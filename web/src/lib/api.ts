import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  calculateBackoff,
  isRetryableError,
  sleep,
  DEFAULT_RETRY_CONFIG,
  RetryConfig,
  retryMetrics,
} from './utils/retry';
import {
  isMockMode,
  mockAuthAPI,
  mockWordsAPI,
  mockProgressAPI,
  mockSubscriptionAPI,
  mockChatAPI,
} from './mock';

// Phase 2-1: Enhanced API client with retry logic and error handling

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Extend axios config with retry settings
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
  _startTime?: number;
  retryConfig?: Partial<RetryConfig>;
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30s default timeout
});

// Request interceptor - Add auth token and track retry count
api.interceptors.request.use((config: ExtendedAxiosRequestConfig) => {
  // Add auth token
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Initialize retry count
  if (config._retryCount === undefined) {
    config._retryCount = 0;
    config._startTime = Date.now();
  }

  return config;
});

// Response interceptor - Handle errors with retry logic
api.interceptors.response.use(
  (response) => {
    // Track successful request
    const config = response.config as ExtendedAxiosRequestConfig;
    retryMetrics.recordRequest(true, config._retryCount || 0);
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as ExtendedAxiosRequestConfig;

    // Handle 401 separately (no retry for auth errors)
    // Don't auto-redirect - let components handle auth state
    if (error.response?.status === 401) {
      // Clear both localStorage token and zustand persist storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('auth-storage');
      // Don't force redirect - components should check auth state and redirect if needed
      return Promise.reject(error);
    }

    // Get retry config
    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config?.retryConfig };

    // Check if retry is possible
    if (!config || config._retryCount === undefined) {
      retryMetrics.recordRequest(false, 0);
      return Promise.reject(error);
    }

    // Check if error is retryable
    if (!isRetryableError(error, retryConfig)) {
      retryMetrics.recordRequest(false, config._retryCount);
      return Promise.reject(error);
    }

    // Check if max retries reached
    if (config._retryCount >= retryConfig.maxRetries) {
      console.error(`❌ Max retries (${retryConfig.maxRetries}) reached for ${config.url}`);
      retryMetrics.recordRequest(false, config._retryCount);
      return Promise.reject(error);
    }

    // Increment retry count
    config._retryCount++;

    // Calculate backoff delay
    const delay = calculateBackoff(
      config._retryCount - 1,
      retryConfig.baseDelay,
      retryConfig.maxDelay,
      retryConfig.enableJitter
    );

    console.warn(
      `⚠️ Retry ${config._retryCount}/${retryConfig.maxRetries} for ${config.url} after ${delay}ms`,
      `Status: ${error.response?.status || 'Network Error'}`
    );

    // Wait before retry
    await sleep(delay);

    // Retry request
    return api.request(config);
  }
);

