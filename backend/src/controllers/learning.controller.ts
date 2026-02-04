import { Response, NextFunction } from 'express';
import OpenAI from 'openai';
import { prisma } from '../index';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { updateUserStats } from './progress.controller';

// QuizType enum (matches Prisma schema)
type QuizType = 'LEVEL_TEST' | 'ENG_TO_KOR' | 'KOR_TO_ENG' | 'FLASHCARD' | 'SPELLING';

// 🚀 플래시카드 UI에 필요한 Word 필드만 select (include 대신 사용)
const FLASHCARD_WORD_SELECT = {
  id: true,
  word: true,
  definition: true,
  definitionKo: true,
  partOfSpeech: true,
  pronunciation: true,
  phonetic: true,
  ipaUs: true,
  ipaUk: true,
  audioUrlUs: true,
  audioUrlUk: true,
  examCategory: true,
  level: true,
  rhymingWords: true,
  // legacy 이미지 필드 (하위호환)
  imageConceptUrl: true,
  imageMnemonicUrl: true,
  imageRhymeUrl: true,
  imageConceptCaption: true,
  imageMnemonicCaption: true,
  imageRhymeCaption: true,
  // 관계 데이터 (select로 필요 필드만)
  visuals: {
    orderBy: { order: 'asc' } as const,
    select: {
      type: true,
      imageUrl: true,
      labelEn: true,
      labelKo: true,
      captionEn: true,
      captionKo: true,
      order: true,
    }
  },
  mnemonics: {
    take: 1,
    orderBy: { rating: 'desc' } as const,
    select: {
      content: true,
      koreanHint: true,
      imageUrl: true,
    }
  },
  examples: {
    take: 2,
    select: {
      sentence: true,
      translation: true,
    }
  },
  etymology: {
    select: {
      origin: true,
      rootWords: true,
      evolution: true,
      relatedWords: true,
      breakdown: true,
    }
  },
};

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

/**
 * @deprecated 프론트엔드에서 미사용 - 향후 제거 예정
 * 플래시카드 학습에 필요한 데이터는 startSession, resumeSession에서 제공
 */
