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
import WordVisualPanel from './WordVisualPanel';
import PronunciationButton from './PronunciationButton';

/**
 * StressedPronunciation - 강세 표시된 발음 렌더링
 * 형식: "어**밴**던" → 어<strong>밴</strong>던
 */
function StressedPronunciation({ text }: { text: string }) {
  // Parse **stressed** patterns
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          // Stressed syllable - remove ** and apply styling
          const stressed = part.slice(2, -2);
          return (
            <span
              key={i}
              className="text-pink-600 font-bold underline underline-offset-4 decoration-2 decoration-pink-400"
            >
              {stressed}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// WordVisual type for the new visuals system
interface WordVisual {
  type: 'CONCEPT' | 'MNEMONIC' | 'RHYME';
  imageUrl?: string | null;
  captionEn?: string;
  captionKo?: string;
  labelKo?: string;
}

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
  // New visuals system (preferred)
  visuals?: WordVisual[];
  // Legacy 3-이미지 시각화 시스템 (backward compatibility)
  imageConceptUrl?: string;
  imageConceptCaption?: string;
  imageMnemonicUrl?: string;
  imageMnemonicCaption?: string;
  imageRhymeUrl?: string;
  imageRhymeCaption?: string;
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

  // 3-이미지 시각화 데이터 (support both new and legacy format)
  const hasNewVisuals = word.visuals && word.visuals.length > 0;
  const hasLegacyVisuals = word.imageConceptUrl || word.imageMnemonicUrl || word.imageRhymeUrl;

  // Legacy format for backward compatibility
  const legacyVisualImages = [
    { type: 'concept' as const, url: word.imageConceptUrl || null, caption: word.imageConceptCaption || null },
    { type: 'mnemonic' as const, url: word.imageMnemonicUrl || null, caption: word.imageMnemonicCaption || null },
    { type: 'rhyme' as const, url: word.imageRhymeUrl || null, caption: word.imageRhymeCaption || null },
  ];

  const hasVisualImages = hasNewVisuals || hasLegacyVisuals;

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

          {/* English Word with Pronunciation */}
          <div className="flex items-center justify-center gap-3 mb-3">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              {word.word}
            </h2>
            <PronunciationButton word={word.word} size="md" variant="ghost" />
          </div>

          {/* IPA Pronunciation */}
          {displayPronunciation && (
            <p className="text-lg text-gray-400 mb-2">
              {displayPronunciation}
            </p>
          )}

          {/* Korean Pronunciation with stress marking - 강세 표시 지원 */}
          {koreanPronunciation && (
            <span className="text-pink-500 font-medium">
              <StressedPronunciation text={koreanPronunciation} />
            </span>
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

              {/* 3-이미지 시각화 패널 */}
              {hasVisualImages && (
                <WordVisualPanel
                  visuals={hasNewVisuals ? word.visuals : undefined}
                  images={!hasNewVisuals ? legacyVisualImages : undefined}
                  word={word.word}
                />
              )}

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
