import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { verifyContentAccess, isGlobalLocale } from '../middleware/subscription.middleware';
import { ExamCategory, LearningMethod } from '@prisma/client';
import appCache from '../lib/cache';

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

    const [progress, stats, todayLearned, todayKnown, totalLearned, totalKnown] = await Promise.all([
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

      // 오늘 학습한 단어 수 (updatedAt 기준 - 복습 포함)
      prisma.userProgress.count({
        where: {
          userId,
          updatedAt: { gte: todayStartUTC }
        }
      }),

      // 오늘 "알았음" 선택한 단어 수 (initialRating >= 3)
      prisma.userProgress.count({
        where: {
          userId,
          updatedAt: { gte: todayStartUTC },
          initialRating: { gte: 3 }
        }
      }),

      // 전체 학습한 단어 수
      prisma.userProgress.count({
        where: { userId }
      }),

      // 전체 "알았음" 선택한 단어 수
      prisma.userProgress.count({
        where: {
          userId,
          initialRating: { gte: 3 }
        }
      })
    ]);

    // 플래시카드 정답률 계산
    const todayFlashcardAccuracy = todayLearned > 0
      ? Math.round((todayKnown / todayLearned) * 100)
      : 0;

    const totalFlashcardAccuracy = totalLearned > 0
      ? Math.round((totalKnown / totalLearned) * 100)
      : 0;

    res.json({
      progress,
      stats: {
        ...stats,
        totalWordsLearned: totalLearned,  // UserProgress 카운트 사용 (User 테이블 대신)
        todayWordsLearned: todayLearned,
        todayFlashcardAccuracy,    // 오늘 플래시카드 정답률
        totalFlashcardAccuracy,    // 전체 플래시카드 정답률
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

    // KST 기준 내일 시작/끝 시간
    const tomorrowStartKST = new Date(todayStartKST);
    tomorrowStartKST.setDate(tomorrowStartKST.getDate() + 1);
    const tomorrowStartUTC = new Date(tomorrowStartKST.getTime() - 9 * 60 * 60 * 1000);
    const tomorrowEndKST = new Date(tomorrowStartKST);
    tomorrowEndKST.setDate(tomorrowEndKST.getDate() + 1);
    const tomorrowEndUTC = new Date(tomorrowEndKST.getTime() - 9 * 60 * 60 * 1000);

    // KST 기준 이번 주 끝 (7일 후)
    const weekEndKST = new Date(todayStartKST);
    weekEndKST.setDate(weekEndKST.getDate() + 7);
    const weekEndUTC = new Date(weekEndKST.getTime() - 9 * 60 * 60 * 1000);

    // 기본 where 조건 (word 모델 필터 — 비활성/아카이브 단어 제외)
    const wordWhere: any = {
      isActive: true,
      examCategory: { not: 'CSAT_ARCHIVE' }
    };

    // UserProgress 레벨 필터 (exam/level은 UserProgress 자체 필드로 필터)
    // → word.examCategory가 아닌 userProgress.examCategory로 필터해야
    //   examLevels 기반 단어(TOEFL, TOEIC 등)도 정확히 매칭됨
    const progressWhere: any = { userId };

    // 시험 필터 (UserProgress.examCategory)
    if (examCategory && examCategory !== 'all') {
      progressWhere.examCategory = examCategory as string;
    }

    // 레벨 필터 (UserProgress.level)
    if (level && level !== 'all') {
      progressWhere.level = level as string;
    }

    // 🚀 메인 쿼리 + 7개 통계 쿼리 = 8개 전부 병렬 실행 (워터폴 제거)
    const [
      allProgress,
      progressForStats,
      lastReviewRecord,
      weakWordsCount,
      todayCorrectCount,
      bookmarkedCount,
      tomorrowDueCount,
      thisWeekDueCount
    ] = await Promise.all([
      // 1. 복습 대상 후보 조회 (경량화된 include - 필요한 필드만)
      prisma.userProgress.findMany({
        where: {
          ...progressWhere,
          correctCount: { lt: 2 },
          nextReviewDate: { lte: new Date() },
          word: wordWhere
        },
        include: {
          word: {
            select: {
              id: true,
              word: true,
              definitionKo: true,
              definition: true,
              visuals: {
                select: {
                  id: true,
                  imageUrl: true,
                  captionKo: true,
                  type: true,
                },
                orderBy: { order: 'asc' },
                take: 1,
              },
              examples: {
                select: {
                  id: true,
                  sentence: true,
                  translation: true,
                },
                orderBy: { order: 'asc' },
              },
            }
          }
        },
        orderBy: [
          { nextReviewDate: 'asc' },
          { incorrectCount: 'desc' },
          { correctCount: 'asc' },
          { createdAt: 'asc' },
        ]
      }),

      // 2. 전체 학습 기록에서 정답률 계산
      prisma.userProgress.findMany({
        where: { ...progressWhere, word: wordWhere },
        select: { correctCount: true, incorrectCount: true }
      }),

      // 3. 마지막 복습 날짜 조회
      prisma.userProgress.findFirst({
        where: {
          ...progressWhere,
          lastReviewDate: { not: null },
          word: wordWhere
        },
        orderBy: { lastReviewDate: 'desc' },
        select: { lastReviewDate: true }
      }),

      // 4. 취약 단어 수 (incorrectCount > 0인 단어)
      prisma.userProgress.count({
        where: {
          ...progressWhere,
          incorrectCount: { gt: 0 },
          word: wordWhere
        }
      }),

      // 5. 오늘 맞춘 복습 수 (KST 기준)
      prisma.userProgress.count({
        where: {
          ...progressWhere,
          lastReviewDate: { gte: todayStartUTC },
          nextReviewDate: { gt: new Date() },
          totalReviews: { gte: 2 },
          word: wordWhere
        }
      }),

      // 6. 북마크 수
      prisma.bookmark.count({
        where: { userId }
      }).catch(() => 0),

      // 7. 내일 복습 예정
      prisma.userProgress.count({
        where: {
          ...progressWhere,
          correctCount: { lt: 2 },
          nextReviewDate: {
            gte: tomorrowStartUTC,
            lt: tomorrowEndUTC
          },
          word: wordWhere
        }
      }),

      // 8. 이번 주 복습 예정
      prisma.userProgress.count({
        where: {
          ...progressWhere,
          correctCount: { lt: 2 },
          nextReviewDate: {
            gte: tomorrowEndUTC,
            lt: weekEndUTC
          },
          word: wordWhere
        }
      })
    ]);

    // 오늘 복습 대기인 단어만 필터링 (2일 포함/1일 쉼 + D+3 알았음)
    const dueReviews = allProgress.filter(p => shouldShowInReview({
      correctCount: p.correctCount,
      incorrectCount: p.incorrectCount,
      initialRating: p.initialRating,
      learnedAt: p.learnedAt,
    }));

    // 정답률 계산
    let totalCorrect = 0;
    let totalIncorrect = 0;
    progressForStats.forEach(p => {
      totalCorrect += p.correctCount;
      totalIncorrect += p.incorrectCount;
    });
    const totalAttempts = totalCorrect + totalIncorrect;
    const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

    // 🚀 사용자별 복습 데이터, 짧은 캐시
    res.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=30');
    res.json({
      reviews: dueReviews,
      count: dueReviews.length,
      accuracy,
      lastReviewDate: lastReviewRecord?.lastReviewDate || null,
      weakCount: weakWordsCount,
      todayCorrect: todayCorrectCount,
      totalReviewed: progressForStats.length,
      bookmarkedCount: bookmarkedCount,
      tomorrowDue: tomorrowDueCount,
      thisWeekDue: thisWeekDueCount
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

    console.log('[submitReview] Request body:', { wordId, rating, examCategory, level, userId });

    if (!wordId || rating === undefined) {
      throw new AppError('Word ID and rating are required', 400);
    }

    if (rating < 1 || rating > 5) {
      throw new AppError('Rating must be between 1 and 5', 400);
    }

    // examCategory와 level이 없으면 Word에서 가져오기
    let wordExamCategory: ExamCategory;
    let wordLevel: string;

    // Word에서 기본값 가져오기 (examCategory와 level 모두)
    const word = await prisma.word.findUnique({
      where: { id: wordId },
      include: {
        examLevels: { take: 1 }
      }
    });

    if (!word) {
      console.error('[submitReview] Word not found:', wordId);
      throw new AppError('Word not found', 404);
    }

    // examCategory: 프론트엔드에서 전달받은 값 > Word의 값
    if (examCategory && Object.values(ExamCategory).includes(examCategory as ExamCategory)) {
      wordExamCategory = examCategory as ExamCategory;
    } else {
      wordExamCategory = word.examCategory;
      console.warn('[submitReview] examCategory fallback to Word:', { received: examCategory, fallback: word.examCategory });
    }

    // level: 프론트엔드에서 전달받은 값 > Word의 examLevels > Word의 level > 기본값 'L1'
    if (level) {
      wordLevel = level;
    } else {
      wordLevel = word.examLevels?.[0]?.level || word.level || 'L1';
      console.warn('[submitReview] level fallback to Word:', { received: level, fallback: wordLevel });
    }

    console.log('[submitReview] Resolved values:', { wordExamCategory, wordLevel, source: examCategory ? 'frontend' : 'fallback' });

    // examCategory 유효성 검증
    if (!wordExamCategory) {
      console.error('[submitReview] examCategory is missing');
      throw new AppError('examCategory is required', 400);
    }

    // Get or create progress (시험/레벨별 독립 진행률 관리)
    // @@unique([userId, wordId, examCategory, level]) — 같은 단어라도 시험별 진행률 분리
    let progress = await prisma.userProgress.findFirst({
      where: {
        userId,
        wordId,
        examCategory: wordExamCategory,
        level: wordLevel,
      }
    });

    if (!progress) {
      // Create new progress - 첫 학습 시 initialRating, learnedAt 저장
      const now = new Date();

      // 첫 학습 시 nextReviewDate 설정 (2버튼 시스템)
      // 모름 (rating 1): 오늘부터 바로 복습
      // 알았음 (rating 5): D+3에 복습
      const initialNextReviewDate = new Date();
      if (rating >= 3) {
        // 알았음 → D+3에 복습
        initialNextReviewDate.setDate(initialNextReviewDate.getDate() + 3);
      }
      // 모름 (rating <= 2)은 오늘 (이미 new Date()로 설정됨)

      // upsert로 경합 방지 (배치/개별 동시 호출 시 unique constraint 충돌 방지)
      progress = await prisma.userProgress.upsert({
        where: {
          userId_wordId_examCategory_level: {
            userId, wordId, examCategory: wordExamCategory, level: wordLevel,
          },
        },
        create: {
          userId,
          wordId,
          examCategory: wordExamCategory,
          level: wordLevel,
          nextReviewDate: initialNextReviewDate,
          masteryLevel: 'NEW',
          initialRating: rating,  // 첫 학습 시 rating 저장 (1=모름, 5=알았음)
          learnedAt: now,         // 첫 학습 날짜 저장
        },
        update: {}, // 이미 존재하면 아래 update 로직에서 처리
      });
    }

    // Calculate next review using SM-2 algorithm
    const { easeFactor, interval, repetitions } = calculateNextReview(
      rating,
      progress.easeFactor,
      progress.interval,
      progress.repetitions
    );

    // ===== nextReviewDate 설정 =====
    // 플래시카드: 모름(rating 1) → 오늘, 알았음(rating 5) → D+3
    // 복습 퀴즈: 정답이든 오답이든 오늘은 끝, 내일 다시
    const nextReviewDate = new Date();
    const isQuiz = learningMethod === 'QUIZ';

    if (isQuiz) {
      // 복습 퀴즈 - 정답이든 오답이든 오늘은 끝, 내일 다시
      // 정답: correctCount++ (자동), 내일 복습
      // 오답: incorrectCount++ (자동), 내일 복습
      nextReviewDate.setDate(nextReviewDate.getDate() + 1);  // D+1 (내일)
    } else {
      // 플래시카드
      if (rating >= 3) {
        // 알았음 → D+3에 복습
        nextReviewDate.setDate(nextReviewDate.getDate() + 3);
      }
      // 모름 (rating <= 2) → 오늘 (바로 복습 대기)
    }

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

    // 새로운 correctCount 계산 (QUIZ에서만 증가)
    // 플래시카드는 initialRating으로 정답률 계산, 복습 퀴즈는 correctCount/incorrectCount 사용
    const newCorrectCount = (isCorrectAnswer && isQuiz) ? progress.correctCount + 1 : progress.correctCount;

    // ===== correctCount >= 2이면 복습 완료 =====
    if (newCorrectCount >= 2) {
      needsReview = false;
    }

    // Determine mastery level based on correctCount
    let masteryLevel = progress.masteryLevel;
    if (newCorrectCount >= 6) {
      masteryLevel = 'MASTERED';
    } else if (newCorrectCount >= 3) {
      masteryLevel = 'FAMILIAR';
    } else if (newCorrectCount >= 1) {
      masteryLevel = 'LEARNING';
    }

    // Update progress (id로 직접 업데이트 - Enum 타입 불일치 방지)
    const updatedProgress = await prisma.userProgress.update({
      where: {
        id: progress.id
      },
      data: {
        easeFactor,
        interval,
        repetitions,
        nextReviewDate,
        lastReviewDate: new Date(),
        masteryLevel,
        // correctCount/incorrectCount: QUIZ에서만 증가 (플래시카드는 initialRating 사용)
        correctCount: (isCorrectAnswer && isQuiz) ? progress.correctCount + 1 : progress.correctCount,
        incorrectCount: (!isCorrectAnswer && isQuiz) ? progress.incorrectCount + 1 : progress.incorrectCount,
        totalReviews: progress.totalReviews + 1,
        needsReview,
        reviewCorrectCount,
        // 플래시카드 재선택 시 initialRating 업데이트 (FLASHCARD 학습만)
        ...(learningMethod === 'FLASHCARD' || !learningMethod ? { initialRating: rating } : {}),
      }
    });

    console.log('[submitReview] Updated progress:', { progressId: updatedProgress.id, examCategory: updatedProgress.examCategory });

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

/**
 * 🚀 배치 리뷰 제출 (Set 완료 시 일괄 전송)
 * POST /progress/review/batch
 * 트랜잭션 없이 개별 처리 — 타임아웃/P2002 문제 근본 해결
 * 각 단어는 독립적이므로 원자성 불필요
 */
export const submitReviewBatch = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const { reviews, sessionId } = req.body;

    if (!Array.isArray(reviews) || reviews.length === 0) {
      throw new AppError('Reviews array is required', 400);
    }

    if (reviews.length > 50) {
      throw new AppError('Maximum 50 reviews per batch', 400);
    }

    console.log(`[submitReviewBatch] Processing ${reviews.length} reviews for user ${userId}`);

    // 동일 wordId 중복 제거 (마지막 리뷰 결과만 유지)
    const deduped = new Map<string, any>();
    for (const review of reviews) {
      const key = `${review.wordId}:${review.examCategory || ''}:${review.level || ''}`;
      deduped.set(key, review);
    }
    const uniqueReviews = Array.from(deduped.values());

    if (uniqueReviews.length < reviews.length) {
      console.log(`[submitReviewBatch] Deduplicated: ${reviews.length} → ${uniqueReviews.length}`);
    }

    // 1. 모든 관련 Word 한번에 조회 (N+1 방지)
    const wordIds = [...new Set(uniqueReviews.map((r: any) => r.wordId))];
    const words = await prisma.word.findMany({
      where: { id: { in: wordIds } },
      include: { examLevels: { take: 1 } },
    });
    const wordMap = new Map(words.map(w => [w.id, w]));

    // 2. 모든 관련 UserProgress 한번에 조회
    const existingProgress = await prisma.userProgress.findMany({
      where: { userId, wordId: { in: wordIds } },
    });
    const progressMap = new Map(
      existingProgress.map(p => [`${p.wordId}:${p.examCategory}:${p.level}`, p])
    );

    // 3. 각 단어 병렬 처리 (5개씩 청크 — DB 커넥션 풀 보호)
    const reviewRecords: Array<{
      userId: string; wordId: string; sessionId?: string;
      rating: number; responseTime?: number; learningMethod: LearningMethod;
    }> = [];

    const processReview = async (review: any) => {
      const { wordId, rating, responseTime, learningMethod, examCategory, level } = review;

      if (!wordId || rating === undefined) return null;

      const word = wordMap.get(wordId);
      if (!word) return null;

      let wordExamCategory: ExamCategory;
      let wordLevel: string;

      if (examCategory && Object.values(ExamCategory).includes(examCategory as ExamCategory)) {
        wordExamCategory = examCategory as ExamCategory;
      } else {
        wordExamCategory = word.examCategory;
      }

      wordLevel = level || word.examLevels?.[0]?.level || word.level || 'L1';

      const progressKey = `${wordId}:${wordExamCategory}:${wordLevel}`;
      let progress = progressMap.get(progressKey) || null;

      if (!progress) {
        const initialNextReviewDate = new Date();
        if (rating >= 3) {
          initialNextReviewDate.setDate(initialNextReviewDate.getDate() + 3);
        }

        try {
          progress = await prisma.userProgress.upsert({
            where: {
              userId_wordId_examCategory_level: {
                userId, wordId, examCategory: wordExamCategory, level: wordLevel,
              },
            },
            create: {
              userId, wordId,
              examCategory: wordExamCategory,
              level: wordLevel,
              nextReviewDate: initialNextReviewDate,
              masteryLevel: 'NEW',
              initialRating: rating,
              learnedAt: new Date(),
            },
            update: {},
          });
        } catch (upsertError: any) {
          // P2002: 동시 요청으로 이미 생성됨 → 기존 레코드 조회
          // DB에 (userId, wordId) 2-field unique가 존재하므로 findFirst로 조회
          if (upsertError?.code === 'P2002') {
            progress = await prisma.userProgress.findFirst({
              where: { userId, wordId },
            });
            if (!progress) throw upsertError; // 조회도 실패하면 원래 에러 throw
          } else {
            throw upsertError;
          }
        }
        progressMap.set(progressKey, progress);
      }

      // SM-2 알고리즘
      const { easeFactor, interval, repetitions } = calculateNextReview(
        rating, progress.easeFactor, progress.interval, progress.repetitions
      );

      const nextReviewDate = new Date();
      const isQuiz = learningMethod === 'QUIZ';
      if (isQuiz) {
        nextReviewDate.setDate(nextReviewDate.getDate() + 1);
      } else if (rating >= 3) {
        nextReviewDate.setDate(nextReviewDate.getDate() + 3);
      }

      const isCorrectAnswer = rating >= 3;
      let needsReview = progress.needsReview;
      let reviewCorrectCount = progress.reviewCorrectCount;

      if (!isCorrectAnswer) {
        needsReview = true;
        reviewCorrectCount = 0;
      } else if (progress.needsReview && isQuiz) {
        reviewCorrectCount = progress.reviewCorrectCount + 1;
      }

      const newCorrectCount = (isCorrectAnswer && isQuiz) ? progress.correctCount + 1 : progress.correctCount;
      if (newCorrectCount >= 2) needsReview = false;

      let masteryLevel = progress.masteryLevel;
      if (newCorrectCount >= 6) masteryLevel = 'MASTERED';
      else if (newCorrectCount >= 3) masteryLevel = 'FAMILIAR';
      else if (newCorrectCount >= 1) masteryLevel = 'LEARNING';

      const updated = await prisma.userProgress.update({
        where: { id: progress.id },
        data: {
          easeFactor, interval, repetitions, nextReviewDate,
          lastReviewDate: new Date(), masteryLevel,
          correctCount: (isCorrectAnswer && isQuiz) ? progress.correctCount + 1 : progress.correctCount,
          incorrectCount: (!isCorrectAnswer && isQuiz) ? progress.incorrectCount + 1 : progress.incorrectCount,
          totalReviews: progress.totalReviews + 1,
          needsReview, reviewCorrectCount,
          ...(learningMethod === 'FLASHCARD' || !learningMethod ? { initialRating: rating } : {}),
        }
      });

      progressMap.set(progressKey, updated);

      reviewRecords.push({
        userId, wordId, sessionId: sessionId || undefined,
        rating, responseTime,
        learningMethod: (learningMethod || 'FLASHCARD') as LearningMethod,
      });

      return updated;
    };

    // 5개씩 병렬 실행 (DB 커넥션 풀 보호)
    const CHUNK_SIZE = 5;
    const processed: any[] = [];

    for (let i = 0; i < uniqueReviews.length; i += CHUNK_SIZE) {
      const chunk = uniqueReviews.slice(i, i + CHUNK_SIZE);
      const results = await Promise.allSettled(chunk.map(processReview));

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          processed.push(result.value);
        } else if (result.status === 'rejected') {
          console.error('[submitReviewBatch] Word failed:', result.reason);
        }
      }
    }

    // 4. Review 레코드 일괄 생성 (성공한 것만)
    if (reviewRecords.length > 0) {
      try {
        await prisma.review.createMany({ data: reviewRecords });
      } catch (createError) {
        console.error('[submitReviewBatch] Review createMany failed:', createError);
      }
    }

    // 5. updateUserStats 1회만 실행
    await updateUserStats(userId);

    console.log(`[submitReviewBatch] Completed: ${processed.length}/${uniqueReviews.length} reviews processed`);

    res.json({
      message: 'Batch reviews submitted',
      count: processed.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * sendBeacon 전용 배치 리뷰 엔드포인트 (페이지 언로드 시)
 * POST /progress/review/batch-beacon
 * body: { reviews, sessionId, token } (text/plain 또는 application/json)
 */
export const submitReviewBatchBeacon = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    let data: any;
    if (typeof req.body === 'string') {
      try {
        data = JSON.parse(req.body);
      } catch {
        return res.status(400).json({ error: 'Invalid JSON' });
      }
    } else {
      data = req.body;
    }

    const { reviews, sessionId, token } = data;

    if (!reviews || !Array.isArray(reviews) || reviews.length === 0 || !token) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 토큰 검증
    const jwt = require('jsonwebtoken');
    let userId: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // submitReviewBatch와 동일한 로직을 재사용
    // req 객체를 조작하여 기존 핸들러 호출
    req.userId = userId;
    req.body = { reviews, sessionId };

    // 병렬 처리 (5개씩 청크)
    const wordIds = [...new Set(reviews.map((r: any) => r.wordId))];
    const words = await prisma.word.findMany({
      where: { id: { in: wordIds } },
      include: { examLevels: { take: 1 } },
    });
    const wordMap = new Map(words.map(w => [w.id, w]));

    const reviewRecords: any[] = [];

    const processBeaconReview = async (review: any) => {
      const word = wordMap.get(review.wordId);
      if (!word) return null;

      const examCategory = review.examCategory || word.examCategory;
      const level = review.level || (word as any).examLevels?.[0]?.level || 'L1';

      try {
        await prisma.userProgress.upsert({
          where: {
            userId_wordId_examCategory_level: {
              userId, wordId: review.wordId, examCategory, level,
            },
          },
          create: {
            userId, wordId: review.wordId, examCategory, level,
            initialRating: review.rating,
            correctCount: review.rating >= 4 ? 1 : 0,
            incorrectCount: review.rating < 3 ? 1 : 0,
            nextReviewDate: new Date(),
            learnedAt: new Date(),
          },
          update: {
            correctCount: review.rating >= 4 ? { increment: 1 } : undefined,
            incorrectCount: review.rating < 3 ? { increment: 1 } : undefined,
            lastReviewDate: new Date(),
          },
        });
      } catch (upsertError: any) {
        // P2002: 동시 요청으로 이미 생성됨 → 기존 레코드로 진행
        // DB에 (userId, wordId) 2-field unique가 존재하므로 findFirst로 조회
        if (upsertError?.code === 'P2002') {
          const existing = await prisma.userProgress.findFirst({
            where: { userId, wordId: review.wordId },
          });
          if (!existing) throw upsertError;
        } else {
          throw upsertError;
        }
      }

      reviewRecords.push({
        userId, wordId: review.wordId,
        rating: review.rating,
        learningMethod: review.learningMethod || 'FLASHCARD',
        sessionId: sessionId || undefined,
      });

      return true;
    };

    const CHUNK_SIZE = 5;
    let successCount = 0;

    for (let i = 0; i < reviews.length; i += CHUNK_SIZE) {
      const chunk = reviews.slice(i, i + CHUNK_SIZE);
      const results = await Promise.allSettled(chunk.map(processBeaconReview));

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          successCount++;
        } else if (result.status === 'rejected') {
          console.error('[batch-beacon] Word failed:', result.reason);
        }
      }
    }

    if (reviewRecords.length > 0) {
      try {
        await prisma.review.createMany({ data: reviewRecords });
      } catch (createError) {
        console.error('[batch-beacon] Review createMany failed:', createError);
      }
    }

    res.json({ success: true, count: successCount });
  } catch (error) {
    console.error('[batch-beacon] Error:', error);
    // beacon 응답은 무시되므로 200 반환
    res.json({ success: false });
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

    // 권한 체크: 시험/레벨이 지정된 경우 구독/구매 기반 접근 제어
    if (examCategory && examCategory !== 'all' && level && level !== 'all') {
      const accessError = await verifyContentAccess(userId, examCategory as string, level as string, isGlobalLocale(req));
      if (accessError) {
        return res.status(403).json(accessError);
      }
    }

    // UserProgress 직접 필터 (examCategory, level 컬럼 사용)
    const progressWhere: any = {
      userId,
      correctCount: { lt: 2 }, // 완료되지 않은 것만 (correctCount < 2)
      nextReviewDate: { lte: new Date() }, // 오늘 또는 이전 날짜만 (복습 대기)
    };

    // examCategory 필터 (UserProgress.examCategory) - Enum 유효성 검증
    if (examCategory && examCategory !== 'all') {
      if (Object.values(ExamCategory).includes(examCategory as ExamCategory)) {
        progressWhere.examCategory = examCategory as ExamCategory;
      }
    }

    // level 필터 (UserProgress.level)
    if (level && level !== 'all') {
      progressWhere.level = level as string;
    }

    // 1. 복습 대상 후보 가져오기 (correctCount < 2) - 🚀 필요한 필드만 select
    const allProgress = await prisma.userProgress.findMany({
      where: progressWhere,
      include: {
        word: {
          select: {
            id: true,
            word: true,
            definitionKo: true,
            definition: true,
            partOfSpeech: true,
            pronunciation: true,
            phonetic: true,
            ipaUs: true,
            ipaUk: true,
            audioUrlUs: true,
            audioUrlUk: true,
            examCategory: true,
            level: true,
            visuals: {
              select: { type: true, imageUrl: true },
              orderBy: { order: 'asc' }
            },
            mnemonics: {
              select: { imageUrl: true },
              take: 1,
              orderBy: { rating: 'desc' }
            },
            examLevels: level && level !== 'all'
              ? { select: { level: true }, where: { level: level as string }, take: 1 }
              : { select: { level: true }, take: 1 },
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
    let examCategoryFilter: ExamCategory | undefined;
    if (examCategory && examCategory !== 'all' && Object.values(ExamCategory).includes(examCategory as ExamCategory)) {
      examCategoryFilter = examCategory as ExamCategory;
    } else {
      examCategoryFilter = limitedReviews[0]?.word?.examCategory;
    }

    const otherWords = await prisma.word.findMany({
      where: {
        examCategory: examCategoryFilter,
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
          examCategory: review.examCategory || word.examCategory,
          level: review.level || wordLevel,
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
// 모집단: 전체 학습한 단어들
// - 복습 대상 단어: initialRating = 1 (모름)
// - 복습 중: correctCount = 1
// - 어느 정도 암기: correctCount >= 2 AND correctCount < 5
// - 완전 암기: correctCount >= 5
export const getMasteryDistribution = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const { examCategory = 'CSAT', level = 'all' } = req.query;

    // 1. UserProgress 직접 필터 (examCategory, level 컬럼 사용)
    const progressWhere: any = {
      userId,
      examCategory: examCategory as string,
    };
    if (level && level !== 'all') {
      progressWhere.level = level as string;
    }

    // 2. 전체 학습한 단어 수
    const totalLearnedWords = await prisma.userProgress.count({
      where: progressWhere
    });

    // 3. 복습 대상 단어 (initialRating = 1, 즉 "모름" 선택)
    const needsReviewWords = await prisma.userProgress.count({
      where: {
        ...progressWhere,
        initialRating: 1
      }
    });

    // 4. 숙련도 분포 계산 (복습 대상 단어 중 correctCount 기준)
    const reviewTargetWhere = { ...progressWhere, initialRating: 1 };

    // - 복습 중: initialRating=1 AND correctCount = 1
    const reviewingCount = await prisma.userProgress.count({
      where: {
        ...reviewTargetWhere,
        correctCount: 1
      }
    });

    // - 어느 정도 암기: initialRating=1 AND correctCount >= 2 AND correctCount < 5
    const familiarCount = await prisma.userProgress.count({
      where: {
        ...reviewTargetWhere,
        correctCount: { gte: 2, lt: 5 }
      }
    });

    // - 완전 암기: initialRating=1 AND correctCount >= 5
    const masteredCount = await prisma.userProgress.count({
      where: {
        ...reviewTargetWhere,
        correctCount: { gte: 5 }
      }
    });

    // 5. 정확도 계산 (정답 처리된 단어 = needsReview=false)
    const correctWords = await prisma.userProgress.count({
      where: {
        ...progressWhere,
        needsReview: false
      }
    });

    const accuracy = totalLearnedWords > 0
      ? Math.round((correctWords / totalLearnedWords) * 100)
      : 0;

    // 6. % 계산 (복습 대상 단어 대비)
    const reviewingPercent = needsReviewWords > 0 ? Math.round((reviewingCount / needsReviewWords) * 100) : 0;
    const familiarPercent = needsReviewWords > 0 ? Math.round((familiarCount / needsReviewWords) * 100) : 0;
    const masteredPercent = needsReviewWords > 0 ? Math.round((masteredCount / needsReviewWords) * 100) : 0;

    // 7. 전체 단어 수 (진행률 표시용)
    const wordFilter: any = { examCategory: examCategory as string };
    if (level && level !== 'all') {
      wordFilter.level = level as string;
    }
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
        reviewTarget: needsReviewWords,  // 복습 대상 단어 총 개수 (initialRating = 1)
        reviewing: {
          count: reviewingCount,
          percent: reviewingPercent,
        },
        familiar: {
          count: familiarCount,
          percent: familiarPercent,
        },
        mastered: {
          count: masteredCount,
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
        learning: reviewingCount,
        familiar: familiarCount,
        mastered: masteredCount,
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

    // 복습 대상 단어 수 조회 (needsReview = true AND nextReviewDate <= NOW)
    // 오늘 복습 대기인 단어만 카운트
    const weakCount = await prisma.userProgress.count({
      where: {
        userId,
        needsReview: true,
        nextReviewDate: { lte: new Date() },  // 오늘 또는 이전 날짜만
        word: wordWhere
      }
    });

    res.json({ count: weakCount });
  } catch (error) {
    next(error);
  }
};

/**
 * 대시보드 요약 API (경량화)
 * GET /progress/dashboard-summary
 * Query: examCategory, level
 */
export const getDashboardSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const { examCategory = 'CSAT', level = 'L1' } = req.query;

    // UserProgress 기반 데이터(learnedCount, progress 등)는 매 학습마다 변하므로
    // 전체 응답 캐시 사용하지 않음. 단어 수(wordCount)만 개별 캐시 유지.

    // KST 기준 오늘 시작 시간 (00:00:00)
    const now = new Date();
    const todayStartKST = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    todayStartKST.setUTCHours(0, 0, 0, 0);
    const todayStartUTC = new Date(todayStartKST.getTime() - 9 * 60 * 60 * 1000);

    // 10초 타임아웃 보호
    const QUERY_TIMEOUT = 10000;
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Dashboard query timeout (10s)')), QUERY_TIMEOUT)
    );

    // 단일 병렬 쿼리로 모든 필요 데이터 조회
    const [
      userStats,
      dueReviewCount,
      totalWordsCount,
      learnedWordsCount,
      weakWordsCount,
      learningSession,
      // Hero 컴포넌트용 추가 통계
      todayLearned,
      todayKnown,
      totalLearned,
      totalKnown
    ] = await Promise.race([
      Promise.all([
        // 1. 유저 통계 (streak, dailyGoal)
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            currentStreak: true,
            longestStreak: true,
            lastActiveDate: true,
            dailyGoal: true,
            totalWordsLearned: true,
          }
        }),

        // 2. 🚀 복습 대기 단어 수 (DB 레벨에서 shouldShowInReview 로직 처리 - OOM 방지)
        // 기존: findMany로 전체 로드 후 JS 필터 → 메모리 폭발 위험
        // 개선: Raw SQL COUNT로 DB에서 직접 계산
        (async () => {
          const result = await prisma.$queryRaw<[{ count: bigint }]>`
            SELECT COUNT(*) as count FROM "UserProgress"
            WHERE "userId" = ${userId}
              AND "correctCount" < 2
              AND "nextReviewDate" <= NOW()
              AND (
                -- "알았음" (rating=5, 틀린적 없음) → D+3에만 복습
                ("initialRating" = 5 AND "incorrectCount" = 0
                  AND (CURRENT_DATE - "learnedAt"::date) = 3)
                OR
                -- "모름" 또는 틀린 단어 → 2일 포함/1일 쉼 패턴 (cycleDay % 3 != 2)
                (NOT ("initialRating" = 5 AND "incorrectCount" = 0)
                  AND (CURRENT_DATE - "learnedAt"::date) % 3 != 2)
              )
          `;
          return Number(result[0]?.count ?? 0);
        })(),

        // 3. 전체 단어 수 (🚀 캐시 사용 - TTL 1시간, THEME_는 캐시 스킵)
        (async () => {
          const isThematic = (level as string).startsWith('THEME_');
          // THEME_ 레벨은 캐시 스킵 (잘못된 0 값이 캐시될 수 있음)
          if (!isThematic) {
            const cachedCount = appCache.getWordCount(examCategory as string, level as string);
            if (cachedCount !== undefined) return cachedCount;
          }
          const count = isThematic
            ? await prisma.word.count({
                where: {
                  tags: { has: level as string },
                  examLevels: { some: { examCategory: examCategory as ExamCategory } },
                  isActive: true,
                }
              })
            : await prisma.wordExamLevel.count({
                where: {
                  examCategory: examCategory as ExamCategory,
                  level: level as string,
                }
              });
          console.log(`[DashboardSummary] wordCount: exam=${examCategory}, level=${level}, isThematic=${isThematic}, count=${count}`);
          appCache.setWordCount(examCategory as string, level as string, count);
          return count;
        })(),

        // 4. 학습 완료 단어 수 (THEME_: wordId 기준, 일반: level 기준)
        (async () => {
          const isThematic = (level as string).startsWith('THEME_');
          if (!isThematic) {
            return prisma.userProgress.count({
              where: { userId, examCategory: examCategory as ExamCategory, level: level as string },
            });
          }
          // THEME_ 단어는 L1/L2 등 다른 level로 학습되었을 수 있으므로
          // 해당 태그의 wordId 목록과 UserProgress를 wordId 기준으로 매칭
          const themeWords = await prisma.word.findMany({
            where: {
              tags: { has: level as string },
              examLevels: { some: { examCategory: examCategory as ExamCategory } },
              isActive: true,
            },
            select: { id: true },
          });
          if (themeWords.length === 0) return 0;
          const wordIds = themeWords.map(w => w.id);
          return prisma.userProgress.count({
            where: { userId, wordId: { in: wordIds } },
          });
        })(),

        // 5. 취약 단어 수 (needsReview = true, THEME_: wordId 기준)
        (async () => {
          const isThematic = (level as string).startsWith('THEME_');
          if (!isThematic) {
            return prisma.userProgress.count({
              where: { userId, needsReview: true, examCategory: examCategory as ExamCategory, level: level as string },
            });
          }
          const themeWords = await prisma.word.findMany({
            where: {
              tags: { has: level as string },
              examLevels: { some: { examCategory: examCategory as ExamCategory } },
              isActive: true,
            },
            select: { id: true },
          });
          if (themeWords.length === 0) return 0;
          const wordIds = themeWords.map(w => w.id);
          return prisma.userProgress.count({
            where: { userId, needsReview: true, wordId: { in: wordIds } },
          });
        })(),

        // 6. 학습 세션
        prisma.learningSession.findFirst({
          where: {
            userId,
            examCategory: examCategory as ExamCategory,
            level: level as string,
            status: { in: ['IN_PROGRESS', 'COMPLETED'] }
          },
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            currentSet: true,
            currentIndex: true,
            completedSets: true,
            totalWords: true,
            totalReviewed: true,
            status: true,
            isRestart: true,
          }
        }),

        // 7. 오늘 학습한 단어 수 (Hero용 - 전체 시험/레벨 합산)
        prisma.userProgress.count({
          where: {
            userId,
            updatedAt: { gte: todayStartUTC }
          }
        }),

        // 8. 오늘 "알았음" 선택한 단어 수 (Hero용)
        prisma.userProgress.count({
          where: {
            userId,
            updatedAt: { gte: todayStartUTC },
            initialRating: { gte: 3 }
          }
        }),

        // 9. 전체 학습한 단어 수 (Hero용)
        prisma.userProgress.count({
          where: { userId }
        }),

        // 10. 전체 "알았음" 선택한 단어 수 (Hero용)
        prisma.userProgress.count({
          where: {
            userId,
            initialRating: { gte: 3 }
          }
        })
      ]),
      timeoutPromise
    ]);

    // 플래시카드 정답률 계산
    const todayFlashcardAccuracy = todayLearned > 0
      ? Math.round((todayKnown / todayLearned) * 100)
      : 0;
    const totalFlashcardAccuracy = totalLearned > 0
      ? Math.round((totalKnown / totalLearned) * 100)
      : 0;

    const responseData = {
      stats: {
        ...userStats,
        totalWordsLearned: totalLearned,
        todayWordsLearned: todayLearned,
        todayFlashcardAccuracy,
        totalFlashcardAccuracy,
      },
      dueReviewCount,
      totalWords: totalWordsCount,
      learnedWords: learnedWordsCount,
      weakWordsCount,
      learningSession,
    };

    // 학습 후 갱신 필요 → no-store로 브라우저 HTTP 캐시 완전 방지
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.json(responseData);
  } catch (error: any) {
    // 타임아웃 에러 시 의미 있는 응답 반환
    if (error?.message?.includes('timeout')) {
      console.error('[Dashboard] Query timeout for user:', req.userId);
      return res.status(504).json({
        error: 'Dashboard query timed out',
        message: '대시보드 데이터 로딩에 시간이 너무 오래 걸립니다. 잠시 후 다시 시도해주세요.',
      });
    }
    next(error);
  }
};
