import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { ExamCategory } from '@prisma/client';

// Spaced Repetition Algorithm (SM-2)
function calculateNextReview(
  rating: number,
  easeFactor: number,
  interval: number,
  repetitions: number
): { easeFactor: number; interval: number; repetitions: number } {
  let newEaseFactor = easeFactor;
  let newInterval = interval;
  let newRepetitions = repetitions;

  if (rating >= 3) {
    // Correct answer
    newRepetitions += 1;
    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }
    newEaseFactor = easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
  } else {
    // Incorrect answer
    newRepetitions = 0;
    newInterval = 1;
  }

  newEaseFactor = Math.max(1.3, newEaseFactor);

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions
  };
}

// ============================================
// 복습 대기 여부 판단 함수 (2일 포함/1일 쉼 + D+3 알았음)
// ============================================
function shouldShowInReview(progress: {
  correctCount: number;
  incorrectCount: number;
  initialRating: number;
  learnedAt: Date;
}): boolean {
  // 이미 완료된 단어는 제외 (correctCount >= 2)
  if (progress.correctCount >= 2) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const learnedAt = new Date(progress.learnedAt);
  learnedAt.setHours(0, 0, 0, 0);
  const daysSinceLearned = Math.floor((today.getTime() - learnedAt.getTime()) / (1000 * 60 * 60 * 24));

  // "알았음"으로 학습 (rating 5) + 아직 틀린 적 없음 → D+3에만 표시
  if (progress.initialRating === 5 && progress.incorrectCount === 0) {
    return daysSinceLearned === 3;
  }

  // "모름" (rating 1-2) 또는 퀴즈에서 틀린 단어 → 2일 포함, 1일 쉼 패턴
  // D+0, D+1: ✅ (cycleDay 0, 1)
  // D+2: ❌ (cycleDay 2) - 쉬는 날
  // D+3, D+4: ✅ (cycleDay 0, 1)
  // D+5: ❌ (cycleDay 2) - 쉬는 날
  const cycleDay = daysSinceLearned % 3;
  return cycleDay !== 2;
}

