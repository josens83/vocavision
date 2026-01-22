'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams, redirect } from 'next/navigation';
import { useAuthStore, useLearningStore, saveLearningSession, loadLearningSession, clearLearningSession } from '@/lib/store';
import { progressAPI, wordsAPI } from '@/lib/api';
import { canAccessContent } from '@/lib/subscription';
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
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Skeleton Header */}
      <div className="bg-white border-b border-[#f5f5f5] sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="h-6 w-20 bg-[#F8F9FA] rounded-[10px] animate-pulse" />
            <div className="h-5 w-24 bg-[#F8F9FA] rounded-[10px] animate-pulse" />
            <div className="h-10 w-20 bg-[#F8F9FA] rounded-[10px] animate-pulse" />
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <div className="h-4 w-12 bg-[#F8F9FA] rounded-[8px] animate-pulse" />
              <div className="h-4 w-16 bg-[#F8F9FA] rounded-[8px] animate-pulse" />
            </div>
            <div className="w-full bg-[#F8F9FA] rounded-full h-2" />
          </div>
        </div>
      </div>
      {/* Skeleton Card */}
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-[#f5f5f5] p-6">
          <div className="h-12 w-48 bg-[#F8F9FA] rounded-[12px] animate-pulse mx-auto mb-4" />
          <div className="h-6 w-32 bg-[#F8F9FA] rounded-[10px] animate-pulse mx-auto mb-6" />
          <div className="h-24 w-full bg-[#F8F9FA] rounded-[14px] animate-pulse mb-6" />
          <div className="flex gap-3 justify-center">
            <div className="h-12 w-24 bg-[#F8F9FA] rounded-[14px] animate-pulse" />
            <div className="h-12 w-24 bg-[#F8F9FA] rounded-[14px] animate-pulse" />
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
  const isDemo = searchParams.get('demo') === 'true' || searchParams.get('demo') === '1';
  const isReviewMode = searchParams.get('mode') === 'review';
  const isWeakMode = searchParams.get('mode') === 'weak';
  const isRestart = searchParams.get('restart') === 'true';

  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  // Demo 체험 횟수 관리 (localStorage) - 최대 2회 허용
  const DEMO_KEY = 'vocavision_demo_count';
  const MAX_DEMO_COUNT = 2;
  const [demoBlocked, setDemoBlocked] = useState(false);
  const [accessBlocked, setAccessBlocked] = useState(false);

  // 체험 횟수 확인
  useEffect(() => {
    if (isDemo && !user && typeof window !== 'undefined') {
      const count = parseInt(localStorage.getItem(DEMO_KEY) || '0', 10);
      if (count >= MAX_DEMO_COUNT) {
        setDemoBlocked(true);
      }
    }
  }, [isDemo, user]);

  // 구독 기반 접근 제어
  useEffect(() => {
    if (!hasHydrated || isDemo) return;

    if (user && examParam && levelParam) {
      if (!canAccessContent(user, examParam, levelParam)) {
        setAccessBlocked(true);
      }
    }
  }, [hasHydrated, user, examParam, levelParam, isDemo]);

  // 시험/레벨 파라미터 없이 접근 시 대시보드로 리다이렉트 (복습 모드 제외)
  useEffect(() => {
    if (hasHydrated && !examParam && !isDemo && !isReviewMode && !isWeakMode) {
      router.replace(user ? '/dashboard' : '/');
    }
  }, [hasHydrated, examParam, isDemo, isReviewMode, isWeakMode, user, router]);
  const {
    currentWordIndex,
    sessionId,
    cardRatings,
    setSessionId,
    setCardRating,
    setCurrentIndex,
    goToNextCard,
    goToPrevCard,
    resetSession,
    restoreSession,
    getWordsStudied,
    getWordsCorrect,
  } = useLearningStore();

  // 세션 복원 여부 추적
  const [sessionRestored, setSessionRestored] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalWordsInLevel, setTotalWordsInLevel] = useState(0);
  const [totalLearnedInLevel, setTotalLearnedInLevel] = useState(0);

  useEffect(() => {
    if (!hasHydrated) return;

    // restart 모드이거나 데모/복습 모드면 세션 초기화
    if (isRestart || isDemo || isReviewMode || isWeakMode) {
      resetSession();
      clearLearningSession();
    }

    setShowResult(false);
    setLoading(true);

    // Guest users can also learn - don't redirect to login
    loadReviews();

    // Only start session for logged-in users
    if (user) {
      startSession();
    }

    // Save last study info to localStorage (for "이어서 학습" button)
    if (examParam && levelParam && !isDemo && !isReviewMode) {
      localStorage.setItem('lastStudy', JSON.stringify({
        exam: examParam,
        level: levelParam,
        timestamp: Date.now(),
      }));
    }
  }, [user, hasHydrated, router, examParam, levelParam, isDemo, isWeakMode, isRestart]);

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
      // 복습 모드: 복습할 단어 로드
      if (isReviewMode && user) {
        const data = await progressAPI.getDueReviews();
        if (data.count === 0) {
          setReviews([]);
        } else {
          setReviews(data.reviews);
        }
        setTotalWordsInLevel(data.count || 0);
      // Demo mode: use first 20 words from API directly
      } else if (isDemo && examParam) {
        const data = await wordsAPI.getWords({
          examCategory: examParam,
          limit: 20,
        });
        const words = data.words || data.data || [];
        setReviews(words.map((word: Word) => ({ word })));
        setTotalWordsInLevel(data.pagination?.total || 0);
      } else if (isWeakMode && examParam && user) {
        // 약한 단어만 학습 모드: incorrectCount > 0 또는 correctCount < 3인 단어
        const [wordsData, totalData] = await Promise.all([
          wordsAPI.getWords({
            examCategory: examParam,
            level: levelParam || undefined,
            limit: 20,
            page,
            mode: 'weak',
            shuffle: true,
          }),
          wordsAPI.getWords({
            examCategory: examParam,
            level: levelParam || undefined,
            limit: 1,
            mode: 'weak',
          }),
        ]);

        const words = wordsData.words || wordsData.data || [];
        const wordsWithContent = words.filter((word: any) =>
          (word.definition && word.definition.trim() !== '') ||
          (word.definitionKo && word.definitionKo.trim() !== '')
        );
        setReviews(wordsWithContent.slice(0, 20).map((word: Word) => ({ word })));
        setCurrentPage(page);

        // 약한 단어 진행률 표시
        const totalWeak = totalData?.pagination?.total || 0;
        setTotalLearnedInLevel(0);
        setTotalWordsInLevel(totalWeak);
      } else if (examParam) {
        // 1. 먼저 저장된 세션 확인 (restart 모드가 아닌 경우)
        if (!isRestart && user && levelParam) {
          const savedSession = loadLearningSession(examParam, levelParam);
          if (savedSession && savedSession.words.length > 0) {
            // 저장된 세션 복원
            setReviews(savedSession.words.map((word: Word) => ({ word })));
            // cardRatings를 인덱스 기반으로 변환
            const indexRatings: Record<number, number> = {};
            savedSession.words.forEach((word: Word, idx: number) => {
              if (savedSession.ratings[word.id]) {
                indexRatings[idx] = savedSession.ratings[word.id];
              }
            });
            restoreSession(savedSession.currentIndex, indexRatings);
            setSessionRestored(true);

            // 진행률 데이터 로드
            const totalData = await wordsAPI.getWords({
              examCategory: examParam,
              level: levelParam,
              limit: 1,
            });
            const totalInLevel = totalData.pagination?.total || 0;
            setTotalWordsInLevel(totalInLevel);
            setLoading(false);
            return;
          }
        }

        // 2. 새로운 단어 로드 (기존 로직)
        // 병렬 호출로 성능 개선 (5-8초 → 1-2초)
        const [wordsData, totalData] = await Promise.all([
          // 학습할 단어 조회 (excludeLearned로 미학습 단어만, restart 모드가 아닌 경우)
          wordsAPI.getWords({
            examCategory: examParam,
            level: levelParam || undefined,
            limit: 20,
            page,
            excludeLearned: user && !isRestart ? true : undefined,
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
        const newWords = wordsWithContent.slice(0, 20);
        setReviews(newWords.map((word: Word) => ({ word })));
        setCurrentPage(page);

        // 3. 새 세션 저장 (로그인 사용자 + levelParam이 있는 경우)
        if (user && levelParam && newWords.length > 0) {
          resetSession();  // 기존 세션 초기화
          saveLearningSession({
            exam: examParam,
            level: levelParam,
            words: newWords,
            currentIndex: 0,
            ratings: {},
            timestamp: Date.now(),
          });
        }

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
            const randomWords = await wordsAPI.getRandomWords(20);
            setReviews(randomWords.words.map((word: Word) => ({ word })));
          } else {
            setReviews(data.reviews);
          }
        } catch (error) {
          // Fallback to random words if progress API fails
          console.error('Failed to load due reviews:', error);
          const randomWords = await wordsAPI.getRandomWords(20);
          setReviews(randomWords.words.map((word: Word) => ({ word })));
        }
      } else {
        // Guest users: Load random words directly
        const randomWords = await wordsAPI.getRandomWords(20);
        setReviews(randomWords.words.map((word: Word) => ({ word })));
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
      // Fallback to random words
      try {
        const randomWords = await wordsAPI.getRandomWords(20);
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

    // Record rating for this card (prevents duplicate counting)
    setCardRating(currentWordIndex, rating);

    // localStorage 세션 업데이트 (rating + index)
    if (user && examParam && levelParam) {
      const session = loadLearningSession(examParam, levelParam);
      if (session) {
        session.ratings[currentWord.id] = rating;
        session.currentIndex = currentWordIndex + 1;
        saveLearningSession(session);
      }
    }

    // Immediately advance to next word
    goToNextCard();

    // Check if we've finished all words
    if (currentWordIndex + 1 >= reviews.length) {
      setShowResult(true);
      clearLearningSession();  // 세션 완료 시 클리어
      // 비로그인 데모 사용자의 경우 체험 횟수 증가
      if (isDemo && !user && typeof window !== 'undefined') {
        const currentCount = parseInt(localStorage.getItem(DEMO_KEY) || '0', 10);
        localStorage.setItem(DEMO_KEY, String(currentCount + 1));
      }
      if (user && sessionId) {
        // Calculate final stats from cardRatings
        const finalWordsStudied = getWordsStudied();
        const finalWordsCorrect = getWordsCorrect();
        progressAPI.endSession({
          sessionId,
          wordsStudied: finalWordsStudied,
          wordsCorrect: finalWordsCorrect,
        }).catch(error => console.error('Failed to end session:', error));
      }
    }
  };

  const handlePrevious = () => {
    if (currentWordIndex > 0) {
      goToPrevCard();

      // localStorage 세션 인덱스 업데이트
      if (user && examParam && levelParam) {
        const session = loadLearningSession(examParam, levelParam);
        if (session) {
          session.currentIndex = currentWordIndex - 1;
          saveLearningSession(session);
        }
      }
    }
  };

  const handleNext = () => {
    // "다음" 버튼은 "알았음"(rating=4)으로 자동 처리 (이미 평가한 카드는 변경하지 않음)
    const currentWord = reviews[currentWordIndex]?.word;

    if (!currentWord) return;

    // Only record rating if this card hasn't been rated yet
    const alreadyRated = cardRatings[currentWordIndex] !== undefined;
    const defaultRating = 4; // 알았음 (KNOWN)

    if (!alreadyRated) {
      // Submit review with "알았음" rating for logged-in users
      if (user) {
        progressAPI.submitReview({
          wordId: currentWord.id,
          rating: defaultRating,
          learningMethod: 'FLASHCARD',
          sessionId: sessionId || undefined,
        }).catch(error => console.error('Failed to submit review:', error));
      }

      // Record as "알았음" (rating=4)
      setCardRating(currentWordIndex, defaultRating);
    }

    // localStorage 세션 업데이트 (rating + index)
    if (user && examParam && levelParam) {
      const session = loadLearningSession(examParam, levelParam);
      if (session) {
        if (!alreadyRated) {
          session.ratings[currentWord.id] = defaultRating;
        }
        session.currentIndex = currentWordIndex + 1;
        saveLearningSession(session);
      }
    }

    // Advance to next word
    goToNextCard();

    // Check if we've finished all words
    if (currentWordIndex + 1 >= reviews.length) {
      setShowResult(true);
      clearLearningSession();  // 세션 완료 시 클리어
      // 비로그인 데모 사용자의 경우 체험 횟수 증가
      if (isDemo && !user && typeof window !== 'undefined') {
        const currentCount = parseInt(localStorage.getItem(DEMO_KEY) || '0', 10);
        localStorage.setItem(DEMO_KEY, String(currentCount + 1));
      }
      if (user && sessionId) {
        // Calculate final stats from cardRatings
        const finalWordsStudied = getWordsStudied();
        const finalWordsCorrect = getWordsCorrect();
        progressAPI.endSession({
          sessionId,
          wordsStudied: finalWordsStudied,
          wordsCorrect: finalWordsCorrect,
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

  // 구독 제한으로 접근 차단
  if (accessBlocked && user) {
    const examName = examParam === 'TEPS' ? 'TEPS' : '수능';
    const levelName = levelParam === 'L2' ? '중급' : levelParam === 'L3' ? '고급' : levelParam;

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-4">
        <div className="bg-white rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-[#f5f5f5] p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-[22px] font-bold text-[#1c1c1e] mb-2">프리미엄 콘텐츠</h2>
          <p className="text-[14px] text-[#767676] mb-6 leading-relaxed">
            <strong>{examName} {levelName}</strong> 콘텐츠는<br />
            {examParam === 'TEPS' ? '프리미엄' : '베이직'} 플랜부터 이용 가능합니다.
          </p>
          <div className="space-y-3">
            <a
              href="/pricing"
              className="block w-full py-3.5 px-4 bg-gradient-to-r from-[#FF6B9D] to-[#A855F7] text-white font-bold text-[14px] rounded-[14px] hover:opacity-90 transition shadow-[0_4px_12px_rgba(255,107,157,0.3)]"
            >
              플랜 업그레이드
            </a>
            <button
              onClick={() => router.push('/dashboard')}
              className="block w-full py-3.5 px-4 border-2 border-[#E8E8E8] text-[#767676] font-semibold text-[14px] rounded-[14px] hover:bg-[#F8F9FA] transition"
            >
              대시보드로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 비로그인 사용자가 이미 체험을 완료한 경우 (2회 완료)
  if (demoBlocked && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-4">
        <div className="bg-white rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-[#f5f5f5] p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-[22px] font-bold text-[#1c1c1e] mb-2">체험이 완료되었습니다!</h2>
          <p className="text-[14px] text-[#767676] mb-6 leading-relaxed">
            2회 무료 체험을 모두 사용하셨습니다.<br />
            VocaVision AI의 모든 기능을 이용하려면<br />
            무료 회원가입을 해주세요.
          </p>
          <div className="space-y-3">
            <a
              href="/auth/register"
              className="block w-full py-3.5 px-4 bg-[#FF6B9D] text-white font-bold text-[14px] rounded-[14px] hover:bg-[#FF5288] transition shadow-[0_4px_12px_rgba(255,107,157,0.3)]"
            >
              무료 회원가입
            </a>
            <a
              href="/auth/login"
              className="block w-full py-3.5 px-4 border-2 border-[#E8E8E8] text-[#767676] font-semibold text-[14px] rounded-[14px] hover:bg-[#F8F9FA] transition"
            >
              이미 계정이 있으신가요? 로그인
            </a>
            <button
              onClick={() => router.push('/')}
              className="block w-full py-2 text-[#999999] text-[13px] hover:text-[#767676] transition"
            >
              메인으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-4">
        <EmptyFirstTime type="words" />
      </div>
    );
  }

  if (showResult) {
    // Calculate final stats from cardRatings
    const wordsStudied = getWordsStudied();
    const wordsCorrect = getWordsCorrect();
    // Check if there are more words to learn
    const hasMoreWords = totalWordsInLevel > 0 && (totalLearnedInLevel + wordsStudied) < totalWordsInLevel;

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-4">
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
  // Calculate accuracy from cardRatings (prevents duplicate counting issue)
  const wordsStudied = getWordsStudied();
  const wordsCorrect = getWordsCorrect();
  const accuracyPercent = wordsStudied > 0 ? Math.round((wordsCorrect / wordsStudied) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Demo Mode Banner for Guests */}
      {!user && (
        <div className="bg-[#FFF7ED] border-b border-[#FDBA74] sticky top-0 z-20">
          <div className="container mx-auto px-4 py-2">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-[13px]">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-[#F59E0B] text-white rounded-full font-bold text-[11px] shrink-0">체험</span>
                <span className="text-[#92400E] whitespace-nowrap">학습 기록이 저장되지 않습니다.</span>
              </div>
              <a href="/auth/login" className="text-[#78350F] font-semibold underline hover:text-[#92400E] whitespace-nowrap">
                로그인하고 기록 저장하기
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Header */}
      <div className="bg-white border-b border-[#f5f5f5] sticky top-0 z-10 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            {/* Back Button */}
            <button
              onClick={() => router.push(user ? '/dashboard' : '/')}
              className="flex items-center gap-1 text-[#767676] hover:text-[#1c1c1e] transition shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium text-[13px]">나가기</span>
            </button>

            {/* Center - Course Info (데모 모드에서는 숨김) */}
            <div className="text-center flex-1 min-w-0">
              {examParam && !isDemo && (
                <span className="text-[15px] font-bold text-[#1c1c1e]">
                  {examNames[examParam]} {levelParam && <span className="text-[#767676] font-normal">· {levelNames[levelParam] || levelParam}</span>}
                </span>
              )}
            </div>

            {/* Right - Stats (compact on mobile) */}
            <div className="flex items-center gap-1.5 shrink-0 bg-[#ECFDF5] px-3 py-1.5 rounded-full">
              <span className="text-[11px] text-[#059669] hidden sm:inline">정확도</span>
              <span className="text-[13px] font-bold text-[#10B981]">{accuracyPercent}%</span>
            </div>
          </div>

          {/* Progress Bar with Navigation */}
          <div className="mt-3">
            <div className="flex items-center gap-2">
              {/* Previous Button */}
              <button
                onClick={handlePrevious}
                disabled={currentWordIndex === 0}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-[10px] text-[13px] font-medium transition shrink-0 ${
                  currentWordIndex === 0
                    ? 'text-[#E8E8E8] cursor-not-allowed'
                    : 'text-[#767676] hover:text-[#1c1c1e] hover:bg-[#F8F9FA]'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">이전</span>
              </button>

              {/* Progress Bar */}
              <div className="flex-1">
                <div className="w-full bg-[#F8F9FA] rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-[#FF6B9D] to-[#A855F7] h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Next/Complete Button */}
              {currentWordIndex >= reviews.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-[10px] text-[13px] font-bold transition shrink-0 bg-[#FF6B9D] text-white hover:bg-[#FF5288] shadow-[0_2px_8px_rgba(255,107,157,0.3)]"
                >
                  <span>완료</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-[10px] text-[13px] font-medium transition shrink-0 text-[#767676] hover:text-[#1c1c1e] hover:bg-[#F8F9FA]"
                >
                  <span className="hidden sm:inline">다음</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}

              {/* Progress Count */}
              <span className="text-[13px] font-bold text-[#FF6B9D] shrink-0">{currentWordIndex + 1}/{reviews.length}</span>
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
        {/* Swipe Hint */}
        <div className="flex items-center justify-center gap-2 text-[#C8C8C8] text-[12px] mt-4">
          <span>←</span>
          <span>스와이프하여 넘기기</span>
          <span>→</span>
        </div>
      </div>
    </div>
  );
}
