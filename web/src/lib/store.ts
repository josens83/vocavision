import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// 학습 세션 localStorage 유틸리티
// ============================================
const LEARNING_SESSION_KEY = 'vocavision_learning_session';

export interface LearningSession {
  exam: string;
  level: string;
  words: any[];  // 현재 20개 세트
  currentIndex: number;
  ratings: Record<string, number>;  // wordId → rating (1-4)
  timestamp: number;
}

export const saveLearningSession = (session: LearningSession) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LEARNING_SESSION_KEY, JSON.stringify(session));
  }
};

export const loadLearningSession = (exam: string, level: string): LearningSession | null => {
  if (typeof window === 'undefined') return null;

  const saved = localStorage.getItem(LEARNING_SESSION_KEY);
  if (!saved) return null;

  try {
    const session = JSON.parse(saved) as LearningSession;
    // 같은 exam/level인 경우만 복원 (24시간 이내)
    const isValid = session.exam?.toUpperCase() === exam?.toUpperCase() &&
                    session.level === level &&
                    Date.now() - session.timestamp < 24 * 60 * 60 * 1000;

    if (isValid && session.words?.length > 0) {
      return session;
    }
  } catch (e) {
    console.error('Failed to parse learning session:', e);
  }
  return null;
};

export const clearLearningSession = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LEARNING_SESSION_KEY);
  }
};

// ============================================
// Auth Store
// ============================================
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface User {
  id: string;
  email?: string | null;
  name?: string;
  avatar?: string | null;
  role: string;
  provider?: string;
  subscriptionStatus: string;
  subscriptionPlan?: string;  // FREE, MONTHLY, YEARLY, FAMILY
  subscriptionEnd?: string;   // ISO date string
}

