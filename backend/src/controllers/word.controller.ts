import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { ExamCategory } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

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
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get user ID if authenticated (set by optionalAuth middleware)
    const userId = (req as any).userId;

    // Only show PUBLISHED words to users
    const where: any = {
      status: 'PUBLISHED',
    };

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (examCategory) {
      where.examCategory = examCategory;
    }

    if (level) {
      where.level = level;
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

    // Get total count first
    const total = await prisma.word.count({ where });

    let words;

    // If shuffle is requested, fetch more and randomize
    if (shuffle === 'true') {
      // Fetch words without skip (we'll handle pagination differently for shuffle)
      const allMatchingWords = await prisma.word.findMany({
        where,
        include: {
          images: { take: 1 },
          mnemonics: {
            take: 1,
            orderBy: { rating: 'desc' }
          },
          examples: { take: 3 },
          etymology: true,
          collocations: { take: 5 },
          visuals: { orderBy: { order: 'asc' } },
          examLevels: true,
        },
        orderBy: { frequency: 'desc' },
        take: Math.min(total, 200), // Limit to prevent memory issues
      });

      // Shuffle using Fisher-Yates algorithm
      const shuffled = [...allMatchingWords];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // Apply pagination to shuffled results
      words = shuffled.slice(skip, skip + limitNum);
    } else {
      // Standard pagination with frequency ordering
      words = await prisma.word.findMany({
        where,
        include: {
          images: { take: 1 },
          mnemonics: {
            take: 1,
            orderBy: { rating: 'desc' }
          },
          examples: { take: 3 },
          etymology: true,
          collocations: { take: 5 },
          visuals: { orderBy: { order: 'asc' } },  // 3-이미지 시각화
          examLevels: true,  // 시험/레벨 매핑
        },
        skip,
        take: limitNum,
        orderBy: { frequency: 'desc' }
      });
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

    // Only return PUBLISHED words to users
    const word = await prisma.word.findFirst({
      where: {
        id,
        status: 'PUBLISHED',
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

    res.json({ word });
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
    const { count = '10', difficulty, examCategory } = req.query;
    const limitNum = parseInt(count as string);

    // Only show PUBLISHED words to users
    const where: any = {
      status: 'PUBLISHED',
    };
    if (difficulty) {
      where.difficulty = difficulty;
    }
    if (examCategory) {
      where.examCategory = examCategory;
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
    // Get counts for each exam category (only PUBLISHED words)
    const examCategories: ExamCategory[] = ['CSAT', 'SAT', 'TOEFL', 'TOEIC', 'TEPS'];

    const counts = await Promise.all(
      examCategories.map(async (exam) => {
        const count = await prisma.word.count({
          where: {
            examCategory: exam,
            status: 'PUBLISHED',
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
        const totalCount = await prisma.word.count({
          where: {
            examCategory: examCategory as ExamCategory,
            level,
            status: 'PUBLISHED',
          },
        });

        const skip = Math.max(0, Math.floor(Math.random() * Math.max(0, totalCount - questionsPerLevel)));

        return prisma.word.findMany({
          where: {
            examCategory: examCategory as ExamCategory,
            level,
            status: 'PUBLISHED',
          },
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
        const otherWords = await prisma.word.findMany({
          where: {
            id: { not: word.id },
            examCategory: examCategory as ExamCategory,
            status: 'PUBLISHED',
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

    const where: any = {
      examCategory: examCategory as ExamCategory,
      status: 'PUBLISHED',
    };

    if (level) {
      where.level = level;
    }

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
        // Get pool of wrong options
        const otherWords = await prisma.word.findMany({
          where: {
            id: { not: word.id },
            examCategory: examCategory as ExamCategory,
            status: 'PUBLISHED',
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
    const { examCategory, limit = '10', difficulty } = req.query;
    const limitNum = Math.min(parseInt(limit as string), 50); // Max 50 for public

    // Only show PUBLISHED words to public
    const where: any = {
      status: 'PUBLISHED',
    };

    if (examCategory) {
      where.examCategory = examCategory;
    }

    if (difficulty) {
      where.difficulty = difficulty;
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
          status: 'PUBLISHED',
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
          status: 'PUBLISHED',
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
        status: 'PUBLISHED',
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
        status: 'PUBLISHED',
      },
      include: {
        examples: { take: 3 },
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
        status: 'PUBLISHED',
      },
      include: {
        examples: { take: 3 },
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