export const getUserProgress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;

    // KST 기준 오늘 시작 시간 (00:00:00)
    const now = new Date();
    const todayStartKST = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    todayStartKST.setUTCHours(0, 0, 0, 0);
    const todayStartUTC = new Date(todayStartKST.getTime() - 9 * 60 * 60 * 1000);

    const [progress, stats, todayLearned] = await Promise.all([
      // 기존 progress 조회 (examLevels 포함)
      prisma.userProgress.findMany({
        where: { userId },
        include: {
          word: {
            select: {
              id: true,
              word: true,
              definition: true,
              difficulty: true,
              level: true,
              examCategory: true,
              examLevels: {
                select: {
                  examCategory: true,
                  level: true,
                }
              }
            }
          }
        },
        orderBy: { nextReviewDate: 'asc' }
      }),

      // 기존 user stats 조회
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          totalWordsLearned: true,
          currentStreak: true,
          longestStreak: true,
          lastActiveDate: true,
          dailyGoal: true,
        }
      }),

      // 오늘 학습/복습한 고유 단어 수 (UserProgress.updatedAt 기준, KST)
      prisma.userProgress.count({
        where: {
          userId,
          updatedAt: {
            gte: todayStartUTC
          }
        }
      })
    ]);

    res.json({
      progress,
      stats: {
        ...stats,
        todayWordsLearned: todayLearned
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getDueReviews = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const now = new Date();
    const { examCategory, level } = req.query;

    // KST 기준 오늘 시작 시간 (00:00:00)
    const todayStartKST = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    todayStartKST.setUTCHours(0, 0, 0, 0);
    const todayStartUTC = new Date(todayStartKST.getTime() - 9 * 60 * 60 * 1000);

    // 기본 where 조건
    const wordWhere: any = {
      isActive: true,
      examCategory: { not: 'CSAT_ARCHIVE' }
    };

    // 시험 필터 (CSAT_ARCHIVE 제외 유지)
    if (examCategory && examCategory !== 'all') {
      wordWhere.examCategory = examCategory as string;
    }

    // 레벨 필터 (WordExamLevel 조인)
    if (level && level !== 'all') {
      wordWhere.examLevels = {
        some: { level: level as string }
      };
    }

    // 복습 대상 후보 조회 (correctCount < 2인 단어)
    const allProgress = await prisma.userProgress.findMany({
      where: {
        userId,
        correctCount: { lt: 2 }, // 완료되지 않은 것만
        word: wordWhere
      },
      include: {
        word: {
          include: {
            images: { take: 1 },
            videos: { take: 1 },
            rhymes: { take: 3 },
            mnemonics: {
              take: 1,
              orderBy: { rating: 'desc' }
            },
            etymology: true,
            visuals: { orderBy: { order: 'asc' } },  // 3-이미지 시각화
            examLevels: true,  // 프론트엔드에서 시험/레벨 정보 표시용
          }
        }
      },
      orderBy: [
        { nextReviewDate: 'asc' },
        { incorrectCount: 'desc' },  // 틀린 횟수 많은 것 먼저
        { correctCount: 'asc' },     // 맞은 횟수 적은 것 먼저
        { createdAt: 'asc' },        // 오래된 것 먼저
      ]
    });

    // 오늘 복습 대기인 단어만 필터링 (2일 포함/1일 쉼 + D+3 알았음)
    const dueReviews = allProgress.filter(p => shouldShowInReview({
      correctCount: p.correctCount,
      incorrectCount: p.incorrectCount,
      initialRating: p.initialRating,
      learnedAt: p.learnedAt,
    }));

    // 병렬로 통계 정보 조회
    const [allProgress, lastReviewRecord, weakWordsCount, completedTodayCount, bookmarkedCount] = await Promise.all([
      // 전체 학습 기록에서 정답률 계산
      prisma.userProgress.findMany({
        where: { userId, word: wordWhere },
        select: { correctCount: true, incorrectCount: true }
      }),

      // 마지막 복습 날짜 조회 (해당 시험/레벨의 가장 최근 lastReviewDate)
      prisma.userProgress.findFirst({
        where: {
          userId,
          lastReviewDate: { not: null },
          word: wordWhere
        },
        orderBy: { lastReviewDate: 'desc' },
        select: { lastReviewDate: true }
      }),

      // 취약 단어 수 (incorrectCount > 0인 단어)
      prisma.userProgress.count({
        where: {
          userId,
          incorrectCount: { gt: 0 },
          word: wordWhere
        }
      }),

      // 오늘 완료한 복습 수 (KST 기준) - 처음 학습이 아닌 실제 복습만 카운트
      prisma.userProgress.count({
        where: {
          userId,
          lastReviewDate: { gte: todayStartUTC },
          createdAt: { lt: todayStartUTC },  // 오늘 이전에 생성된 단어만 (= 복습)
          word: wordWhere
        }
      }),

      // 북마크 수 (Bookmark 테이블 - word 관계 없음, userId만 필터)
      prisma.bookmark.count({
        where: {
          userId
        }
      }).catch(() => 0)  // Bookmark 테이블이 없을 경우 0 반환
    ]);

    // 정답률 계산
    let totalCorrect = 0;
    let totalIncorrect = 0;
    allProgress.forEach(p => {
      totalCorrect += p.correctCount;
      totalIncorrect += p.incorrectCount;
    });
    const totalAttempts = totalCorrect + totalIncorrect;
    const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

    res.json({
      reviews: dueReviews,
      count: dueReviews.length,
      accuracy,
      lastReviewDate: lastReviewRecord?.lastReviewDate || null,
      weakCount: weakWordsCount,
      completedToday: completedTodayCount,
      totalReviewed: allProgress.length,
      bookmarkedCount: bookmarkedCount
    });
  } catch (error) {
    next(error);
  }
};

export const submitReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const { wordId, rating, responseTime, learningMethod, sessionId, examCategory, level } = req.body;

    if (!wordId || rating === undefined) {
      throw new AppError('Word ID and rating are required', 400);
    }

    if (rating < 1 || rating > 5) {
      throw new AppError('Rating must be between 1 and 5', 400);
    }

    // examCategory와 level이 없으면 Word에서 가져오기
    let wordExamCategory = examCategory;
    let wordLevel = level;

    if (!wordExamCategory || !wordLevel) {
      const word = await prisma.word.findUnique({
        where: { id: wordId },
        include: {
          examLevels: { take: 1 }
        }
      });

      if (!word) {
        throw new AppError('Word not found', 404);
      }

      wordExamCategory = wordExamCategory || word.examCategory;
      wordLevel = wordLevel || word.examLevels?.[0]?.level || word.level || 'L1';
    }

    // Get or create progress (새 unique key: userId + wordId + examCategory + level)
    let progress = await prisma.userProgress.findUnique({
      where: {
        userId_wordId_examCategory_level: {
          userId,
          wordId,
          examCategory: wordExamCategory,
          level: wordLevel
        }
      }
    });

    if (!progress) {
      // Create new progress - 첫 학습 시 initialRating, learnedAt 저장
      const now = new Date();

      progress = await prisma.userProgress.create({
        data: {
          userId,
          wordId,
          examCategory: wordExamCategory,
          level: wordLevel,
          nextReviewDate: now,
          masteryLevel: 'NEW',
          initialRating: rating,  // 첫 학습 시 rating 저장 (1=모름, 5=알았음)
          learnedAt: now,         // 첫 학습 날짜 저장
        }
      });
    }

    // Calculate next review using SM-2 algorithm
    const { easeFactor, interval, repetitions } = calculateNextReview(
      rating,
      progress.easeFactor,
      progress.interval,
      progress.repetitions
    );

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    // ===== 정확도/숙련도 로직 개편 =====
    // rating 1-2: 모름/애매함 → 복습 대상 (needsReview: true)
    // rating 3-5: 알았음/스와이프/다음 → 정답 처리 (needsReview: false 또는 유지)

    const isCorrectAnswer = rating >= 3;

    // 복습 대상 여부 결정
    // - 처음 학습에서 모름/애매함 선택 → 복습 대상으로 마킹
    // - 복습 퀴즈에서 정답 → reviewCorrectCount 증가
    let needsReview = progress.needsReview;
    let reviewCorrectCount = progress.reviewCorrectCount;

    if (!isCorrectAnswer) {
      // 모름/애매함 → 복습 대상으로 마킹
      needsReview = true;
      // 복습 대상이 되면 reviewCorrectCount 리셋
      reviewCorrectCount = 0;
    } else if (progress.needsReview && learningMethod === 'QUIZ') {
      // 복습 대상 단어가 복습 퀴즈에서 정답 → reviewCorrectCount 증가
      reviewCorrectCount = progress.reviewCorrectCount + 1;
      // reviewCorrectCount가 2 이상이면 복습 완료 (선택사항: needsReview를 false로 변경 가능)
    }

    // 새로운 correctCount 계산
    const newCorrectCount = isCorrectAnswer ? progress.correctCount + 1 : progress.correctCount;

    // Determine mastery level based on correctCount
    let masteryLevel = progress.masteryLevel;
    if (newCorrectCount >= 6) {
      masteryLevel = 'MASTERED';
    } else if (newCorrectCount >= 3) {
      masteryLevel = 'FAMILIAR';
    } else if (newCorrectCount >= 1) {
      masteryLevel = 'LEARNING';
    }

    // Update progress (새 unique key: userId + wordId + examCategory + level)
    const updatedProgress = await prisma.userProgress.update({
      where: {
        userId_wordId_examCategory_level: {
          userId,
          wordId,
          examCategory: wordExamCategory,
          level: wordLevel
        }
      },
      data: {
        easeFactor,
        interval,
        repetitions,
        nextReviewDate,
        lastReviewDate: new Date(),
        masteryLevel,
        correctCount: isCorrectAnswer ? progress.correctCount + 1 : progress.correctCount,
        incorrectCount: !isCorrectAnswer ? progress.incorrectCount + 1 : progress.incorrectCount,
        totalReviews: progress.totalReviews + 1,
        needsReview,
        reviewCorrectCount,
      }
    });

    // Create review record
    await prisma.review.create({
      data: {
        userId,
        wordId,
        sessionId,
        rating,
        responseTime,
        learningMethod: learningMethod || 'FLASHCARD'
      }
    });

    // Update user stats
    await updateUserStats(userId);

    res.json({
      message: 'Review submitted successfully',
      progress: updatedProgress,
      nextReviewDate
    });
  } catch (error) {
    next(error);
  }
};