interface AuthState {
  user: User | null;
  token: string | null;
  _hasHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      _hasHydrated: false,
      setAuth: (user, token) => {
        localStorage.setItem('authToken', token);
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem('authToken');
        set({ user: null, token: null });
      },
      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },
      refreshUser: async () => {
        const token = get().token;
        if (!token) return;

        try {
          const response = await fetch(`${API_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            set({ user: data.user });
          }
        } catch (error) {
          console.error('Failed to refresh user:', error);
        }
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

interface LearningState {
  currentWordIndex: number;
  sessionId: string | null;
  cardRatings: Record<number, number>; // 카드 인덱스 → rating (중복 방지)
  setSessionId: (id: string) => void;
  setCardRating: (index: number, rating: number) => void;
  setCurrentIndex: (index: number) => void;
  goToNextCard: () => void;
  goToPrevCard: () => void;
  resetSession: () => void;
  restoreSession: (index: number, ratings: Record<number, number>) => void;
  // Computed getters (calculated from cardRatings)
  getWordsStudied: () => number;
  getWordsCorrect: () => number;
}

export const useLearningStore = create<LearningState>()((set, get) => ({
  currentWordIndex: 0,
  sessionId: null,
  cardRatings: {},
  setSessionId: (id) => set({ sessionId: id }),
  setCardRating: (index, rating) =>
    set((state) => ({
      cardRatings: {
        ...state.cardRatings,
        [index]: rating,
      },
    })),
  setCurrentIndex: (index) => set({ currentWordIndex: index }),
  goToNextCard: () =>
    set((state) => ({
      currentWordIndex: state.currentWordIndex + 1,
    })),
  goToPrevCard: () =>
    set((state) => ({
      currentWordIndex: Math.max(0, state.currentWordIndex - 1),
    })),
  resetSession: () =>
    set({
      currentWordIndex: 0,
      sessionId: null,
      cardRatings: {},
    }),
  restoreSession: (index, ratings) =>
    set({
      currentWordIndex: index,
      cardRatings: ratings,
    }),
  getWordsStudied: () => Object.keys(get().cardRatings).length,
  getWordsCorrect: () =>
    Object.values(get().cardRatings).filter((rating) => rating >= 3).length,
}));

// Exam Course State - 시험별 코스 관리
export type ExamType = 'CSAT' | 'CSAT_2026' | 'TEPS' | 'TOEIC' | 'TOEFL' | 'SAT' | null;
export type LevelType = 'L1' | 'L2' | 'L3';

interface ExamCourseState {
  activeExam: ExamType;
  activeLevel: LevelType;
  goalScore: string | null;
  setActiveExam: (exam: ExamType) => void;
  setActiveLevel: (level: LevelType) => void;
  setGoalScore: (score: string) => void;
  clearExam: () => void;
}

export const useExamCourseStore = create<ExamCourseState>()(
  persist(
    (set) => ({
      activeExam: 'CSAT',
      activeLevel: 'L1',
      goalScore: null,
      setActiveExam: (exam) => set({ activeExam: exam }),
      setActiveLevel: (level) => set({ activeLevel: level }),
      setGoalScore: (score) => set({ goalScore: score }),
      clearExam: () => set({ activeExam: null, activeLevel: 'L1', goalScore: null }),
    }),
    {
      name: 'exam-course-storage',
    }
  )
);

// ============================================
// User Settings Store (dailyGoal 등)
// ============================================
const DEFAULT_DAILY_GOAL = 20;

interface UserSettingsState {
  dailyGoal: number;
  setDailyGoal: (goal: number) => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useUserSettingsStore = create<UserSettingsState>()(
  persist(
    (set) => ({
      dailyGoal: DEFAULT_DAILY_GOAL,
      _hasHydrated: false,
      setDailyGoal: (goal) => set({ dailyGoal: goal }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'user-settings-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Chat Message Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  wordId?: string;
  wordText?: string;
  isLoading?: boolean;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

interface ChatState {
  conversations: ChatConversation[];
  currentConversationId: string | null;
  isTyping: boolean;
  isSidebarOpen: boolean;

  // Actions
  createConversation: (title?: string) => string;
  setCurrentConversation: (id: string | null) => void;
  addMessage: (conversationId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateMessage: (conversationId: string, messageId: string, content: string) => void;
  deleteConversation: (id: string) => void;
  clearConversations: () => void;
  setIsTyping: (typing: boolean) => void;
  toggleSidebar: () => void;
  getCurrentConversation: () => ChatConversation | null;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversationId: null,
      isTyping: false,
      isSidebarOpen: true,

      createConversation: (title?: string) => {
        const id = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newConversation: ChatConversation = {
          id,
          title: title || '새 대화',
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          currentConversationId: id,
        }));

        return id;
      },

      setCurrentConversation: (id) => {
        set({ currentConversationId: id });
      },

      addMessage: (conversationId, message) => {
        const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newMessage: ChatMessage = {
          ...message,
          id,
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: [...conv.messages, newMessage],
                  updatedAt: new Date().toISOString(),
                  // 첫 사용자 메시지로 제목 업데이트
                  title: conv.messages.length === 0 && message.role === 'user'
                    ? message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '')
                    : conv.title,
                }
              : conv
          ),
        }));
      },

      updateMessage: (conversationId, messageId, content) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: conv.messages.map((msg) =>
                    msg.id === messageId ? { ...msg, content, isLoading: false } : msg
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : conv
          ),
        }));
      },

      deleteConversation: (id) => {
        set((state) => {
          const newConversations = state.conversations.filter((conv) => conv.id !== id);
          return {
            conversations: newConversations,
            currentConversationId:
              state.currentConversationId === id
                ? newConversations[0]?.id || null
                : state.currentConversationId,
          };
        });
      },

      clearConversations: () => {
        set({ conversations: [], currentConversationId: null });
      },

      setIsTyping: (typing) => {
        set({ isTyping: typing });
      },

      toggleSidebar: () => {
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
      },

      getCurrentConversation: () => {
        const state = get();
        return state.conversations.find((conv) => conv.id === state.currentConversationId) || null;
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        currentConversationId: state.currentConversationId,
      }),
    }
  )
);
