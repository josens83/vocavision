import { Response, NextFunction } from 'express';
import OpenAI from 'openai';
import { prisma } from '../index';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { updateUserStats } from './progress.controller';

// QuizType enum (matches Prisma schema)
type QuizType = 'LEVEL_TEST' | 'ENG_TO_KOR' | 'KOR_TO_ENG' | 'FLASHCARD' | 'SPELLING';

// Lazy initialization of OpenAI client
let openai: OpenAI | null = null;

const getOpenAIClient = (): OpenAI => {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new AppError('OpenAI API key not configured', 500);
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
};

export const getLearningMethods = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { wordId } = req.params;

    const word = await prisma.word.findUnique({
      where: { id: wordId },
      include: {
        images: true,
        videos: true,
        rhymes: true,
        mnemonics: {
          orderBy: { rating: 'desc' },
        },
        etymology: true,
        examples: true,
        synonyms: true,
        antonyms: true,
      },
    });

    if (!word) {
      throw new AppError('Word not found', 404);
    }

    res.json({
      word,
      methods: {
        images: word.images,
        videos: word.videos,
        rhymes: word.rhymes,
        mnemonics: word.mnemonics,
        etymology: word.etymology,
        examples: word.examples,
        synonyms: word.synonyms,
        antonyms: word.antonyms,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const generateMnemonic = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { wordId } = req.body;

    const word = await prisma.word.findUnique({
      where: { id: wordId },
    });

    if (!word) {
      throw new AppError('Word not found', 404);
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new AppError('OpenAI API key not configured', 500);
    }

    const prompt = `Create a creative and memorable mnemonic device to help remember the English word "${word.word}" which means "${word.definition}".

Please provide:
1. A catchy title
2. A detailed explanation connecting the word sound/spelling to its meaning
3. A Korean hint if possible

Make it fun and easy to remember!`;

    const completion = await getOpenAIClient().chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful English vocabulary teacher who creates memorable mnemonics.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
    });

    const response = completion.choices[0].message.content || '';

    // Parse the response (simplified)
    const mnemonic = await prisma.mnemonic.create({
      data: {
        wordId: word.id,
        title: `AI Mnemonic for ${word.word}`,
        content: response,
        source: 'AI_GENERATED',
        rating: 0,
        ratingCount: 0,
      },
    });

    res.json({
      message: 'Mnemonic generated successfully',
      mnemonic,
    });
  } catch (error) {
    next(error);
  }
};

export const generateImage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { wordId } = req.body;

    const word = await prisma.word.findUnique({
      where: { id: wordId },
    });

    if (!word) {
      throw new AppError('Word not found', 404);
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new AppError('OpenAI API key not configured', 500);
    }

    const prompt = `A clear, simple illustration representing the word "${word.word}" meaning "${word.definition}". Educational style, easy to understand.`;

    const image = await getOpenAIClient().images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
    });

    const imageUrl = image.data?.[0]?.url;

    if (!imageUrl) {
      throw new AppError('Failed to generate image', 500);
    }

    const wordImage = await prisma.wordImage.create({
      data: {
        wordId: word.id,
        imageUrl,
        description: prompt,
        source: 'AI_GENERATED',
        aiPrompt: prompt,
      },
    });

    res.json({
      message: 'Image generated successfully',
      image: wordImage,
    });
  } catch (error) {
    next(error);
  }
};

// Record a single learning/quiz result
export const recordLearning = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const {
      wordId,
      quizType,
      isCorrect,
      selectedAnswer,
      correctAnswer,
      responseTime,
      sessionId,
    } = req.body;

    // Validate quizType
    const validQuizTypes: QuizType[] = ['LEVEL_TEST', 'ENG_TO_KOR', 'KOR_TO_ENG', 'FLASHCARD', 'SPELLING'];
    if (!validQuizTypes.includes(quizType)) {
      throw new AppError('Invalid quiz type', 400);
    }

    const record = await prisma.learningRecord.create({
      data: {
        userId,
        wordId,
        quizType: quizType as QuizType,
        isCorrect,
        selectedAnswer,
        correctAnswer,
        responseTime,
        sessionId,
      },
    });

    // Update user stats (streak, totalWordsLearned)
    await updateUserStats(userId);

    res.status(201).json({
      message: 'Learning record created',
      record,
    });
  } catch (error) {
    next(error);
  }
};

