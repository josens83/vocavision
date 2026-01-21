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

export const getUserProgress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;

    // 오늘 시작 시간 (00:00:00)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

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

      // 오늘 학습한 고유 단어 수 카운트
      prisma.learningRecord.findMany({
        where: {
          userId,
          createdAt: {
            gte: todayStart
          }
        },
        distinct: ['wordId'],
        select: {
          wordId: true
        }
      })
    ]);

    res.json({
      progress,
      stats: {
        ...stats,
        todayWordsLearned: todayLearned.length
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

    // 기본 where 조건
    const wordWhere: any = {
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

    const dueReviews = await prisma.userProgress.findMany({
      where: {
        userId,
        nextReviewDate: {
          lte: now
        },
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
      orderBy: { nextReviewDate: 'asc' }
    });

    // 전체 학습 기록에서 정답률 계산 (복습 대기와 무관하게)
    const allProgress = await prisma.userProgress.findMany({
      where: { userId, word: wordWhere },
      select: { correctCount: true, incorrectCount: true }
    });

    let totalCorrect = 0;
    let totalIncorrect = 0;
    allProgress.forEach(p => {
      totalCorrect += p.correctCount;
      totalIncorrect += p.incorrectCount;
    });
    const totalAttempts = totalCorrect + totalIncorrect;
    const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

    res.json({ reviews: dueReviews, count: dueReviews.length, accuracy });
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
    const { wordId, rating, responseTime, learningMethod, sessionId } = req.body;

    if (!wordId || rating === undefined) {
      throw new AppError('Word ID and rating are required', 400);
    }

    if (rating < 1 || rating > 5) {
      throw new AppError('Rating must be between 1 and 5', 400);
    }

    // Get or create progress
    let progress = await prisma.userProgress.findUnique({
      where: {
        userId_wordId: {
          userId,
          wordId
        }
      }
    });

    if (!progress) {
      // Create new progress - 즉시 복습 가능하도록 현재 시간으로 설정
      const now = new Date();

      progress = await prisma.userProgress.create({
        data: {
          userId,
          wordId,
          nextReviewDate: now, // 오늘 학습 → 오늘 복습 가능
          masteryLevel: 'NEW'
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

    // Determine mastery level based on correctCount (더 직관적인 기준)
    // 새로운 correctCount 계산 (업데이트 전에 미리 계산)
    const newCorrectCount = rating >= 3 ? progress.correctCount + 1 : progress.correctCount;

    let masteryLevel = progress.masteryLevel;
    if (newCorrectCount >= 6) {
      masteryLevel = 'MASTERED';    // 6회 이상 정답 → 완전히 암기 완료
    } else if (newCorrectCount >= 3) {
      masteryLevel = 'FAMILIAR';     // 3~5회 정답 → 어느 정도 암기됨
    } else if (newCorrectCount >= 1) {
      masteryLevel = 'LEARNING';     // 1~2회 정답 → 공부 중
    }
    // correctCount 0이면 NEW 유지

    // Update progress
    const updatedProgress = await prisma.userProgress.update({
      where: {
        userId_wordId: {
          userId,
          wordId
        }
      },
      data: {
        easeFactor,
        interval,
        repetitions,
        nextReviewDate,
        lastReviewDate: new Date(),
        masteryLevel,
        correctCount: rating >= 3 ? progress.correctCount + 1 : progress.correctCount,
        incorrectCount: rating < 3 ? progress.incorrectCount + 1 : progress.incorrectCount,
        totalReviews: progress.totalReviews + 1
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
    const reviewsWithNextDate = await Promise.all(
      reviews.map(async (review) => {
        const progress = await prisma.userProgress.findUnique({
          where: {
            userId_wordId: {
              userId,
              wordId: review.wordId,
            },
          },
          select: {
            nextReviewDate: true,
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

// 복습 퀴즈 생성 API
export const getReviewQuiz = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const now = new Date();
    const { examCategory, level, limit = '10' } = req.query;

    // 기본 where 조건
    const wordWhere: any = {
      examCategory: { not: 'CSAT_ARCHIVE' }
    };

    if (examCategory && examCategory !== 'all') {
      wordWhere.examCategory = examCategory as string;
    }

    if (level && level !== 'all') {
      wordWhere.examLevels = {
        some: { level: level as string }
      };
    }

    // 복습할 단어 가져오기
    const dueReviews = await prisma.userProgress.findMany({
      where: {
        userId,
        nextReviewDate: { lte: now },
        word: wordWhere
      },
      include: {
        word: {
          include: {
            visuals: { orderBy: { order: 'asc' } },
            mnemonics: { take: 1, orderBy: { rating: 'desc' } },
            examLevels: { take: 1 },  // 레벨 정보 포함
          }
        }
      },
      orderBy: { nextReviewDate: 'asc' },
      take: parseInt(limit as string)
    });

    if (dueReviews.length === 0) {
      return res.json({ questions: [], count: 0 });
    }

    // 오답 선택지용 단어들 가져오기 (같은 시험 카테고리에서)
    const examCategoryFilter = examCategory && examCategory !== 'all'
      ? examCategory as ExamCategory
      : dueReviews[0]?.word?.examCategory;

    const otherWords = await prisma.word.findMany({
      where: {
        examCategory: examCategoryFilter as ExamCategory,
        id: { notIn: dueReviews.map(r => r.wordId) },
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
    const questions = dueReviews.map(review => {
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

// 숙련도 분포 API (전체 단어 수 포함)
export const getMasteryDistribution = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const { examCategory = 'CSAT', level = 'all' } = req.query;

    // 1. 해당 시험/레벨의 전체 단어 수 조회
    const totalWordCountQuery: any = {
      examCategory: examCategory as string,
    };
    if (level && level !== 'all') {
      totalWordCountQuery.level = level as string;
    }

    const totalWords = await prisma.wordExamLevel.count({
      where: totalWordCountQuery,
    });

    // 2. 사용자가 학습한 단어의 masteryLevel 분포 조회
    const userProgressWhere: any = {
      userId,
      word: {
        examLevels: {
          some: totalWordCountQuery,
        }
      }
    };

    const progressByMastery = await prisma.userProgress.groupBy({
      by: ['masteryLevel'],
      where: userProgressWhere,
      _count: {
        _all: true,
      }
    });

    // 3. 분포 계산
    const distribution: Record<string, number> = {
      NEW: 0,
      LEARNING: 0,
      FAMILIAR: 0,
      MASTERED: 0,
    };

    let totalLearned = 0;
    progressByMastery.forEach((item) => {
      const count = item._count._all;
      distribution[item.masteryLevel] = count;
      totalLearned += count;
    });

    // "아직 안 본 단어" = 전체 - 학습한 단어
    const notSeen = Math.max(0, totalWords - totalLearned);

    res.json({
      examCategory,
      level,
      totalWords,
      distribution: {
        notSeen,
        learning: distribution.NEW + distribution.LEARNING, // NEW도 공부 중에 포함
        familiar: distribution.FAMILIAR,
        mastered: distribution.MASTERED,
      },
      // 상세 분포 (개별 masteryLevel)
      detailedDistribution: {
        NEW: notSeen, // 아직 안 본 단어
        LEARNING: distribution.NEW + distribution.LEARNING,
        FAMILIAR: distribution.FAMILIAR,
        MASTERED: distribution.MASTERED,
      }
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