export const startStudySession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;

    const session = await prisma.studySession.create({
      data: {
        userId
      }
    });

    res.json({ session });
  } catch (error) {
    next(error);
  }
};

export const endStudySession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const { sessionId, wordsStudied, wordsCorrect } = req.body;

    const session = await prisma.studySession.findUnique({
      where: { id: sessionId }
    });

    if (!session || session.userId !== userId) {
      throw new AppError('Session not found', 404);
    }

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);

    const updatedSession = await prisma.studySession.update({
      where: { id: sessionId },
      data: {
        endTime,
        duration,
        wordsStudied,
        wordsCorrect
      }
    });

    res.json({ session: updatedSession });
  } catch (error) {
    next(error);
  }
};

export const getReviewHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;

    const reviews = await prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 200, // Limit to last 200 reviews
    });

    // Add nextReviewDate from UserProgress
    // 새 스키마에서는 userId+wordId+examCategory+level로 unique하지만,
    // 여기서는 가장 최근 progress를 찾아서 반환
    const reviewsWithNextDate = await Promise.all(
      reviews.map(async (review) => {
        const progress = await prisma.userProgress.findFirst({
          where: {
            userId,
            wordId: review.wordId,
          },
          select: {
            nextReviewDate: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
        });

        return {
          ...review,
          nextReviewDate: progress?.nextReviewDate || new Date(),
        };
      })
    );

    res.json({ reviews: reviewsWithNextDate });
  } catch (error) {
    next(error);
  }
};