// Record multiple learning/quiz results in batch
export const recordLearningBatch = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const { records, sessionId } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      throw new AppError('Records array is required', 400);
    }

    // Validate and transform records
    const validQuizTypes: QuizType[] = ['LEVEL_TEST', 'ENG_TO_KOR', 'KOR_TO_ENG', 'FLASHCARD', 'SPELLING'];

    const dataToCreate = records.map((record: any) => {
      if (!validQuizTypes.includes(record.quizType)) {
        throw new AppError(`Invalid quiz type: ${record.quizType}`, 400);
      }

      return {
        userId,
        wordId: record.wordId,
        quizType: record.quizType as QuizType,
        isCorrect: record.isCorrect,
        selectedAnswer: record.selectedAnswer,
        correctAnswer: record.correctAnswer,
        responseTime: record.responseTime,
        sessionId: sessionId || record.sessionId,
      };
    });

    const result = await prisma.learningRecord.createMany({
      data: dataToCreate,
    });

    // Update user stats (streak, totalWordsLearned)
    await updateUserStats(userId);

    res.status(201).json({
      message: 'Learning records created',
      count: result.count,
    });
  } catch (error) {
    next(error);
  }
};

// Get learning statistics for a user
export const getLearningStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    // Get overall stats
    const [totalRecords, correctRecords] = await Promise.all([
      prisma.learningRecord.count({ where: { userId } }),
      prisma.learningRecord.count({ where: { userId, isCorrect: true } }),
    ]);

    const overallAccuracy = totalRecords > 0
      ? Math.round((correctRecords / totalRecords) * 100)
      : 0;

    // Get stats by quiz type (mode)
    const modeStats = await prisma.learningRecord.groupBy({
      by: ['quizType'],
      where: { userId },
      _count: { _all: true },
    });

    const modeCorrectStats = await prisma.learningRecord.groupBy({
      by: ['quizType'],
      where: { userId, isCorrect: true },
      _count: { _all: true },
    });

    const correctByMode = modeCorrectStats.reduce((acc, stat) => {
      acc[stat.quizType] = stat._count._all;
      return acc;
    }, {} as Record<string, number>);

    const byMode = {
      flashcard: {
        totalQuestions: modeStats.find(s => s.quizType === 'FLASHCARD')?._count._all || 0,
        correctAnswers: correctByMode['FLASHCARD'] || 0,
        accuracy: 0,
      },
      engToKor: {
        totalQuestions: modeStats.find(s => s.quizType === 'ENG_TO_KOR')?._count._all || 0,
        correctAnswers: correctByMode['ENG_TO_KOR'] || 0,
        accuracy: 0,
      },
      korToEng: {
        totalQuestions: modeStats.find(s => s.quizType === 'KOR_TO_ENG')?._count._all || 0,
        correctAnswers: correctByMode['KOR_TO_ENG'] || 0,
        accuracy: 0,
      },
    };

    // Calculate accuracy for each mode
    for (const mode of Object.keys(byMode) as Array<keyof typeof byMode>) {
      const stats = byMode[mode];
      stats.accuracy = stats.totalQuestions > 0
        ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100)
        : 0;
    }

    // Get weekly activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyRecords = await prisma.learningRecord.findMany({
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        wordId: true,
        createdAt: true,
      },
    });

    // Group by date
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const weeklyActivity: { date: string; dayOfWeek: string; wordsStudied: number }[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];

      const wordsOnDay = weeklyRecords.filter((r) => {
        const recordDate = new Date(r.createdAt).toISOString().split('T')[0];
        return recordDate === dateStr;
      });

      // Count unique words
      const uniqueWords = new Set(wordsOnDay.map((r) => r.wordId));

      weeklyActivity.push({
        date: dateStr,
        dayOfWeek: dayNames[date.getDay()],
        wordsStudied: uniqueWords.size,
      });
    }

    // Calculate streak
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        currentStreak: true,
        longestStreak: true,
      },
    });

    res.json({
      overall: {
        totalQuestions: totalRecords,
        correctAnswers: correctRecords,
        accuracy: overallAccuracy,
      },
      byLevel: {
        L1: { totalQuestions: 0, correctAnswers: 0, accuracy: 0 },
        L2: { totalQuestions: 0, correctAnswers: 0, accuracy: 0 },
        L3: { totalQuestions: 0, correctAnswers: 0, accuracy: 0 },
      },
      byMode,
      weeklyActivity,
      streak: {
        current: user?.currentStreak || 0,
        longest: user?.longestStreak || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