// Auth API
export const authAPI = {
  register: async (data: { email: string; password: string; name?: string }) => {
    if (isMockMode()) return mockAuthAPI.register(data);
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  login: async (data: { email: string; password: string }) => {
    if (isMockMode()) return mockAuthAPI.login(data);
    const response = await api.post('/auth/login', data);
    return response.data;
  },
  getProfile: async () => {
    if (isMockMode()) return mockAuthAPI.getProfile();
    const response = await api.get('/auth/profile');
    return response.data;
  },
};

// Words API
export const wordsAPI = {
  getWords: async (params?: {
    page?: number;
    limit?: number;
    difficulty?: string;
    examCategory?: string;
    level?: string;
    search?: string;
    hasImages?: boolean; // 이미지 유무 필터
    excludeLearned?: boolean; // 학습한 단어 제외
    shuffle?: boolean; // 랜덤 순서
  }) => {
    if (isMockMode()) return mockWordsAPI.getWords(params);
    const response = await api.get('/words', { params });
    return response.data;
  },
  getWordCounts: async (): Promise<{ counts: Record<string, number> }> => {
    if (isMockMode()) return mockWordsAPI.getWordCounts();
    const response = await api.get('/words/counts');
    return response.data;
  },
  getWordById: async (id: string) => {
    if (isMockMode()) return mockWordsAPI.getWordById(id);
    const response = await api.get(`/words/${id}`);
    return response.data;
  },
  getRandomWords: async (count?: number, difficulty?: string) => {
    if (isMockMode()) return mockWordsAPI.getRandomWords(count, difficulty);
    const response = await api.get('/words/random', {
      params: { count, difficulty },
    });
    return response.data;
  },
  getLevelTestQuestions: async (params?: {
    examCategory?: string;
    count?: number;
  }) => {
    if (isMockMode()) return mockWordsAPI.getLevelTestQuestions();
    const response = await api.get('/words/level-test-questions', { params });
    return response.data;
  },
  // 4지선다 퀴즈 문제 조회
  getQuizQuestions: async (params?: {
    examCategory?: string;
    level?: string;
    mode?: 'eng-to-kor' | 'kor-to-eng';
    count?: number;
  }) => {
    const response = await api.get('/words/quiz-questions', { params });
    return response.data;
  },
  // 단어 + 시각화 이미지 포함 조회
  getWordWithVisuals: async (id: string) => {
    const response = await api.get(`/words/${id}/with-visuals`);
    return response.data;
  },

  // 배치 단어 조회 (최대 50개)
  getWordsBatch: async (ids: string[]) => {
    if (ids.length === 0) return { data: [], total: 0, requested: 0 };
    const response = await api.get('/words/batch', {
      params: { ids: ids.join(',') },
    });
    return response.data;
  },

  // 배치 단어 상세 조회 (시각화 포함, 최대 20개)
  getWordsBatchWithVisuals: async (ids: string[]) => {
    if (ids.length === 0) return { data: [], total: 0, requested: 0 };
    const response = await api.get('/words/batch-with-visuals', {
      params: { ids: ids.join(',') },
    });
    return response.data;
  },
};

// Learning Records API - 학습 기록 저장/조회
export const learningAPI = {
  // 개별 학습 기록 저장
  recordLearning: async (data: {
    wordId: string;
    quizType: 'LEVEL_TEST' | 'ENG_TO_KOR' | 'KOR_TO_ENG' | 'FLASHCARD' | 'SPELLING';
    isCorrect: boolean;
    selectedAnswer?: string;
    correctAnswer?: string;
    responseTime?: number;
    sessionId?: string;
  }) => {
    const response = await api.post('/learning/record', data);
    return response.data;
  },

  // 배치 학습 기록 저장
  recordLearningBatch: async (records: Array<{
    wordId: string;
    quizType: 'LEVEL_TEST' | 'ENG_TO_KOR' | 'KOR_TO_ENG' | 'FLASHCARD' | 'SPELLING';
    isCorrect: boolean;
    selectedAnswer?: string;
    correctAnswer?: string;
    responseTime?: number;
  }>, sessionId?: string) => {
    const response = await api.post('/learning/record-batch', { records, sessionId });
    return response.data;
  },

  // 학습 통계 조회
  getStats: async () => {
    const response = await api.get('/learning/stats');
    return response.data;
  },
};

// Word Visuals API - 3-이미지 시각화 시스템
export const visualsAPI = {
  // 단어의 시각화 이미지 조회
  getVisuals: async (wordId: string) => {
    const response = await api.get(`/words/${wordId}/visuals`);
    return response.data;
  },

  // 시각화 이미지 업데이트 (admin)
  updateVisuals: async (wordId: string, visuals: Array<{
    type: 'CONCEPT' | 'MNEMONIC' | 'RHYME';
    labelKo?: string;
    captionEn?: string;
    captionKo?: string;
    imageUrl?: string;
    promptEn?: string;
    order?: number;
  }>) => {
    const response = await api.put(`/words/${wordId}/visuals`, { visuals });
    return response.data;
  },

  // 시각화 이미지 삭제 (admin)
  deleteVisual: async (wordId: string, type: 'CONCEPT' | 'MNEMONIC' | 'RHYME') => {
    const response = await api.delete(`/words/${wordId}/visuals/${type}`);
    return response.data;
  },

  // JSON 템플릿에서 일괄 가져오기 (admin)
  importFromTemplate: async (templates: Array<{
    word: string;
    visuals: {
      concept?: { captionKo?: string; imageUrl?: string; promptEn?: string };
      mnemonic?: { captionKo?: string; imageUrl?: string; promptEn?: string };
      rhyme?: { captionKo?: string; imageUrl?: string; promptEn?: string };
    };
  }>) => {
    const response = await api.post('/words/visuals/import', { templates });
    return response.data;
  },
};

// Pronunciation API - 발음 듣기 (Free Dictionary API)
export const pronunciationAPI = {
  // Free Dictionary API에서 발음 URL 가져오기
  getPronunciation: async (word: string): Promise<{
    audioUrl: string | null;
    phonetic: string | null;
  }> => {
    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
      );
      if (!response.ok) return { audioUrl: null, phonetic: null };

      const data = await response.json();
      const entry = data[0];

      // Find audio URL (prefer US pronunciation)
      let audioUrl: string | null = null;
      let phonetic: string | null = entry?.phonetic || null;

      if (entry?.phonetics) {
        for (const p of entry.phonetics) {
          if (p.audio) {
            audioUrl = p.audio;
            if (p.audio.includes('-us')) break; // Prefer US pronunciation
          }
          if (p.text && !phonetic) phonetic = p.text;
        }
      }

      return { audioUrl, phonetic };
    } catch {
      return { audioUrl: null, phonetic: null };
    }
  },

  // 발음 재생
  playPronunciation: async (word: string): Promise<boolean> => {
    const { audioUrl } = await pronunciationAPI.getPronunciation(word);
    if (!audioUrl) return false;

    try {
      const audio = new Audio(audioUrl);
      await audio.play();
      return true;
    } catch {
      return false;
    }
  },
};

