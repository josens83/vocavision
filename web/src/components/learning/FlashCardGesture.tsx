/**
 * FlashCard Component (Redesigned)
 *
 * 새로운 디자인:
 * - 카드 앞면: 단어 + 발음만 표시
 * - "정답 보기" 버튼으로 추가 정보 표시/숨김
 * - 뒤집기/스와이프 제거 → 버튼으로 평가
 * - Courses 페이지 스타일 참고
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
    <div className="max-w-2xl mx-auto">
      {/* 메인 카드 */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* 단어 섹션 */}
        <div className="p-8 text-center border-b">
          {/* 레벨 뱃지 */}
          {word.partOfSpeech && (
            <span className="inline-block bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full mb-4">
              {word.partOfSpeech}
            </span>
          )}

          {/* 영단어 */}
          <h2 className="text-5xl font-bold text-gray-900 mb-3">
            {word.word}
          </h2>

          {/* IPA 발음 */}
          {displayPronunciation && (
            <p className="text-xl text-gray-500 mb-2">
              {displayPronunciation}
            </p>
          )}

          {/* 한글 발음 */}
          {koreanPronunciation && (
            <p className="text-lg text-blue-600">
              🔊 {koreanPronunciation}
            </p>
          )}
        </div>

        {/* 정답 보기 버튼 / 추가 정보 */}
        <AnimatePresence mode="wait">
          {!showAnswer ? (
            <motion.div
              key="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 text-center"
            >
              <button
                onClick={() => setShowAnswer(true)}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-8 rounded-xl text-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition shadow-lg hover:shadow-xl"
              >
                👁️ 정답 보기
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="answer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="p-6 space-y-4"
            >
              {/* 뜻 */}
              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-500 mb-2">📖 뜻</h3>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {definition}
                </p>
                {englishDefinition && definition !== englishDefinition && (
                  <p className="text-gray-600">
                    {englishDefinition}
                  </p>
                )}
              </div>

              {/* 연상법 */}
              {mnemonic && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-r-xl p-5">
                  <h3 className="text-sm font-semibold text-yellow-700 mb-2">💡 연상법</h3>
                  <p className="text-gray-800">
                    {mnemonic.content || mnemonic.koreanHint}
                  </p>
                </div>
              )}

              {/* 예문 */}
              {example && (
                <div className="bg-green-50 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-green-700 mb-2">📝 예문</h3>
                  <p className="text-gray-800 italic mb-1">
                    "{example.sentence}"
                  </p>
                  {example.translation && (
                    <p className="text-gray-600 text-sm">
                      → {example.translation}
                    </p>
                  )}
                </div>
              )}

              {/* 연어 표현 */}
              {word.collocations && word.collocations.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-blue-700 mb-2">🔗 연어 표현</h3>
                  <div className="flex flex-wrap gap-2">
                    {word.collocations.slice(0, 5).map((col: any, i: number) => (
                      <span
                        key={i}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                      >
                        {col.phrase}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 정답 숨기기 버튼 */}
              <button
                onClick={() => setShowAnswer(false)}
                className="w-full text-gray-500 py-2 text-sm hover:text-gray-700"
              >
                ▲ 정답 숨기기
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 평가 버튼 */}
        <div className="border-t bg-gray-50 p-5">
          <p className="text-center text-gray-600 text-sm mb-4">
            이 단어를 얼마나 잘 알고 있나요?
          </p>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleRating(1)}
              className="bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-xl font-semibold transition shadow hover:shadow-lg"
            >
              😕 모름
            </button>
            <button
              onClick={() => handleRating(3)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white py-3 px-4 rounded-xl font-semibold transition shadow hover:shadow-lg"
            >
              🤔 애매함
            </button>
            <button
              onClick={() => handleRating(5)}
              className="bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl font-semibold transition shadow hover:shadow-lg"
            >
              😊 알았음
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
