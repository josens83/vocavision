/**
 * FlashCardGesture Component
 *
 * 벤치마킹: Quizlet의 플래시카드 제스처 시스템
 * - 스와이프 오른쪽: 알았어요 (Easy/Perfect)
 * - 스와이프 왼쪽: 모르겠어요 (Again/Hard)
 * - 더블탭: 카드 뒤집기
 * - 드래그 애니메이션: 카드가 날아가는 효과
 *
 * 핵심 개선사항:
 * 1. 현재: 클릭 기반만 → 개선: 제스처 기반 인터랙션
 * 2. 현재: 버튼으로만 평가 → 개선: 스와이프로 빠른 평가
 * 3. 현재: 정적인 전환 → 개선: 물리 기반 애니메이션
 *
 * Quizlet 분석:
 * - 스와이프 임계값: 화면 너비의 30%
 * - 색상 피드백: 초록(알았어요), 빨강(모르겠어요)
 * - 햅틱 피드백 (모바일)
 * - 카드 스택 효과 (다음 카드 미리보기)
 */

'use client';

import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';

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
  const [flipped, setFlipped] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [activeTab, setActiveTab] = useState<'definition' | 'image' | 'mnemonic' | 'etymology'>('definition');

  // Motion values for swipe gesture
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  // Color feedback based on swipe direction
  const cardRef = useRef<HTMLDivElement>(null);

  // 더블탭으로 카드 뒤집기
  const handleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // 더블탭 감지
      setFlipped(!flipped);
    }

    setLastTap(now);
  };

  // 스와이프 제스처 핸들러
  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100; // 스와이프 임계값 (px)
    const velocity = info.velocity.x;

    if (Math.abs(info.offset.x) > threshold || Math.abs(velocity) > 500) {
      if (info.offset.x > 0) {
        // 오른쪽 스와이프: 알았어요 (Good/Easy)
        onSwipeRight();
      } else {
        // 왼쪽 스와이프: 모르겠어요 (Again/Hard)
        onSwipeLeft();
      }
    } else {
      // 임계값 미달: 원위치
      x.set(0);
    }
  };

  const onSwipeRight = () => {
    // 오른쪽으로 날아가는 애니메이션
    x.set(1000);
    setTimeout(() => {
      onAnswer(true, 4); // Easy
      resetCard();
    }, 300);
  };

  const onSwipeLeft = () => {
    // 왼쪽으로 날아가는 애니메이션
    x.set(-1000);
    setTimeout(() => {
      onAnswer(false, 1); // Again
      resetCard();
    }, 300);
  };

  const resetCard = () => {
    x.set(0);
    setFlipped(false);
    setActiveTab('definition');
  };

  const handleRating = (rating: number) => {
    const correct = rating >= 3;
    onAnswer(correct, rating);
    resetCard();
  };

  return (
    <div className="max-w-3xl mx-auto relative">
      {/* 스와이프 힌트 표시 */}
      {!flipped && (
        <div className="absolute -top-12 left-0 right-0 flex justify-between text-sm text-gray-500 px-4">
          <div className="flex items-center gap-2">
            <span>←</span>
            <span>모르겠어요</span>
          </div>
          <div className="text-center">
            <span>더블탭으로 뒤집기</span>
          </div>
          <div className="flex items-center gap-2">
            <span>알았어요</span>
            <span>→</span>
          </div>
        </div>
      )}

      <motion.div
        ref={cardRef}
        style={{ x, rotate, opacity }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        onTap={handleTap}
        className="cursor-grab active:cursor-grabbing relative"
        whileTap={{ scale: 0.98 }}
      >
        {/* 스와이프 색상 피드백 오버레이 */}
        <motion.div
          className="absolute inset-0 bg-red-500 rounded-3xl pointer-events-none"
          style={{
            opacity: useTransform(x, [-200, -50, 0], [0.3, 0.1, 0]),
          }}
        />
        <motion.div
          className="absolute inset-0 bg-green-500 rounded-3xl pointer-events-none"
          style={{
            opacity: useTransform(x, [0, 50, 200], [0, 0.1, 0.3]),
          }}
        />

        {/* 카드 컨텐츠 */}
        <motion.div
          initial={{ rotateY: 0 }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden relative"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div style={{ backfaceVisibility: 'hidden' }}>
            {!flipped ? (
              // 앞면: 단어
              <div className="p-12 text-center min-h-[500px] flex flex-col justify-center">
                <div className="mb-8">
                  <h2 className="text-6xl font-bold text-gray-900 mb-4">
                    {word.word}
                  </h2>
                  {word.pronunciation && (
                    <p className="text-2xl text-gray-500">
                      {word.pronunciation}
                    </p>
                  )}
                </div>

                <p className="text-gray-400 text-sm">
                  더블탭으로 답 확인 또는 좌우로 스와이프
                </p>
              </div>
            ) : (
              // 뒷면: 답
              <div className="min-h-[500px]" style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}>
                {/* Tabs */}
                <div className="flex border-b">
                  <TabButton
                    active={activeTab === 'definition'}
                    onClick={() => setActiveTab('definition')}
                    icon="📝"
                    label="정의"
                  />
                  {word.images && word.images.length > 0 && (
                    <TabButton
                      active={activeTab === 'image'}
                      onClick={() => setActiveTab('image')}
                      icon="📸"
                      label="이미지"
                    />
                  )}
                  {word.mnemonics && word.mnemonics.length > 0 && (
                    <TabButton
                      active={activeTab === 'mnemonic'}
                      onClick={() => setActiveTab('mnemonic')}
                      icon="🧠"
                      label="연상법"
                    />
                  )}
                  {word.etymology && (
                    <TabButton
                      active={activeTab === 'etymology'}
                      onClick={() => setActiveTab('etymology')}
                      icon="📚"
                      label="어원"
                    />
                  )}
                </div>

                {/* Tab Content */}
                <div className="p-8">
                  {activeTab === 'definition' && (
                    <div className="text-center">
                      <h3 className="text-4xl font-bold text-gray-900 mb-4">
                        {word.word}
                      </h3>
                      {word.partOfSpeech && (
                        <p className="text-lg text-blue-600 mb-2">
                          ({word.partOfSpeech})
                        </p>
                      )}
                      {(word.ipaUs || word.pronunciation) && (
                        <p className="text-xl text-gray-500 mb-4">
                          {word.ipaUs || word.pronunciation}
                        </p>
                      )}
                      <p className="text-3xl text-gray-700 mb-4">
                        {word.definitionKo || word.definition || '정의 없음'}
                      </p>
                      {word.definition && word.definitionKo && (
                        <p className="text-lg text-gray-500 mb-6">
                          {word.definition}
                        </p>
                      )}
                      {word.examples && word.examples.length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-6 text-left max-w-2xl mx-auto">
                          <h4 className="font-semibold mb-4">예문:</h4>
                          {word.examples.slice(0, 2).map((example: any, i: number) => (
                            <div key={i} className="mb-4">
                              <p className="text-gray-800 italic">"{example.sentence}"</p>
                              {example.translation && (
                                <p className="text-gray-600 text-sm mt-1">
                                  {example.translation}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {word.collocations && word.collocations.length > 0 && (
                        <div className="bg-blue-50 rounded-xl p-4 mt-4 text-left max-w-2xl mx-auto">
                          <h4 className="font-semibold mb-2 text-blue-800">🔗 연어 표현:</h4>
                          <div className="flex flex-wrap gap-2">
                            {word.collocations.slice(0, 5).map((col: any, i: number) => (
                              <span key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                {col.phrase}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'image' && word.images && word.images.length > 0 && (
                    <div className="text-center">
                      <div className="relative w-full max-w-lg mx-auto mb-4 rounded-xl overflow-hidden">
                        <img
                          src={word.images[0].imageUrl}
                          alt={word.word}
                          className="w-full h-auto"
                        />
                      </div>
                      {word.images[0].description && (
                        <p className="text-gray-600">{word.images[0].description}</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'mnemonic' && word.mnemonics && word.mnemonics.length > 0 && (
                    <div>
                      <h4 className="text-2xl font-bold mb-4">
                        {word.mnemonics[0].title}
                      </h4>
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-xl mb-4">
                        <p className="text-lg text-gray-800 whitespace-pre-wrap">
                          {word.mnemonics[0].content}
                        </p>
                      </div>
                      {word.mnemonics[0].koreanHint && (
                        <div className="bg-blue-50 p-4 rounded-xl">
                          <p className="text-sm text-gray-700">
                            💡 {word.mnemonics[0].koreanHint}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'etymology' && word.etymology && (
                    <div>
                      <h4 className="text-2xl font-bold mb-4">어원</h4>
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-xl">
                          <p className="text-sm text-gray-600 mb-1">기원</p>
                          <p className="text-lg font-semibold">{word.etymology.origin}</p>
                        </div>
                        {word.etymology.rootWords && word.etymology.rootWords.length > 0 && (
                          <div className="bg-gray-50 p-4 rounded-xl">
                            <p className="text-sm text-gray-600 mb-2">어근</p>
                            <ul className="space-y-1">
                              {word.etymology.rootWords.map((root: string, i: number) => (
                                <li key={i} className="text-gray-800">• {root}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {word.etymology.evolution && (
                          <div className="bg-gray-50 p-4 rounded-xl">
                            <p className="text-sm text-gray-600 mb-1">발전 과정</p>
                            <p className="text-gray-800">{word.etymology.evolution}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Rating Buttons */}
                <div className="border-t p-6 bg-gray-50">
                  <p className="text-center text-gray-700 mb-4 font-medium">
                    이 단어를 얼마나 잘 기억하고 있나요?
                  </p>
                  <div className="flex gap-3 justify-center">
                    <RatingButton
                      rating={1}
                      label="다시"
                      color="red"
                      onClick={() => handleRating(1)}
                    />
                    <RatingButton
                      rating={2}
                      label="어려움"
                      color="orange"
                      onClick={() => handleRating(2)}
                    />
                    <RatingButton
                      rating={3}
                      label="보통"
                      color="yellow"
                      onClick={() => handleRating(3)}
                    />
                    <RatingButton
                      rating={4}
                      label="쉬움"
                      color="green"
                      onClick={() => handleRating(4)}
                    />
                    <RatingButton
                      rating={5}
                      label="완벽"
                      color="blue"
                      onClick={() => handleRating(5)}
                    />
                  </div>
                  <p className="text-center text-gray-500 mt-3 text-sm">
                    또는 좌우로 스와이프하세요
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* 스와이프 방향 표시 */}
      <motion.div
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full font-bold text-xl"
        style={{
          opacity: useTransform(x, [-100, -50, 0], [1, 0.5, 0]),
          scale: useTransform(x, [-100, -50, 0], [1.2, 1, 0.8]),
        }}
      >
        ✗ 모르겠어요
      </motion.div>

      <motion.div
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full font-bold text-xl"
        style={{
          opacity: useTransform(x, [0, 50, 100], [0, 0.5, 1]),
          scale: useTransform(x, [0, 50, 100], [0.8, 1, 1.2]),
        }}
      >
        ✓ 알았어요
      </motion.div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-4 px-4 text-center transition ${
        active
          ? 'bg-white border-b-2 border-blue-600 text-blue-600 font-semibold'
          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
      }`}
    >
      <span className="mr-2">{icon}</span>
      {label}
    </button>
  );
}

function RatingButton({
  rating,
  label,
  color,
  onClick,
}: {
  rating: number;
  label: string;
  color: string;
  onClick: () => void;
}) {
  const colorClasses = {
    red: 'bg-red-500 hover:bg-red-600',
    orange: 'bg-orange-500 hover:bg-orange-600',
    yellow: 'bg-yellow-500 hover:bg-yellow-600',
    green: 'bg-green-500 hover:bg-green-600',
    blue: 'bg-blue-500 hover:bg-blue-600',
  }[color];

  return (
    <button
      onClick={onClick}
      className={`${colorClasses} text-white px-6 py-3 rounded-lg font-semibold transition flex-1 hover:shadow-lg transform hover:scale-105`}
    >
      {label}
    </button>
  );
}
