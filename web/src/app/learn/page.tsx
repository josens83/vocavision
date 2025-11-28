'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useLearningStore } from '@/lib/store';
import { progressAPI, wordsAPI } from '@/lib/api';
import FlashCardGesture from '@/components/learning/FlashCardGesture';

interface Word {
  id: string;
  word: string;
  definition: string;
  pronunciation?: string;
  images?: any[];
  mnemonics?: any[];
  examples?: any[];
  rhymes?: any[];
  etymology?: any;
}

interface Review {
  word: Word;
}

export default function LearnPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const {
    currentWordIndex,
    sessionId,
    wordsStudied,
    wordsCorrect,
    setSessionId,
    incrementWord,
    resetSession,
  } = useLearningStore();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }

    loadReviews();
    startSession();
  }, [user, hasHydrated, router]);

  const startSession = async () => {
    try {
      const session = await progressAPI.startSession();
      setSessionId(session.session.id);
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const loadReviews = async () => {
    try {
      const data = await progressAPI.getDueReviews();

      // If no reviews, get random words
      if (data.count === 0) {
        const randomWords = await wordsAPI.getRandomWords(10);
        setReviews(randomWords.words.map((word: Word) => ({ word })));
      } else {
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
      // Fallback to random words
      try {
        const randomWords = await wordsAPI.getRandomWords(10);
        setReviews(randomWords.words.map((word: Word) => ({ word })));
      } catch (e) {
        console.error('Failed to load random words:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (correct: boolean, rating: number) => {
    const currentWord = reviews[currentWordIndex]?.word;

    if (!currentWord) return;

    try {
      await progressAPI.submitReview({
        wordId: currentWord.id,
        rating,
        learningMethod: 'FLASHCARD',
        sessionId: sessionId || undefined,
      });

      incrementWord(correct);

      // Check if we've finished all words
      if (currentWordIndex + 1 >= reviews.length) {
        setShowResult(true);
        if (sessionId) {
          await progressAPI.endSession({
            sessionId,
            wordsStudied: wordsStudied + 1,
            wordsCorrect: wordsCorrect + (correct ? 1 : 0),
          });
        }
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  };

  const handleRestart = () => {
    resetSession();
    setShowResult(false);
    loadReviews();
    startSession();
  };

  if (!hasHydrated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold mb-4">학습할 단어가 없습니다</h2>
          <p className="text-gray-600 mb-6">
            새로운 단어를 추가하거나 나중에 다시 시도해주세요.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (showResult) {
    const accuracy = wordsStudied > 0 ? Math.round((wordsCorrect / wordsStudied) * 100) : 0;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold mb-4">학습 완료!</h2>

          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold text-blue-600">{wordsStudied}</div>
                <div className="text-sm text-gray-600">학습한 단어</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{wordsCorrect}</div>
                <div className="text-sm text-gray-600">정답</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{accuracy}%</div>
                <div className="text-sm text-gray-600">정확도</div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleRestart}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              다시 학습하기
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300"
            >
              대시보드
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentWord = reviews[currentWordIndex]?.word;

  if (!currentWord) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← 대시보드
          </button>
          <div className="text-center">
            <div className="text-sm text-gray-600">진행 상황</div>
            <div className="text-lg font-semibold">
              {currentWordIndex + 1} / {reviews.length}
            </div>
          </div>
          <div className="text-sm text-gray-600">
            정확도: {wordsStudied > 0 ? Math.round((wordsCorrect / wordsStudied) * 100) : 0}%
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentWordIndex + 1) / reviews.length) * 100}%` }}
          />
        </div>

        {/* Flash Card - Benchmarking: Quizlet 스타일 제스처 (스와이프, 더블탭) */}
        <FlashCardGesture word={currentWord} onAnswer={handleAnswer} />
      </div>
    </div>
  );
}
