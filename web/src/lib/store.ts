import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email?: string | null;
  name?: string;
  avatar?: string | null;
  role: string;
  provider?: string;
  subscriptionStatus: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  _hasHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
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
  goToNextCard: () => void;
  goToPrevCard: () => void;
  resetSession: () => void;
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
  getWordsStudied: () => Object.keys(get().cardRatings).length,
  getWordsCorrect: () =>
    Object.values(get().cardRatings).filter((rating) => rating >= 3).length,
}));

// Exam Course State - 시험별 코스 관리
export type ExamType = 'CSAT' | 'TEPS' | 'TOEIC' | 'TOEFL' | 'SAT' | null;
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
