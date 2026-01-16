/**
 * FlashCard Component (FastCampus/Skillflo Style Redesign)
 *
 * 깔끔하고 현대적인 디자인:
 * - 깔끔한 화이트 카드
 * - 핑크색 CTA 버튼
 * - 명확한 타이포그래피
 * - 부드러운 애니메이션
 * - 모바일 스와이프 제스처 지원
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
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
  onPrevious?: () => void;  // 이전 카드로 이동
  hasPrevious?: boolean;    // 이전 카드 존재 여부
}

// Swipe hint counter key for localStorage
const SWIPE_HINT_KEY = 'vocavision_swipe_hint_count';

export default function FlashCardGesture({
  word,
  onAnswer,
  onPrevious,
  hasPrevious = false,
}: FlashCardGestureProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);

  // Motion values for swipe gesture (horizontal only)
  const x = useMotionValue(0);

  // Transform values based on drag (horizontal only)
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const leftOpacity = useTransform(x, [-100, 0], [1, 0]);
  const rightOpacity = useTransform(x, [0, 100], [0, 1]);

  // Reset showAnswer when word changes (새 단어로 넘어갈 때 정답 숨김)
  useEffect(() => {
    setShowAnswer(false);
  }, [word.id]);

  // Check if swipe hint should be shown (first 5 times)
  useEffect(() => {
    const count = parseInt(localStorage.getItem(SWIPE_HINT_KEY) || '0', 10);
    if (count >= 5) {
      setShowSwipeHint(false);
    }
  }, []);

  const handleRating = (rating: number, fromSwipe = false) => {
    if (fromSwipe) {
      // Increment swipe hint counter
      const count = parseInt(localStorage.getItem(SWIPE_HINT_KEY) || '0', 10);
      localStorage.setItem(SWIPE_HINT_KEY, String(count + 1));
      if (count + 1 >= 5) {
        setShowSwipeHint(false);
      }
    }

    const correct = rating >= 3;
    onAnswer(correct, rating);
    setShowAnswer(false);
    setIsExiting(false);
    setExitDirection(null);
    // Reset motion values
    x.set(0);
  };

  // Handle previous card navigation
  const handlePrevious = () => {
    if (hasPrevious && onPrevious) {
      // Increment swipe hint counter
      const count = parseInt(localStorage.getItem(SWIPE_HINT_KEY) || '0', 10);
      localStorage.setItem(SWIPE_HINT_KEY, String(count + 1));
      if (count + 1 >= 5) {
        setShowSwipeHint(false);
      }

      setExitDirection('right');
      setIsExiting(true);
      setTimeout(() => {
        onPrevious();
        setShowAnswer(false);
        setIsExiting(false);
        setExitDirection(null);
        x.set(0);
      }, 200);
    }
  };

  // Handle swipe gesture end (horizontal only)
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    const velocity = 500;

    // Only handle horizontal swipes
    if (Math.abs(info.offset.y) > Math.abs(info.offset.x) * 0.5) {
      // Vertical movement is dominant - ignore (allow scroll)
      x.set(0);
      return;
    }

    if (info.offset.x < -threshold || info.velocity.x < -velocity) {
      // Left swipe → 다음 카드 (틀림 표시)
      setExitDirection('left');
      setIsExiting(true);
      setTimeout(() => handleRating(1, true), 200);
    } else if (info.offset.x > threshold || info.velocity.x > velocity) {
      // Right swipe → 이전 카드
      if (hasPrevious && onPrevious) {
        handlePrevious();
      } else {
        // No previous card - spring back
        x.set(0);
      }
    } else {
      // Not enough swipe - spring back
      x.set(0);
    }
  };

  // Exit animation variants (horizontal only)
  const exitVariants = {
    left: { x: -300, opacity: 0, rotate: -20 },
    right: { x: 300, opacity: 0, rotate: 20 },
  };

  // Get display values
  const displayPronunciation = word.ipaUs || word.ipaUk || '';
  const koreanPronunciation = word.pronunciation || '';
  const definition = word.definitionKo || word.definition || '정의 없음';
  const englishDefinition = word.definition || '';
  const mnemonic = word.mnemonics?.[0];
  const examples = word.examples?.slice(0, 3) || [];  // 최대 3개 예문

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
    <div className="flex flex-col min-h-[calc(100vh-200px)] md:min-h-0 md:block">
      {/* Swipe Hint - shown on mobile for first 5 uses */}
      {showSwipeHint && (
        <div className="text-center text-sm text-gray-400 flex justify-center gap-6 md:hidden mb-2">
          <span className="inline-flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> 다음</span>
          {hasPrevious && <span className="inline-flex items-center gap-1">이전 <ArrowRight className="w-3.5 h-3.5" /></span>}
        </div>
      )}

      {/* Main Card with Swipe Gesture (horizontal only) */}
      <motion.div
        style={{ x, rotate }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        animate={isExiting && exitDirection ? exitVariants[exitDirection] : {}}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="relative cursor-grab active:cursor-grabbing flex-1 md:flex-none"
      >
        {/* Swipe Overlay Indicators */}
        <motion.div
          style={{ opacity: leftOpacity }}
          className="absolute inset-0 bg-pink-500/20 rounded-2xl flex items-center justify-center pointer-events-none z-10"
        >
          <div className="bg-pink-500 text-white rounded-full px-6 py-3">
            <span className="text-xl font-bold inline-flex items-center gap-1">다음 <ArrowRight className="w-5 h-5" /></span>
          </div>
        </motion.div>

        {hasPrevious && (
          <motion.div
            style={{ opacity: rightOpacity }}
            className="absolute inset-0 bg-slate-500/20 rounded-2xl flex items-center justify-center pointer-events-none z-10"
          >
            <div className="bg-slate-500 text-white rounded-full px-6 py-3">
              <span className="text-xl font-bold inline-flex items-center gap-1"><ArrowLeft className="w-5 h-5" /> 이전</span>
            </div>
          </motion.div>
        )}

        {/* Card Content */}
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

        {/* Rating Buttons - 항상 표시 */}
        <div className="p-6 pb-0">
          <div className="bg-white rounded-xl border-2 border-pink-100 p-4">
            <p className="text-center text-gray-500 text-xs md:text-sm mb-3">
              이 단어를 알고 있었나요?
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleRating(1)}
                className="bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-xl font-bold transition border-2 border-transparent hover:border-red-200"
              >
                <span className="block text-xl mb-0.5">😕</span>
                <span className="text-xs">모름</span>
              </button>
              <button
                onClick={() => handleRating(3)}
                className="bg-yellow-50 hover:bg-yellow-100 text-yellow-600 py-3 rounded-xl font-bold transition border-2 border-transparent hover:border-yellow-200"
              >
                <span className="block text-xl mb-0.5">🤔</span>
                <span className="text-xs">애매함</span>
              </button>
              <button
                onClick={() => handleRating(5)}
                className="bg-green-50 hover:bg-green-100 text-green-600 py-3 rounded-xl font-bold transition border-2 border-transparent hover:border-green-200"
              >
                <span className="block text-xl mb-0.5">😊</span>
                <span className="text-xs">알았음</span>
              </button>
            </div>
          </div>
        </div>

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
                  showEnglishCaption={true}
                />
              )}

              {/* Etymology - 어원 */}
              {word.etymology && (
                <div className="bg-purple-50 rounded-xl p-5">
                  <p className="text-sm font-medium text-purple-600 mb-2">📚 어원</p>
                  {word.etymology.origin && (
                    <p className="text-gray-800 mb-2">{word.etymology.origin}</p>
                  )}
                  {word.etymology.breakdown && (
                    <p className="text-gray-600 text-sm mb-2">
                      <span className="font-medium">형태분석:</span> {word.etymology.breakdown}
                    </p>
                  )}
                  {word.etymology.relatedWords && word.etymology.relatedWords.length > 0 && (
                    <div className="mt-2">
                      <span className="text-gray-500 text-sm">관련 단어: </span>
                      <span className="text-purple-700 text-sm">
                        {word.etymology.relatedWords.slice(0, 5).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Examples - 예문 (최대 3개) */}
              {examples.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-5">
                  <p className="text-sm font-medium text-blue-600 mb-3">예문</p>
                  <div className="space-y-3">
                    {examples.map((ex, index) => (
                      <div key={ex.id || index} className={index > 0 ? "pt-3 border-t border-blue-100" : ""}>
                        <p className="text-gray-800 italic">
                          "{ex.sentence}"
                        </p>
                        {ex.translation && (
                          <p className="text-gray-500 text-sm mt-1">
                            → {ex.translation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mnemonic - 연상법 */}
              {mnemonic && (
                <div className="bg-yellow-50 rounded-xl p-5 border-l-4 border-yellow-400">
                  <p className="text-sm font-medium text-yellow-700 mb-2">💡 연상법</p>
                  <p className="text-gray-800">
                    {mnemonic.content || mnemonic.koreanHint}
                  </p>
                </div>
              )}

              {/* Collocations - 연어 표현 */}
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
      </motion.div>

    </div>
  );
}
