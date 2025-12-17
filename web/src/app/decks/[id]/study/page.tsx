'use client';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/store';
import { decksAPI, progressAPI } from '@/lib/api';
import FlashCardGesture from '@/components/learning/FlashCardGesture';

// Benchmarking: Anki-style spaced repetition study mode
// Phase 2-1: SM-2 알고리즘 기반 덱 학습 모드

interface Word {
  id: string;
  word: string;
  definition: string;
  pronunciation?: string;
  difficulty: string;
  partOfSpeech: string;
  example?: string;
  mnemonic?: string;
  etymology?: string;
  image?: string;
}

interface Deck {
  id: string;
  name: string;
  wordCount: number;
}

export default function DeckStudyPage() {
  const router = useRouter();
  const params = useParams();
  const deckId = params.id as string;
  const user = useAuthStore((state) => state.user);

  const [deck, setDeck] = useState<Deck | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [studiedCount, setStudiedCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showComplete, setShowComplete] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    loadDeck();
    startSession();
  }, [user, deckId]);

  const loadDeck = async () => {
    setLoading(true);
    try {
      const deckData = await decksAPI.getDeckById(deckId);
      setDeck(deckData);

      const wordsData = await decksAPI.getDeckWords(deckId);
      // Shuffle words for varied practice
      const shuffled = (wordsData.words || []).sort(() => Math.random() - 0.5);
      setWords(shuffled);
    } catch (error) {
      console.error('Failed to load deck:', error);
      // Mock data for development
      setDeck({
        id: deckId,
        name: 'TOEFL 필수 단어',
        wordCount: 3,
      });

      const mockWords: Word[] = [
        {
          id: '1',
          word: 'ephemeral',
          definition: '일시적인, 덧없는',
          pronunciation: 'ɪˈfem(ə)rəl',
          difficulty: 'ADVANCED',
          partOfSpeech: 'adjective',
          example: 'The beauty of cherry blossoms is ephemeral.',
          mnemonic: 'e-femeral → 이(e) 여성(female)의 아름다움은 일시적',
          etymology: 'Greek ephemeros (lasting a day)',
        },
        {
          id: '2',
          word: 'ubiquitous',
          definition: '어디에나 있는, 편재하는',
          pronunciation: 'juːˈbɪkwɪtəs',
          difficulty: 'ADVANCED',
          partOfSpeech: 'adjective',
          example: 'Smartphones have become ubiquitous in modern society.',
          mnemonic: 'you-bi-quit-us → 너는 양방향으로 그만둘 수 없어 (어디에나 있음)',
        },
        {
          id: '3',
          word: 'ameliorate',
          definition: '개선하다, 향상시키다',
          pronunciation: 'əˈmiːliəreɪt',
          difficulty: 'EXPERT',
          partOfSpeech: 'verb',
          example: 'The new policy aims to ameliorate working conditions.',
        },
      ];
      setWords(mockWords);
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    try {
      const session = await progressAPI.startSession();
      setSessionId(session.id);
    } catch (error) {
      console.error('Failed to start session:', error);
      setSessionId('mock-session-id');
    }
  };

  const handleReview = async (rating: number) => {
    const currentWord = words[currentIndex];

    // Submit review to backend
    try {
      await progressAPI.submitReview({
        wordId: currentWord.id,
        rating,
        sessionId: sessionId || undefined,
        learningMethod: 'deck_study',
      });
    } catch (error) {
      console.error('Failed to submit review:', error);
    }

    // Update stats
    setStudiedCount(studiedCount + 1);
    if (rating >= 3) {
      // Rating 3 (Good) or higher is considered correct
      setCorrectCount(correctCount + 1);
    }

    // Move to next card
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Session complete
      endSession();
      setShowComplete(true);
    }
  };

  const endSession = async () => {
    if (!sessionId) return;

    try {
      await progressAPI.endSession({
        sessionId,
        wordsStudied: studiedCount + 1, // +1 for current word
        wordsCorrect: correctCount + (currentIndex >= 3 ? 1 : 0), // Estimate last word as correct
      });
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  const handleSwipeLeft = () => {
    // Swipe left = Again/Hard (rating 1-2)
    handleReview(1);
  };

  const handleSwipeRight = () => {
    // Swipe right = Easy/Perfect (rating 4-5)
    handleReview(5);
  };

  const handleButtonRate = (rating: number) => {
    handleReview(rating);
  };

  const currentWord = words[currentIndex];
  const progress = words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-gray-600 text-lg">학습 준비 중...</p>
        </div>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-gray-600 text-lg mb-4">이 덱에는 학습할 단어가 없습니다.</p>
          <Link
            href={`/decks/${deckId}`}
            className="inline-block bg-indigo-500 text-white px-6 py-3 rounded-lg hover:bg-indigo-600 transition"
          >
            덱으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-indigo-600">{deck?.name}</h1>
              <p className="text-sm text-gray-600">
                {currentIndex + 1} / {words.length} 단어
              </p>
            </div>
            <Link
              href={`/decks/${deckId}`}
              className="text-gray-600 hover:text-gray-900 font-semibold"
            >
              ✕ 종료
            </Link>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!showComplete ? (
          <>
            {/* Flashcard */}
            <div className="max-w-2xl mx-auto mb-8">
              <FlashCardGesture
                word={currentWord}
                onAnswer={(correct, rating) => handleReview(rating)}
              />
            </div>

            {/* Rating Buttons - Anki Style */}
            <div className="max-w-2xl mx-auto">
              <p className="text-center text-gray-600 mb-4 text-sm">
                💡 왼쪽 스와이프 = 다시, 오른쪽 스와이프 = 완벽
              </p>

              <div className="grid grid-cols-4 gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleButtonRate(1)}
                  className="bg-red-500 text-white py-4 rounded-xl font-semibold hover:bg-red-600 transition"
                >
                  <div className="text-2xl mb-1">😓</div>
                  <div className="text-sm">다시</div>
                  <div className="text-xs opacity-80">1분</div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleButtonRate(2)}
                  className="bg-orange-500 text-white py-4 rounded-xl font-semibold hover:bg-orange-600 transition"
                >
                  <div className="text-2xl mb-1">😐</div>
                  <div className="text-sm">어려움</div>
                  <div className="text-xs opacity-80">10분</div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleButtonRate(3)}
                  className="bg-blue-500 text-white py-4 rounded-xl font-semibold hover:bg-blue-600 transition"
                >
                  <div className="text-2xl mb-1">🙂</div>
                  <div className="text-sm">보통</div>
                  <div className="text-xs opacity-80">1일</div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleButtonRate(5)}
                  className="bg-green-500 text-white py-4 rounded-xl font-semibold hover:bg-green-600 transition"
                >
                  <div className="text-2xl mb-1">😄</div>
                  <div className="text-sm">쉬움</div>
                  <div className="text-xs opacity-80">4일</div>
                </motion.button>
              </div>

              <p className="text-center text-xs text-gray-500 mt-4">
                복습 간격은 학습 데이터를 기반으로 자동 조정됩니다
              </p>
            </div>

            {/* Stats */}
            <div className="max-w-2xl mx-auto mt-8 grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 text-center shadow">
                <div className="text-3xl font-bold text-indigo-600">{studiedCount}</div>
                <div className="text-sm text-gray-600">학습한 단어</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow">
                <div className="text-3xl font-bold text-green-600">
                  {studiedCount > 0 ? Math.round((correctCount / studiedCount) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-600">정확도</div>
              </div>
            </div>
          </>
        ) : (
          /* Completion Screen */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-12 text-center"
          >
            <div className="text-8xl mb-6">🎉</div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">학습 완료!</h2>
            <p className="text-gray-600 text-lg mb-8">
              모든 단어를 학습했습니다. 훌륭해요!
            </p>

            {/* Final Stats */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-indigo-50 rounded-xl p-6">
                <div className="text-4xl font-bold text-indigo-600">{words.length}</div>
                <div className="text-sm text-gray-600 mt-2">총 단어 수</div>
              </div>
              <div className="bg-green-50 rounded-xl p-6">
                <div className="text-4xl font-bold text-green-600">{correctCount}</div>
                <div className="text-sm text-gray-600 mt-2">정답 수</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-6">
                <div className="text-4xl font-bold text-purple-600">
                  {Math.round((correctCount / words.length) * 100)}%
                </div>
                <div className="text-sm text-gray-600 mt-2">정확도</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setCurrentIndex(0);
                  setStudiedCount(0);
                  setCorrectCount(0);
                  setShowComplete(false);
                  startSession();
                }}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition"
              >
                다시 학습하기
              </button>
              <Link
                href={`/decks/${deckId}`}
                className="flex-1 bg-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-300 transition text-center"
              >
                덱으로 돌아가기
              </Link>
            </div>

            {/* Encouragement */}
            <div className="mt-8 p-6 bg-blue-50 rounded-xl">
              <p className="text-blue-900 font-semibold mb-2">💪 계속 학습하세요!</p>
              <p className="text-blue-800 text-sm">
                꾸준한 복습이 장기 기억으로 이어집니다. 내일 다시 만나요!
              </p>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