// KST 기준 날짜 변환 (UTC+9)
function toKSTDate(date: Date): Date {
  const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  kstDate.setUTCHours(0, 0, 0, 0);
  return kstDate;
}

export async function updateUserStats(userId: string) {
  const now = new Date();
  const todayKST = toKSTDate(now);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      lastActiveDate: true,
      currentStreak: true,
      longestStreak: true
    }
  });

  if (!user) return;

  // null/undefined 방지: 기본값 0으로 시작
  let newStreak = user.currentStreak ?? 0;

  if (user.lastActiveDate) {
    const lastActiveKST = toKSTDate(new Date(user.lastActiveDate));

    const daysDiff = Math.floor((todayKST.getTime() - lastActiveKST.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      // 같은 날 → 최소 1일 유지 (0이면 1로 변경)
      newStreak = Math.max(newStreak, 1);
    } else if (daysDiff === 1) {
      // 어제 학습 → 오늘이 연속 학습이므로 +1
      // (어제 1일 + 오늘 1일 = 2일 연속)
      newStreak = newStreak + 1;
    } else if (daysDiff > 1) {
      // 2일 이상 공백 → 리셋 (오늘 학습했으므로 1일)
      newStreak = 1;
    }
  } else {
    // 첫 학습 → 1일 연속
    newStreak = 1;
  }

  // 학습한 단어 수 (UserProgress 기준)
  const learnedWordsCount = await prisma.userProgress.count({
    where: { userId }
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      lastActiveDate: now,
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, user.longestStreak || 0),
      totalWordsLearned: learnedWordsCount
    }
  });
}

