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

// Level name mapping
const levelNames: Record<string, string> = {
  L1: '초급',
  L2: '중급',
  L3: '고급',
};

// Loading fallback component
function LearnPageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-xl text-gray-500">로딩 중...</div>
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-sm border border-gray-200">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">학습할 단어가 없습니다</h2>
          <p className="text-gray-500 mb-6">
            {examParam
              ? `${examNames[examParam] || examParam} 콘텐츠가 준비 중입니다. 곧 학습할 수 있습니다!`
              : '새로운 단어를 추가하거나 나중에 다시 시도해주세요.'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-pink-500/25"
            >
              홈으로
            </button>
            {examParam && (
              <button
                onClick={() => router.push('/courses')}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition"
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-sm border border-gray-200">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">학습 완료!</h2>
            <p className="text-gray-500">오늘도 수고하셨어요!</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{wordsStudied}</div>
              <div className="text-xs text-gray-500 mt-1">학습 단어</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{wordsCorrect}</div>
              <div className="text-xs text-gray-500 mt-1">정답</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{accuracy}%</div>
              <div className="text-xs text-gray-500 mt-1">정확도</div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleRestart}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white py-4 rounded-xl font-bold transition shadow-lg shadow-pink-500/25"
            >
              다시 학습하기
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-medium hover:bg-gray-200 transition"
            >
              홈으로 돌아가기
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

  const progressPercent = ((currentWordIndex + 1) / reviews.length) * 100;
  const accuracyPercent = wordsStudied > 0 ? Math.round((wordsCorrect / wordsStudied) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">나가기</span>
            </button>

            {/* Center - Course Info */}
            <div className="text-center">
              {examParam && (
                <span className="text-sm font-bold text-gray-900">
                  {examNames[examParam]} {levelParam && `· ${levelNames[levelParam] || levelParam}`}
                </span>
              )}
            </div>

            {/* Right - Stats */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-sm text-gray-500">정확도</span>
                <p className="text-lg font-bold text-green-600">{accuracyPercent}%</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-500">진행률</span>
              <span className="font-medium text-pink-600">{currentWordIndex + 1} / {reviews.length}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-pink-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <FlashCardGesture word={currentWord} onAnswer={handleAnswer} />
      </div>
    </div>
  );
}
