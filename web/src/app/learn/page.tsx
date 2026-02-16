'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams, redirect } from 'next/navigation';
import { useAuthStore, useLearningStore, saveLearningSession, loadLearningSession, clearLearningSession } from '@/lib/store';
import { progressAPI, wordsAPI, learningAPI, bookmarkAPI, api } from '@/lib/api';
import { canAccessContent } from '@/lib/subscription';
import { useInvalidateDashboard } from '@/hooks/useQueries';
import { motion } from 'framer-motion';
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
  examCategory?: string;
  level?: string;
}

interface Review {
  word: Word;
}

// Exam name mapping
const examNames: Record<string, string> = {
  CSAT: '수능',
  CSAT_2026: '2026 수능 기출',
  SAT: 'SAT',
  TOEFL: 'TOEFL',
  TOEIC: 'TOEIC',
  TEPS: 'TEPS',
};

// Level name mapping - exam-specific
const getLevelName = (exam: string, level: string): string => {
  if (exam === 'CSAT_2026') {
    switch (level) {
      case 'LISTENING': return '듣기영역';
      case 'READING_2': return '독해 2점';
      case 'READING_3': return '독해 3점';
      default: return level;
    }
  }
  if (exam === 'EBS') {
    switch (level) {
      case 'LISTENING': return '듣기영역';
      case 'READING_BASIC': return '독해기본';
      case 'READING_ADV': return '독해실력';
      default: return level;
    }
  }
  if (exam === 'TEPS') {
    // TEPS는 L1, L2만 (L3 없음)
    return level === 'L1' ? 'L1(기본)' : 'L2(필수)';
  }
  // CSAT 및 기타
  switch (level) {
    case 'L1': return 'L1(기초)';
    case 'L2': return 'L2(중급)';
    case 'L3': return 'L3(고급)';
    default: return level;
  }
};

// 기존 호환용 (CSAT 기본값)
const levelNames: Record<string, string> = {
  L1: 'L1(기초)',
  L2: 'L2(중급)',
  L3: 'L3(고급)',
};

