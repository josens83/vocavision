'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '@/lib/store';
import { chatAPI } from '@/lib/api';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ChatSidebar from './ChatSidebar';

interface ChatWindowProps {
  wordId?: string;
  wordText?: string;
  initialMessage?: string;
}

export default function ChatWindow({ wordId, wordText, initialMessage }: ChatWindowProps) {
  const {
    conversations,
    currentConversationId,
    isTyping,
    isSidebarOpen,
    createConversation,
    addMessage,
    updateMessage,
    setIsTyping,
    toggleSidebar,
    getCurrentConversation,
  } = useChatStore();

  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentConversation = getCurrentConversation();

  // Initialize conversation if needed
  useEffect(() => {
    if (!currentConversationId && conversations.length === 0) {
      createConversation();
    }
  }, [currentConversationId, conversations.length, createConversation]);

  // Handle initial message from word page
  useEffect(() => {
    if (initialMessage && currentConversationId) {
      handleSendMessage(initialMessage);
    }
  }, [initialMessage, currentConversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  const handleSendMessage = async (content: string) => {
    if (!currentConversationId) return;

    setError(null);

    // Add user message
    addMessage(currentConversationId, {
      role: 'user',
      content,
      wordId,
      wordText,
    });

    // Add loading assistant message
    const loadingMessageId = `msg-loading-${Date.now()}`;
    addMessage(currentConversationId, {
      role: 'assistant',
      content: '',
      isLoading: true,
    });

    setIsTyping(true);

    try {
      // Call AI API
      const response = await chatAPI.sendMessage({
        message: content,
        conversationId: currentConversationId,
        wordId,
        context: wordId ? 'word_help' : 'general',
      });

      // Update the loading message with actual response
      updateMessage(currentConversationId, loadingMessageId, response.content);
    } catch (err: any) {
      console.error('Chat error:', err);

      // Generate mock response for development
      const mockResponse = generateMockResponse(content, wordText);
      updateMessage(currentConversationId, loadingMessageId, mockResponse);

      // Uncomment below for production error handling
      // setError('메시지 전송에 실패했습니다. 다시 시도해주세요.');
      // updateMessage(currentConversationId, loadingMessageId, '죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsTyping(false);
    }
  };

  // Mock response generator for development
  const generateMockResponse = (userMessage: string, word?: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (word) {
      return `"${word}"에 대해 알려드릴게요!

이 단어는 영어 학습에서 자주 나오는 표현입니다.

예문:
- "The ${word.toLowerCase()} was evident in the room."

암기 팁:
발음을 소리내어 여러 번 반복해보세요. 연상 이미지를 만들면 더 오래 기억할 수 있어요!

더 궁금한 점이 있으시면 물어봐주세요! 😊`;
    }

    if (lowerMessage.includes('추천') || lowerMessage.includes('오늘')) {
      return `오늘의 추천 단어입니다! 📚

**Serendipity** (세렌디피티)
- 뜻: 우연히 발견한 행운, 뜻밖의 발견
- 발음: /ˌserənˈdɪpəti/

예문: "Finding that old photo was pure serendipity."
(그 오래된 사진을 찾은 것은 순전한 행운이었다.)

암기 팁: "서프라이즈 + 디스커버리" = 놀라운 발견!

이 단어를 학습하시겠어요?`;
    }

    if (lowerMessage.includes('팁') || lowerMessage.includes('방법')) {
      return `효과적인 영어 단어 학습 팁을 알려드릴게요! 🎯

1. **간격 반복 학습 (Spaced Repetition)**
   - 복습 주기를 점점 늘려가며 학습하세요
   - VocaVision AI의 플래시카드가 이 방법을 사용합니다!

2. **연상 기억법 (Mnemonics)**
   - 단어와 관련된 이미지나 이야기를 만들어보세요
   - 커뮤니티 암기법을 참고해보세요

3. **문맥 속 학습**
   - 예문과 함께 단어를 외우세요
   - 직접 문장을 만들어보면 더 효과적이에요

4. **하루 목표 설정**
   - 매일 5-10개의 새 단어를 목표로 하세요
   - 꾸준함이 가장 중요합니다!

어떤 방법이 궁금하시나요?`;
    }

    if (lowerMessage.includes('퀴즈') || lowerMessage.includes('테스트')) {
      return `좋아요! 간단한 퀴즈를 내볼게요! 🧠

다음 단어의 뜻은 무엇일까요?

**"Ephemeral"**

A) 영원한
B) 일시적인, 순간적인
C) 아름다운
D) 특별한

힌트: 벚꽃의 아름다움처럼, 금방 사라지는 것을 설명할 때 사용해요.

정답을 말씀해주세요! 😊`;
    }

    if (lowerMessage.includes('뜻') || lowerMessage.includes('의미')) {
      const wordMatch = lowerMessage.match(/"([^"]+)"|'([^']+)'|「([^」]+)」/);
      const searchWord = wordMatch ? (wordMatch[1] || wordMatch[2] || wordMatch[3]) : null;

      if (searchWord) {
        return `"${searchWord}"의 의미를 찾아볼게요! 🔍

죄송하지만, 현재 데이터베이스에서 정확한 정보를 찾기 어렵네요.

단어 검색 페이지에서 직접 검색해보시거나, 다른 단어에 대해 물어봐주세요!

도움이 필요하시면 언제든 말씀해주세요! 😊`;
      }
    }

    // Default response
    return `안녕하세요! VocaVision AI 학습 도우미입니다! 🎓

저는 다음과 같은 도움을 드릴 수 있어요:

📚 **단어 학습**
- 단어의 뜻, 발음, 예문 설명
- 암기법 및 어원 정보

🎯 **학습 팁**
- 효과적인 학습 방법 안내
- 오늘의 추천 단어

🧠 **퀴즈**
- 재미있는 단어 퀴즈
- 복습 테스트

무엇이 궁금하신가요?`;
  };

  const welcomeMessages = [
    '안녕하세요! 무엇을 도와드릴까요?',
    '영어 단어에 대해 궁금한 점을 물어보세요!',
    '학습 팁이나 퀴즈도 요청할 수 있어요.',
  ];

  return (
    <div className="flex h-full bg-white">
      {/* Sidebar */}
      <ChatSidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'lg:ml-72' : ''}`}>
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b bg-white">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <div>
              <h1 className="font-bold text-gray-900">VocaVision AI</h1>
              <p className="text-xs text-gray-500">학습 도우미</p>
            </div>
          </div>

          {wordText && (
            <div className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
              📚 {wordText}
            </div>
          )}
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            {/* Welcome Message */}
            {(!currentConversation || currentConversation.messages.length === 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="text-6xl mb-4">🤖</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  VocaVision AI 학습 도우미
                </h2>
                <p className="text-gray-600 mb-6">
                  영어 단어 학습을 도와드립니다!
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {welcomeMessages.map((msg, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="px-4 py-2 bg-white rounded-full text-sm text-gray-600 shadow-sm"
                    >
                      {msg}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Chat Messages */}
            <AnimatePresence>
              {currentConversation?.messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isLast={index === currentConversation.messages.length - 1}
                />
              ))}
            </AnimatePresence>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-4"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  {error}
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <ChatInput
          onSend={handleSendMessage}
          disabled={isTyping}
          placeholder={wordText ? `"${wordText}"에 대해 물어보세요...` : '메시지를 입력하세요...'}
        />
      </div>
    </div>
  );
}
