// Force redeploy - 2026-01-31 v3 (fix exam order: 수능→TEPS→2026기출)
'use client';

import { useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore, useExamCourseStore, useUserSettingsStore, ExamType } from '@/lib/store';
import { canAccessExamWithPurchase, canAccessContentWithPurchase, getAvailableExams, getSubscriptionTier } from '@/lib/subscription';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { SkeletonDashboard } from '@/components/ui/Skeleton';
import { useDashboardSummary, usePackageAccessBulk, usePrefetchDashboard } from '@/hooks/useQueries';

// ============================================
// DashboardItem 컴포넌트 (미니멀 스타일)
// ============================================
function DashboardItem({ value, label, color, loading }: { value: string | number, label: string, color: 'blue' | 'amber' | 'emerald', loading?: boolean }) {
  const colorClasses = {
    blue: 'text-blue-600',
    amber: 'text-amber-600',
    emerald: 'text-emerald-600',
  };

  return (
    <div className="flex-1 flex flex-col items-center gap-1">
      {loading ? (
        <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
      ) : (
        <span className={`text-2xl font-bold ${colorClasses[color]}`}>
          {value}
        </span>
      )}
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

// Exam info (순서: 수능 → TEPS → 2026 기출 → EBS 연계)
const examInfo: Record<string, { name: string; icon: string; color: string }> = {
  CSAT: { name: '수능', icon: '📝', color: 'blue' },
  TEPS: { name: 'TEPS', icon: '🎓', color: 'purple' },
  CSAT_2026: { name: '2026 수능 기출', icon: '📋', color: 'emerald' },
  EBS: { name: 'EBS 연계', icon: '📗', color: 'green' },
  TOEFL: { name: 'TOEFL', icon: '🌍', color: 'blue' },
  TOEIC: { name: 'TOEIC', icon: '💼', color: 'green' },
};

// Get valid level for exam
const getValidLevelForExam = (exam: string, level: string): string => {
  if (exam === 'TEPS') {
    return ['L1', 'L2'].includes(level) ? level : 'L1';
  }
  if (exam === 'CSAT_2026') {
    return ['LISTENING', 'READING_2', 'READING_3'].includes(level) ? level : 'LISTENING';
  }
  if (exam === 'EBS') {
    return ['LISTENING', 'READING_BASIC', 'READING_ADV'].includes(level) ? level : 'LISTENING';
  }
  if (exam === 'TOEFL') {
    return ['L1', 'L2'].includes(level) ? level : 'L1';
  }
  if (exam === 'TOEIC') {
    return ['L1', 'L2'].includes(level) ? level : 'L1';
  }
  return ['L1', 'L2', 'L3'].includes(level) ? level : 'L1';
};

// Level info - exam-specific
const getLevelInfo = (exam: string, level: string) => {
  if (exam === 'CSAT_2026') {
    const csat2026Levels: Record<string, { name: string; description: string; target: string; wordCount: number }> = {
      LISTENING: { name: '듣기', description: '듣기 영역 1~17번', target: '듣기 만점', wordCount: 132 },
      READING_2: { name: '독해 2점', description: '독해 2점 문항', target: '기본 확보', wordCount: 265 },
      READING_3: { name: '독해 3점', description: '고난도 3점 문항', target: '고득점', wordCount: 124 },
    };
    return csat2026Levels[level] || csat2026Levels.LISTENING;
  }

  if (exam === 'TOEFL') {
    const toeflLevels: Record<string, { name: string; description: string; target: string; wordCount: number }> = {
      L1: { name: 'Core 핵심필수', description: '수능/EBS 수준 기본 단어', target: '기본필수', wordCount: 1994 },
      L2: { name: 'Advanced 실전고난도', description: '실전 고난도 학술 어휘', target: '고난도', wordCount: 1657 },
    };
    return toeflLevels[level] || toeflLevels.L1;
  }

  if (exam === 'TOEIC') {
    const toeicLevels: Record<string, { name: string; description: string; target: string; wordCount: number }> = {
      L1: { name: '토익 Start', description: '600~700점 목표 기초 비즈니스 어휘', target: '600~700점', wordCount: 1370 },
      L2: { name: '토익 Boost', description: '800점+ 고득점 비즈니스 어휘', target: '800점+', wordCount: 1121 },
    };
    return toeicLevels[level] || toeicLevels.L1;
  }

  if (exam === 'TEPS') {
    // TEPS는 L1, L2만 (L3 없음)
    const tepsLevels: Record<string, { name: string; description: string; target: string; wordCount: number }> = {
      L1: { name: 'L1(기본)', description: 'TEPS 고급어휘 기본', target: '기본 점수 목표', wordCount: 265 },
      L2: { name: 'L2(필수)', description: 'TEPS 고급어휘 필수', target: '고득점 목표', wordCount: 126 },
    };
    return tepsLevels[level] || tepsLevels.L1;
  }

  if (exam === 'EBS') {
    const ebsLevels: Record<string, { name: string; description: string; target: string; wordCount: number }> = {
      LISTENING: { name: '듣기영역', description: 'EBS 수능특강 영어듣기', target: '듣기 연계 대비', wordCount: 1177 },
      READING_BASIC: { name: '독해 기본', description: 'EBS 수능특강 영어', target: '독해 기본 대비', wordCount: 1284 },
      READING_ADV: { name: '독해 실력', description: 'EBS 수능특강 영어독해연습', target: '독해 심화 대비', wordCount: 1534 },
    };
    return ebsLevels[level] || ebsLevels.LISTENING;
  }

  const defaultLevels: Record<string, { name: string; description: string; target: string; wordCount: number }> = {
    L1: { name: 'L1(기초)', description: '기초 필수 단어', target: '3등급 목표', wordCount: 884 },
    L2: { name: 'L2(중급)', description: '핵심 심화 단어', target: '2등급 목표', wordCount: 747 },
    L3: { name: 'L3(고급)', description: '고난도 단어', target: '1등급 목표', wordCount: 158 },
  };
  return defaultLevels[level] || defaultLevels.L1;
};

interface UserStats {
  totalWordsLearned: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: string;
}

interface LearningSessionData {
  id: string;
  examCategory: string;
  level: string;
  totalWords: number;
  currentSet: number;
  currentIndex: number;
  completedSets: number;
  totalReviewed: number;
  status: string;
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const activeExam = useExamCourseStore((state) => state.activeExam);
  const activeLevel = useExamCourseStore((state) => state.activeLevel);
  const setActiveExam = useExamCourseStore((state) => state.setActiveExam);
  const setActiveLevel = useExamCourseStore((state) => state.setActiveLevel);
  const examHasHydrated = useExamCourseStore((state) => state._hasHydrated);

  // dailyGoal: Zustand store에서 관리 (Hero.tsx와 동기화)
  const dailyGoal = useUserSettingsStore((state) => state.dailyGoal);
  const setDailyGoal = useUserSettingsStore((state) => state.setDailyGoal);

  // React Query: 대시보드 데이터 캐싱
  const examCategory = activeExam || 'CSAT';
  const validLevel = getValidLevelForExam(examCategory, activeLevel || 'L1');

  // 4개 패키지 접근 권한을 1번의 API 호출로 체크
  const { data: bulkAccessData } = usePackageAccessBulk(
    ['2026-csat-analysis', 'ebs-vocab', 'toefl-complete', 'toeic-complete'],
    !!user && hasHydrated
  );

  // 개별 데이터 추출 (기존 변수명 유지하여 하위 코드 변경 최소화)
  const accessData = bulkAccessData?.['2026-csat-analysis'] ? { hasAccess: bulkAccessData['2026-csat-analysis'].hasAccess } : undefined;
  const ebsAccessData = bulkAccessData?.['ebs-vocab'] ? { hasAccess: bulkAccessData['ebs-vocab'].hasAccess } : undefined;
  const toeflAccessData = bulkAccessData?.['toefl-complete'] ? { hasAccess: bulkAccessData['toefl-complete'].hasAccess } : undefined;
  const toeicAccessData = bulkAccessData?.['toeic-complete'] ? { hasAccess: bulkAccessData['toeic-complete'].hasAccess } : undefined;

  // dashboard-summary: bulkAccessData 로딩 완료 후에만 쿼리 시작
  // → fallback effect가 접근 권한 확인 전에 exam을 CSAT으로 리셋하는 race condition 방지
  // → exam/level이 완전히 안정된 후 1회만 호출
  const {
    data: summaryData,
    isLoading: summaryLoading,
    isFetching: summaryFetching
  } = useDashboardSummary(examCategory, validLevel, !!user && hasHydrated && examHasHydrated && !!bulkAccessData);

  // 프리패치 훅 (hover 시 미리 로딩)
  const prefetchDashboard = usePrefetchDashboard();

  // 페이지 포커스 시 데이터 갱신 (학습 후 복귀 시 최신 데이터 표시)
  // 30초 디바운스: 탭 전환, 창 클릭 등 빈번한 focus 이벤트에서 중복 refetch 방지
  const queryClient = useQueryClient();
  const lastFocusRef = useRef(0);
  useEffect(() => {
    const handleFocus = () => {
      const now = Date.now();
      if (now - lastFocusRef.current < 30_000) return;
      lastFocusRef.current = now;
      queryClient.invalidateQueries({
        queryKey: ['dashboardSummary', examCategory, validLevel],
        refetchType: 'active',
      });
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [queryClient, examCategory, validLevel]);

  // React Query 데이터에서 추출
  const stats = summaryData?.stats || null;
  const dueReviewCount = summaryData?.dueReviewCount || 0;
  const examLevelTotalWords = summaryData?.totalWords || 0;
  const examLevelLearnedWords = summaryData?.learnedWords || 0;
  const weakWordCount = summaryData?.weakWordsCount || 0;
  const learningSession = summaryData?.learningSession || null;
  const hasCsat2026Access = accessData?.hasAccess || false;
  const hasEbsAccess = ebsAccessData?.hasAccess || false;
  const hasToeflAccess = toeflAccessData?.hasAccess || false;
  const hasToeicAccess = toeicAccessData?.hasAccess || false;

  // 로딩 상태
  const loading = summaryLoading;
  const examLevelLoading = summaryFetching && !summaryData;

  // dailyGoal 동기화
  useEffect(() => {
    if (summaryData?.stats?.dailyGoal) {
      setDailyGoal(summaryData.stats.dailyGoal);
    }
  }, [summaryData?.stats?.dailyGoal, setDailyGoal]);

  // 구독 + 단품 구매 상태에 따른 접근 권한 체크
  const canAccessExam = (exam: string) => canAccessExamWithPurchase(user, exam);
  const canAccessLevel = (exam: string, level: string) => canAccessContentWithPurchase(user, exam, level);
  const availableExams = getAvailableExams(user);
  const isPremium = getSubscriptionTier(user) === 'PREMIUM';

  // Calendar data
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // 로그인 체크
  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, hasHydrated, router]);

  // URL 쿼리 파라미터 → Zustand store 동기화
  useEffect(() => {
    if (!hasHydrated || !examHasHydrated) return;

    const examParam = searchParams.get('exam')?.toUpperCase();
    const levelParam = searchParams.get('level')?.toUpperCase();

    if (!examParam) return; // 쿼리 파라미터 없으면 Zustand 기존값 유지 (재방문 시나리오)

    // 유효한 시험인지 확인
    const validExams = ['CSAT', 'TEPS', 'CSAT_2026', 'EBS', 'TOEFL', 'TOEIC'];
    if (validExams.includes(examParam)) {
      setActiveExam(examParam as ExamType);

      // 레벨도 함께 왔으면 설정
      const validLevel = getValidLevelForExam(examParam, levelParam || 'L1');
      setActiveLevel(validLevel as 'L1' | 'L2' | 'L3');

      // 개별 localStorage도 업데이트 (시험 탭 전환 시 사용)
      localStorage.setItem(`dashboard_${examParam}_level`, validLevel);
    }
  }, [hasHydrated, examHasHydrated, searchParams, setActiveExam, setActiveLevel]);

  // CSAT_2026/TEPS 접근권한 없으면 CSAT으로 fallback
  // bulkAccessData 로딩 전에는 실행하지 않음 (접근 권한 미확인 상태에서 시험 리셋 방지)
  useEffect(() => {
    if (!hasHydrated || !bulkAccessData) return;

    // CSAT_2026 접근 불가 → CSAT으로 fallback
    if (activeExam === 'CSAT_2026' && !hasCsat2026Access && !isPremium) {
      setActiveExam('CSAT' as ExamType);
      setActiveLevel('L1');
      return;
    }

    // TEPS 접근 불가 (프리미엄 아님) → CSAT으로 fallback
    if (activeExam === 'TEPS' && !canAccessExam('TEPS')) {
      setActiveExam('CSAT' as ExamType);
      setActiveLevel('L1');
      return;
    }

    // EBS 접근 불가 → CSAT으로 fallback
    if (activeExam === 'EBS' && !canAccessExam('EBS')) {
      setActiveExam('CSAT' as ExamType);
      setActiveLevel('L1');
      return;
    }

    // TOEFL 접근 불가 → CSAT으로 fallback
    if (activeExam === 'TOEFL' && !hasToeflAccess) {
      setActiveExam('CSAT' as ExamType);
      setActiveLevel('L1');
      return;
    }

    // TOEIC 접근 불가 → CSAT으로 fallback
    if (activeExam === 'TOEIC' && !hasToeicAccess) {
      setActiveExam('CSAT' as ExamType);
      setActiveLevel('L1');
      return;
    }
  }, [hasHydrated, activeExam, hasCsat2026Access, hasEbsAccess, hasToeflAccess, hasToeicAccess, isPremium, canAccessExam, setActiveExam, setActiveLevel, bulkAccessData]);

  // 잘못된 시험/레벨 조합 수정 (예: TEPS + L3 → TEPS + L1)
  // 하이드레이션 후 activeLevel이 없으면 L1 자동 설정
  useEffect(() => {
    if (!hasHydrated || !examHasHydrated || !activeExam) return;
    const validLevel = getValidLevelForExam(activeExam, activeLevel || 'L1');
    // activeLevel이 null/undefined이거나 유효하지 않으면 강제 설정
    if (!activeLevel || validLevel !== activeLevel) {
      setActiveLevel(validLevel as 'L1' | 'L2' | 'L3');
    }
  }, [hasHydrated, examHasHydrated, activeExam, activeLevel, setActiveLevel]);

  const selectedExam = activeExam || 'CSAT';
  const selectedLevel = activeLevel || 'L1';
  const exam = examInfo[selectedExam];
  const level = getLevelInfo(selectedExam, selectedLevel);

  const totalWords = examLevelTotalWords || level.wordCount;
  // IN_PROGRESS: 세션 값만 사용 (리셋 후 0부터 시작 — Math.max 하면 이전 값 잔존)
  // COMPLETED: Math.max(세션, DB) — updateSessionProgress 실패해도 UserProgress 기준 표시
  // 세션 없음: UserProgress 사용
  const learnedWords = learningSession
    ? (learningSession.status === 'COMPLETED'
        ? Math.max(learningSession.totalReviewed + learningSession.currentIndex, examLevelLearnedWords)
        : learningSession.totalReviewed + learningSession.currentIndex)
    : examLevelLearnedWords;
  const remainingWords = Math.max(totalWords - learnedWords, 0);
  const progressPercent = totalWords > 0 ? Math.min(Math.round((learnedWords / totalWords) * 100), 100) : 0;

  // Set 계산 (세션의 totalWords 또는 전체 totalWords 기준으로 계산)
  const totalSets = Math.ceil((learningSession?.totalWords || totalWords) / 20);
  const currentSet = learningSession
    ? learningSession.currentSet + 1  // 서버는 0-indexed, UI는 1-indexed
    : (learnedWords > 0 ? Math.floor((learnedWords - 1) / 20) + 1 : 1);

  // 마지막 Set의 단어 수 계산 (158개면 마지막 Set은 18개)
  const isLastSet = currentSet === totalSets;
  const wordsInLastSet = totalWords % 20 || 20;  // 나머지가 0이면 20
  const wordsPerCurrentSet = isLastSet ? wordsInLastSet : 20;

  // COMPLETED: currentIndex가 0으로 리셋되므로 전체 단어 수 표시 (6/6)
  const wordsInCurrentSet = learningSession
    ? (learningSession.status === 'COMPLETED'
        ? wordsPerCurrentSet
        : learningSession.currentIndex + 1)
    : (learnedWords > 0 ? ((learnedWords - 1) % 20) + 1 : 1);

  // 학습 완료 여부 (세션 상태 또는 남은 단어 기준)
  const isCompleted = (learningSession?.status === 'COMPLETED') ||
    (remainingWords === 0 && totalWords > 0) ||
    (learningSession && learningSession.totalReviewed >= totalWords && totalWords > 0);

  // 현재 Set에서 남은 단어 수 (Set당 최대 20개)
  const currentSetRemaining = wordsPerCurrentSet - wordsInCurrentSet + 1;
  const todayRemaining = Math.min(currentSetRemaining, remainingWords);
  const estimatedMinutes = Math.ceil(todayRemaining * 0.3);

  if (!hasHydrated || !examHasHydrated || loading) {
    return (
      <DashboardLayout>
        <SkeletonDashboard />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-4">
        {/* 모바일 헤더 */}
        <div className="lg:hidden">
          <h1 className="text-xl font-bold text-gray-900">대시보드</h1>
        </div>

        {/* 오늘의 학습 목표 Hero */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="relative">
            <span className={`text-sm font-semibold block mb-2 ${isCompleted ? 'text-emerald-600' : 'text-teal-600'}`}>
              {isCompleted ? '🎉 학습 완료!' : '오늘의 학습 목표'}
            </span>

            {isCompleted ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-2">
                  {exam.name} {level.name} 마스터!<br />
                  <span className="text-emerald-600">{totalWords}개</span> 단어 완료
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  모든 단어를 학습했어요! 복습 퀴즈로 실력을 확인해보세요.
                </p>
                <div className="space-y-2">
                  <Link
                    href={`/learn?exam=${selectedExam}&level=${selectedLevel}&restart=true`}
                    className="block w-full bg-emerald-50 hover:bg-emerald-100 rounded-xl py-4 text-emerald-600 font-semibold text-center transition-colors"
                  >
                    처음부터 다시 학습
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-2">
                  다음 학습할 단어<br />
                  <span className="text-teal-600">{todayRemaining}개</span>
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  지금 시작하면 <span className="font-semibold text-gray-900">{estimatedMinutes}분</span>이면 끝나요
                </p>
                <Link
                  href={`/learn?exam=${selectedExam}&level=${selectedLevel}`}
                  className="block w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl py-4 text-center transition-colors"
                >
                  {learnedWords === 0 ? '학습 시작' : '이어서 학습'}
                </Link>
              </>
            )}
          </div>

          {/* 장식 요소 */}
          <div className="absolute top-4 right-4 opacity-40 select-none pointer-events-none hidden md:flex gap-1">
            <span className="text-4xl transform -rotate-12">{isCompleted ? '🎉' : '📚'}</span>
            <span className="text-3xl transform rotate-6">{isCompleted ? '✅' : '✨'}</span>
          </div>
        </section>

        {/* 시험 선택 섹션 */}
        <section className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">시험 선택</h3>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {/* 수능 버튼 */}
            <button
              onMouseEnter={() => {
                const lastLevel = localStorage.getItem('dashboard_CSAT_level') || 'L1';
                prefetchDashboard('CSAT', lastLevel);
              }}
              onClick={() => {
                setActiveExam('CSAT' as ExamType);
                const lastLevel = localStorage.getItem('dashboard_CSAT_level') || 'L1';
                setActiveLevel(lastLevel as 'L1' | 'L2' | 'L3');
              }}
              className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all ${
                selectedExam === 'CSAT'
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="text-2xl">📝</span>
              <span className="font-semibold text-xs">수능</span>
            </button>

            {/* TEPS 버튼 */}
            <button
              onMouseEnter={() => {
                if (canAccessExam('TEPS')) {
                  const lastLevel = localStorage.getItem('dashboard_TEPS_level') || 'L1';
                  const validLevel = ['L1', 'L2'].includes(lastLevel) ? lastLevel : 'L1';
                  prefetchDashboard('TEPS', validLevel);
                }
              }}
              onClick={() => {
                if (canAccessExam('TEPS')) {
                  setActiveExam('TEPS' as ExamType);
                  const lastLevel = localStorage.getItem('dashboard_TEPS_level') || 'L1';
                  const validLevel = ['L1', 'L2'].includes(lastLevel) ? lastLevel : 'L1';
                  setActiveLevel(validLevel as 'L1' | 'L2' | 'L3');
                } else {
                  router.push('/pricing');
                }
              }}
              className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all ${
                !canAccessExam('TEPS')
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : selectedExam === 'TEPS'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="text-2xl">🎓</span>
              <span className="font-semibold text-xs">TEPS</span>
              {!canAccessExam('TEPS') && <span className="text-xs">🔒</span>}
            </button>

            {/* 2026 기출 버튼 - 프리미엄 또는 단품 구매자만 표시 */}
            {(hasCsat2026Access || isPremium) && (
              <button
                onMouseEnter={() => {
                  const lastLevel = localStorage.getItem('dashboard_CSAT_2026_level') || 'LISTENING';
                  prefetchDashboard('CSAT_2026', lastLevel);
                }}
                onClick={() => {
                  setActiveExam('CSAT_2026' as ExamType);
                  const lastLevel = localStorage.getItem('dashboard_CSAT_2026_level') || 'LISTENING';
                  setActiveLevel(lastLevel as 'L1' | 'L2' | 'L3');
                }}
                className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all ${
                  selectedExam === 'CSAT_2026'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="text-2xl">📋</span>
                <span className="font-semibold text-xs">2026 기출</span>
              </button>
            )}

            {/* EBS 연계어휘 버튼 - 프리미엄 또는 단품 구매자만 표시 */}
            {(hasEbsAccess || isPremium) && (
              <button
                onMouseEnter={() => {
                  const lastLevel = localStorage.getItem('dashboard_EBS_level') || 'LISTENING';
                  prefetchDashboard('EBS', lastLevel);
                }}
                onClick={() => {
                  setActiveExam('EBS' as ExamType);
                  const lastLevel = localStorage.getItem('dashboard_EBS_level') || 'LISTENING';
                  setActiveLevel(lastLevel as 'L1' | 'L2' | 'L3');
                }}
                className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all ${
                  selectedExam === 'EBS'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="text-2xl">📗</span>
                <span className="font-semibold text-xs">EBS 연계</span>
              </button>
            )}

            {/* TOEFL 버튼 - 단품 구매자만 표시 */}
            {hasToeflAccess && (
              <button
                onMouseEnter={() => {
                  const lastLevel = localStorage.getItem('dashboard_TOEFL_level') || 'L1';
                  const validLevel = ['L1', 'L2'].includes(lastLevel) ? lastLevel : 'L1';
                  prefetchDashboard('TOEFL', validLevel);
                }}
                onClick={() => {
                  setActiveExam('TOEFL' as ExamType);
                  const lastLevel = localStorage.getItem('dashboard_TOEFL_level') || 'L1';
                  const validLevel = ['L1', 'L2'].includes(lastLevel) ? lastLevel : 'L1';
                  setActiveLevel(validLevel as 'L1' | 'L2' | 'L3');
                }}
                className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all ${
                  selectedExam === 'TOEFL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="text-2xl">🌍</span>
                <span className="font-semibold text-xs">TOEFL</span>
              </button>
            )}

            {/* TOEIC 버튼 - 단품 구매자만 표시 */}
            {hasToeicAccess && (
              <button
                onMouseEnter={() => {
                  const lastLevel = localStorage.getItem('dashboard_TOEIC_level') || 'L1';
                  const validLevel = ['L1', 'L2'].includes(lastLevel) ? lastLevel : 'L1';
                  prefetchDashboard('TOEIC', validLevel);
                }}
                onClick={() => {
                  setActiveExam('TOEIC' as ExamType);
                  const lastLevel = localStorage.getItem('dashboard_TOEIC_level') || 'L1';
                  const validLevel = ['L1', 'L2'].includes(lastLevel) ? lastLevel : 'L1';
                  setActiveLevel(validLevel as 'L1' | 'L2' | 'L3');
                }}
                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all ${
                  selectedExam === 'TOEIC'
                    ? 'bg-green-50 border-2 border-green-400 shadow-sm'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">💼</span>
                <span className="font-semibold text-xs">TOEIC</span>
              </button>
            )}
          </div>
        </section>

        {/* 레벨/유형 선택 섹션 */}
        <section className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            {(selectedExam === 'CSAT_2026' || selectedExam === 'EBS') ? '유형 선택' : (selectedExam === 'TOEFL' || selectedExam === 'TOEIC') ? '난이도 선택' : '레벨 선택'}
          </h3>

          <div className="flex gap-3">
            {(selectedExam === 'CSAT_2026'
              ? ['LISTENING', 'READING_2', 'READING_3'] as const
              : selectedExam === 'TEPS'
                ? ['L1', 'L2'] as const
                : selectedExam === 'EBS'
                  ? ['LISTENING', 'READING_BASIC', 'READING_ADV'] as const
                  : (selectedExam === 'TOEFL' || selectedExam === 'TOEIC')
                    ? ['L1', 'L2'] as const
                    : ['L1', 'L2', 'L3'] as const
            ).map((lvl) => {
              const isLocked = (selectedExam !== 'CSAT_2026' && selectedExam !== 'EBS' && selectedExam !== 'TOEFL' && selectedExam !== 'TOEIC') && !canAccessLevel(selectedExam, lvl as 'L1' | 'L2' | 'L3');
              const levelLabel = selectedExam === 'CSAT_2026'
                ? (lvl === 'LISTENING' ? '듣기영역' : lvl === 'READING_2' ? '독해 2점' : '독해 3점')
                : selectedExam === 'EBS'
                  ? (lvl === 'LISTENING' ? '듣기영역' : lvl === 'READING_BASIC' ? '독해 기본' : '독해 실력')
                  : selectedExam === 'TEPS'
                    ? (lvl === 'L1' ? '기본' : '필수')
                    : selectedExam === 'TOEFL'
                      ? (lvl === 'L1' ? 'Core 핵심필수' : 'Advanced 실전고난도')
                      : selectedExam === 'TOEIC'
                        ? (lvl === 'L1' ? '토익 Start' : '토익 Boost')
                        : (lvl === 'L1' ? '기초' : lvl === 'L2' ? '중급' : '고급');
              const displayName = selectedExam === 'CSAT_2026'
                ? (lvl === 'LISTENING' ? '듣기' : lvl === 'READING_2' ? '2점' : '3점')
                : selectedExam === 'EBS'
                  ? (lvl === 'LISTENING' ? '듣기' : lvl === 'READING_BASIC' ? '기본' : '실력')
                  : selectedExam === 'TOEFL'
                    ? (lvl === 'L1' ? 'Core' : 'Adv')
                    : selectedExam === 'TOEIC'
                      ? (lvl === 'L1' ? 'Start' : 'Boost')
                      : lvl;
              return (
                <button
                  key={lvl}
                  onMouseEnter={() => {
                    if (!isLocked) {
                      prefetchDashboard(selectedExam, lvl);
                    }
                  }}
                  onClick={() => {
                    if (isLocked) {
                      router.push('/pricing');
                    } else {
                      setActiveLevel(lvl as 'L1' | 'L2' | 'L3');
                      localStorage.setItem(`dashboard_${selectedExam}_level`, lvl);
                    }
                  }}
                  className={`flex-1 flex flex-col items-center py-4 rounded-xl transition-all ${
                    isLocked
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : selectedLevel === lvl
                      ? selectedExam === 'CSAT_2026' ? 'bg-emerald-500 text-white'
                        : selectedExam === 'EBS' ? 'bg-green-500 text-white'
                        : 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {(selectedExam === 'CSAT_2026' || selectedExam === 'EBS') ? (
                    // CSAT_2026/EBS: 한 줄로 표시
                    <span className="font-semibold text-sm">{levelLabel}</span>
                  ) : (
                    // 기존 CSAT/TEPS: 두 줄 유지
                    <>
                      <div className="flex items-center gap-1">
                        <span className="font-bold">{displayName}</span>
                        {isLocked && <span className="text-sm">🔒</span>}
                      </div>
                      <span className={`text-xs mt-1 ${
                        isLocked ? 'text-gray-400' : selectedLevel === lvl ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {levelLabel}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* 바로 학습 이어가기 카드 (전체 너비) */}
        <section className="bg-white border border-gray-200 rounded-2xl p-5">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">바로 학습 이어가기</h3>
            <span className="text-sm text-teal-600 font-medium flex items-center gap-1">
              🔥 {stats?.currentStreak || 0}일 연속
            </span>
          </div>

          {/* 현재 학습 정보 + Set 정보 */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center">
                <span className="text-2xl">{exam.icon}</span>
              </div>
              <div>
                <p className="font-bold text-gray-900">
                  {exam.name} {level.name}
                </p>
                <p className="text-sm text-gray-500">
                  {level.description} • {level.target}
                </p>
              </div>
            </div>
            {/* Set 정보 뱃지 (데스크톱) */}
            {totalWords > 0 && (
              <div className="hidden sm:flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl">
                <span className="text-blue-600 font-semibold">
                  Set {currentSet} / {totalSets}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600 text-sm">
                  {wordsInCurrentSet} / {wordsPerCurrentSet}
                </span>
              </div>
            )}
          </div>

          {/* Set 정보 (모바일용) */}
          {totalWords > 0 && (
            <div className="sm:hidden flex items-center justify-center gap-2 bg-blue-50 px-4 py-3 rounded-xl mb-4">
              <span className="text-lg">📚</span>
              <span className="text-blue-600 font-semibold">
                Set {currentSet} / {totalSets}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600 text-sm">
                {wordsInCurrentSet} / {wordsPerCurrentSet}
              </span>
            </div>
          )}

          {/* 통계 3분할 */}
          <div className="flex justify-between items-center py-4 border-y border-gray-100 mb-4">
            <DashboardItem value={learnedWords} label="학습 완료" color="blue" loading={examLevelLoading} />
            <div className="w-px h-10 bg-gray-100" />
            <DashboardItem value={remainingWords} label="남은 단어" color="amber" loading={examLevelLoading} />
            <div className="w-px h-10 bg-gray-100" />
            <DashboardItem value={`${progressPercent}%`} label="진행률" color="emerald" loading={examLevelLoading} />
          </div>

          {/* 프로그레스 바 */}
          <div className="w-full h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
            <div
              className={`h-full bg-teal-500 rounded-full transition-all duration-500 ${examLevelLoading ? 'animate-pulse' : ''}`}
              style={{ width: examLevelLoading ? '0%' : `${progressPercent}%` }}
            />
          </div>

          {/* 부가 정보 */}
          <div className="flex justify-between text-sm text-gray-500 mb-4">
            <span>마지막 학습: {stats?.lastActiveDate ? new Date(stats.lastActiveDate).toLocaleDateString('ko-KR') : '오늘'}</span>
            <span>오늘 목표: {dailyGoal}개</span>
          </div>

          {/* 버튼 */}
          {isCompleted ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50 rounded-xl">
                <span className="text-xl">✅</span>
                <span className="font-semibold text-emerald-600">학습 완료!</span>
              </div>
              <Link
                href={`/learn?exam=${selectedExam}&level=${selectedLevel}&restart=true`}
                className="block w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 font-semibold text-center transition-colors"
              >
                처음부터 다시 학습
              </Link>
            </div>
          ) : (
            <Link
              href={`/learn?exam=${selectedExam}&level=${selectedLevel}`}
              className="block w-full py-4 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl text-center transition-colors"
            >
              {learnedWords === 0 ? '학습 시작' : '이어서 학습'}
            </Link>
          )}
        </section>

        {/* 연속 학습일 + 캘린더 */}
        <section className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">연속 학습일</h3>
            <span className="text-sm text-gray-500">{currentYear}년 {currentMonth + 1}월</span>
          </div>

          {/* 현재/최장 연속 */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 bg-teal-50 rounded-xl p-4 text-center">
              <span className="text-2xl mb-1 block">🔥</span>
              <p className="text-2xl font-bold text-teal-600">{stats?.currentStreak || 0}일</p>
              <p className="text-xs text-gray-500">현재 연속</p>
            </div>
            <div className="flex-1 bg-amber-50 rounded-xl p-4 text-center">
              <span className="text-2xl mb-1 block">🏆</span>
              <p className="text-2xl font-bold text-amber-600">{stats?.longestStreak || 0}일</p>
              <p className="text-xs text-gray-500">최장 기록</p>
            </div>
          </div>

          {/* 캘린더 그리드 */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* 요일 헤더 */}
            {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
              <div key={day} className="text-xs text-gray-400 py-1">{day}</div>
            ))}
            {/* 빈 셀 */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="py-2" />
            ))}
            {/* 날짜들 */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = day === today.getDate();
              const hasActivity = day <= today.getDate() && day > today.getDate() - (stats?.currentStreak || 0);

              return (
                <div
                  key={day}
                  className={`py-2 text-sm rounded-full ${
                    isToday
                      ? 'bg-teal-500 text-white font-bold'
                      : hasActivity
                      ? 'bg-teal-50 text-teal-600 font-semibold'
                      : 'text-gray-900'
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

// Suspense wrapper (useSearchParams requires Suspense boundary in Next.js 14+)
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLayout><SkeletonDashboard /></DashboardLayout>}>
      <DashboardContent />
    </Suspense>
  );
}