// Loading fallback component
function LearnPageLoading() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Skeleton Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="h-6 w-20 bg-gray-100 rounded-[10px] animate-pulse" />
            <div className="h-5 w-24 bg-gray-100 rounded-[10px] animate-pulse" />
            <div className="h-10 w-20 bg-gray-100 rounded-[10px] animate-pulse" />
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <div className="h-4 w-12 bg-gray-100 rounded-[8px] animate-pulse" />
              <div className="h-4 w-16 bg-gray-100 rounded-[8px] animate-pulse" />
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2" />
          </div>
        </div>
      </div>
      {/* Skeleton Card */}
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="h-12 w-48 bg-gray-100 rounded-[12px] animate-pulse mx-auto mb-4" />
          <div className="h-6 w-32 bg-gray-100 rounded-[10px] animate-pulse mx-auto mb-6" />
          <div className="h-24 w-full bg-gray-100 rounded-xl animate-pulse mb-6" />
          <div className="flex gap-3 justify-center">
            <div className="h-12 w-24 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-12 w-24 bg-gray-100 rounded-xl animate-pulse" />
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
  const isBookmarksMode = searchParams.get('mode') === 'bookmarks';
  const isRestart = searchParams.get('restart') === 'true';

  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  // 캐시 무효화 훅
  const invalidateDashboard = useInvalidateDashboard();

  // Demo 체험 횟수 관리 (localStorage) - 최대 5회 허용
  const DEMO_KEY = 'vocavision_demo_count';
  const MAX_DEMO_COUNT = 5;
  const [demoBlocked, setDemoBlocked] = useState(false);
  const [accessBlocked, setAccessBlocked] = useState(false);
  const [packageBlocked, setPackageBlocked] = useState(false);

  // 체험 횟수 확인
  useEffect(() => {
    if (isDemo && !user && typeof window !== 'undefined') {
      const count = parseInt(localStorage.getItem(DEMO_KEY) || '0', 10);
      if (count >= MAX_DEMO_COUNT) {
        setDemoBlocked(true);
      }
    }
  }, [isDemo, user]);

  // 구독 기반 접근 제어 및 단품 구매 체크
  useEffect(() => {
    if (!hasHydrated || isDemo) return;

    const checkAccess = async () => {
      if (user && examParam && levelParam) {
        // 단품 구매 상품: CSAT_2026, EBS (프리미엄 또는 구매 확인)
        const packageSlugMap: Record<string, string> = {
          'CSAT_2026': '2026-csat-analysis',
          'EBS': 'ebs-vocab',
        };
        const packageSlug = packageSlugMap[examParam];

        if (packageSlug) {
          try {
            const response = await api.get(`/packages/check-access?slug=${packageSlug}`);
            if (!response.data?.hasAccess) {
              setPackageBlocked(true);
            }
          } catch (error) {
            console.error('Package access check failed:', error);
            setPackageBlocked(true);
          }
          return;
        }

        // 기존 구독 기반 접근 제어 (CSAT, TEPS 등)
        if (!canAccessContent(user, examParam, levelParam)) {
          setAccessBlocked(true);
        }
      }
    };

    checkAccess();
  }, [hasHydrated, user, examParam, levelParam, isDemo]);

  // 시험/레벨 파라미터 없이 접근 시 대시보드로 리다이렉트 (복습/북마크 모드 제외)
  useEffect(() => {
    if (hasHydrated && !examParam && !isDemo && !isReviewMode && !isWeakMode && !isBookmarksMode) {
      router.replace(user ? '/dashboard' : '/');
    }
  }, [hasHydrated, examParam, isDemo, isReviewMode, isWeakMode, isBookmarksMode, user, router]);

  // Pull-to-Refresh 비활성화 (맨 위에서 아래로 당길 때만 방지)
  useEffect(() => {
    let startY = 0;
    let isAtTop = false;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].pageY;
      isAtTop = window.scrollY === 0;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].pageY;
      const isPullingDown = y > startY;

      // 맨 위에서 아래로 당기는 경우만 방지
      if (isAtTop && isPullingDown) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

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
  const [showSetComplete, setShowSetComplete] = useState(false);
  const [loadingNextSet, setLoadingNextSet] = useState(false);
  const [pendingNextSet, setPendingNextSet] = useState<{
    session: typeof serverSession;
    words: Word[];
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalWordsInLevel, setTotalWordsInLevel] = useState(0);
  const [totalLearnedInLevel, setTotalLearnedInLevel] = useState(0);

  // 서버측 학습 세션 상태
  const [serverSession, setServerSession] = useState<{
    id: string;
    totalWords: number;
    currentSet: number;
    currentIndex: number;
    totalSets: number;
    completedSets: number;
    totalReviewed: number;
    status: string;
  } | null>(null);

  // 낙관적 UI용 세트 번호 (API 응답 전에 미리 표시)
  const [optimisticCompletedSet, setOptimisticCompletedSet] = useState<number | null>(null);

  // startSession 중복 호출 방지 가드
  const isStartingSession = useRef(false);

  // handleSetComplete 이중 호출 방지 가드
  const isCompletingSet = useRef(false);

  // 🚀 배치 리뷰: Set 완료 시 일괄 전송 (개별 API 호출 방지)
  const pendingReviews = useRef<Array<{
    wordId: string;
    rating: number;
    learningMethod: string;
    examCategory?: string;
    level?: string;
  }>>([]);

  useEffect(() => {
    if (!hasHydrated) return;

    // 일반 학습 모드에서는 examParam이 있어야 진행 (searchParams 대기)
    // 복습/북마크 모드는 examParam 없이도 진행 가능
    if (!isDemo && !isReviewMode && !isWeakMode && !isBookmarksMode) {
      if (!examParam) {
        // searchParams가 아직 준비되지 않음 - 로딩 상태 유지
        return;
      }
    }

    // restart 모드이거나 데모/복습/북마크 모드면 세션 초기화
    if (isRestart || isDemo || isReviewMode || isWeakMode || isBookmarksMode) {
      resetSession();
      clearLearningSession();
    }

    setShowResult(false);
    setLoading(true);

    // Guest users can also learn - don't redirect to login
    loadReviews();

    // 🚀 통계 세션은 첫 답변 시 지연 시작 (서버 부하 감소)
    // startSession()은 handleAnswer에서 lazy하게 호출

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
    if (isStartingSession.current) return; // 가드: 이미 시작 중이면 skip
    isStartingSession.current = true;
    try {
      const session = await progressAPI.startSession();
      setSessionId(session.session.id);
    } catch (error) {
      console.error('Failed to start session:', error);
    } finally {
      isStartingSession.current = false;
    }
  };

  // 🚀 배치 리뷰 일괄 전송
  const flushPendingReviews = async () => {
    if (pendingReviews.current.length === 0 || !user) return;

    const reviewsToSend = [...pendingReviews.current];
    pendingReviews.current = []; // 즉시 비우기 (중복 전송 방지)

    try {
      await progressAPI.submitReviewBatch({
        reviews: reviewsToSend,
        sessionId: sessionId || undefined,
      });
    } catch (error) {
      console.error('Batch review failed, retrying once:', error);
      // 1초 대기 후 재시도 (P2002 레이스 컨디션 해소 시간)
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        await progressAPI.submitReviewBatch({
          reviews: reviewsToSend,
          sessionId: sessionId || undefined,
        });
      } catch (retryError) {
        console.error('Batch review retry also failed:', retryError);
        // 포기 — 다음 세트에서 다시 시도됨
      }
    }
  };

  const loadReviews = async (page = 1) => {
    try {
      // 복습 모드: 복습할 단어 로드 (exam/level 필터 적용)
      if (isReviewMode && user) {
        const data = await progressAPI.getDueReviews({
          examCategory: examParam || undefined,
          level: levelParam || undefined,
        });
        if (data.count === 0) {
          setReviews([]);
        } else {
          setReviews(data.reviews);
        }
        setTotalWordsInLevel(data.count || 0);
      // 북마크 모드: 북마크된 단어 로드
      } else if (isBookmarksMode && user) {
        const data = await bookmarkAPI.getBookmarks();
        const bookmarks = data.bookmarks || [];
        if (bookmarks.length === 0) {
          setReviews([]);
        } else {
          setReviews(bookmarks.map((b: { word: Word }) => ({ word: b.word })));
        }
        setTotalWordsInLevel(bookmarks.length);
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
      } else if (examParam && levelParam && user) {
        // ====== 서버측 학습 세션 사용 (로그인 + exam + level) ======
        try {
          // restart 모드면 새 세션 시작, 아니면 기존 세션 조회/생성
          const sessionData = await learningAPI.startSession({
            exam: examParam,
            level: levelParam,
            restart: isRestart,
          });

          if (sessionData.session) {
            setServerSession(sessionData.session);
            setTotalWordsInLevel(sessionData.session.totalWords);
            setTotalLearnedInLevel(sessionData.session.totalReviewed);

            // 서버에서 받은 단어들 사용
            const words = sessionData.words || [];

            if (words.length > 0) {
              setReviews(words.map((word: Word) => ({ word })));

              // 서버 인덱스가 항상 source of truth (localStorage보다 우선)
              const serverIndex = sessionData.session.currentIndex;
              const savedSession = loadLearningSession(examParam, levelParam);

              // 기존 세션이면 복원 (serverIndex가 0이어도 Set 중간에서 재개하는 경우)
              // 현재 세트 단어 ID만 매칭되는 ratings 복원 (이전 세트 잔존 데이터 필터링)
              const currentWordIds = new Set(words.map((w: Word) => w.id));
              let filteredRatings: Record<string, number> = {};
              if (sessionData.isExisting && savedSession?.ratings) {
                for (const [key, value] of Object.entries(savedSession.ratings)) {
                  if (currentWordIds.has(key)) {
                    filteredRatings[key] = value as number;
                  }
                }
              }

              if (sessionData.isExisting) {
                restoreSession(serverIndex, filteredRatings);
                setSessionRestored(true);
              } else {
                // 완전히 새 세션이면 리셋
                resetSession();
                setCurrentIndex(0);
              }

              // localStorage 세션도 서버 값으로 동기화
              saveLearningSession({
                exam: examParam,
                level: levelParam,
                words,
                currentIndex: serverIndex,
                ratings: sessionData.isExisting ? filteredRatings : {},
                timestamp: Date.now(),
              });
            } else {
              // 세션은 있지만 단어가 없으면 fallback
              console.warn('Server session returned empty words, falling back to local');
              await loadReviewsFallback(page);
            }
          } else {
            // 세션 생성 실패 → fallback
            console.warn('Server session returned null, falling back to local');
            await loadReviewsFallback(page);
          }
        } catch (sessionError) {
          console.error('Server session failed, falling back to local:', sessionError);
          // 서버 세션 실패시 기존 로직으로 폴백
          await loadReviewsFallback(page);
        }
      } else if (examParam) {
        // 비로그인 또는 레벨 없는 경우 기존 로직
        await loadReviewsFallback(page);
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

  // 폴백 로직 (서버 세션 없이 로컬 방식)
  const loadReviewsFallback = async (page = 1) => {
    if (!examParam) return;

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
        return;
      }
    }

    // 2. 새로운 단어 로드 (기존 로직)
    const [wordsData, totalData] = await Promise.all([
      wordsAPI.getWords({
        examCategory: examParam,
        level: levelParam || undefined,
        limit: 20,
        page,
        excludeLearned: user && !isRestart ? true : undefined,
        shuffle: true,
      }),
      user ? wordsAPI.getWords({
        examCategory: examParam,
        level: levelParam || undefined,
        limit: 1,
      }) : Promise.resolve(null),
    ]);

    const words = wordsData.words || wordsData.data || [];
    const wordsWithContent = words.filter((word: any) =>
      (word.definition && word.definition.trim() !== '') ||
      (word.definitionKo && word.definitionKo.trim() !== '')
    );
    const newWords = wordsWithContent.slice(0, 20);
    setReviews(newWords.map((word: Word) => ({ word })));
    setCurrentPage(page);

    // 3. 새 세션 저장 (로그인 사용자 + levelParam이 있는 경우)
    if (user && levelParam && newWords.length > 0) {
      resetSession();
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
  };

  const handleAnswer = (correct: boolean, rating: number) => {
    const currentWord = reviews[currentWordIndex]?.word;

    if (!currentWord) return;

    // 🚀 통계 세션이 없으면 첫 답변 시 지연 시작 (서버 부하 감소)
    if (user && !sessionId) {
      startSession();
    }

    // 🚀 배치 리뷰: 개별 전송 대신 배열에 축적 (Set 완료 시 일괄 전송)
    if (user) {
      pendingReviews.current.push({
        wordId: currentWord.id,
        rating,
        learningMethod: 'FLASHCARD',
        examCategory: examParam || currentWord.examCategory || undefined,
        level: levelParam || currentWord.level || undefined,
      });
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

    // Check if we've finished all words in current set
    if (currentWordIndex + 1 >= reviews.length) {
      handleSetComplete();
    }
  };

  // 세트 완료 처리 (handleAnswer, handleNext에서 공통 사용)
  const handleSetComplete = async () => {
    // 이중 호출 방지 가드 (handleAnswer + handleNext 동시 호출 방지)
    if (isCompletingSet.current) return;
    isCompletingSet.current = true;

    // 서버 세션이 있으면 세트 완료 처리
    if (serverSession && user && examParam && levelParam) {
      // 🔑 낙관적 UI: 현재 completedSets + 1로 먼저 설정
      const completedSetNumber = (serverSession.completedSets || 0) + 1;
      const isLastSet = completedSetNumber >= (serverSession.totalSets || 1);
      setOptimisticCompletedSet(completedSetNumber);

      // ============================
      // 마지막 세트: 모든 API 완료 후 결과 화면
      // ============================
      if (isLastSet) {
        // 로딩 표시 (빈 화면 방지)
        setLoadingNextSet(true);

        // 1. 배치 리뷰 전송 완료 대기
        await flushPendingReviews();

        // 2. 세션 완료 처리 완료 대기 (COMPLETED + 서버 캐시 무효화)
        try {
          const result = await learningAPI.updateSessionProgress({
            sessionId: serverSession.id,
            completedSet: true,
          });

          if (result.session) {
            setServerSession(result.session);
            setOptimisticCompletedSet(result.session.completedSets);
          }
        } catch (error) {
          console.error('Failed to complete session:', error);
        }

        // 3. 클라이언트 캐시 무효화
        invalidateDashboard(examParam, levelParam || undefined);

        // 4. 결과 화면 전환
        setLoadingNextSet(false);
        setShowSetComplete(false);
        setShowResult(true);
        clearLearningSession();
        return;
      }

      // ============================
      // 중간 세트: 기존 로직 유지 (fire-and-forget OK)
      // ============================
      setLoadingNextSet(true);
      setShowSetComplete(true);

      // 배치 리뷰 일괄 전송 (세션 업데이트 전에 완료 보장)
      await flushPendingReviews();

      // 백그라운드에서 API 호출 (응답 기다리지 않음 — 사용자가 세트 완료 화면 읽는 동안 완료)
      learningAPI.updateSessionProgress({
        sessionId: serverSession.id,
        completedSet: true,
      }).then((result) => {
        if (result.isCompleted) {
          // 예상 밖 전체 학습 완료 (totalSets 계산 오차 등)
          if (result.session) {
            setServerSession(result.session);
            setOptimisticCompletedSet(result.session.completedSets);
          }
          setShowSetComplete(false);
          setShowResult(true);
          clearLearningSession();
          invalidateDashboard(examParam, levelParam || undefined);
          return;
        }

        // Set 완료 (중간 Set) - 세션 및 다음 Set 데이터 업데이트
        invalidateDashboard(examParam, levelParam || undefined);

        if (result.session) {
          setServerSession(result.session);
          setOptimisticCompletedSet(result.session.completedSets);
        }

        if (result.words && result.words.length > 0) {
          setPendingNextSet({
            session: result.session,
            words: result.words,
          });
        }
        setLoadingNextSet(false);
      }).catch((error) => {
        console.error('Failed to update server session:', error);
        setLoadingNextSet(false);
      });

      return;
    }

    // 🚀 배치 리뷰 일괄 전송 (비-서버세션 경로)
    await flushPendingReviews();

    // serverSession이 없어도 중간 세트 완료인지 확인
    const hasMoreToLearn = totalWordsInLevel > 0 &&
      (totalLearnedInLevel + getWordsStudied()) < totalWordsInLevel;

    if (user && examParam && levelParam && hasMoreToLearn) {
      // 아직 학습할 단어가 남았으면 세트 완료 화면 표시
      setShowSetComplete(true);
    } else {
      // 전체 완료 또는 비로그인 → 결과 화면 표시
      setShowResult(true);
    }
    clearLearningSession();  // 세션 완료 시 클리어
    // 대시보드 캐시 무효화 (학습 완료 후 데이터 갱신)
    invalidateDashboard(examParam, levelParam || undefined);
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
  };

  // 다음 Set으로 이동
  const handleContinueToNextSet = () => {
    isCompletingSet.current = false; // 다음 세트 시작 시 가드 리셋
    if (pendingNextSet && examParam && levelParam) {
      // 먼저 인덱스를 0으로 리셋 (새 Set 시작)
      setCurrentIndex(0);
      resetSession();

      // 그 다음 새 데이터 설정
      setServerSession(pendingNextSet.session);
      setReviews(pendingNextSet.words.map((word: Word) => ({ word })));
      setTotalLearnedInLevel(pendingNextSet.session?.totalReviewed || 0);

      // localStorage도 업데이트
      saveLearningSession({
        exam: examParam,
        level: levelParam,
        words: pendingNextSet.words,
        currentIndex: 0,
        ratings: {},
        timestamp: Date.now(),
      });

      setPendingNextSet(null);
      setShowSetComplete(false);
      setOptimisticCompletedSet(null); // 다음 Set 시작 시 리셋
    }
  };

  // 🚀 API 실패 시 다음 Set 재시도 (pendingNextSet이 없을 때)
  const handleRetryNextSet = async () => {
    isCompletingSet.current = false; // 가드 리셋
    if (!serverSession || !examParam || !levelParam) return;

    setLoadingNextSet(true);
    const nextSetNumber = (optimisticCompletedSet ?? serverSession.completedSets ?? 0) + 1;

    try {
      // getSessionSet으로 다음 Set 단어 직접 조회
      const result = await learningAPI.getSessionSet(serverSession.id, nextSetNumber);

      if (result.words && result.words.length > 0) {
        // 성공 — 다음 Set 데이터로 전환
        setCurrentIndex(0);
        resetSession();
        if (result.session) setServerSession(result.session);
        setReviews(result.words.map((word: Word) => ({ word })));
        setTotalLearnedInLevel(result.session?.totalReviewed || totalLearnedInLevel);

        saveLearningSession({
          exam: examParam,
          level: levelParam,
          words: result.words,
          currentIndex: 0,
          ratings: {},
          timestamp: Date.now(),
        });

        setPendingNextSet(null);
        setShowSetComplete(false);
        setOptimisticCompletedSet(null);
      } else {
        // 단어가 없으면 학습 완료
        setShowSetComplete(false);
        setShowResult(true);
      }
    } catch (error) {
      console.error('Retry failed, reloading:', error);
      // 재시도도 실패하면 페이지 새로고침
      window.location.reload();
    } finally {
      setLoadingNextSet(false);
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
      // 🚀 배치 리뷰: 개별 전송 대신 배열에 축적
      if (user) {
        pendingReviews.current.push({
          wordId: currentWord.id,
          rating: defaultRating,
          learningMethod: 'FLASHCARD',
          examCategory: examParam || currentWord.examCategory || undefined,
          level: levelParam || currentWord.level || undefined,
        });
      }

      // Record as "알았음" (rating=4)
      setCardRating(currentWordIndex, defaultRating);
    }

    // Check if we've finished all words in current set (BEFORE advancing)
    const isLastCard = currentWordIndex + 1 >= reviews.length;

    // localStorage 세션 업데이트 (rating + index)
    if (user && examParam && levelParam) {
      const session = loadLearningSession(examParam, levelParam);
      if (session) {
        if (!alreadyRated) {
          session.ratings[currentWord.id] = defaultRating;
        }
        session.currentIndex = isLastCard ? 0 : currentWordIndex + 1;
        saveLearningSession(session);
      }
    }

    // 마지막 카드면 Set 완료 처리 (goToNextCard 전에!)
    if (isLastCard) {
      handleSetComplete();
      return; // Set 완료 화면으로 전환, goToNextCard 호출 안 함
    }

    // Advance to next word (마지막이 아닐 때만)
    goToNextCard();
  };

  // 전체 완료 후 홈으로: 상태 정리 + 대시보드 이동
  // 세션은 이미 handleSetComplete에서 COMPLETED 처리됨 → restart 불필요
  // (restart 호출이 race condition 원인: COMPLETED 전에 실행되면 세션 ABANDONED 처리)
  const handleCompleteAndGoHome = async () => {
    // 1. 대시보드 캐시 무효화 (handleSetComplete에서 이미 했지만 안전장치)
    if (examParam) {
      invalidateDashboard(examParam, levelParam || undefined);
    }

    // 2. 로컬 상태 정리
    resetSession();
    clearLearningSession();

    // 3. 대시보드로 이동
    router.push('/dashboard');
  };

  const handleRestart = async () => {
    isCompletingSet.current = false; // 가드 리셋
    resetSession();
    setShowResult(false);
    setServerSession(null);

    // 서버 세션 재시작
    if (user && examParam && levelParam) {
      setLoading(true);
      try {
        const sessionData = await learningAPI.startSession({
          exam: examParam,
          level: levelParam,
          restart: true,  // 새 세션 시작
        });

        if (sessionData.session) {
          setServerSession(sessionData.session);
          setTotalWordsInLevel(sessionData.session.totalWords);
          setTotalLearnedInLevel(0);

          const words = sessionData.words || [];
          setReviews(words.map((word: Word) => ({ word })));

          saveLearningSession({
            exam: examParam,
            level: levelParam,
            words,
            currentIndex: 0,
            ratings: {},
            timestamp: Date.now(),
          });
        }
        setLoading(false);
        // 🚀 통계 세션은 handleAnswer에서 lazy 시작
        return;
      } catch (error) {
        console.error('Failed to restart server session:', error);
        setLoading(false);
      }
    }

    // 폴백
    loadReviews();
    // 🚀 통계 세션은 handleAnswer에서 lazy 시작
  };

  const handleNextBatch = async () => {
    isCompletingSet.current = false; // 가드 리셋
    // 서버 세션이 있으면 다음 세트 로드 (이미 handleSetComplete에서 처리됨)
    // 이 함수는 서버 세션 없이 기존 방식으로 사용하는 경우만 처리
    if (!serverSession) {
      resetSession();
      setShowResult(false);
      setLoading(true);
      loadReviews(currentPage + 1);
      // 🚀 통계 세션은 handleAnswer에서 lazy 시작
    }
  };

  // 모드에 따른 나가기 경로
  const exitPath = (isReviewMode || isBookmarksMode) ? '/review' : (user ? '/dashboard' : '/');

  // 나가기 버튼 핸들러 - 현재 진행 위치를 서버에 저장
  const handleExit = async () => {
    // 🚀 나가기 전에 미전송 리뷰 일괄 전송
    await flushPendingReviews();

    // 서버 세션이 있으면 현재 위치 저장
    if (serverSession && user) {
      try {
        await learningAPI.updateSessionProgress({
          sessionId: serverSession.id,
          currentIndex: currentWordIndex,
        });
      } catch (error) {
        console.error('Failed to save progress on exit:', error);
      }
    }
    // 대시보드 캐시 무효화 (학습 데이터 갱신)
    invalidateDashboard(examParam, levelParam || undefined);
    router.push(exitPath);
  };

  // beforeunload 이벤트 - 페이지 떠날 때 진행 위치 + 미전송 리뷰 저장
  useEffect(() => {
    if (!user) return;

    const saveProgressBeforeUnload = () => {
      const token = localStorage.getItem('authToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

      // 🚀 미전송 리뷰가 있으면 sendBeacon으로 배치 전송
      if (token && pendingReviews.current.length > 0) {
        const blob = new Blob([JSON.stringify({
          reviews: pendingReviews.current,
          sessionId: sessionId || undefined,
          token,
        })], { type: 'application/json' });
        navigator.sendBeacon(`${apiUrl}/progress/review/batch-beacon`, blob);
        pendingReviews.current = [];
      }

      // sendBeacon으로 진행 위치 저장 (기존 로직)
      if (token && serverSession) {
        navigator.sendBeacon(
          `${apiUrl}/learning/session/progress-beacon`,
          JSON.stringify({
            sessionId: serverSession.id,
            currentIndex: currentWordIndex,
            token,
          })
        );
      }
    };

    window.addEventListener('beforeunload', saveProgressBeforeUnload);
    return () => window.removeEventListener('beforeunload', saveProgressBeforeUnload);
  }, [serverSession, user, currentWordIndex, sessionId]);

  // 서버 세션이 업데이트될 때 currentWordIndex 동기화 (Set 전환 등)
  useEffect(() => {
    if (serverSession && !loading && reviews.length > 0) {
      const serverIndex = serverSession.currentIndex;
      // 서버 인덱스와 로컬 인덱스가 다르면 서버 값으로 동기화
      if (currentWordIndex !== serverIndex && currentWordIndex >= reviews.length) {
        setCurrentIndex(serverIndex);
      }
    }
  }, [serverSession?.id, serverSession?.currentSet, loading, reviews.length]);

  if (!hasHydrated || loading) {
    return <LearnPageLoading />;
  }

  // 단품 구매 필요 (CSAT_2026, EBS 등)
  if (packageBlocked && user) {
    const levelName = examParam && levelParam ? getLevelName(examParam, levelParam) : levelParam;
    const packageInfo: Record<string, { name: string; slug: string }> = {
      'CSAT_2026': { name: '2026 수능기출완전분석', slug: '2026-csat-analysis' },
      'EBS': { name: 'EBS 연계 어휘', slug: 'ebs-vocab' },
    };
    const pkg = packageInfo[examParam || ''] || { name: examParam, slug: '' };

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-[22px] font-bold text-[#1c1c1e] mb-2">단품 구매가 필요합니다</h2>
          <p className="text-[14px] text-gray-500 mb-6 leading-relaxed">
            <strong>{pkg.name} {levelName}</strong> 콘텐츠는<br />
            단품 구매 후 이용 가능합니다.
          </p>
          <div className="space-y-3">
            <a
              href={`/packages/${pkg.slug}`}
              className="block w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-[14px] rounded-xl hover:opacity-90 transition shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
            >
              상품 보기
            </a>
            <button
              onClick={() => {
                invalidateDashboard(examParam, levelParam || undefined);
                router.push(exitPath);
              }}
              className="block w-full py-3.5 px-4 border-2 border-[#E8E8E8] text-gray-500 font-semibold text-[14px] rounded-xl hover:bg-gray-100 transition"
            >
              대시보드로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 구독 제한으로 접근 차단
  if (accessBlocked && user) {
    const examNameMap: Record<string, string> = { 'CSAT': '수능', 'TEPS': 'TEPS', 'EBS': 'EBS 연계', 'CSAT_2026': '2026 기출' };
    const examName = examNameMap[examParam || ''] || '수능';
    const levelName = examParam && levelParam ? getLevelName(examParam, levelParam) : levelParam;

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-[22px] font-bold text-[#1c1c1e] mb-2">프리미엄 콘텐츠</h2>
          <p className="text-[14px] text-gray-500 mb-6 leading-relaxed">
            <strong>{examName} {levelName}</strong> 콘텐츠는<br />
            {examParam === 'TEPS' ? '프리미엄' : '베이직'} 플랜부터 이용 가능합니다.
          </p>
          <div className="space-y-3">
            <a
              href="/pricing"
              className="block w-full py-3.5 px-4 bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white font-bold text-[14px] rounded-xl hover:opacity-90 transition shadow-[0_4px_12px_rgba(20,184,166,0.3)]"
            >
              플랜 업그레이드
            </a>
            <button
              onClick={() => {
                invalidateDashboard(examParam, levelParam || undefined);
                router.push(exitPath);
              }}
              className="block w-full py-3.5 px-4 border-2 border-[#E8E8E8] text-gray-500 font-semibold text-[14px] rounded-xl hover:bg-gray-100 transition"
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-[22px] font-bold text-[#1c1c1e] mb-2">체험이 완료되었습니다!</h2>
          <p className="text-[14px] text-gray-500 mb-6 leading-relaxed">
            5회 무료 체험을 모두 사용하셨습니다.<br />
            VocaVision AI의 모든 기능을 이용하려면<br />
            무료 회원가입을 해주세요.
          </p>
          <div className="space-y-3">
            <a
              href="/auth/register"
              className="block w-full py-3.5 px-4 bg-[#14B8A6] text-white font-bold text-[14px] rounded-xl hover:bg-[#0D9488] transition shadow-[0_4px_12px_rgba(20,184,166,0.3)]"
            >
              무료 회원가입
            </a>
            <a
              href="/auth/login"
              className="block w-full py-3.5 px-4 border-2 border-[#E8E8E8] text-gray-500 font-semibold text-[14px] rounded-xl hover:bg-gray-100 transition"
            >
              이미 계정이 있으신가요? 로그인
            </a>
            <button
              onClick={() => router.push('/')}
              className="block w-full py-2 text-[#999999] text-[13px] hover:text-gray-500 transition"
            >
              메인으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    // 로그인 사용자 + exam/level 설정된 경우: 빈 상태는 일시적 오류일 가능성 높음
    if (user && examParam && levelParam) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-4">
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 max-w-md mx-auto">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">단어를 불러오지 못했어요</h3>
            <p className="text-gray-500 mb-6 text-sm">네트워크 상태를 확인하고 다시 시도해주세요.</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setLoading(true);
                  loadReviews();
                }}
                className="w-full bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white px-6 py-3 rounded-xl font-bold"
              >
                다시 시도
              </button>
              <button
                onClick={() => router.push(exitPath)}
                className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium"
              >
                돌아가기
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-4">
        <EmptyFirstTime type="words" />
      </div>
    );
  }

  // Set 완료 화면 표시 (pendingNextSet 유무와 상관없이 일관되게 표시)
  if (showSetComplete) {
    // reviews.length가 현재 세트의 실제 단어 수 (cardRatings 오염과 무관)
    const wordsStudied = reviews.length;
    const wordsCorrect = getWordsCorrect();
    const percentage = wordsStudied > 0 ? Math.round((wordsCorrect / wordsStudied) * 100) : 0;

    // 🔑 낙관적 UI: optimisticCompletedSet 우선, 그 다음 serverSession, 마지막 fallback 1
    const completedSet = optimisticCompletedSet ?? serverSession?.completedSets ?? 1;
    const totalSets = serverSession?.totalSets ?? (totalWordsInLevel > 0 ? Math.ceil(totalWordsInLevel / 20) : 1);
    // 마지막 세트 완료 시 낙관적으로 전체 완료 처리
    const totalReviewed = (completedSet >= totalSets)
      ? totalWordsInLevel
      : (serverSession?.totalReviewed ?? (totalLearnedInLevel + reviews.length));
    // 🚀 API 실패와 무관하게 Set 번호 기반으로 다음 Set 존재 여부 추론
    // Set 4/77이면 Set 5가 있다는 건 확실 → pendingNextSet 없어도 "Set 5 시작하기" 표시
    const hasNextSet = serverSession
      ? (completedSet < totalSets)
      : (totalWordsInLevel > 0 && (totalLearnedInLevel + wordsStudied) < totalWordsInLevel);

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-8 text-center border border-gray-200 max-w-md mx-auto shadow-lg"
        >
          {/* 축하 이모지 */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="text-7xl mb-4"
          >
            {percentage === 100 ? '🏆' : percentage >= 80 ? '🎉' : '💪'}
          </motion.div>

          {/* Set 완료 메시지 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Set {completedSet} 완료!
            </h3>
            <p className="text-gray-600 mb-4">
              {wordsStudied}단어 학습 · 정확도 {percentage}%
            </p>
          </motion.div>

          {/* 진행 상황 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-[#F0FDF4] rounded-xl p-4 mb-6"
          >
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">전체 진행</span>
              <span className="font-bold text-[#10B981]">
                Set {completedSet}/{totalSets}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(completedSet / totalSets) * 100}%` }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] h-3 rounded-full"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              총 {totalReviewed}단어 학습 완료
            </p>
          </motion.div>

          {/* 액션 버튼 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col gap-3"
          >
            {loadingNextSet ? (
              <button
                disabled
                className="w-full bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white px-6 py-4 rounded-xl font-bold opacity-70 cursor-wait"
              >
                <span className="inline-flex items-center gap-2">
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  다음 Set 준비 중...
                </span>
              </button>
            ) : hasNextSet ? (
              <button
                onClick={serverSession ? (pendingNextSet ? handleContinueToNextSet : handleRetryNextSet) : handleNextBatch}
                className="w-full bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] hover:opacity-90 text-white px-6 py-4 rounded-xl font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-lg shadow-[#14B8A6]/25"
              >
                {serverSession
                  ? `Set ${completedSet + 1} 시작하기 →`
                  : `다음 ${Math.min(20, totalWordsInLevel - totalLearnedInLevel - wordsStudied)}개 학습 →`
                }
              </button>
            ) : (
              <button
                onClick={() => {
                  setShowSetComplete(false);
                  setShowResult(true);
                }}
                className="w-full bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] hover:opacity-90 text-white px-6 py-4 rounded-xl font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-lg shadow-[#14B8A6]/25"
              >
                학습 결과 보기
              </button>
            )}

            <button
              onClick={() => {
                invalidateDashboard(examParam, levelParam || undefined);
                router.push(exitPath);
              }}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium transition-all duration-200 active:scale-95"
            >
              나중에 계속하기
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (showResult) {
    // reviews.length가 현재 세트의 실제 단어 수 (cardRatings 오염과 무관)
    const wordsStudied = reviews.length;
    const wordsCorrect = getWordsCorrect();

    // 서버 세션인 경우 전체 학습 완료 여부 확인
    const isSessionCompleted = serverSession?.status === 'COMPLETED';

    // 마지막 세트 완료(전체 완료)면 더 이상 학습할 단어 없음
    const allCompleted = isSessionCompleted ||
      (optimisticCompletedSet && serverSession &&
       optimisticCompletedSet >= (serverSession.totalSets || 1));
    const hasMoreWords = !allCompleted &&
      totalWordsInLevel > 0 &&
      (totalLearnedInLevel + reviews.length) < totalWordsInLevel;

    // 전체 진행률 계산 (서버 세션 기준)
    const totalLearned = isSessionCompleted
      ? totalWordsInLevel
      : (serverSession
        ? Math.max(serverSession.totalReviewed, totalLearnedInLevel + reviews.length)
        : totalLearnedInLevel + reviews.length);

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-4">
        <CelebrateCompletion
          score={wordsCorrect}
          total={reviews.length}
          onRetry={allCompleted ? undefined : handleRestart}
          onHome={allCompleted ? handleCompleteAndGoHome : () => router.push(exitPath)}
          onNext={user && hasMoreWords && examParam && !serverSession ? handleNextBatch : undefined}
          isGuest={!user}
          isAllCompleted={!!allCompleted}
          totalProgress={user && totalWordsInLevel > 0 ? {
            learned: allCompleted ? totalWordsInLevel : totalLearned,
            total: totalWordsInLevel,
          } : undefined}
        />
      </div>
    );
  }

  // 안전한 인덱스 계산 (범위를 벗어나면 0으로)
  const safeIndex = reviews.length > 0
    ? Math.min(currentWordIndex, reviews.length - 1)
    : 0;
  const currentWord = reviews[safeIndex]?.word;

  // currentWord가 없으면 로딩 화면 표시 (빈 화면 방지)
  if (!currentWord) {
    return <LearnPageLoading />;
  }

  const progressPercent = ((safeIndex + 1) / reviews.length) * 100;
  // Calculate accuracy from cardRatings (prevents duplicate counting issue)
  const wordsStudied = getWordsStudied();
  const wordsCorrect = getWordsCorrect();
  const accuracyPercent = wordsStudied > 0 ? Math.round((wordsCorrect / wordsStudied) * 100) : 0;

  return (
    <div className="no-pull-refresh min-h-screen bg-[#FAFAFA] flex flex-col">
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
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            {/* Back Button */}
            <button
              onClick={handleExit}
              className="flex items-center gap-1 text-gray-500 hover:text-[#1c1c1e] transition shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium text-[13px]">나가기</span>
            </button>

            {/* Center - Course Info + Set Info */}
            <div className="text-center flex-1 min-w-0">
              {isBookmarksMode ? (
                <span className="text-[15px] font-bold text-[#1c1c1e]">
                  북마크 <span className="text-gray-500 font-normal">· 플래시카드</span>
                </span>
              ) : isReviewMode ? (
                <span className="text-[15px] font-bold text-[#1c1c1e]">
                  복습 <span className="text-gray-500 font-normal">· 플래시카드</span>
                </span>
              ) : examParam && !isDemo && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                  <span className="text-[15px] font-bold text-[#1c1c1e]">
                    {examNames[examParam]} {levelParam && <span className="text-gray-500 font-normal">· {getLevelName(examParam, levelParam)}</span>}
                  </span>
                  {/* Set 정보 표시 (복습 모드에서는 숨김) */}
                  {serverSession && serverSession.totalSets > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[12px] font-medium">
                      Set {serverSession.currentSet + 1}/{serverSession.totalSets}
                    </span>
                  )}
                </div>
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
                    : 'text-gray-500 hover:text-[#1c1c1e] hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">이전</span>
              </button>

              {/* Progress Bar */}
              <div className="flex-1">
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Next Button (마지막 카드에서도 동일) */}
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-2 py-1.5 rounded-[10px] text-[13px] font-medium transition shrink-0 text-gray-500 hover:text-[#1c1c1e] hover:bg-gray-100"
              >
                <span className="hidden sm:inline">다음</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Progress Count + Set Info (모바일) - 복습 모드에서는 Set 숨김 */}
              <div className="flex items-center gap-2 shrink-0">
                {!isReviewMode && serverSession && serverSession.totalSets > 0 && (
                  <span className="sm:hidden text-[12px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    Set {serverSession.currentSet + 1}
                  </span>
                )}
                <span className="text-[13px] font-bold text-[#14B8A6]">{safeIndex + 1}/{reviews.length}</span>
              </div>
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
          onNext={handleNext}
          hasPrevious={currentWordIndex > 0}
          hasNext={currentWordIndex < reviews.length - 1}
          hasExistingProgress={cardRatings[currentWordIndex] !== undefined}
          isReviewMode={isReviewMode || isBookmarksMode}
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
