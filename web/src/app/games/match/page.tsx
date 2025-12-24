/**
 * Match Game Page
 *
 * 벤치마킹: Quizlet의 Match 게임
 * - 단어와 정의를 드래그 앤 드롭으로 매칭
 * - 모든 쌍을 맞추는 시간 측정
 * - 정답 시 카드 사라지는 애니메이션
 * - 완료 시 리더보드 표시
 *
 * Quizlet Match 분석:
 * - 8개 단어 (16개 카드)
 * - 그리드 레이아웃 (4x4)
 * - 클릭/터치 기반 선택
 * - 시간 기록 및 최고 기록
 * - 실수 카운트 (틀린 매칭)
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { wordsAPI } from '@/lib/api';
import Link from 'next/link';

interface Word {
  id: string;
  word: string;
  definition: string;
}

interface Card {
  id: string;
  content: string;
  type: 'word' | 'definition';
  wordId: string;
  matched: boolean;
}

export default function MatchGamePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    loadWords();
  }, [user, router]);

  // Timer
  useEffect(() => {
    if (startTime && !isComplete) {
      const timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [startTime, isComplete]);

  const loadWords = async () => {
    try {
      const response = await wordsAPI.getRandomWords(8);
      const words: Word[] = response.words;

      // Create cards (word + definition)
      const newCards: Card[] = [];

      words.forEach((word) => {
        newCards.push({
          id: `word-${word.id}`,
          content: word.word,
          type: 'word',
          wordId: word.id,
          matched: false,
        });

        newCards.push({
          id: `def-${word.id}`,
          content: word.definition,
          type: 'definition',
          wordId: word.id,
          matched: false,
        });
      });

      // Shuffle cards
      const shuffled = newCards.sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setStartTime(Date.now());
    } catch (error) {
      console.error('Failed to load words:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (card: Card) => {
    if (card.matched || selectedCards.some((c) => c.id === card.id)) {
      return;
    }

    const newSelected = [...selectedCards, card];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      checkMatch(newSelected[0], newSelected[1]);
    }
  };

  const checkMatch = (card1: Card, card2: Card) => {
    setTimeout(() => {
      if (card1.wordId === card2.wordId && card1.type !== card2.type) {
        // Match!
        setMatchedPairs([...matchedPairs, card1.wordId]);
        setCards((prevCards) =>
          prevCards.map((c) =>
            c.wordId === card1.wordId ? { ...c, matched: true } : c
          )
        );

        // Check if game is complete
        if (matchedPairs.length + 1 === 8) {
          setIsComplete(true);
        }
      } else {
        // No match
        setMistakes(mistakes + 1);
      }

      setSelectedCards([]);
    }, 500);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRestart = () => {
    setCards([]);
    setSelectedCards([]);
    setMatchedPairs([]);
    setMistakes(0);
    setStartTime(null);
    setElapsedTime(0);
    setIsComplete(false);
    setLoading(true);
    loadWords();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
        <div className="text-white text-2xl">게임 준비 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 py-4 md:py-8 px-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-4 md:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <Link
            href="/dashboard"
            className="text-white hover:text-purple-200 transition inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> 대시보드로
          </Link>
          <div className="flex gap-2 md:gap-6 text-white w-full sm:w-auto justify-between sm:justify-end">
            <div className="bg-white/20 rounded-lg px-3 md:px-4 py-2 backdrop-blur-sm flex-1 sm:flex-initial">
              <div className="text-xs md:text-sm opacity-80">시간</div>
              <div className="text-lg md:text-2xl font-bold">{formatTime(elapsedTime)}</div>
            </div>
            <div className="bg-white/20 rounded-lg px-3 md:px-4 py-2 backdrop-blur-sm flex-1 sm:flex-initial">
              <div className="text-xs md:text-sm opacity-80">실수</div>
              <div className="text-lg md:text-2xl font-bold">{mistakes}</div>
            </div>
            <div className="bg-white/20 rounded-lg px-3 md:px-4 py-2 backdrop-blur-sm flex-1 sm:flex-initial">
              <div className="text-xs md:text-sm opacity-80">매칭</div>
              <div className="text-lg md:text-2xl font-bold">{matchedPairs.length}/8</div>
            </div>
          </div>
        </div>

        <div className="text-center text-white">
          <h1 className="text-2xl md:text-4xl font-bold mb-2">🎯 Match Game</h1>
          <p className="text-purple-100 text-sm md:text-base">
            단어와 정의를 매칭하세요! 빠를수록 좋습니다!
          </p>
        </div>
      </div>

      {/* Game Grid */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          <AnimatePresence>
            {cards.map((card) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.3 }}
              >
                {!card.matched && (
                  <motion.button
                    onClick={() => handleCardClick(card)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      w-full h-24 md:h-32 rounded-xl p-3 md:p-4 font-medium text-center
                      transition-all duration-200
                      ${
                        selectedCards.some((c) => c.id === card.id)
                          ? 'bg-yellow-400 text-yellow-900 shadow-lg scale-105'
                          : card.type === 'word'
                          ? 'bg-white text-purple-900 hover:shadow-lg'
                          : 'bg-purple-100 text-purple-900 hover:shadow-lg'
                      }
                    `}
                  >
                    <div className="text-xs md:text-sm opacity-60 mb-1">
                      {card.type === 'word' ? '단어' : '정의'}
                    </div>
                    <div className="text-sm md:text-lg leading-tight line-clamp-2">
                      {card.content}
                    </div>
                  </motion.button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Completion Modal */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                완료!
              </h2>
              <div className="space-y-3 mb-6">
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-sm text-purple-600 mb-1">걸린 시간</div>
                  <div className="text-3xl font-bold text-purple-900">
                    {formatTime(elapsedTime)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">실수</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {mistakes}번
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-green-600 mb-1">정확도</div>
                  <div className="text-2xl font-bold text-green-900">
                    {Math.round((8 / (8 + mistakes)) * 100)}%
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRestart}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
                >
                  다시 하기
                </button>
                <Link
                  href="/dashboard"
                  className="flex-1 bg-gray-200 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-300 transition text-center"
                >
                  대시보드
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
