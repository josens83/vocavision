import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  calculateBackoff,
  isRetryableError,
  sleep,
  DEFAULT_RETRY_CONFIG,
  RetryConfig,
  retryMetrics,
} from './utils/retry';

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
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/auth/login';
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
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
  getProfile: async () => {
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
    search?: string;
  }) => {
    const response = await api.get('/words', { params });
    return response.data;
  },
  getWordById: async (id: string) => {
    const response = await api.get(`/words/${id}`);
    return response.data;
  },
  getRandomWords: async (count?: number, difficulty?: string) => {
    const response = await api.get('/words/random', {
      params: { count, difficulty },
    });
    return response.data;
  },
};

// Progress API
export const progressAPI = {
  getUserProgress: async () => {
    const response = await api.get('/progress');
    return response.data;
  },
  getDueReviews: async () => {
    const response = await api.get('/progress/due');
    return response.data;
  },
  submitReview: async (data: {
    wordId: string;
    rating: number;
    responseTime?: number;
    learningMethod?: string;
    sessionId?: string;
  }) => {
    const response = await api.post('/progress/review', data);
    return response.data;
  },
  startSession: async () => {
    const response = await api.post('/progress/session/start');
    return response.data;
  },
  endSession: async (data: {
    sessionId: string;
    wordsStudied: number;
    wordsCorrect: number;
  }) => {
    const response = await api.post('/progress/session/end', data);
    return response.data;
  },
};

// Subscription API
export const subscriptionAPI = {
  createCheckout: async (plan: 'monthly' | 'yearly') => {
    const response = await api.post('/subscriptions/create-checkout', { plan });
    return response.data;
  },
  getStatus: async () => {
    const response = await api.get('/subscriptions/status');
    return response.data;
  },
  cancel: async () => {
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
    const response = await api.post('/chat/message', data);
    return response.data;
  },

  // Get conversation history (if stored on server)
  getConversations: async (params?: { limit?: number; page?: number }) => {
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
    const response = await api.get('/chat/suggestions', { params: { context } });
    return response.data;
  },

  // Get word-specific help
  getWordHelp: async (wordId: string, helpType: 'meaning' | 'example' | 'mnemonic' | 'pronunciation') => {
    const response = await api.get(`/chat/word-help/${wordId}`, { params: { helpType } });
    return response.data;
  },
};
