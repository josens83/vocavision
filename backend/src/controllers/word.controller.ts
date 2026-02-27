import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { ExamCategory } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import appCache from '../lib/cache';

// 현재 서비스 중인 시험 카테고리
const ACTIVE_EXAM_CATEGORIES: ExamCategory[] = ['CSAT', 'TEPS', 'CSAT_2026', 'EBS', 'TOEFL'];

// 구독 티어별 접근 가능한 시험 카테고리
function getAccessibleExams(subscriptionPlan: string | null, subscriptionStatus: string | null): ExamCategory[] {
  const isPremium = subscriptionPlan === 'YEARLY' || subscriptionPlan === 'FAMILY';
  if (isPremium) {
    return ACTIVE_EXAM_CATEGORIES; // 전체
  }
  // BASIC, FREE: TEPS 제외
  return ACTIVE_EXAM_CATEGORIES.filter(e => e !== 'TEPS');
}

export const getWords = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = '1',
      limit = '20',
      difficulty,
      examCategory,
      level,
      search,
      excludeLearned,
      shuffle,
      mode,
      fields,  // 'list' | 'full' (기본값: 'full')
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get user ID if authenticated (set by optionalAuth middleware)
    const userId = (req as any).userId;

    // Only show PUBLISHED and ACTIVE words to users
    const where: any = {
      status: 'PUBLISHED' as const,
      isActive: true,
    };

    if (difficulty) {
      where.difficulty = difficulty;
    }

    // examCategory 또는 level이 지정된 경우 WordExamLevel 테이블을 통해 필터링
    // 현재 서비스 중인 시험(CSAT, TEPS)만 표시, 준비중인 시험(SAT, TOEFL 등)은 제외
    // Note: Word.status로 이미 PUBLISHED 필터링하므로 examLevels에서는 status 제외
    if (examCategory || level) {
      const examLevelFilter: any = {};

      if (examCategory) {
        // 서비스 중인 시험만 허용 (CSAT, TEPS)
        if (ACTIVE_EXAM_CATEGORIES.includes(examCategory as ExamCategory)) {
          examLevelFilter.examCategory = examCategory;
        } else {
          // 준비중인 시험 요청 시 빈 결과 반환
          examLevelFilter.examCategory = examCategory;
        }
      } else {
        // examCategory가 지정되지 않았지만 level만 지정된 경우 - 서비스 중인 시험만
        examLevelFilter.examCategory = { in: ACTIVE_EXAM_CATEGORIES };
      }

      if (level) {
        examLevelFilter.level = level;
      }

      where.examLevels = {
        some: examLevelFilter,
      };
    } else {
      // examCategory/level 없이 전체 조회 시 사용자 접근 가능한 시험만 표시
      let accessibleExams = ACTIVE_EXAM_CATEGORIES;
      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { subscriptionPlan: true, subscriptionStatus: true },
        });
        if (user) {
          accessibleExams = getAccessibleExams(user.subscriptionPlan, user.subscriptionStatus);
        }
      } else {
        // 비로그인: TEPS 제외
        accessibleExams = ACTIVE_EXAM_CATEGORIES.filter(e => e !== 'TEPS');
      }
      where.examLevels = {
        some: {
          examCategory: { in: accessibleExams },
        },
      };
    }

    if (search) {
      where.word = {
        contains: search as string,
        mode: 'insensitive'
      };
    }

    // Exclude already-learned words if requested and user is authenticated
    if (excludeLearned === 'true' && userId) {
      const learnedWordIds = await prisma.userProgress.findMany({
        where: { userId },
        select: { wordId: true },
      });
      const learnedIds = learnedWordIds.map(p => p.wordId);
      if (learnedIds.length > 0) {
        where.id = { notIn: learnedIds };
      }
    }

    // mode=weak: 복습 대상 단어 반환 (needsReview = true AND nextReviewDate <= NOW)
    // 플래시카드에서 "모름/애매함" 선택한 단어들 중 오늘 복습 대기인 것만
    if (mode === 'weak' && userId) {
      const weakWordIds = await prisma.userProgress.findMany({
        where: {
          userId,
          needsReview: true,
          nextReviewDate: { lte: new Date() },  // 오늘 또는 이전 날짜만
          word: {
            isActive: true,
            status: 'PUBLISHED',
            ...(examCategory ? { examLevels: { some: { examCategory: examCategory as any } } } : {}),
            ...(level ? { examLevels: { some: { level: level as string } } } : {}),
          },
        },
        select: { wordId: true },
        orderBy: [
          { reviewCorrectCount: 'asc' },  // 복습 진행도 낮은 것 먼저
          { updatedAt: 'asc' },           // 오래 복습 안 한 것 먼저
        ],
      });
      const weakIds = weakWordIds.map(p => p.wordId);
      if (weakIds.length > 0) {
        where.id = { in: weakIds };
      } else {
        // No weak words found - return empty result
        return res.json({
          data: [],
          words: [],
          pagination: { page: 1, limit: limitNum, total: 0, totalPages: 0 }
        });
      }
    }

    let total: number;
    let words;

    // 🚀 fields='list': 목록용 경량 쿼리 (배지만), fields='full': 학습용 전체 데이터
    const wordInclude = fields === 'list'
      ? {
          // 목록용: 시험 배지만 (6개 JOIN 제거 → 1개만)
          examLevels: {
            where: { examCategory: { in: ACTIVE_EXAM_CATEGORIES } },
            select: { examCategory: true, level: true },
          },
        }
      : {
          // 학습용: 기존 전체 include (하위호환)
          images: { take: 1 },
          mnemonics: {
            take: 1,
            orderBy: { rating: 'desc' } as const,
          },
          examples: true,
          etymology: true,
          collocations: { take: 5 },
          visuals: { orderBy: { order: 'asc' } as const },
          // 서비스 중인 시험(CSAT, TEPS)의 배지만 표시
          examLevels: {
            where: {
              examCategory: { in: ACTIVE_EXAM_CATEGORIES },
            },
          },
        };

    // If shuffle is requested, fetch more and randomize
    if (shuffle === 'true') {
      // 병렬로 count와 findMany 실행 (성능 개선)
      const [countResult, allMatchingWords] = await Promise.all([
        prisma.word.count({ where }),
        prisma.word.findMany({
          where,
          include: wordInclude,
          orderBy: { frequency: 'desc' },
          take: 200, // Limit to prevent memory issues
        }),
      ]);
      total = countResult;

      // Shuffle using Fisher-Yates algorithm
      const shuffled = [...allMatchingWords];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // Apply pagination to shuffled results
      words = shuffled.slice(skip, skip + limitNum);
    } else {
      // 병렬로 count와 findMany 실행 (성능 개선)
      const [countResult, wordsResult] = await Promise.all([
        prisma.word.count({ where }),
        prisma.word.findMany({
          where,
          include: wordInclude,
          skip,
          take: limitNum,
          orderBy: { frequency: 'desc' },
        }),
      ]);
      total = countResult;
      words = wordsResult;
    }

    // 🚀 목록 데이터는 공유 가능, 1분 캐시 (fields=list 모드에서 특히 효과적)
    if (fields === 'list') {
      res.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');
    }
    res.json({
      data: words,
      words,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getWordById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // 🚀 캐시 확인 (TTL 10분)
    const cached = appCache.getWord(id);
    if (cached) {
      return res.json(cached);
    }

    // Only return PUBLISHED words to users
    const word = await prisma.word.findFirst({
      where: {
        id,
        status: 'PUBLISHED' as const,
      },
      include: {
        examples: true,
        images: true,
        videos: true,
        rhymes: true,
        mnemonics: {
          orderBy: { rating: 'desc' }
        },
        etymology: true,
        synonyms: true,
        antonyms: true,
        visuals: { orderBy: { order: 'asc' } },  // 3-이미지 시각화
        examLevels: true,  // 시험/레벨 매핑
      }
    });

    if (!word) {
      throw new AppError('Word not found', 404);
    }

    const response = { word };
    appCache.setWord(id, response);  // 캐시 저장
    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const createWord = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const wordData = req.body;

    const word = await prisma.word.create({
      data: {
        word: wordData.word,
        definition: wordData.definition,
        definitionKo: wordData.definitionKo,
        pronunciation: wordData.pronunciation,
        phonetic: wordData.phonetic,
        partOfSpeech: wordData.partOfSpeech,
        difficulty: wordData.difficulty || 'INTERMEDIATE',
        examCategory: wordData.examCategory || 'CSAT',
        level: wordData.level,
        frequency: wordData.frequency || 0,
        tags: wordData.tags || [],
        tips: wordData.tips
      }
    });

    res.status(201).json({ word });
  } catch (error) {
    next(error);
  }
};

