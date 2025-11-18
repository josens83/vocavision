import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAllAchievements = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;

    // Get all achievements
    const achievements = await prisma.achievement.findMany({
      orderBy: { requirement: 'asc' },
    });

    // Get user's achievement progress
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
    });

    // Get user stats for progress calculation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalWordsLearned: true,
        currentStreak: true,
        longestStreak: true,
      },
    });

    const progress = await prisma.userProgress.findMany({
      where: { userId },
    });

    // Calculate progress for each achievement type
    const stats = {
      wordsLearned: user?.totalWordsLearned || 0,
      currentStreak: user?.currentStreak || 0,
      longestStreak: user?.longestStreak || 0,
      perfectReviews: progress.filter(p => p.correctCount === p.totalReviews && p.totalReviews > 0).length,
      methodsUsed: new Set(progress.map(p => 'FLASHCARD')).size, // Simplified for now
      studyTime: 0, // To be implemented with session tracking
    };

    // Combine achievements with user progress
    const achievementsWithProgress = achievements.map((achievement) => {
      const userAchievement = userAchievements.find((ua) => ua.achievementId === achievement.id);

      let currentProgress = 0;
      switch (achievement.type) {
        case 'WORDS_LEARNED':
          currentProgress = stats.wordsLearned;
          break;
        case 'DAILY_STREAK':
          currentProgress = Math.max(stats.currentStreak, stats.longestStreak);
          break;
        case 'PERFECT_REVIEWS':
          currentProgress = stats.perfectReviews;
          break;
        case 'METHODS_USED':
          currentProgress = stats.methodsUsed;
          break;
        case 'STUDY_TIME':
          currentProgress = stats.studyTime;
          break;
      }

      return {
        ...achievement,
        unlocked: !!userAchievement,
        unlockedAt: userAchievement?.unlockedAt || null,
        progress: currentProgress,
        percentage: Math.min(100, Math.round((currentProgress / achievement.requirement) * 100)),
      };
    });

    res.json({
      achievements: achievementsWithProgress,
      totalUnlocked: userAchievements.length,
      totalAchievements: achievements.length,
    });
  } catch (error) {
    next(error);
  }
};

export const checkAndUnlockAchievements = async (userId: string) => {
  try {
    // Get user stats
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalWordsLearned: true,
        currentStreak: true,
        longestStreak: true,
      },
    });

    if (!user) return;

    const progress = await prisma.userProgress.findMany({
      where: { userId },
    });

    // Calculate stats
    const stats = {
      wordsLearned: user.totalWordsLearned,
      dailyStreak: Math.max(user.currentStreak, user.longestStreak),
      perfectReviews: progress.filter(p => p.correctCount === p.totalReviews && p.totalReviews > 0).length,
    };

    // Get all achievements
    const achievements = await prisma.achievement.findMany();

    // Get already unlocked achievements
    const unlockedAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    });

    const unlockedIds = new Set(unlockedAchievements.map(ua => ua.achievementId));

    // Check each achievement
    for (const achievement of achievements) {
      if (unlockedIds.has(achievement.id)) continue;

      let shouldUnlock = false;

      switch (achievement.type) {
        case 'WORDS_LEARNED':
          shouldUnlock = stats.wordsLearned >= achievement.requirement;
          break;
        case 'DAILY_STREAK':
          shouldUnlock = stats.dailyStreak >= achievement.requirement;
          break;
        case 'PERFECT_REVIEWS':
          shouldUnlock = stats.perfectReviews >= achievement.requirement;
          break;
      }

      if (shouldUnlock) {
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
          },
        });
      }
    }
  } catch (error) {
    console.error('Error checking achievements:', error);
  }
};
