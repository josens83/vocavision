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
      search
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

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

    const [words, total] = await Promise.all([
      prisma.word.findMany({
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
        },
        skip,
        take: limitNum,
        orderBy: { frequency: 'desc' }
      }),
      prisma.word.count({ where })
    ]);

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
        antonyms: true
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
        mnemonics: { take: 1, orderBy: { rating: 'desc' } }
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

    res.json({ counts: result });
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

    res.json({ data: words });
  } catch (error) {
    next(error);
  }
};