// 복습 퀴즈 생성 API (2일 포함/1일 쉼 + D+3 알았음 로직)
export const getReviewQuiz = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const { examCategory, level, limit = '10' } = req.query;

    // UserProgress 직접 필터 (examCategory, level 컬럼 사용)
    const progressWhere: any = {
      userId,
      correctCount: { lt: 2 }, // 완료되지 않은 것만 (correctCount < 2)
    };

    // examCategory 필터 (UserProgress.examCategory)
    if (examCategory && examCategory !== 'all') {
      progressWhere.examCategory = examCategory as ExamCategory;
    }

    // level 필터 (UserProgress.level)
    if (level && level !== 'all') {
      progressWhere.level = level as string;
    }

    // 1. 복습 대상 후보 가져오기 (correctCount < 2)
    const allProgress = await prisma.userProgress.findMany({
      where: progressWhere,
      include: {
        word: {
          include: {
            visuals: { orderBy: { order: 'asc' } },
            mnemonics: { take: 1, orderBy: { rating: 'desc' } },
            examLevels: level && level !== 'all'
              ? { where: { level: level as string }, take: 1 }
              : { take: 1 },
          }
        }
      },
      orderBy: [
        { reviewCorrectCount: 'asc' },  // 복습 진행도 낮은 것 먼저
        { updatedAt: 'asc' },           // 오래 복습 안 한 것 먼저
        { createdAt: 'asc' },           // 오래된 것 먼저
      ],
    });

    // 2. 오늘 복습 대기인 단어만 필터링 (2일 포함/1일 쉼 + D+3 알았음)
    const dueReviews = allProgress.filter(p => shouldShowInReview({
      correctCount: p.correctCount,
      incorrectCount: p.incorrectCount,
      initialRating: p.initialRating,
      learnedAt: p.learnedAt,
    }));

    // 3. 제한 적용
    const limitedReviews = dueReviews.slice(0, parseInt(limit as string));

    if (limitedReviews.length === 0) {
      return res.json({ questions: [], count: 0, totalDue: dueReviews.length });
    }

    // 오답 선택지용 단어들 가져오기 (같은 시험 카테고리에서)
    const examCategoryFilter = examCategory && examCategory !== 'all'
      ? examCategory as ExamCategory
      : limitedReviews[0]?.word?.examCategory;

    const otherWords = await prisma.word.findMany({
      where: {
        examCategory: examCategoryFilter as ExamCategory,
        id: { notIn: limitedReviews.map(r => r.wordId) },
        definitionKo: { not: null }
      },
      select: {
        id: true,
        definitionKo: true,
        definition: true
      },
      take: 100 // 충분한 오답 선택지 확보
    });

    // 퀴즈 생성
    const questions = limitedReviews.map(review => {
      const word = review.word;
      const correctAnswer = word.definitionKo || word.definition;

      // 오답 3개 랜덤 선택
      const wrongAnswers = shuffleArray(
        otherWords.filter(w => (w.definitionKo || w.definition) !== correctAnswer)
      )
        .slice(0, 3)
        .map(w => ({
          text: w.definitionKo || w.definition,
          isCorrect: false
        }));

      // 정답 포함하여 섞기
      const options = shuffleArray([
        { text: correctAnswer, isCorrect: true },
        ...wrongAnswers
      ]);

      // 이미지 정리 (CONCEPT, MNEMONIC, RHYME)
      const visuals = {
        concept: word.visuals?.find(v => v.type === 'CONCEPT')?.imageUrl || null,
        mnemonic: word.visuals?.find(v => v.type === 'MNEMONIC')?.imageUrl ||
                  word.mnemonics?.[0]?.imageUrl || null,
        rhyme: word.visuals?.find(v => v.type === 'RHYME')?.imageUrl || null,
      };

      // 레벨 정보 가져오기
      const wordLevel = word.examLevels?.[0]?.level || word.level || 'L1';

      return {
        wordId: word.id,
        word: {
          id: word.id,
          word: word.word,
          partOfSpeech: word.partOfSpeech,
          pronunciation: word.pronunciation,
          phonetic: word.phonetic,
          ipaUs: word.ipaUs,
          ipaUk: word.ipaUk,
          audioUrlUs: word.audioUrlUs,
          audioUrlUk: word.audioUrlUk,
          // 추가 필드
          pronunciationKo: word.phonetic,  // 한국어 발음 (phonetic 필드 사용)
          examCategory: word.examCategory,
          level: wordLevel,
        },
        visuals,
        options,
        correctAnswer,
        progressId: review.id,
        correctCount: review.correctCount,
        incorrectCount: review.incorrectCount,
      };
    });

    res.json({
      questions,
      count: questions.length,
      totalDue: dueReviews.length
    });
  } catch (error) {
    next(error);
  }
};