export const getRandomWords = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { count = '10', difficulty, examCategory, level } = req.query;
    const limitNum = parseInt(count as string);

    // Only show PUBLISHED and ACTIVE words to users
    const where: any = {
      status: 'PUBLISHED' as const,
      isActive: true,
    };
    if (difficulty) {
      where.difficulty = difficulty;
    }

    // WordExamLevel 테이블을 통해 필터링 (서비스 중인 시험만: CSAT, TEPS)
    // Note: Word.status로 이미 PUBLISHED 필터링하므로 examLevels에서는 status 제외
    if (examCategory || level) {
      const examLevelFilter: any = {};

      if (examCategory) {
        // 서비스 중인 시험만 허용 (CSAT, TEPS)
        if (ACTIVE_EXAM_CATEGORIES.includes(examCategory as ExamCategory)) {
          examLevelFilter.examCategory = examCategory as ExamCategory;
        } else {
          examLevelFilter.examCategory = examCategory as ExamCategory;
        }
      } else {
        // examCategory가 지정되지 않았지만 level만 지정된 경우 - 서비스 중인 시험만
        examLevelFilter.examCategory = { in: ACTIVE_EXAM_CATEGORIES };
      }

      if (level) {
        examLevelFilter.level = level;
      }

      where.examLevels = {
        some: examLevelFilter,
      };
    } else {
      // examCategory/level 없이 조회 시 서비스 중인 시험(CSAT, TEPS)만
      where.examLevels = {
        some: {
          examCategory: { in: ACTIVE_EXAM_CATEGORIES },
        },
      };
    }

    // Get random words using a simple approach
    const totalCount = await prisma.word.count({ where });
    const skip = Math.max(0, Math.floor(Math.random() * (totalCount - limitNum)));

    const words = await prisma.word.findMany({
      where,
      include: {
        images: { take: 1 },
        mnemonics: { take: 1, orderBy: { rating: 'desc' } },
        visuals: { orderBy: { order: 'asc' } },  // 3-이미지 시각화
      },
      skip,
      take: limitNum
    });

    res.json({ words });
  } catch (error) {
    next(error);
  }
};