export const getLearningMethods = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { wordId } = req.params;

    const word = await prisma.word.findUnique({
      where: { id: wordId },
      select: {
        id: true,
        word: true,
        definition: true,
        definitionKo: true,
        mnemonics: { select: { content: true, koreanHint: true, imageUrl: true } },
        etymology: { select: { origin: true, breakdown: true } },
        examples: { take: 3, select: { sentence: true, translation: true } },
        rhymes: { take: 3, select: { rhymingWord: true } },
      },
    });

    if (!word) {
      throw new AppError('Word not found', 404);
    }

    // 🚀 경량화된 응답 (deprecated 함수이지만 호환성 유지)
    res.json({
      word,
      methods: {
        rhymes: word.rhymes,
        mnemonics: word.mnemonics,
        etymology: word.etymology,
        examples: word.examples,
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

// ============================================
// Learning Session Management (전체 레벨 학습)
// ============================================

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
 * 현재 진행 중인 학습 세션 조회
 * GET /learning/session?exam=CSAT&level=L1
 */
export const getLearningSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const { exam, level } = req.query;

    if (!exam || !level) {
      throw new AppError('exam and level are required', 400);
    }

    // 진행 중인 세션 찾기
    const session = await prisma.learningSession.findFirst({
      where: {
        userId,
        examCategory: exam as string,
        level: level as string,
        status: 'IN_PROGRESS',
      },
    });

    if (!session) {
      return res.json({ session: null });
    }

    // wordOrder를 파싱하여 현재 세트의 단어들 가져오기
    const wordOrder: string[] = JSON.parse(session.wordOrder);
    const setSize = 20;
    const startIdx = session.currentSet * setSize;
    const endIdx = Math.min(startIdx + setSize, wordOrder.length);
    const currentSetWordIds = wordOrder.slice(startIdx, endIdx);

    // 현재 세트 단어들의 상세 정보 조회
    const words = await prisma.word.findMany({
      where: {
        id: { in: currentSetWordIds },
      },
      select: FLASHCARD_WORD_SELECT,
    });

    // wordOrder 순서대로 정렬
    const orderedWords = currentSetWordIds
      .map(id => words.find(w => w.id === id))
      .filter(Boolean);

    res.json({
      session: {
        id: session.id,
        examCategory: session.examCategory,
        level: session.level,
        totalWords: session.totalWords,
        currentSet: session.currentSet,
        currentIndex: session.currentIndex,
        totalSets: Math.ceil(session.totalWords / setSize),
        completedSets: session.completedSets,
        totalReviewed: session.totalReviewed,
        status: session.status,
      },
      words: orderedWords,
      setInfo: {
        setNumber: session.currentSet,
        totalSets: Math.ceil(session.totalWords / setSize),
        wordsInSet: orderedWords.length,
        startIndex: startIdx,
        endIndex: endIdx - 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 새 학습 세션 시작 또는 재시작
 * POST /learning/session/start
 * body: { exam, level, restart: boolean }
 */
export const startLearningSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const { exam, level, restart = false } = req.body;

    if (!exam || !level) {
      throw new AppError('exam and level are required', 400);
    }

    // restart=true면 기존 진행 중인 세션 종료
    if (restart) {
      await prisma.learningSession.updateMany({
        where: {
          userId,
          examCategory: exam,
          level,
          status: 'IN_PROGRESS',
        },
        data: {
          status: 'ABANDONED',
        },
      });
    } else {
      // 기존 진행 중인 세션이 있는지 확인
      const existingSession = await prisma.learningSession.findFirst({
        where: {
          userId,
          examCategory: exam,
          level,
          status: 'IN_PROGRESS',
        },
      });

      if (existingSession) {
        // 기존 세션 반환 (getLearningSession과 동일한 형식)
        const wordOrder: string[] = JSON.parse(existingSession.wordOrder);
        const setSize = 20;
        const startIdx = existingSession.currentSet * setSize;
        const endIdx = Math.min(startIdx + setSize, wordOrder.length);
        const currentSetWordIds = wordOrder.slice(startIdx, endIdx);

        const words = await prisma.word.findMany({
          where: { id: { in: currentSetWordIds } },
          select: FLASHCARD_WORD_SELECT,
        });

        const orderedWords = currentSetWordIds
          .map(id => words.find(w => w.id === id))
          .filter(Boolean);

        // 🚀 세션 데이터는 캐시하면 안 됨
        res.set('Cache-Control', 'private, no-store');
        return res.json({
          session: {
            id: existingSession.id,
            examCategory: existingSession.examCategory,
            level: existingSession.level,
            totalWords: existingSession.totalWords,
            currentSet: existingSession.currentSet,
            currentIndex: existingSession.currentIndex,
            totalSets: Math.ceil(existingSession.totalWords / setSize),
            completedSets: existingSession.completedSets,
            totalReviewed: existingSession.totalReviewed,
            status: existingSession.status,
          },
          words: orderedWords,
          isExisting: true,
        });
      }
    }

    // 해당 레벨의 모든 단어 ID 조회
    const allWords = await prisma.word.findMany({
      where: {
        examLevels: {
          some: {
            examCategory: exam,
            level: level,
          },
        },
        isActive: true,
      },
      select: { id: true },
      orderBy: { word: 'asc' },
    });

    if (allWords.length === 0) {
      throw new AppError('No words found for this exam/level', 404);
    }

    // 단어 ID 배열 셔플
    const wordIds = allWords.map(w => w.id);
    const shuffledWordIds = shuffleArray(wordIds);

    // 새 세션 생성
    const newSession = await prisma.learningSession.create({
      data: {
        userId,
        examCategory: exam,
        level,
        wordOrder: JSON.stringify(shuffledWordIds),
        totalWords: shuffledWordIds.length,
        currentSet: 0,
        currentIndex: 0,
        status: 'IN_PROGRESS',
      },
    });

    // 첫 번째 세트 단어들 조회
    const setSize = 20;
    const firstSetWordIds = shuffledWordIds.slice(0, setSize);

    const words = await prisma.word.findMany({
      where: { id: { in: firstSetWordIds } },
      select: FLASHCARD_WORD_SELECT,
    });

    const orderedWords = firstSetWordIds
      .map(id => words.find(w => w.id === id))
      .filter(Boolean);

    // 🚀 세션 데이터는 캐시하면 안 됨
    res.set('Cache-Control', 'private, no-store');
    res.status(201).json({
      session: {
        id: newSession.id,
        examCategory: newSession.examCategory,
        level: newSession.level,
        totalWords: newSession.totalWords,
        currentSet: 0,
        currentIndex: 0,
        totalSets: Math.ceil(newSession.totalWords / setSize),
        completedSets: 0,
        totalReviewed: 0,
        status: newSession.status,
      },
      words: orderedWords,
      isNew: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 학습 세션 진행률 업데이트
 * PATCH /learning/session/progress
 * body: { sessionId, currentSet?, currentIndex?, completedSet?: boolean }
 */
export const updateSessionProgress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const { sessionId, currentSet, currentIndex, completedSet } = req.body;

    if (!sessionId) {
      throw new AppError('sessionId is required', 400);
    }

    // 세션 확인
    const session = await prisma.learningSession.findFirst({
      where: {
        id: sessionId,
        userId,
        status: 'IN_PROGRESS',
      },
    });

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    const setSize = 20;
    const totalSets = Math.ceil(session.totalWords / setSize);

    // 업데이트 데이터 준비
    const updateData: any = {};

    if (currentSet !== undefined) {
      updateData.currentSet = currentSet;
    }

    if (currentIndex !== undefined) {
      updateData.currentIndex = currentIndex;
    }

    // 세트 완료 처리
    if (completedSet) {
      updateData.completedSets = session.completedSets + 1;
      updateData.totalReviewed = (session.currentSet + 1) * setSize;
      updateData.currentIndex = 0;

      // 다음 세트로 이동
      const nextSet = session.currentSet + 1;
      if (nextSet >= totalSets) {
        // 전체 학습 완료
        updateData.status = 'COMPLETED';
        updateData.currentSet = session.currentSet; // 마지막 세트 유지
      } else {
        updateData.currentSet = nextSet;
      }
    }

    const updatedSession = await prisma.learningSession.update({
      where: { id: sessionId },
      data: updateData,
    });

    // 다음 세트 단어들 조회 (세트 완료 후)
    let nextWords: any[] = [];
    if (completedSet && updatedSession.status === 'IN_PROGRESS') {
      const wordOrder: string[] = JSON.parse(updatedSession.wordOrder);
      const startIdx = updatedSession.currentSet * setSize;
      const endIdx = Math.min(startIdx + setSize, wordOrder.length);
      const nextSetWordIds = wordOrder.slice(startIdx, endIdx);

      const words = await prisma.word.findMany({
        where: { id: { in: nextSetWordIds } },
        select: FLASHCARD_WORD_SELECT,
      });

      nextWords = nextSetWordIds
        .map(id => words.find(w => w.id === id))
        .filter(Boolean);
    }

    res.json({
      session: {
        id: updatedSession.id,
        examCategory: updatedSession.examCategory,
        level: updatedSession.level,
        totalWords: updatedSession.totalWords,
        currentSet: updatedSession.currentSet,
        currentIndex: updatedSession.currentIndex,
        totalSets,
        completedSets: updatedSession.completedSets,
        totalReviewed: updatedSession.totalReviewed,
        status: updatedSession.status,
      },
      words: nextWords.length > 0 ? nextWords : undefined,
      isCompleted: updatedSession.status === 'COMPLETED',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * sendBeacon을 통한 진행 위치 저장 (페이지 언로드 시)
 * POST /learning/session/progress-beacon
 * body: { sessionId, currentIndex, token }
 */
export const saveProgressBeacon = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    // sendBeacon은 text/plain으로 보내므로 body 파싱 필요
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

    const { sessionId, currentIndex, token } = data;

    if (!sessionId || currentIndex === undefined || !token) {
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

    // 세션 업데이트
    const session = await prisma.learningSession.findFirst({
      where: {
        id: sessionId,
        userId,
        status: 'IN_PROGRESS',
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await prisma.learningSession.update({
      where: { id: sessionId },
      data: { currentIndex },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

/**
 * 특정 세트 단어 조회 (직접 이동용)
 * GET /learning/session/:sessionId/set/:setNumber
 */
export const getSessionSet = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const { sessionId, setNumber } = req.params;
    const setNum = parseInt(setNumber, 10);

    if (isNaN(setNum) || setNum < 0) {
      throw new AppError('Invalid set number', 400);
    }

    // 세션 확인
    const session = await prisma.learningSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    const setSize = 20;
    const totalSets = Math.ceil(session.totalWords / setSize);

    if (setNum >= totalSets) {
      throw new AppError('Set number out of range', 400);
    }

    // 해당 세트 단어들 조회
    const wordOrder: string[] = JSON.parse(session.wordOrder);
    const startIdx = setNum * setSize;
    const endIdx = Math.min(startIdx + setSize, wordOrder.length);
    const setWordIds = wordOrder.slice(startIdx, endIdx);

    const words = await prisma.word.findMany({
      where: { id: { in: setWordIds } },
      select: FLASHCARD_WORD_SELECT,
    });

    const orderedWords = setWordIds
      .map(id => words.find(w => w.id === id))
      .filter(Boolean);

    res.json({
      words: orderedWords,
      setInfo: {
        setNumber: setNum,
        totalSets,
        wordsInSet: orderedWords.length,
        startIndex: startIdx,
        endIndex: endIdx - 1,
      },
    });
  } catch (error) {
    next(error);
  }
};