// Progress API
export const progressAPI = {
  getUserProgress: async () => {
    if (isMockMode()) return mockProgressAPI.getUserProgress();
    const response = await api.get('/progress');
    return response.data;
  },
  getDueReviews: async (params?: { examCategory?: string; level?: string }) => {
    if (isMockMode()) return mockProgressAPI.getDueReviews();
    const queryParams = new URLSearchParams();
    if (params?.examCategory) queryParams.set('examCategory', params.examCategory);
    if (params?.level) queryParams.set('level', params.level);
    const queryString = queryParams.toString();
    const response = await api.get(`/progress/due${queryString ? `?${queryString}` : ''}`);
    return response.data;
  },
  submitReview: async (data: {
    wordId: string;
    rating: number;
    responseTime?: number;
    learningMethod?: string;
    sessionId?: string;
  }) => {
    if (isMockMode()) return mockProgressAPI.submitReview(data);
    const response = await api.post('/progress/review', data);
    return response.data;
  },
  startSession: async () => {
    if (isMockMode()) return mockProgressAPI.startSession();
    const response = await api.post('/progress/session/start');
    return response.data;
  },
  endSession: async (data: {
    sessionId: string;
    wordsStudied: number;
    wordsCorrect: number;
  }) => {
    if (isMockMode()) return mockProgressAPI.endSession(data);
    const response = await api.post('/progress/session/end', data);
    return response.data;
  },
  // 오늘의 진행도 조회
  getTodayProgress: async () => {
    try {
      const response = await api.get('/progress/today');
      return response.data;
    } catch {
      // API가 없으면 기본값 반환
      return {
        newWords: { current: 0, goal: 10 },
        review: { current: 0, goal: 15 },
        quiz: { score: 0, total: 0 },
      };
    }
  },
  // 최근 학습 단어 조회
  getRecentWords: async (limit = 5) => {
    try {
      const response = await api.get('/progress/recent-words', { params: { limit } });
      return response.data;
    } catch {
      // API가 없으면 빈 배열 반환
      return { words: [] };
    }
  },
};

