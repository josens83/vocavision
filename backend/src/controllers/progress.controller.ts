import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

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

    const progress = await prisma.userProgress.findMany({
      where: { userId },
      include: {
        word: {
          select: {
            id: true,
            word: true,
            definition: true,
            difficulty: true
          }
        }
      },
      orderBy: { nextReviewDate: 'asc' }
    });

    const stats = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalWordsLearned: true,
        currentStreak: true,
        longestStreak: true,
        lastActiveDate: true
      }
    });

    res.json({
      progress,
      stats
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

    const dueReviews = await prisma.userProgress.findMany({
      where: {
        userId,
        nextReviewDate: {
          lte: now
        }
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
          }
        }
      },
      orderBy: { nextReviewDate: 'asc' }
    });

    res.json({ reviews: dueReviews, count: dueReviews.length });
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
      // Create new progress
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      progress = await prisma.userProgress.create({
        data: {
          userId,
          wordId,
          nextReviewDate: tomorrow,
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

    // Determine mastery level
    let masteryLevel = progress.masteryLevel;
    if (repetitions >= 5 && easeFactor >= 2.5) {
      masteryLevel = 'MASTERED';
    } else if (repetitions >= 3) {
      masteryLevel = 'FAMILIAR';
    } else if (repetitions >= 1) {
      masteryLevel = 'LEARNING';
    }

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

async function updateUserStats(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      lastActiveDate: true,
      currentStreak: true,
      longestStreak: true
    }
  });

  if (!user) return;

  let newStreak = user.currentStreak;

  if (user.lastActiveDate) {
    const lastActive = new Date(user.lastActiveDate);
    lastActive.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      newStreak += 1;
    } else if (daysDiff > 1) {
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }

  const masteredCount = await prisma.userProgress.count({
    where: {
      userId,
      masteryLevel: 'MASTERED'
    }
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      lastActiveDate: new Date(),
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, user.longestStreak || 0),
      totalWordsLearned: masteredCount
    }
  });
}
