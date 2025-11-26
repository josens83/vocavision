'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  suggestions?: string[];
}

export default function ChatInput({
  onSend,
  disabled = false,
  placeholder = '메시지를 입력하세요...',
  suggestions = [],
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  // Show suggestions when empty
  useEffect(() => {
    setShowSuggestions(message.length === 0 && suggestions.length > 0);
  }, [message, suggestions]);

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSend(suggestion);
    setShowSuggestions(false);
  };

  const defaultSuggestions = [
    '오늘의 단어를 추천해주세요',
    '영어 공부 팁을 알려주세요',
    '"serendipity"의 뜻이 뭐예요?',
    '단어 퀴즈 내줘',
  ];

  const displaySuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions;

  return (
    <div className="border-t bg-white p-4">
      {/* Quick Suggestions */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-3 flex flex-wrap gap-2"
          >
            {displaySuggestions.map((suggestion, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={disabled}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {suggestion}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full px-4 py-3 bg-gray-100 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ maxHeight: '150px' }}
          />
        </div>

        {/* Send Button */}
        <motion.button
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          onClick={handleSubmit}
          disabled={!message.trim() || disabled}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
            message.trim() && !disabled
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
          </svg>
        </motion.button>
      </div>

      {/* Helper Text */}
      <div className="mt-2 text-xs text-gray-400 text-center">
        Enter로 전송 | Shift + Enter로 줄바꿈
      </div>
    </div>
  );
}
