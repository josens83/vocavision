/**
 * Mock API Implementation
 * 백엔드 없이 프론트엔드 테스트를 위한 Mock API
 *
 * 사용법: NEXT_PUBLIC_USE_MOCK_API=true 환경변수 설정
 */

import {
  mockWords,
  mockUserStats,
  mockDueReviews,
  mockUser,
  mockSession,
  getWordsByExam,
  getRandomWords,
} from './data';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const MOCK_DELAY = 300; // 300ms delay to simulate network

// Mock Auth API
export const mockAuthAPI = {
  register: async (data: { email: string; password: string; name?: string }) => {
    await delay(MOCK_DELAY);
    return {
      user: { ...mockUser, email: data.email, name: data.name || '사용자' },
      token: 'mock-token-' + Date.now(),
    };
  },

  login: async (data: { email: string; password: string }) => {
    await delay(MOCK_DELAY);
    // Demo login: any email/password works
    return {
      user: { ...mockUser, email: data.email },
      token: 'mock-token-' + Date.now(),
    };
  },

  getProfile: async () => {
    await delay(MOCK_DELAY);
    return { user: mockUser };
  },
};

// Mock Words API
export const mockWordsAPI = {
  getWords: async (params?: {
    page?: number;
    limit?: number;
    difficulty?: string;
    examCategory?: string;
    level?: string;
    search?: string;
  }) => {
    await delay(MOCK_DELAY);
    const words = getWordsByExam(params?.examCategory, params?.level, params?.limit || 20);

    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      return {
        words: words.filter(w =>
          w.word.toLowerCase().includes(searchLower) ||
          w.definitionKo?.includes(params.search!)
        ),
        total: words.length,
        page: params?.page || 1,
      };
    }

    return {
      words,
      total: mockWords.length,
      page: params?.page || 1,
    };
  },

  getWordCounts: async () => {
    await delay(MOCK_DELAY);
    return {
      counts: {
        CSAT: mockWords.filter(w => w.examCategory === 'CSAT').length,
        SAT: 0,
        TOEFL: 0,
        TOEIC: 0,
        TEPS: 0,
      },
    };
  },

  getWordById: async (id: string) => {
    await delay(MOCK_DELAY);
    const word = mockWords.find(w => w.id === id);
    if (!word) {
      throw new Error('Word not found');
    }
    return { word };
  },

  getRandomWords: async (count?: number, difficulty?: string) => {
    await delay(MOCK_DELAY);
    let words = getRandomWords(count || 10);

    if (difficulty) {
      words = words.filter(w => w.difficulty === difficulty);
    }

    return { words };
  },

  getLevelTestQuestions: async () => {
    await delay(MOCK_DELAY);

    // 레벨별로 문제 선택
    const l1Words = mockWords.filter(w => w.level === 'L1').slice(0, 3);
    const l2Words = mockWords.filter(w => w.level === 'L2').slice(0, 4);
    const l3Words = mockWords.filter(w => w.level === 'L3').slice(0, 3);

    const allDefinitions = mockWords
      .map(w => w.definitionKo)
      .filter(Boolean) as string[];

    // 오답 선택지 생성
    const generateOptions = (correctAnswer: string) => {
      const wrongAnswers = allDefinitions
        .filter(d => d !== correctAnswer)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      return [correctAnswer, ...wrongAnswers].sort(() => 0.5 - Math.random());
    };

    const questions = [
      ...l1Words.map(w => ({
        word: w.word,
        correctAnswer: w.definitionKo || w.definition,
        options: generateOptions(w.definitionKo || w.definition),
        level: 'L1',
      })),
      ...l2Words.map(w => ({
        word: w.word,
        correctAnswer: w.definitionKo || w.definition,
        options: generateOptions(w.definitionKo || w.definition),
        level: 'L2',
      })),
      ...l3Words.map(w => ({
        word: w.word,
        correctAnswer: w.definitionKo || w.definition,
        options: generateOptions(w.definitionKo || w.definition),
        level: 'L3',
      })),
    ].sort(() => 0.5 - Math.random());

    return { questions };
  },
};

// Mock Progress API
export const mockProgressAPI = {
  getUserProgress: async () => {
    await delay(MOCK_DELAY);
    return {
      stats: mockUserStats,
      progress: [],
    };
  },

  getDueReviews: async () => {
    await delay(MOCK_DELAY);
    return mockDueReviews;
  },

  submitReview: async (data: {
    wordId: string;
    rating: number;
    responseTime?: number;
  }) => {
    await delay(MOCK_DELAY);
    const correct = data.rating >= 3;
    return {
      success: true,
      correct,
      nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  },

  startSession: async () => {
    await delay(MOCK_DELAY);
    return {
      session: {
        ...mockSession,
        id: 'mock-session-' + Date.now(),
      },
    };
  },

  endSession: async (data: {
    sessionId: string;
    wordsStudied: number;
    wordsCorrect: number;
  }) => {
    await delay(MOCK_DELAY);
    return {
      success: true,
      summary: {
        wordsStudied: data.wordsStudied,
        wordsCorrect: data.wordsCorrect,
        accuracy: data.wordsStudied > 0
          ? Math.round((data.wordsCorrect / data.wordsStudied) * 100)
          : 0,
        duration: Math.floor(Math.random() * 600) + 60, // 1-10 minutes
      },
    };
  },
};

// Mock Subscription API
export const mockSubscriptionAPI = {
  createCheckout: async (plan: 'monthly' | 'yearly') => {
    await delay(MOCK_DELAY);
    return {
      url: '#demo-checkout',
      sessionId: 'mock-checkout-' + Date.now(),
    };
  },

  getStatus: async () => {
    await delay(MOCK_DELAY);
    return {
      status: 'TRIAL',
      plan: null,
      trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  },

  cancel: async () => {
    await delay(MOCK_DELAY);
    return { success: true };
  },
};

// Mock Chat API
export const mockChatAPI = {
  sendMessage: async (data: { message: string; conversationId?: string }) => {
    await delay(MOCK_DELAY * 2); // Longer delay for chat

    const responses = [
      "안녕하세요! 영어 학습에 대해 무엇이든 물어보세요.",
      "그 단어의 뜻을 설명해 드릴게요.",
      "좋은 질문이에요! 예문을 들어 설명해 드릴게요.",
      "연상법을 사용하면 더 쉽게 외울 수 있어요.",
    ];

    return {
      id: 'msg-' + Date.now(),
      content: responses[Math.floor(Math.random() * responses.length)],
      role: 'assistant' as const,
      timestamp: new Date().toISOString(),
      suggestions: ['다른 단어 배우기', '퀴즈 풀기', '복습하기'],
    };
  },

  getConversations: async () => {
    await delay(MOCK_DELAY);
    return { conversations: [] };
  },

  getSuggestions: async () => {
    await delay(MOCK_DELAY);
    return {
      suggestions: [
        '오늘의 단어 학습하기',
        'CSAT 필수 어휘 복습',
        '틀린 단어 다시 보기',
      ],
    };
  },
};

// Check if mock mode is enabled
export const isMockMode = () => {
  if (typeof window === 'undefined') return false;
  return process.env.NEXT_PUBLIC_USE_MOCK_API === 'true' ||
         localStorage.getItem('useMockAPI') === 'true';
};

// Enable/disable mock mode programmatically
export const setMockMode = (enabled: boolean) => {
  if (typeof window !== 'undefined') {
    if (enabled) {
      localStorage.setItem('useMockAPI', 'true');
    } else {
      localStorage.removeItem('useMockAPI');
    }
  }
};
