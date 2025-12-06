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

    res.json({ data: words });
  } catch (error) {
    next(error);
  }
};
