'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams, redirect } from 'next/navigation';
import { useAuthStore, useLearningStore, saveLearningSession, loadLearningSession, clearLearningSession } from '@/lib/store';
import { progressAPI, wordsAPI, learningAPI, api } from '@/lib/api';
import { canAccessContent } from '@/lib/subscription';
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

// Level name mapping - exam-specific
const getLevelName = (exam: string, level: string): string => {
  if (exam === 'TEPS') {
    return level === 'L1' ? '기본' : '필수';
  }
  // CSAT 및 기타
  switch (level) {
    case 'L1': return '초급';
    case 'L2': return '중급';
    case 'L3': return '고급';
    default: return level;
  }
};

// 기존 호환용 (CSAT 기본값)
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
  const [showSetComplete, setShowSetComplete] = useState(false);
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
            setReviews(words.map((word: Word) => ({ word })));

            // localStorage에 저장된 더 진행된 인덱스 확인
            const savedSession = loadLearningSession(examParam, levelParam);
            const serverIndex = sessionData.session.currentIndex;
            const localIndex = savedSession?.currentIndex || 0;

            // 더 진행된 인덱스 사용 (같은 exam/level인 경우)
            const restoreIndex = Math.max(serverIndex, localIndex);

            // 기존 세션이면 인덱스 복원
            if (sessionData.isExisting && restoreIndex > 0) {
              restoreSession(restoreIndex, savedSession?.ratings || {});
              setSessionRestored(true);
            }

            // localStorage 세션도 동기화 (폴백용)
            saveLearningSession({
              exam: examParam,
              level: levelParam,
              words,
              currentIndex: restoreIndex,
              ratings: savedSession?.ratings || {},
              timestamp: Date.now(),
            });
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

    // Check if we've finished all words in current set
    if (currentWordIndex + 1 >= reviews.length) {
      handleSetComplete();
    }
  };

  // 세트 완료 처리 (handleAnswer, handleNext에서 공통 사용)
  const handleSetComplete = async () => {
    // 서버 세션이 있으면 세트 완료 처리
    if (serverSession && user && examParam && levelParam) {
      try {
        const result = await learningAPI.updateSessionProgress({
          sessionId: serverSession.id,
          completedSet: true,
        });

        if (result.isCompleted) {
          // 전체 학습 완료
          setShowResult(true);
          clearLearningSession();
          return; // 전체 완료 시 여기서 종료
        }

        // Set 완료 - 중간 화면 표시 (다음 단어 유무와 상관없이 일관되게)
        if (result.session) {
          setServerSession(result.session);
        }

        if (result.words && result.words.length > 0) {
          // 다음 Set 데이터 저장
          setPendingNextSet({
            session: result.session,
            words: result.words,
          });
        }
        setShowSetComplete(true);
        return; // Set 완료 화면 표시
      } catch (error) {
        console.error('Failed to update server session:', error);
      }
    }

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
  };

  // 다음 Set으로 이동
  const handleContinueToNextSet = () => {
    if (pendingNextSet && examParam && levelParam) {
      setServerSession(pendingNextSet.session);
      setReviews(pendingNextSet.words.map((word: Word) => ({ word })));
      setTotalLearnedInLevel(pendingNextSet.session?.totalReviewed || 0);
      resetSession();

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

    // Check if we've finished all words in current set
    if (currentWordIndex + 1 >= reviews.length) {
      handleSetComplete();
    }
  };

  const handleRestart = async () => {
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
        startSession();
        return;
      } catch (error) {
        console.error('Failed to restart server session:', error);
        setLoading(false);
      }
    }

    // 폴백
    loadReviews();
    if (user) {
      startSession();
    }
  };

  const handleNextBatch = async () => {
    // 서버 세션이 있으면 다음 세트 로드 (이미 handleSetComplete에서 처리됨)
    // 이 함수는 서버 세션 없이 기존 방식으로 사용하는 경우만 처리
    if (!serverSession) {
      resetSession();
      setShowResult(false);
      setLoading(true);
      loadReviews(currentPage + 1);
      if (user) {
        startSession();
      }
    }
  };

  // 나가기 버튼 핸들러 - 현재 진행 위치를 서버에 저장
  const handleExit = async () => {
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
    router.push(user ? '/dashboard' : '/');
  };

  // beforeunload 이벤트 - 페이지 떠날 때 진행 위치 저장
  useEffect(() => {
    if (!serverSession || !user) return;

    const saveProgressBeforeUnload = () => {
      // sendBeacon으로 비동기 저장 (페이지 언로드 중에도 작동)
      const token = localStorage.getItem('authToken');
      if (token && serverSession) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
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
  }, [serverSession, user, currentWordIndex]);

  if (!hasHydrated || loading) {
    return <LearnPageLoading />;
  }

  // 구독 제한으로 접근 차단
  if (accessBlocked && user) {
    const examName = examParam === 'TEPS' ? 'TEPS' : '수능';
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
              onClick={() => router.push('/dashboard')}
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
            2회 무료 체험을 모두 사용하셨습니다.<br />
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-4">
        <EmptyFirstTime type="words" />
      </div>
    );
  }

  // Set 완료 화면 표시 (pendingNextSet 유무와 상관없이 일관되게 표시)
  if (showSetComplete && serverSession) {
    const wordsStudied = getWordsStudied();
    const wordsCorrect = getWordsCorrect();
    const percentage = wordsStudied > 0 ? Math.round((wordsCorrect / wordsStudied) * 100) : 0;
    const completedSet = serverSession.completedSets; // 방금 완료한 Set 번호
    const totalSets = serverSession.totalSets;
    const totalReviewed = serverSession.totalReviewed;
    const hasNextSet = pendingNextSet && pendingNextSet.words && pendingNextSet.words.length > 0;

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
            {hasNextSet ? (
              <button
                onClick={handleContinueToNextSet}
                className="w-full bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] hover:opacity-90 text-white px-6 py-4 rounded-xl font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-lg shadow-[#14B8A6]/25"
              >
                Set {completedSet + 1} 시작하기 →
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
              onClick={() => router.push('/dashboard')}
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
    // Calculate final stats from cardRatings
    const wordsStudied = getWordsStudied();
    const wordsCorrect = getWordsCorrect();

    // 서버 세션인 경우 전체 학습 완료 여부 확인
    const isSessionCompleted = serverSession?.status === 'COMPLETED';

    // Check if there are more words to learn
    // 서버 세션 완료면 더 이상 학습할 단어 없음
    const hasMoreWords = !isSessionCompleted &&
      totalWordsInLevel > 0 &&
      (totalLearnedInLevel + wordsStudied) < totalWordsInLevel;

    // 전체 진행률 계산 (서버 세션 기준)
    const totalLearned = serverSession
      ? serverSession.totalReviewed
      : totalLearnedInLevel + wordsStudied;

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-4">
        <CelebrateCompletion
          score={wordsCorrect}
          total={wordsStudied}
          onRetry={handleRestart}
          onHome={() => router.push(user ? '/dashboard' : '/')}
          onNext={user && hasMoreWords && examParam && !serverSession ? handleNextBatch : undefined}
          isGuest={!user}
          totalProgress={user && totalWordsInLevel > 0 ? {
            learned: totalLearned,
            total: totalWordsInLevel,
          } : undefined}
        />
      </div>
    );
  }

  const currentWord = reviews[currentWordIndex]?.word;

  // currentWordIndex가 범위를 벗어나면 0으로 리셋
  useEffect(() => {
    if (reviews.length > 0 && currentWordIndex >= reviews.length) {
      setCurrentIndex(0);
    }
  }, [reviews.length, currentWordIndex, setCurrentIndex]);

  // currentWord가 없으면 로딩 화면 표시 (빈 화면 방지)
  if (!currentWord) {
    return <LearnPageLoading />;
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
              {isReviewMode ? (
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
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[12px] font-medium">
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

              {/* Next/Complete Button */}
              {currentWordIndex >= reviews.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-[10px] text-[13px] font-bold transition shrink-0 bg-[#14B8A6] text-white hover:bg-[#0D9488] shadow-[0_2px_8px_rgba(20,184,166,0.3)]"
                >
                  <span>완료</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-[10px] text-[13px] font-medium transition shrink-0 text-gray-500 hover:text-[#1c1c1e] hover:bg-gray-100"
                >
                  <span className="hidden sm:inline">다음</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}

              {/* Progress Count + Set Info (모바일) - 복습 모드에서는 Set 숨김 */}
              <div className="flex items-center gap-2 shrink-0">
                {!isReviewMode && serverSession && serverSession.totalSets > 0 && (
                  <span className="sm:hidden text-[12px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    Set {serverSession.currentSet + 1}
                  </span>
                )}
                <span className="text-[13px] font-bold text-[#14B8A6]">{currentWordIndex + 1}/{reviews.length}</span>
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
