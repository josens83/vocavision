'use client';

import { motion } from 'framer-motion';
import { ChatMessage as ChatMessageType } from '@/lib/store';

interface ChatMessageProps {
  message: ChatMessageType;
  isLast?: boolean;
}

export default function ChatMessage({ message, isLast }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isLoading = message.isLoading;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`flex items-start gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            isUser
              ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
              : 'bg-gradient-to-br from-purple-500 to-pink-500'
          }`}
        >
          <span className="text-white text-lg">
            {isUser ? '👤' : '🤖'}
          </span>
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {/* Name & Time */}
          <div className={`flex items-center gap-2 mb-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-sm font-medium text-gray-700">
              {isUser ? '나' : 'VocaVision AI'}
            </span>
            <span className="text-xs text-gray-400">
              {formatTime(message.timestamp)}
            </span>
          </div>

          {/* Message Bubble */}
          <div
            className={`rounded-2xl px-4 py-3 ${
              isUser
                ? 'bg-blue-600 text-white rounded-tr-sm'
                : 'bg-gray-100 text-gray-900 rounded-tl-sm'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center gap-1">
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
              </div>
            ) : (
              <div className="whitespace-pre-wrap break-words">
                {message.content.split('\n').map((line, index) => (
                  <p key={index} className={index > 0 ? 'mt-2' : ''}>
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Word Tag if present */}
          {message.wordText && (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                <span>📚</span>
                {message.wordText}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
