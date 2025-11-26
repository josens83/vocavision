import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  subscriptionStatus: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem('authToken', token);
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem('authToken');
        set({ user: null, token: null });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

interface LearningState {
  currentWordIndex: number;
  sessionId: string | null;
  wordsStudied: number;
  wordsCorrect: number;
  setSessionId: (id: string) => void;
  incrementWord: (correct: boolean) => void;
  resetSession: () => void;
}

export const useLearningStore = create<LearningState>()((set) => ({
  currentWordIndex: 0,
  sessionId: null,
  wordsStudied: 0,
  wordsCorrect: 0,
  setSessionId: (id) => set({ sessionId: id }),
  incrementWord: (correct) =>
    set((state) => ({
      currentWordIndex: state.currentWordIndex + 1,
      wordsStudied: state.wordsStudied + 1,
      wordsCorrect: correct ? state.wordsCorrect + 1 : state.wordsCorrect,
    })),
  resetSession: () =>
    set({
      currentWordIndex: 0,
      sessionId: null,
      wordsStudied: 0,
      wordsCorrect: 0,
    }),
}));

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
