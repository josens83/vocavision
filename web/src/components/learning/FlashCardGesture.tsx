/**
 * FlashCard Component (Cashnote/Toss Style Redesign)
 *
 * 미니멀하고 깔끔한 디자인:
 * - 플랫 화이트 카드 + 그레이 테두리
 * - 틸 포인트 컬러
 * - 그라데이션 제거, 그림자 최소화
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
 */
function StressedPronunciation({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const stressed = part.slice(2, -2);
          return (
            <span
              key={i}
              className="text-teal-600 font-bold underline underline-offset-4 decoration-2 decoration-teal-400"
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
  rhymingWords?: string[];
  etymology?: any;
  collocations?: any[];
  visuals?: WordVisual[];
}

interface FlashCardGestureProps {
  word: Word;
  onAnswer: (correct: boolean, rating: number) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  hasExistingProgress?: boolean;
  /** 복습 모드 (rating 버튼 숨김, 이전/다음만 표시) */
  isReviewMode?: boolean;
}

const SWIPE_HINT_KEY = 'vocavision_swipe_hint_count';

export default function FlashCardGesture({
  word,
  onAnswer,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = true,
  hasExistingProgress = false,
  isReviewMode = false,
}: FlashCardGestureProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const leftOpacity = useTransform(x, [-100, 0], [1, 0]);
  const rightOpacity = useTransform(x, [0, 100], [0, 1]);

  useEffect(() => {
    setShowAnswer(false);
  }, [word.id]);

  useEffect(() => {
    const count = parseInt(localStorage.getItem(SWIPE_HINT_KEY) || '0', 10);
    if (count >= 5) {
      setShowSwipeHint(false);
    }
  }, []);

  const handleRating = (rating: number, fromSwipe = false) => {
    if (fromSwipe) {
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
    x.set(0);
  };

  const handlePrevious = () => {
    if (hasPrevious && onPrevious) {
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

  // 다음 단어로 이동 (기록 없으면 "알았음" 기록)
  const handleGoToNext = () => {
    const count = parseInt(localStorage.getItem(SWIPE_HINT_KEY) || '0', 10);
    localStorage.setItem(SWIPE_HINT_KEY, String(count + 1));
    if (count + 1 >= 5) {
      setShowSwipeHint(false);
    }

    setExitDirection('left');
    setIsExiting(true);
    setTimeout(() => {
      // 기존 기록이 없는 경우에만 "알았음" (rating 5) 기록
      if (!hasExistingProgress) {
        onAnswer(true, 5);
      } else if (onNext) {
        onNext();
      }
      setShowAnswer(false);
      setIsExiting(false);
      setExitDirection(null);
      x.set(0);
    }, 200);
  };

  // 이전 단어로 이동 (API 호출 없음)
  const handleGoToPrevious = () => {
    if (hasPrevious && onPrevious) {
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
    } else {
      x.set(0);
    }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    const velocity = 500;

    if (Math.abs(info.offset.y) > Math.abs(info.offset.x) * 0.5) {
      x.set(0);
      return;
    }

    // 왼쪽 스와이프 (오른쪽→왼쪽, x < 0) → 다음 단어로 이동
    if (info.offset.x < -threshold || info.velocity.x < -velocity) {
      handleGoToNext();
    // 오른쪽 스와이프 (왼쪽→오른쪽, x > 0) → 이전 단어로 이동
    } else if (info.offset.x > threshold || info.velocity.x > velocity) {
      handleGoToPrevious();
    } else {
      x.set(0);
    }
  };

  const exitVariants = {
    left: { x: -300, opacity: 0, rotate: -20 },
    right: { x: 300, opacity: 0, rotate: 20 },
  };

  const displayPronunciation = word.ipaUs || word.ipaUk || '';
  const koreanPronunciation = word.pronunciation || '';
  const definition = word.definitionKo || word.definition || '정의 없음';
  const englishDefinition = word.definition || '';
  const mnemonic = word.mnemonics?.[0];
  const examples = word.examples?.slice(0, 3) || [];

  const hasVisualImages = word.visuals && word.visuals.length > 0;

  return (
    <div className="flex flex-col min-h-[calc(100vh-200px)] md:min-h-0 md:block">
      {/* Swipe Hint - 왼쪽 스와이프=다음, 오른쪽 스와이프=이전 */}
      {showSwipeHint && (
        <div className="text-center text-sm text-gray-400 flex justify-center gap-6 md:hidden mb-2">
          {hasPrevious && <span className="inline-flex items-center gap-1">이전 <ArrowRight className="w-3.5 h-3.5" /></span>}
          <span className="inline-flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> 다음</span>
        </div>
      )}

      {/* Main Card with Swipe Gesture */}
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
        {/* 왼쪽 스와이프 시 (다음 단어) - 오른쪽→왼쪽으로 스와이프하면 다음 */}
        <motion.div
          style={{ opacity: leftOpacity }}
          className="absolute inset-0 bg-teal-50 rounded-2xl flex items-center justify-center pointer-events-none z-10 border-2 border-teal-300"
        >
          <div className="bg-teal-500 text-white rounded-full px-6 py-3">
            <span className="text-xl font-bold inline-flex items-center gap-1">다음 <ArrowRight className="w-5 h-5" /></span>
          </div>
        </motion.div>

        {/* 오른쪽 스와이프 시 (이전 단어) - 왼쪽→오른쪽으로 스와이프하면 이전 */}
        {hasPrevious && (
          <motion.div
            style={{ opacity: rightOpacity }}
            className="absolute inset-0 bg-gray-50 rounded-2xl flex items-center justify-center pointer-events-none z-10 border-2 border-gray-300"
          >
            <div className="bg-gray-500 text-white rounded-full px-6 py-3">
              <span className="text-xl font-bold inline-flex items-center gap-1"><ArrowLeft className="w-5 h-5" /> 이전</span>
            </div>
          </motion.div>
        )}

        {/* Card Content */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
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
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
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

            {/* Korean Pronunciation with stress marking */}
            {koreanPronunciation && (
              <span className="text-teal-600 font-medium">
                <StressedPronunciation text={koreanPronunciation} />
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* 학습 모드: Rating Buttons (모름/알았음) */}
          {!isReviewMode && (
            <div className="p-6 border-b border-gray-100">
              <p className="text-center text-gray-500 text-xs md:text-sm mb-3">
                이 단어를 알고 있었나요?
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleRating(1)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 py-5 rounded-xl font-medium transition-colors"
                >
                  <span className="block text-2xl mb-1">😕</span>
                  <span className="text-sm font-semibold">모름</span>
                </button>
                <button
                  onClick={() => handleRating(5)}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 py-5 rounded-xl font-medium transition-colors"
                >
                  <span className="block text-2xl mb-1">😊</span>
                  <span className="text-sm font-semibold">알았음</span>
                </button>
              </div>
            </div>
          )}

          {/* 복습 모드: 이전/다음 네비게이션 */}
          {isReviewMode && (
            <div className="p-6 border-b border-gray-100">
              <p className="text-center text-gray-500 text-xs md:text-sm mb-3">
                복습 모드 - 빠르게 훑어보기
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={onPrevious}
                  disabled={!hasPrevious}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="text-sm font-semibold">이전</span>
                </button>
                <button
                  onClick={onNext}
                  disabled={!hasNext}
                  className="bg-teal-500 hover:bg-teal-600 text-white py-4 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span className="text-sm font-semibold">다음</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

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
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white py-4 rounded-xl text-lg font-semibold transition-colors"
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

                {/* Visual Panel */}
                {hasVisualImages && (
                  <WordVisualPanel
                    visuals={word.visuals}
                    word={word.word}
                    showEnglishCaption={true}
                  />
                )}

                {/* 1. Examples (예문) */}
                {examples.length > 0 && (
                  <div className="bg-blue-50 rounded-xl p-5">
                    <p className="text-sm font-medium text-blue-600 mb-3">✍️ 예문</p>
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

                {/* 2. Collocations (콜로케이션) */}
                {word.collocations && word.collocations.length > 0 && (
                  <div className="bg-green-50 rounded-xl p-5">
                    <p className="text-sm font-medium text-green-600 mb-3">🔗 콜로케이션</p>
                    <div className="space-y-2">
                      {word.collocations.slice(0, 5).map((col: any, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="bg-green-100 text-green-800 px-3 py-1.5 rounded-lg text-sm font-medium">
                            {col.phrase}
                          </span>
                          {col.meaning && (
                            <span className="text-gray-500 text-sm">— {col.meaning}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Etymology (어원) */}
                {word.etymology && word.etymology.origin && (
                  <div className="bg-purple-50 rounded-xl p-5">
                    <p className="text-sm font-medium text-purple-600 mb-2">📚 어원</p>
                    <p className="text-gray-800">{word.etymology.origin}</p>
                    {word.etymology.relatedWords && word.etymology.relatedWords.length > 0 && (
                      <div className="mt-3">
                        <span className="text-gray-500 text-sm">관련 단어: </span>
                        <span className="text-purple-700 text-sm">
                          {word.etymology.relatedWords.slice(0, 5).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. 형태 분석 */}
                {word.etymology?.breakdown && (
                  <div className="bg-indigo-50 rounded-xl p-5">
                    <p className="text-sm font-medium text-indigo-600 mb-2">🧩 형태 분석</p>
                    <p className="text-gray-800">{word.etymology.breakdown}</p>
                  </div>
                )}

                {/* 5. Rhyming (라이밍) */}
                {word.rhymingWords && word.rhymingWords.length > 0 && (
                  <div className="bg-pink-50 rounded-xl p-5">
                    <p className="text-sm font-medium text-pink-600 mb-2">🎵 라이밍</p>
                    <div className="flex flex-wrap gap-2">
                      {word.rhymingWords.slice(0, 6).map((rhyme: string, i: number) => (
                        <span
                          key={i}
                          className="bg-pink-100 text-pink-700 px-3 py-1.5 rounded-full text-sm"
                        >
                          {rhyme}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hide Answer Button */}
                <button
                  onClick={() => setShowAnswer(false)}
                  className="w-full text-gray-400 py-2 text-sm hover:text-gray-600 transition-colors"
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