// Get word counts by exam category (for dashboard)
export const getWordCountsByExam = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get counts for each exam category (only PUBLISHED words, 서비스 중인 시험만)
    const counts = await Promise.all(
      ACTIVE_EXAM_CATEGORIES.map(async (exam) => {
        const count = await prisma.word.count({
          where: {
            examCategory: exam,
            status: 'PUBLISHED' as const,
          },
        });
        return { exam, count };
      })
    );

    // Convert to object format
    const result = counts.reduce((acc, { exam, count }) => {
      acc[exam] = count;
      return acc;
    }, {} as Record<string, number>);

    // Set cache headers for counts (10 minutes - data changes infrequently)
    res.set('Cache-Control', 'public, max-age=600, s-maxage=1200');
    res.json({ counts: result });
  } catch (error) {
    next(error);
  }
};

// Get level test questions (shuffled words from all levels)
export const getLevelTestQuestions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { examCategory = 'CSAT', count = '15' } = req.query;
    const countNum = Math.min(parseInt(count as string), 30); // Max 30 questions

    // Get words from each level (L1, L2, L3)
    const levels = ['L1', 'L2', 'L3'];
    const questionsPerLevel = Math.ceil(countNum / levels.length);

    const wordsByLevel = await Promise.all(
      levels.map(async (level) => {
        // WordExamLevel 테이블을 통해 필터링 (CSAT_ARCHIVE 제외)
        // Note: Word.status로 이미 PUBLISHED 필터링하므로 examLevels에서는 status 제외
        const levelWhere = {
          status: 'PUBLISHED' as const,
          examLevels: {
            some: {
              examCategory: examCategory as ExamCategory,
              level,
            },
          },
        };
        const totalCount = await prisma.word.count({ where: levelWhere });

        const skip = Math.max(0, Math.floor(Math.random() * Math.max(0, totalCount - questionsPerLevel)));

        return prisma.word.findMany({
          where: levelWhere,
          select: {
            id: true,
            word: true,
            definitionKo: true,
            definition: true,
            level: true,
            examCategory: true,
          },
          skip,
          take: questionsPerLevel,
        });
      })
    );

    // Combine and shuffle all words
    const allWords = wordsByLevel.flat();
    const shuffled = allWords.sort(() => Math.random() - 0.5).slice(0, countNum);

    // Generate wrong options for each question
    const questions = await Promise.all(
      shuffled.map(async (word) => {
        // Get random wrong options (3 other words)
        // WordExamLevel 테이블을 통해 필터링 (CSAT_ARCHIVE 제외)
        // Note: Word.status로 이미 PUBLISHED 필터링하므로 examLevels에서는 status 제외
        const otherWords = await prisma.word.findMany({
          where: {
            id: { not: word.id },
            status: 'PUBLISHED' as const,
            examLevels: {
              some: {
                examCategory: examCategory as ExamCategory,
              },
            },
          },
          select: {
            id: true,
            definitionKo: true,
            definition: true,
          },
          take: 100, // Get a pool to pick from
        });

        // Shuffle and pick 3
        const wrongOptions = otherWords
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map((w) => w.definitionKo || w.definition);

        // Create options array with correct answer
        const correctAnswer = word.definitionKo || word.definition;
        const options = [...wrongOptions, correctAnswer].sort(() => Math.random() - 0.5);

        return {
          id: word.id,
          word: word.word,
          level: word.level,
          options,
          correctAnswer,
        };
      })
    );

    res.json({ questions });
  } catch (error) {
    next(error);
  }
};

