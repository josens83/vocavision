import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// Get all notifications for the current user
export const getNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const { unreadOnly, limit = '50', offset = '0' } = req.query;

    const where: any = { userId };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const [notifications, totalCount, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    res.json({
      notifications,
      totalCount,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

// Mark a notification as read
export const markAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const notification = await prisma.notification.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        isRead: true,
      },
    });

    if (notification.count === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read
export const markAllAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// Delete a notification
export const deleteNotification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const notification = await prisma.notification.deleteMany({
      where: {
        id,
        userId,
      },
    });

    if (notification.count === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};

// Clear all notifications
export const clearAllNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;

    await prisma.notification.deleteMany({
      where: { userId },
    });

    res.json({ message: 'All notifications cleared' });
  } catch (error) {
    next(error);
  }
};

// Get notification preferences
export const getNotificationPreferences = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        emailNotifications: true,
        pushNotifications: true,
        reminderTime: true,
        reminderDays: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

// Update notification preferences
export const updateNotificationPreferences = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const {
      emailNotifications,
      pushNotifications,
      reminderTime,
      reminderDays,
    } = req.body;

    const updateData: any = {};
    if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;
    if (pushNotifications !== undefined) updateData.pushNotifications = pushNotifications;
    if (reminderTime !== undefined) updateData.reminderTime = reminderTime;
    if (reminderDays !== undefined) updateData.reminderDays = reminderDays;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        emailNotifications: true,
        pushNotifications: true,
        reminderTime: true,
        reminderDays: true,
      },
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
};

// Create a notification (internal use or admin)
export const createNotification = async (
  userId: string,
  type: string,
  title: string,
  message: string,
  data?: any
) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type: type as any,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
      },
    });

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
};

// Generate review reminders for users with pending reviews
export const generateReviewReminders = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find users with words due for review
    const usersWithPendingReviews = await prisma.userProgress.groupBy({
      by: ['userId'],
      where: {
        nextReviewDate: {
          lte: new Date(),
        },
      },
      _count: {
        wordId: true,
      },
    });

    for (const userProgress of usersWithPendingReviews) {
      const count = userProgress._count.wordId;
      if (count > 0) {
        // Check if we already sent a reminder today
        const existingReminder = await prisma.notification.findFirst({
          where: {
            userId: userProgress.userId,
            type: 'REVIEW_REMINDER',
            createdAt: {
              gte: today,
            },
          },
        });

        if (!existingReminder) {
          await createNotification(
            userProgress.userId,
            'REVIEW_REMINDER',
            '복습할 시간이에요!',
            `오늘 복습할 단어가 ${count}개 있습니다. 지금 복습을 시작하세요!`,
            { wordCount: count }
          );
        }
      }
    }

    return { success: true, usersNotified: usersWithPendingReviews.length };
  } catch (error) {
    console.error('Failed to generate review reminders:', error);
    return { success: false, error };
  }
};

// Generate streak warning for users about to lose streak
export const generateStreakWarnings = async () => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find users who were active yesterday but not today and have a streak
    const usersAtRisk = await prisma.user.findMany({
      where: {
        currentStreak: {
          gt: 0,
        },
        lastActiveDate: {
          gte: yesterday,
          lt: today,
        },
      },
      select: {
        id: true,
        currentStreak: true,
      },
    });

    for (const user of usersAtRisk) {
      // Check if we already sent a warning today
      const existingWarning = await prisma.notification.findFirst({
        where: {
          userId: user.id,
          type: 'STREAK_WARNING',
          createdAt: {
            gte: today,
          },
        },
      });

      if (!existingWarning) {
        await createNotification(
          user.id,
          'STREAK_WARNING',
          '연속 기록이 위험해요!',
          `${user.currentStreak}일 연속 기록을 유지하세요! 오늘 학습을 완료하지 않으면 연속 기록이 초기화됩니다.`,
          { currentStreak: user.currentStreak }
        );
      }
    }

    return { success: true, usersWarned: usersAtRisk.length };
  } catch (error) {
    console.error('Failed to generate streak warnings:', error);
    return { success: false, error };
  }
};

// Generate goal reminder for users who haven't completed daily goal
export const generateGoalReminders = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find users who haven't completed their daily goal
    const usersWithIncompleteGoals = await prisma.user.findMany({
      where: {
        dailyProgress: {
          lt: prisma.user.fields.dailyGoal,
        },
        lastGoalReset: {
          gte: today,
        },
      },
      select: {
        id: true,
        dailyGoal: true,
        dailyProgress: true,
      },
    });

    for (const user of usersWithIncompleteGoals) {
      const remaining = user.dailyGoal - user.dailyProgress;

      // Check if we already sent a reminder today
      const existingReminder = await prisma.notification.findFirst({
        where: {
          userId: user.id,
          type: 'GOAL_REMINDER',
          createdAt: {
            gte: today,
          },
        },
      });

      if (!existingReminder) {
        await createNotification(
          user.id,
          'GOAL_REMINDER',
          '일일 목표를 달성하세요!',
          `오늘의 목표까지 ${remaining}개 단어가 남았습니다. 지금 학습을 시작하세요!`,
          { remaining, goal: user.dailyGoal, progress: user.dailyProgress }
        );
      }
    }

    return { success: true, usersReminded: usersWithIncompleteGoals.length };
  } catch (error) {
    console.error('Failed to generate goal reminders:', error);
    return { success: false, error };
  }
};
