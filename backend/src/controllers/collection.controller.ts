import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAllCollections = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;

    const collections = await prisma.wordCollection.findMany({
      include: {
        _count: {
          select: { words: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // If user is authenticated, get their progress for each collection
    let collectionsWithProgress = collections;

    if (userId) {
      const userProgress = await prisma.userProgress.findMany({
        where: { userId },
        include: {
          word: {
            select: {
              collections: {
                select: {
                  collectionId: true,
                },
              },
            },
          },
        },
      });

      collectionsWithProgress = collections.map((collection) => {
        const wordsInCollection = userProgress.filter((progress) =>
          progress.word.collections.some((c) => c.collectionId === collection.id)
        );

        const masteredWords = wordsInCollection.filter(
          (progress) => progress.masteryLevel === 'MASTERED'
        ).length;

        return {
          ...collection,
          wordCount: collection._count.words,
          progressCount: wordsInCollection.length,
          masteredCount: masteredWords,
          progressPercentage:
            collection._count.words > 0
              ? Math.round((masteredWords / collection._count.words) * 100)
              : 0,
        };
      });
    } else {
      collectionsWithProgress = collections.map((collection) => ({
        ...collection,
        wordCount: collection._count.words,
        progressCount: 0,
        masteredCount: 0,
        progressPercentage: 0,
      }));
    }

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

    const collection = await prisma.wordCollection.findUnique({
      where: { id },
      include: {
        words: {
          include: {
            word: {
              select: {
                id: true,
                word: true,
                definition: true,
                pronunciation: true,
                difficulty: true,
              },
            },
          },
        },
      },
    });

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    // Get user progress for words in this collection
    let wordsWithProgress = collection.words.map((cw) => ({
      ...cw.word,
      progress: null,
    }));

    if (userId) {
      const wordIds = collection.words.map((cw) => cw.wordId);
      const userProgress = await prisma.userProgress.findMany({
        where: {
          userId,
          wordId: { in: wordIds },
        },
      });

      wordsWithProgress = collection.words.map((cw) => {
        const progress = userProgress.find((p) => p.wordId === cw.wordId);
        return {
          ...cw.word,
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
      wordCount: collection.words.length,
    });
  } catch (error) {
    next(error);
  }
};
