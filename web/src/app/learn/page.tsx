'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore, useLearningStore } from '@/lib/store';
import { progressAPI, wordsAPI } from '@/lib/api';
import FlashCardGesture from '@/components/learning/FlashCardGesture';

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

interface Review {
  word: Word;
}

// Exam name mapping
const examNames: Record<string, string> = {
  CSAT: '수능',
  SAT: 'SAT',
  TOEFL: 'TOEFL',
  TOEIC: 'TOEIC',
  TEPS: 'TEPS',
};

// Loading fallback component
function LearnPageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-xl">로딩 중...</div>
    </div>
  );
}

// Main page component wrapped in Suspense
export default function LearnPage() {
  return (
    <Suspense fallback={<LearnPageLoading />}>
      <LearnPageContent />
    </Suspense>
  );
}

function LearnPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examParam = searchParams.get('exam')?.toUpperCase();
  const levelParam = searchParams.get('level');

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
  }, [user, hasHydrated, router, examParam, levelParam]);

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
      // If exam filter is provided, load words from that exam
      if (examParam) {
        const data = await wordsAPI.getWords({
          examCategory: examParam,
          level: levelParam || undefined,
          limit: 50, // Fetch more to filter
        });
        const words = data.words || data.data || [];
        // Filter to only include words with actual content (definition or definitionKo exists)
        const wordsWithContent = words.filter((word: any) =>
          (word.definition && word.definition.trim() !== '') ||
          (word.definitionKo && word.definitionKo.trim() !== '')
        );
        setReviews(wordsWithContent.slice(0, 20).map((word: Word) => ({ word })));
      } else {
        // Default: Get due reviews or random words
        const data = await progressAPI.getDueReviews();

        if (data.count === 0) {
          const randomWords = await wordsAPI.getRandomWords(10);
          setReviews(randomWords.words.map((word: Word) => ({ word })));
        } else {
          setReviews(data.reviews);
        }
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

  const handleAnswer = (correct: boolean, rating: number) => {
    const currentWord = reviews[currentWordIndex]?.word;

    if (!currentWord) return;

    // Fire and forget - don't wait for API response
    progressAPI.submitReview({
      wordId: currentWord.id,
      rating,
      learningMethod: 'FLASHCARD',
      sessionId: sessionId || undefined,
    }).catch(error => console.error('Failed to submit review:', error));

    // Immediately advance to next word
    incrementWord(correct);

    // Check if we've finished all words
    if (currentWordIndex + 1 >= reviews.length) {
      setShowResult(true);
      if (sessionId) {
        progressAPI.endSession({
          sessionId,
          wordsStudied: wordsStudied + 1,
          wordsCorrect: wordsCorrect + (correct ? 1 : 0),
        }).catch(error => console.error('Failed to end session:', error));
      }
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
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-xl">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold mb-4">학습할 단어가 없습니다</h2>
          <p className="text-gray-600 mb-6">
            {examParam
              ? `${examNames[examParam] || examParam} 콘텐츠가 준비 중입니다. 곧 학습할 수 있습니다!`
              : '새로운 단어를 추가하거나 나중에 다시 시도해주세요.'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              대시보드
            </button>
            {examParam && (
              <button
                onClick={() => router.push('/courses')}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
              >
                다른 코스 보기
              </button>
            )}
          </div>
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
              <span className="block">다시</span>
              <span className="block">학습하기</span>
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
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-700 hover:text-blue-600 font-medium transition"
          >
            <span className="text-lg">←</span>
            <span>홈으로</span>
          </button>
          <div className="text-center">
            {examParam && (
              <div className="inline-block bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-sm mb-2">
                {examNames[examParam]} {levelParam && `• ${levelParam}`}
              </div>
            )}
            <div className="text-gray-500 text-sm">진행 상황</div>
            <div className="text-2xl font-bold text-gray-900">
              {currentWordIndex + 1} / {reviews.length}
            </div>
          </div>
          <div className="text-right">
            <div className="text-gray-500 text-sm">정확도</div>
            <div className="text-xl font-bold text-green-600">
              {wordsStudied > 0 ? Math.round((wordsCorrect / wordsStudied) * 100) : 0}%
            </div>
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