// Subscription API
export const subscriptionAPI = {
  createCheckout: async (plan: 'monthly' | 'yearly') => {
    if (isMockMode()) return mockSubscriptionAPI.createCheckout(plan);
    const response = await api.post('/subscriptions/create-checkout', { plan });
    return response.data;
  },
  getStatus: async () => {
    if (isMockMode()) return mockSubscriptionAPI.getStatus();
    const response = await api.get('/subscriptions/status');
    return response.data;
  },
  cancel: async () => {
    if (isMockMode()) return mockSubscriptionAPI.cancel();
    const response = await api.post('/subscriptions/cancel');
    return response.data;
  },
};

// Decks API - Anki-style custom deck system (Phase 2-1)
export const decksAPI = {
  // Get all decks (user's own and public decks)
  getDecks: async (params?: { page?: number; limit?: number; isPublic?: boolean }) => {
    const response = await api.get('/decks', { params });
    return response.data;
  },

  // Get a specific deck by ID
  getDeckById: async (id: string) => {
    const response = await api.get(`/decks/${id}`);
    return response.data;
  },

  // Create a new deck
  createDeck: async (data: {
    name: string;
    description?: string;
    isPublic?: boolean;
    tags?: string[];
  }) => {
    const response = await api.post('/decks', data);
    return response.data;
  },

  // Update a deck
  updateDeck: async (id: string, data: {
    name?: string;
    description?: string;
    isPublic?: boolean;
    tags?: string[];
  }) => {
    const response = await api.put(`/decks/${id}`, data);
    return response.data;
  },

  // Delete a deck
  deleteDeck: async (id: string) => {
    const response = await api.delete(`/decks/${id}`);
    return response.data;
  },

  // Get words in a deck
  getDeckWords: async (deckId: string) => {
    const response = await api.get(`/decks/${deckId}/words`);
    return response.data;
  },

  // Add a word to a deck
  addWordToDeck: async (deckId: string, wordId: string) => {
    const response = await api.post(`/decks/${deckId}/words`, { wordId });
    return response.data;
  },

  // Remove a word from a deck
  removeWordFromDeck: async (deckId: string, wordId: string) => {
    const response = await api.delete(`/decks/${deckId}/words/${wordId}`);
    return response.data;
  },

  // Clone a public deck
  cloneDeck: async (deckId: string) => {
    const response = await api.post(`/decks/${deckId}/clone`);
    return response.data;
  },

  // Get public/community decks
  getPublicDecks: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    tags?: string[];
  }) => {
    const response = await api.get('/decks/public', { params });
    return response.data;
  },
};

// Mnemonics API - Memrise-style community mnemonics (Phase 2-3)
export const mnemonicsAPI = {
  // Get mnemonics for a word
  getMnemonicsForWord: async (wordId: string, params?: {
    limit?: number;
    sortBy?: 'popular' | 'recent';
  }) => {
    const response = await api.get(`/mnemonics/word/${wordId}`, { params });
    return response.data;
  },

  // Submit a new mnemonic
  submitMnemonic: async (data: {
    wordId: string;
    content: string;
    imageUrl?: string;
  }) => {
    const response = await api.post('/mnemonics', data);
    return response.data;
  },

  // Update a mnemonic
  updateMnemonic: async (mnemonicId: string, data: {
    content?: string;
    imageUrl?: string;
  }) => {
    const response = await api.put(`/mnemonics/${mnemonicId}`, data);
    return response.data;
  },

  // Delete a mnemonic
  deleteMnemonic: async (mnemonicId: string) => {
    const response = await api.delete(`/mnemonics/${mnemonicId}`);
    return response.data;
  },

  // Vote on a mnemonic
  voteMnemonic: async (mnemonicId: string, vote: 'up' | 'down') => {
    const response = await api.post(`/mnemonics/${mnemonicId}/vote`, { vote });
    return response.data;
  },

  // Remove vote
  removeVote: async (mnemonicId: string) => {
    const response = await api.delete(`/mnemonics/${mnemonicId}/vote`);
    return response.data;
  },

  // Report inappropriate mnemonic
  reportMnemonic: async (mnemonicId: string, reason: string) => {
    const response = await api.post(`/mnemonics/${mnemonicId}/report`, { reason });
    return response.data;
  },

  // Get top mnemonics (community favorites)
  getTopMnemonics: async (params?: {
    limit?: number;
    period?: 'week' | 'month' | 'all';
  }) => {
    const response = await api.get('/mnemonics/top', { params });
    return response.data;
  },
};

