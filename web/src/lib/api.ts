import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
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
