import { Response, NextFunction } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAllCollections = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const collections = await prisma.collection.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: 'asc' },
    });

    // Add word count based on wordIds array
    const collectionsWithProgress = collections.map((collection) => ({
      ...collection,
      wordCount: collection.wordIds?.length || 0,
      progressCount: 0,
      masteredCount: 0,
      progressPercentage: 0,
    }));

    res.json({ collections: collectionsWithProgress });
  } catch (error) {
    next(error);
  }
};

export const getCollectionById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const collection = await prisma.collection.findUnique({
      where: { id },
    });

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // Get words by IDs from the collection
    const words = collection.wordIds?.length
      ? await prisma.word.findMany({
          where: {
            id: { in: collection.wordIds },
          },
          select: {
            id: true,
            word: true,
            definition: true,
            pronunciation: true,
            difficulty: true,
          },
        })
      : [];

    // Get user progress if authenticated
    interface WordProgress {
      masteryLevel: string;
      correctCount: number;
      totalReviews: number;
      lastReviewDate: Date | null;
    }

    let wordsWithProgress: Array<{
      id: string;
      word: string;
      definition: string;
      pronunciation: string | null;
      difficulty: string;
      progress: WordProgress | null;
    }> = words.map((word) => ({
      ...word,
      progress: null,
    }));

    if (userId && words.length > 0) {
      const wordIds = words.map((w) => w.id);
      const userProgress = await prisma.userProgress.findMany({
        where: {
          userId,
          wordId: { in: wordIds },
        },
      });

      wordsWithProgress = words.map((word) => {
        const progress = userProgress.find((p) => p.wordId === word.id);
        return {
          ...word,
          progress: progress
            ? {
                masteryLevel: progress.masteryLevel,
                correctCount: progress.correctCount,
                totalReviews: progress.totalReviews,
                lastReviewDate: progress.lastReviewDate,
              }
            : null,
        };
      });
    }

    res.json({
      ...collection,
      words: wordsWithProgress,
      wordCount: words.length,
    });
  } catch (error) {
    next(error);
  }
};