// Leagues API - Duolingo-style league system (Phase 3-1)
export const leaguesAPI = {
  // Get current user's league info
  getMyLeague: async () => {
    const response = await api.get('/leagues/my');
    return response.data;
  },

  // Get leaderboard for current week
  getLeaderboard: async (params?: {
    leagueId?: string;
    limit?: number;
  }) => {
    const response = await api.get('/leagues/leaderboard', { params });
    return response.data;
  },

  // Get league history
  getLeagueHistory: async (params?: {
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/leagues/history', { params });
    return response.data;
  },

  // Get league info
  getLeagueInfo: async (tier: string) => {
    const response = await api.get(`/leagues/info/${tier}`);
    return response.data;
  },
};

// Chat API - AI 학습 도우미 챗봇
export interface ChatMessageRequest {
  message: string;
  conversationId?: string;
  wordId?: string;
  context?: 'general' | 'word_help' | 'quiz' | 'grammar' | 'pronunciation';
}

export interface ChatMessageResponse {
  id: string;
  content: string;
  role: 'assistant';
  timestamp: string;
  suggestions?: string[];
  relatedWords?: {
    id: string;
    word: string;
    definition: string;
  }[];
}

export const chatAPI = {
  // Send a message to AI assistant
  sendMessage: async (data: ChatMessageRequest): Promise<ChatMessageResponse> => {
    if (isMockMode()) return mockChatAPI.sendMessage(data);
    const response = await api.post('/chat/message', data);
    return response.data;
  },

  // Get conversation history (if stored on server)
  getConversations: async (params?: { limit?: number; page?: number }) => {
    if (isMockMode()) return mockChatAPI.getConversations();
    const response = await api.get('/chat/conversations', { params });
    return response.data;
  },

  // Get a specific conversation
  getConversation: async (conversationId: string) => {
    const response = await api.get(`/chat/conversations/${conversationId}`);
    return response.data;
  },

  // Delete a conversation
  deleteConversation: async (conversationId: string) => {
    const response = await api.delete(`/chat/conversations/${conversationId}`);
    return response.data;
  },

  // Get quick suggestions based on context
  getSuggestions: async (context?: string) => {
    if (isMockMode()) return mockChatAPI.getSuggestions();
    const response = await api.get('/chat/suggestions', { params: { context } });
    return response.data;
  },

  // Get word-specific help
  getWordHelp: async (wordId: string, helpType: 'meaning' | 'example' | 'mnemonic' | 'pronunciation') => {
    const response = await api.get(`/chat/word-help/${wordId}`, { params: { helpType } });
    return response.data;
  },
};

// Admin Image Generation API
export const imageGenerationAPI = {
  // Get image generation status for all levels
  getStatus: async (examType = 'CSAT') => {
    const response = await api.get('/admin/image-generation/status', {
      params: { examType },
    });
    return response.data;
  },

  // Start batch image generation
  startBatch: async (data: {
    examType: string;
    level: string;
    limit: number;
  }) => {
    const response = await api.post('/admin/image-generation/batch', data);
    return response.data;
  },

  // Get job status
  getJobStatus: async (jobId: string) => {
    const response = await api.get(`/admin/image-generation/job/${jobId}`);
    return response.data;
  },
};

// Re-export mock mode utilities
export { isMockMode, setMockMode } from './mock';
