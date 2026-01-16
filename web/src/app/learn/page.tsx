'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore, useLearningStore } from '@/lib/store';
import { progressAPI, wordsAPI } from '@/lib/api';
import FlashCardGesture from '@/components/learning/FlashCardGesture';
import { EmptyFirstTime, CelebrateCompletion } from '@/components/ui/EmptyState';

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
  visuals?: WordVisual[];
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
    <div className="min-h-screen bg-gray-50">
      {/* Skeleton Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2" />
          </div>
        </div>
      </div>
      {/* Skeleton Card */}
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="h-12 w-48 bg-gray-200 rounded animate-pulse mx-auto mb-4" />
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mx-auto mb-6" />
          <div className="h-24 w-full bg-gray-100 rounded-xl animate-pulse mb-6" />
          <div className="flex gap-3 justify-center">
            <div className="h-12 w-24 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-12 w-24 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
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
  const isDemo = searchParams.get('demo') === '1';

  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const {
    currentWordIndex,
    sessionId,
    wordsStudied,
    wordsCorrect,
    setSessionId,
    incrementWord,
    decrementWord,
    resetSession,
  } = useLearningStore();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalWordsInLevel, setTotalWordsInLevel] = useState(0);
  const [totalLearnedInLevel, setTotalLearnedInLevel] = useState(0);

  useEffect(() => {
    if (!hasHydrated) return;

    // Reset state on page entry to fix re-entry issue
    resetSession();
    setShowResult(false);
    setReviews([]);
    setLoading(true);

    // Guest users can also learn - don't redirect to login
    loadReviews();

    // Only start session for logged-in users
    if (user) {
      startSession();
    }
  }, [user, hasHydrated, router, examParam, levelParam, isDemo]);

  const startSession = async () => {
    try {
      const session = await progressAPI.startSession();
      setSessionId(session.session.id);
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const loadReviews = async (page = 1) => {
    try {
      // Demo mode: use first 10 words from API directly
      if (isDemo && examParam) {
        const data = await wordsAPI.getWords({
          examCategory: examParam,
          limit: 10,
        });
        const words = data.words || data.data || [];
        setReviews(words.map((word: Word) => ({ word })));
        setTotalWordsInLevel(data.pagination?.total || 0);
      } else if (examParam) {
        // If exam filter is provided, load words from that exam
        // 병렬 호출로 성능 개선 (5-8초 → 1-2초)
        const [wordsData, totalData] = await Promise.all([
          // 학습할 단어 조회 (excludeLearned로 미학습 단어만)
          wordsAPI.getWords({
            examCategory: examParam,
            level: levelParam || undefined,
            limit: 20,
            page,
            excludeLearned: user ? true : undefined,
            shuffle: true,
          }),
          // 로그인 사용자만 전체 단어 수 조회 (진행률 계산용)
          user ? wordsAPI.getWords({
            examCategory: examParam,
            level: levelParam || undefined,
            limit: 1,
          }) : Promise.resolve(null),
        ]);

        const words = wordsData.words || wordsData.data || [];
        // Filter to only include words with actual content
        const wordsWithContent = words.filter((word: any) =>
          (word.definition && word.definition.trim() !== '') ||
          (word.definitionKo && word.definitionKo.trim() !== '')
        );
        setReviews(wordsWithContent.slice(0, 20).map((word: Word) => ({ word })));
        setCurrentPage(page);

        // Set progress data
        if (user && totalData) {
          const totalInLevel = totalData.pagination?.total || 0;
          const remainingUnlearned = wordsData.pagination?.total || 0;
          setTotalLearnedInLevel(totalInLevel - remainingUnlearned);
          setTotalWordsInLevel(totalInLevel);
        } else {
          setTotalWordsInLevel(wordsData.pagination?.total || 0);
        }
      } else if (user) {
        // Logged-in users: Get due reviews or random words
        try {
          const data = await progressAPI.getDueReviews();

          if (data.count === 0) {
            const randomWords = await wordsAPI.getRandomWords(10);
            setReviews(randomWords.words.map((word: Word) => ({ word })));
          } else {
            setReviews(data.reviews);
          }
        } catch (error) {
          // Fallback to random words if progress API fails
          console.error('Failed to load due reviews:', error);
          const randomWords = await wordsAPI.getRandomWords(10);
          setReviews(randomWords.words.map((word: Word) => ({ word })));
        }
      } else {
        // Guest users: Load random words directly
        const randomWords = await wordsAPI.getRandomWords(10);
        setReviews(randomWords.words.map((word: Word) => ({ word })));
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

    // Only submit progress for logged-in users
    if (user) {
      progressAPI.submitReview({
        wordId: currentWord.id,
        rating,
        learningMethod: 'FLASHCARD',
        sessionId: sessionId || undefined,
      }).catch(error => console.error('Failed to submit review:', error));
    }

    // Immediately advance to next word
    incrementWord(correct);

    // Check if we've finished all words
    if (currentWordIndex + 1 >= reviews.length) {
      setShowResult(true);
      if (user && sessionId) {
        progressAPI.endSession({
          sessionId,
          wordsStudied: wordsStudied + 1,
          wordsCorrect: wordsCorrect + (correct ? 1 : 0),
        }).catch(error => console.error('Failed to end session:', error));
      }
    }
  };

  const handlePrevious = () => {
    if (currentWordIndex > 0) {
      decrementWord();
    }
  };

  const handleNext = () => {
    // "다음" 버튼은 "모름"(rating=1)으로 자동 처리
    const currentWord = reviews[currentWordIndex]?.word;

    if (!currentWord) return;

    // Submit review with "모름" rating for logged-in users
    if (user) {
      progressAPI.submitReview({
        wordId: currentWord.id,
        rating: 1, // 모름
        learningMethod: 'FLASHCARD',
        sessionId: sessionId || undefined,
      }).catch(error => console.error('Failed to submit review:', error));
    }

    // Advance to next word
    incrementWord(false);

    // Check if we've finished all words
    if (currentWordIndex + 1 >= reviews.length) {
      setShowResult(true);
      if (user && sessionId) {
        progressAPI.endSession({
          sessionId,
          wordsStudied: wordsStudied + 1,
          wordsCorrect, // Don't increment since marked as "모름"
        }).catch(error => console.error('Failed to end session:', error));
      }
    }
  };

  const handleRestart = () => {
    resetSession();
    setShowResult(false);
    loadReviews();
    if (user) {
      startSession();
    }
  };

  const handleNextBatch = () => {
    resetSession();
    setShowResult(false);
    setLoading(true);
    loadReviews(currentPage + 1);
    if (user) {
      startSession();
    }
  };

  if (!hasHydrated || loading) {
    return <LearnPageLoading />;
  }

  if (reviews.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <EmptyFirstTime type="words" />
      </div>
    );
  }

  if (showResult) {
    // Check if there are more words to learn
    const hasMoreWords = totalWordsInLevel > 0 && (totalLearnedInLevel + wordsStudied) < totalWordsInLevel;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <CelebrateCompletion
          score={wordsCorrect}
          total={wordsStudied}
          onRetry={handleRestart}
          onHome={() => router.push(user ? '/dashboard' : '/')}
          onNext={user && hasMoreWords && examParam ? handleNextBatch : undefined}
          isGuest={!user}
          totalProgress={user && totalWordsInLevel > 0 ? {
            learned: totalLearnedInLevel + wordsStudied,
            total: totalWordsInLevel,
          } : undefined}
        />
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Demo Mode Banner for Guests */}
      {!user && (
        <div className="bg-amber-50 border-b border-amber-200 sticky top-0 z-20">
          <div className="container mx-auto px-4 py-2">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-200 text-amber-800 rounded font-bold text-xs shrink-0">체험</span>
                <span className="text-amber-800 whitespace-nowrap">학습 기록이 저장되지 않습니다.</span>
              </div>
              <a href="/auth/login" className="text-amber-900 font-medium underline hover:text-amber-700 whitespace-nowrap">
                로그인하고 기록 저장하기
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            {/* Back Button */}
            <button
              onClick={() => router.push(user ? '/dashboard' : '/')}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium text-sm">나가기</span>
            </button>

            {/* Center - Course Info */}
            <div className="text-center flex-1 min-w-0">
              {examParam && (
                <span className="text-base font-bold text-gray-900">
                  {examNames[examParam]} {levelParam && <span className="text-gray-500 font-normal">· {levelNames[levelParam] || levelParam}</span>}
                </span>
              )}
            </div>

            {/* Right - Stats (compact on mobile) */}
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs text-gray-500 hidden sm:inline">정확도</span>
              <span className="text-sm font-bold text-green-600">{accuracyPercent}%</span>
            </div>
          </div>

          {/* Progress Bar with Navigation */}
          <div className="mt-3">
            <div className="flex items-center gap-2">
              {/* Previous Button */}
              <button
                onClick={handlePrevious}
                disabled={currentWordIndex === 0}
                className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-medium transition shrink-0 ${
                  currentWordIndex === 0
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">이전</span>
              </button>

              {/* Progress Bar */}
              <div className="flex-1">
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-pink-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Next Button */}
              <button
                onClick={handleNext}
                disabled={currentWordIndex >= reviews.length - 1}
                className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-medium transition shrink-0 ${
                  currentWordIndex >= reviews.length - 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="hidden sm:inline">다음</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Progress Count */}
              <span className="text-sm font-medium text-pink-600 shrink-0">{currentWordIndex + 1}/{reviews.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 md:py-6 max-w-2xl flex-1 overflow-hidden">
        <FlashCardGesture
          word={currentWord}
          onAnswer={handleAnswer}
          onPrevious={handlePrevious}
          hasPrevious={currentWordIndex > 0}
        />
      </div>
    </div>
  );
}