// Get quiz questions (for eng-to-kor or kor-to-eng quiz)
export const getQuizQuestions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      examCategory = 'CSAT',
      level,
      mode = 'eng-to-kor',
      count = '10',
    } = req.query;
    const countNum = Math.min(parseInt(count as string), 50); // Max 50 questions

    // WordExamLevel 테이블을 통해 필터링 (CSAT_ARCHIVE 제외)
    // Note: Word.status로 이미 PUBLISHED 필터링하므로 examLevels에서는 status 제외
    const examLevelFilter: any = {
      examCategory: examCategory as ExamCategory,
    };

    if (level) {
      examLevelFilter.level = level;
    }

    const where: any = {
      status: 'PUBLISHED' as const,
      examLevels: {
        some: examLevelFilter,
      },
    };

    // Get total count for random selection
    const totalCount = await prisma.word.count({ where });
    const skip = Math.max(0, Math.floor(Math.random() * Math.max(0, totalCount - countNum)));

    const words = await prisma.word.findMany({
      where,
      include: {
        mnemonics: {
          take: 1,
          orderBy: { rating: 'desc' },
        },
      },
      skip,
      take: countNum,
    });

    // Shuffle words
    const shuffled = words.sort(() => Math.random() - 0.5);

    // Generate questions based on mode
    const questions = await Promise.all(
      shuffled.map(async (word) => {
        // Get pool of wrong options (WordExamLevel 테이블을 통해 필터링)
        // Note: Word.status로 이미 PUBLISHED 필터링하므로 examLevels에서는 status 제외
        const otherWords = await prisma.word.findMany({
          where: {
            id: { not: word.id },
            status: 'PUBLISHED' as const,
            examLevels: {
              some: {
                examCategory: examCategory as ExamCategory,
              },
            },
          },
          select: {
            id: true,
            word: true,
            definitionKo: true,
            definition: true,
          },
          take: 100,
        });

        // Shuffle and pick 3
        const wrongPool = otherWords.sort(() => Math.random() - 0.5).slice(0, 3);

        if (mode === 'kor-to-eng') {
          // Korean meaning -> English word
          const correctAnswer = word.word;
          const options = [...wrongPool.map((w) => w.word), correctAnswer].sort(
            () => Math.random() - 0.5
          );

          return {
            id: word.id,
            question: word.definitionKo || word.definition,
            options,
            correctAnswer,
            mnemonic: word.mnemonics[0]?.koreanHint || word.mnemonics[0]?.content || null,
          };
        } else {
          // English word -> Korean meaning (default)
          const correctAnswer = word.definitionKo || word.definition;
          const options = [
            ...wrongPool.map((w) => w.definitionKo || w.definition),
            correctAnswer,
          ].sort(() => Math.random() - 0.5);

          return {
            id: word.id,
            question: word.word,
            options,
            correctAnswer,
            mnemonic: word.mnemonics[0]?.koreanHint || word.mnemonics[0]?.content || null,
          };
        }
      })
    );

    res.json({ questions });
  } catch (error) {
    next(error);
  }
};

