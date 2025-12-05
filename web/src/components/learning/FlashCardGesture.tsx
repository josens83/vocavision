/**
 * FlashCard Component (FastCampus/Skillflo Style Redesign)
 *
 * 깔끔하고 현대적인 디자인:
 * - 깔끔한 화이트 카드
 * - 핑크색 CTA 버튼
 * - 명확한 타이포그래피
 * - 부드러운 애니메이션
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Word {
  id: string;
  word: string;
  definition: string;
  definitionKo?: string;
  pronunciation?: string;
  ipaUs?: string;
  ipaUk?: string;
  partOfSpeech?: string;
  images?: any[];
  mnemonics?: any[];
  examples?: any[];
  rhymes?: any[];
  etymology?: any;
  collocations?: any[];
}

interface FlashCardGestureProps {
  word: Word;
  onAnswer: (correct: boolean, rating: number) => void;
}

export default function FlashCardGesture({ word, onAnswer }: FlashCardGestureProps) {
  const [showAnswer, setShowAnswer] = useState(false);

  const handleRating = (rating: number) => {
    const correct = rating >= 3;
    onAnswer(correct, rating);
    setShowAnswer(false);
  };

  // Get display values
  const displayPronunciation = word.ipaUs || word.ipaUk || '';
  const koreanPronunciation = word.pronunciation || '';
  const definition = word.definitionKo || word.definition || '정의 없음';
  const englishDefinition = word.definition || '';
  const mnemonic = word.mnemonics?.[0];
  const example = word.examples?.[0];

  return (
    <div className="space-y-4">
      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Word Section */}
        <div className="p-8 text-center">
          {/* Part of Speech Badge */}
          {word.partOfSpeech && (
            <span className="inline-block bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full mb-4">
              {word.partOfSpeech}
            </span>
          )}

          {/* English Word */}
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            {word.word}
          </h2>

          {/* IPA Pronunciation */}
          {displayPronunciation && (
            <p className="text-lg text-gray-400 mb-2">
              {displayPronunciation}
            </p>
          )}

          {/* Korean Pronunciation */}
          {koreanPronunciation && (
            <button className="inline-flex items-center gap-2 text-pink-500 font-medium">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
              {koreanPronunciation}
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Answer Section */}
        <AnimatePresence mode="wait">
          {!showAnswer ? (
            <motion.div
              key="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6"
            >
              <button
                onClick={() => setShowAnswer(true)}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white py-4 rounded-xl text-lg font-bold transition shadow-lg shadow-pink-500/25"
              >
                정답 보기
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="answer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="p-6 space-y-4"
            >
              {/* Definition */}
              <div className="bg-gray-50 rounded-xl p-5">
                <p className="text-sm font-medium text-gray-400 mb-2">뜻</p>
                <p className="text-xl font-bold text-gray-900">
                  {definition}
                </p>
                {englishDefinition && definition !== englishDefinition && (
                  <p className="text-gray-500 mt-2 text-sm">
                    {englishDefinition}
                  </p>
                )}
              </div>

              {/* Mnemonic */}
              {mnemonic && (
                <div className="bg-yellow-50 rounded-xl p-5 border-l-4 border-yellow-400">
                  <p className="text-sm font-medium text-yellow-700 mb-2">💡 연상법</p>
                  <p className="text-gray-800">
                    {mnemonic.content || mnemonic.koreanHint}
                  </p>
                </div>
              )}

              {/* Example */}
              {example && (
                <div className="bg-blue-50 rounded-xl p-5">
                  <p className="text-sm font-medium text-blue-600 mb-2">예문</p>
                  <p className="text-gray-800 italic">
                    "{example.sentence}"
                  </p>
                  {example.translation && (
                    <p className="text-gray-500 text-sm mt-2">
                      → {example.translation}
                    </p>
                  )}
                </div>
              )}

              {/* Collocations */}
              {word.collocations && word.collocations.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-2">연어 표현</p>
                  <div className="flex flex-wrap gap-2">
                    {word.collocations.slice(0, 5).map((col: any, i: number) => (
                      <span
                        key={i}
                        className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm"
                      >
                        {col.phrase}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Hide Answer Button */}
              <button
                onClick={() => setShowAnswer(false)}
                className="w-full text-gray-400 py-2 text-sm hover:text-gray-600 transition"
              >
                정답 숨기기
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rating Buttons */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <p className="text-center text-gray-500 text-sm mb-4">
          이 단어를 알고 있었나요?
        </p>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleRating(1)}
            className="bg-red-50 hover:bg-red-100 text-red-600 py-4 rounded-xl font-bold transition border-2 border-transparent hover:border-red-200"
          >
            <span className="block text-2xl mb-1">😕</span>
            <span className="text-sm">모름</span>
          </button>
          <button
            onClick={() => handleRating(3)}
            className="bg-yellow-50 hover:bg-yellow-100 text-yellow-600 py-4 rounded-xl font-bold transition border-2 border-transparent hover:border-yellow-200"
          >
            <span className="block text-2xl mb-1">🤔</span>
            <span className="text-sm">애매함</span>
          </button>
          <button
            onClick={() => handleRating(5)}
            className="bg-green-50 hover:bg-green-100 text-green-600 py-4 rounded-xl font-bold transition border-2 border-transparent hover:border-green-200"
          >
            <span className="block text-2xl mb-1">😊</span>
            <span className="text-sm">알았음</span>
          </button>
        </div>
      </div>
    </div>
  );
}