// 숙련도 분포 API (개편된 로직)
// 모집단: needsReview=true인 단어들 (복습 대상)
// - 복습 중: reviewCorrectCount = 0
// - 어느 정도 암기: reviewCorrectCount = 1
// - 완전 암기: reviewCorrectCount >= 2
export const getMasteryDistribution = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const { examCategory = 'CSAT', level = 'all' } = req.query;

    // 1. 해당 시험/레벨 필터
    const wordFilter: any = {
      examCategory: examCategory as string,
    };
    if (level && level !== 'all') {
      wordFilter.level = level as string;
    }

    // 2. 전체 학습한 단어 수 (정확도 계산용)
    const totalLearnedWords = await prisma.userProgress.count({
      where: {
        userId,
        word: {
          examLevels: { some: wordFilter }
        }
      }
    });

    // 3. 정답 처리된 단어 수 (needsReview=false 또는 correctCount > 0)
    const correctWords = await prisma.userProgress.count({
      where: {
        userId,
        needsReview: false,
        word: {
          examLevels: { some: wordFilter }
        }
      }
    });

    // 정확도 계산
    const accuracy = totalLearnedWords > 0
      ? Math.round((correctWords / totalLearnedWords) * 100)
      : 0;

    // 4. 복습 대상 단어들 조회 (needsReview=true)
    const reviewWords = await prisma.userProgress.findMany({
      where: {
        userId,
        needsReview: true,
        word: {
          examLevels: { some: wordFilter }
        }
      },
      select: {
        reviewCorrectCount: true,
      }
    });

    const totalReviewWords = reviewWords.length;

    // 5. 숙련도 분포 계산 (복습 대상 단어 기준)
    const reviewing = reviewWords.filter(w => w.reviewCorrectCount === 0).length;     // 복습 중
    const familiar = reviewWords.filter(w => w.reviewCorrectCount === 1).length;      // 어느 정도 암기
    const mastered = reviewWords.filter(w => w.reviewCorrectCount >= 2).length;       // 완전 암기

    // % 계산 (복습 대상 단어 대비)
    const reviewingPercent = totalReviewWords > 0 ? Math.round((reviewing / totalReviewWords) * 100) : 0;
    const familiarPercent = totalReviewWords > 0 ? Math.round((familiar / totalReviewWords) * 100) : 0;
    const masteredPercent = totalReviewWords > 0 ? Math.round((mastered / totalReviewWords) * 100) : 0;

    // 6. 전체 단어 수 (진행률 표시용)
    const totalWords = await prisma.wordExamLevel.count({
      where: wordFilter,
    });

    res.json({
      examCategory,
      level,
      // 정확도 (전체 학습 단어 기준)
      accuracy: {
        correctWords,
        totalLearnedWords,
        percent: accuracy,
      },
      // 숙련도 분포 (복습 대상 단어 기준)
      mastery: {
        reviewTarget: totalReviewWords,  // 복습 대상 단어 총 개수
        reviewing: {
          count: reviewing,
          percent: reviewingPercent,
        },
        familiar: {
          count: familiar,
          percent: familiarPercent,
        },
        mastered: {
          count: mastered,
          percent: masteredPercent,
        },
      },
      // 전체 진행률 (참고용)
      overall: {
        totalWords,
        learnedWords: totalLearnedWords,
        progressPercent: totalWords > 0 ? Math.round((totalLearnedWords / totalWords) * 100) : 0,
      },
      // 기존 호환성 유지 (deprecated)
      distribution: {
        notSeen: totalWords - totalLearnedWords,
        learning: reviewing,
        familiar: familiar,
        mastered: mastered,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Fisher-Yates 셔플 알고리즘
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 학습 활동 히트맵 데이터 조회
 * GET /progress/activity
 * 최근 1년(365일)간의 일별 학습 활동 데이터 반환
 */
export const getActivityHeatmap = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const weeks = parseInt(req.query.weeks as string) || 52;
    const daysToFetch = weeks * 7;

    // 시작 날짜 계산 (오늘 - daysToFetch일)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysToFetch);
    startDate.setHours(0, 0, 0, 0);

    // 일별 학습 단어 수 쿼리 (UserProgress.updatedAt 또는 createdAt 기준)
    const dailyActivity = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT
        DATE("updatedAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul') as date,
        COUNT(DISTINCT "wordId")::bigint as count
      FROM "UserProgress"
      WHERE "userId" = ${userId}
        AND "updatedAt" >= ${startDate}
      GROUP BY DATE("updatedAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul')
      ORDER BY date
    `;

    // 날짜별 Map 생성
    const activityMap = new Map<string, number>();
    for (const row of dailyActivity) {
      const dateStr = new Date(row.date).toISOString().split('T')[0];
      activityMap.set(dateStr, Number(row.count));
    }

    // 모든 날짜에 대해 데이터 생성 (없는 날은 0)
    const heatmapData: Array<{ date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = daysToFetch - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = activityMap.get(dateStr) || 0;

      // 레벨 결정 (학습량에 따라)
      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (count === 0) level = 0;
      else if (count < 10) level = 1;
      else if (count < 20) level = 2;
      else if (count < 30) level = 3;
      else level = 4;

      heatmapData.push({ date: dateStr, count, level });
    }

    // 통계 계산
    const totalDays = heatmapData.filter(d => d.count > 0).length;
    const totalWords = heatmapData.reduce((sum, d) => sum + d.count, 0);

    res.json({
      heatmapData,
      stats: {
        totalDays,
        totalWords,
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 복습 대상 단어 수 조회 (needsReview = true인 단어)
 * GET /progress/weak-words/count
 * Query: examCategory, level
 */
export const getWeakWordsCount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const { examCategory, level } = req.query;

    // 기본 where 조건
    const wordWhere: any = {
      isActive: true,
      examCategory: { not: 'CSAT_ARCHIVE' }
    };

    // 시험 필터
    if (examCategory && examCategory !== 'all') {
      wordWhere.examCategory = examCategory as string;
    }

    // 레벨 필터
    if (level && level !== 'all') {
      wordWhere.examLevels = {
        some: { level: level as string }
      };
    }

    // 복습 대상 단어 수 조회 (needsReview = true)
    const weakCount = await prisma.userProgress.count({
      where: {
        userId,
        needsReview: true,
        word: wordWhere
      }
    });

    res.json({ count: weakCount });
  } catch (error) {
    next(error);
  }
};