// Public endpoint - no authentication required
export const getPublicWords = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { examCategory, level, limit = '10', difficulty } = req.query;
    const limitNum = Math.min(parseInt(limit as string), 50); // Max 50 for public

    // Only show PUBLISHED words to public
    const where: any = {
      status: 'PUBLISHED' as const,
    };

    if (difficulty) {
      where.difficulty = difficulty;
    }

    // WordExamLevel 테이블을 통해 필터링 (서비스 중인 시험만: CSAT, TEPS)
    // Note: Word.status로 이미 PUBLISHED 필터링하므로 examLevels에서는 status 제외
    if (examCategory || level) {
      const examLevelFilter: any = {};

      if (examCategory) {
        // 서비스 중인 시험만 허용 (CSAT, TEPS)
        if (ACTIVE_EXAM_CATEGORIES.includes(examCategory as ExamCategory)) {
          examLevelFilter.examCategory = examCategory as ExamCategory;
        } else {
          examLevelFilter.examCategory = examCategory as ExamCategory;
        }
      } else {
        // examCategory가 지정되지 않았지만 level만 지정된 경우 - 서비스 중인 시험만
        examLevelFilter.examCategory = { in: ACTIVE_EXAM_CATEGORIES };
      }

      if (level) {
        examLevelFilter.level = level;
      }

      where.examLevels = {
        some: examLevelFilter,
      };
    } else {
      // examCategory/level 없이 조회 시 서비스 중인 시험(CSAT, TEPS)만
      where.examLevels = {
        some: {
          examCategory: { in: ACTIVE_EXAM_CATEGORIES },
        },
      };
    }

    const words = await prisma.word.findMany({
      where,
      select: {
        id: true,
        word: true,
        definition: true,
        definitionKo: true,
        pronunciation: true,
        phonetic: true,
        partOfSpeech: true,
        difficulty: true,
        examCategory: true,
        tips: true,
      },
      take: limitNum,
      orderBy: { frequency: 'asc' } // Most common words first
    });

    // Set cache headers for public data (5 minutes)
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    res.json({ data: words });
  } catch (error) {
    next(error);
  }
};

// Featured words for homepage (with CONCEPT images)
export const getFeaturedWords = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type = 'best', limit = '10' } = req.query;
    const limitNum = Math.min(parseInt(limit as string), 20);

    let words;

    if (type === 'best') {
      // BEST 탭: 고정된 10개 단어 목록 (순서 유지)
      const bestWordsList = [
        'sycophant',
        'ephemeral',
        'ubiquitous',
        'scrutinize',
        'eloquent',
        'synthesis',
        'paradigm',
        'anthropology',
        'methodology',
        'subsidiary',
      ];

      // Fetch these specific words by name
      const fetchedWords = await prisma.word.findMany({
        where: {
          word: { in: bestWordsList },
          status: 'PUBLISHED' as const,
        },
        include: {
          visuals: {
            where: { type: 'CONCEPT' },
            take: 1,
          },
        },
      });

      // Sort by the original order in bestWordsList
      const wordMap = new Map(fetchedWords.map(w => [w.word.toLowerCase(), w]));
      words = bestWordsList
        .map(name => wordMap.get(name.toLowerCase()))
        .filter((w): w is NonNullable<typeof w> => w != null)
        .slice(0, limitNum);
    } else {
      // NEW 탭: 최신 단어 (기존 로직)
      words = await prisma.word.findMany({
        where: {
          status: 'PUBLISHED' as const,
          visuals: {
            some: {
              type: 'CONCEPT',
              imageUrl: { not: null },
            },
          },
        },
        include: {
          visuals: {
            where: { type: 'CONCEPT' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' as const },
        take: limitNum,
      });
    }

    // Map to simpler format for frontend
    const result = words.map((word) => ({
      id: word.id,
      word: word.word,
      definition: word.definitionKo || word.definition,
      level: word.level || 'L1',
      pronunciation: word.phonetic || word.pronunciation,
      imageUrl: word.visuals[0]?.imageUrl || null,
      createdAt: word.createdAt,
    }));

    // Set cache headers (10 minutes for featured words)
    res.set('Cache-Control', 'public, max-age=600, s-maxage=1200');
    res.json({ words: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Batch endpoint to fetch multiple words by IDs
 * Optimized for frontend batch loading
 * GET /words/batch?ids=id1,id2,id3
 */
export const getWordsBatch = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ids } = req.query;

    if (!ids || typeof ids !== 'string') {
      res.status(400).json({ error: 'ids query parameter is required' });
      return;
    }

    const idArray = ids.split(',').filter(Boolean).slice(0, 50); // Max 50 words per batch

    if (idArray.length === 0) {
      res.json({ data: [], total: 0 });
      return;
    }

    const words = await prisma.word.findMany({
      where: {
        id: { in: idArray },
        status: 'PUBLISHED' as const,
      },
      select: {
        id: true,
        word: true,
        definition: true,
        definitionKo: true,
        pronunciation: true,
        phonetic: true,
        partOfSpeech: true,
        difficulty: true,
        examCategory: true,
        level: true,
        frequency: true,
        tips: true,
      },
    });

    // Maintain order of requested IDs
    const wordMap = new Map(words.map(w => [w.id, w]));
    const orderedWords = idArray
      .map(id => wordMap.get(id))
      .filter((w): w is NonNullable<typeof w> => w !== undefined);

    // Set cache headers (5 minutes for public batch data)
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    res.json({
      data: orderedWords,
      total: orderedWords.length,
      requested: idArray.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Batch endpoint to fetch words with full details including visuals
 * GET /words/batch-with-visuals?ids=id1,id2,id3
 */
export const getWordsBatchWithVisuals = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ids } = req.query;

    if (!ids || typeof ids !== 'string') {
      res.status(400).json({ error: 'ids query parameter is required' });
      return;
    }

    const idArray = ids.split(',').filter(Boolean).slice(0, 20); // Max 20 for detailed data

    if (idArray.length === 0) {
      res.json({ data: [], total: 0 });
      return;
    }

    const words = await prisma.word.findMany({
      where: {
        id: { in: idArray },
        status: 'PUBLISHED' as const,
      },
      include: {
        examples: true,
        mnemonics: { take: 1, orderBy: { rating: 'desc' } },
        etymology: true,
        collocations: { take: 5, orderBy: { frequency: 'desc' } },
        visuals: { orderBy: { order: 'asc' } },
      },
    });

    // Maintain order of requested IDs
    const wordMap = new Map(words.map(w => [w.id, w]));
    const orderedWords = idArray
      .map(id => wordMap.get(id))
      .filter((w): w is NonNullable<typeof w> => w !== undefined);

    // Set cache headers (3 minutes for detailed data)
    res.set('Cache-Control', 'public, max-age=180, s-maxage=300');
    res.json({
      data: orderedWords,
      total: orderedWords.length,
      requested: idArray.length,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// 3-이미지 시각화 시스템 (Word Visuals) API
// ============================================

// VisualType for validation
type VisualType = 'CONCEPT' | 'MNEMONIC' | 'RHYME';
const VALID_VISUAL_TYPES: VisualType[] = ['CONCEPT', 'MNEMONIC', 'RHYME'];

// Get visuals for a word
export const getWordVisuals = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const visuals = await prisma.wordVisual.findMany({
      where: { wordId: id },
      orderBy: { order: 'asc' },
    });

    // Set cache headers (5 minutes for word visuals)
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    res.json({ visuals });
  } catch (error) {
    next(error);
  }
};

// Update/create visuals for a word (upsert)
export const updateWordVisuals = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { visuals } = req.body;

    if (!Array.isArray(visuals)) {
      throw new AppError('visuals must be an array', 400);
    }

    // Verify word exists
    const word = await prisma.word.findUnique({ where: { id } });
    if (!word) {
      throw new AppError('Word not found', 404);
    }

    // Process each visual (upsert)
    const upsertedVisuals = await Promise.all(
      visuals.map(async (visual: any, index: number) => {
        const type = visual.type as VisualType;

        // Validate type
        if (!VALID_VISUAL_TYPES.includes(type)) {
          throw new AppError(`Invalid visual type: ${type}`, 400);
        }

        return prisma.wordVisual.upsert({
          where: {
            wordId_type: {
              wordId: id,
              type,
            },
          },
          create: {
            wordId: id,
            type,
            labelEn: visual.labelEn,
            labelKo: visual.labelKo,
            captionEn: visual.captionEn,
            captionKo: visual.captionKo,
            imageUrl: visual.imageUrl,
            promptEn: visual.promptEn,
            order: visual.order ?? index,
          },
          update: {
            labelEn: visual.labelEn,
            labelKo: visual.labelKo,
            captionEn: visual.captionEn,
            captionKo: visual.captionKo,
            imageUrl: visual.imageUrl,
            promptEn: visual.promptEn,
            order: visual.order ?? index,
          },
        });
      })
    );

    res.json({ visuals: upsertedVisuals });
  } catch (error) {
    next(error);
  }
};

// Delete a specific visual
export const deleteWordVisual = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, type } = req.params;

    // Validate type
    if (!VALID_VISUAL_TYPES.includes(type as VisualType)) {
      throw new AppError(`Invalid visual type: ${type}`, 400);
    }

    await prisma.wordVisual.delete({
      where: {
        wordId_type: {
          wordId: id,
          type: type as VisualType,
        },
      },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// Import visuals from JSON template (batch)
export const importWordVisualsFromTemplate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { templates } = req.body;

    if (!Array.isArray(templates)) {
      throw new AppError('templates must be an array', 400);
    }

    const results: { word: string; success: boolean; error?: string }[] = [];

    for (const template of templates) {
      try {
        // Find word by name
        const word = await prisma.word.findFirst({
          where: { word: template.word },
        });

        if (!word) {
          results.push({
            word: template.word,
            success: false,
            error: 'Word not found',
          });
          continue;
        }

        // Process each visual type
        const visualsToUpsert: any[] = [];

        if (template.visuals?.concept) {
          visualsToUpsert.push({
            type: 'CONCEPT' as VisualType,
            labelEn: 'Concept',
            labelKo: template.visuals.concept.labelKo || '의미',
            captionEn: template.visuals.concept.captionEn,
            captionKo: template.visuals.concept.captionKo,
            imageUrl: template.visuals.concept.imageUrl,
            promptEn: template.visuals.concept.promptEn,
            order: 0,
          });
        }

        if (template.visuals?.mnemonic) {
          visualsToUpsert.push({
            type: 'MNEMONIC' as VisualType,
            labelEn: 'Mnemonic',
            labelKo: template.visuals.mnemonic.labelKo || '연상',
            captionEn: template.visuals.mnemonic.captionEn,
            captionKo: template.visuals.mnemonic.captionKo,
            imageUrl: template.visuals.mnemonic.imageUrl,
            promptEn: template.visuals.mnemonic.promptEn,
            order: 1,
          });
        }

        if (template.visuals?.rhyme) {
          visualsToUpsert.push({
            type: 'RHYME' as VisualType,
            labelEn: 'Rhyme',
            labelKo: template.visuals.rhyme.labelKo || '라이밍',
            captionEn: template.visuals.rhyme.captionEn,
            captionKo: template.visuals.rhyme.captionKo,
            imageUrl: template.visuals.rhyme.imageUrl,
            promptEn: template.visuals.rhyme.promptEn,
            order: 2,
          });
        }

        // Upsert each visual
        await Promise.all(
          visualsToUpsert.map((visual) =>
            prisma.wordVisual.upsert({
              where: {
                wordId_type: {
                  wordId: word.id,
                  type: visual.type,
                },
              },
              create: {
                wordId: word.id,
                ...visual,
              },
              update: visual,
            })
          )
        );

        results.push({ word: template.word, success: true });
      } catch (err: any) {
        results.push({
          word: template.word,
          success: false,
          error: err.message || 'Unknown error',
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    res.json({
      message: `Imported ${successCount} words, ${failCount} failed`,
      results,
    });
  } catch (error) {
    next(error);
  }
};

// Get word with visuals (for learning view)
export const getWordWithVisuals = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const word = await prisma.word.findFirst({
      where: {
        id,
        status: 'PUBLISHED' as const,
      },
      include: {
        examples: true,
        images: { take: 1 },
        mnemonics: { take: 1, orderBy: { rating: 'desc' } },
        etymology: true,
        collocations: { take: 5, orderBy: { frequency: 'desc' } },
        visuals: { orderBy: { order: 'asc' } },
      },
    });

    if (!word) {
      throw new AppError('Word not found', 404);
    }

    // Set cache headers (5 minutes for word detail with visuals)
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    res.json({ word });
  } catch (error) {
    next(error);
  }
};
