// Force redeploy - 2026-01-31 v3 (fix exam order: 수능→TEPS→2026기출)
'use client';

import { useEffect, Suspense, useRef, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore, useExamCourseStore, useUserSettingsStore, ExamType } from '@/lib/store';
import { canAccessExamWithPurchase, canAccessContentWithPurchase, getAvailableExams, getSubscriptionTier, isLevelLocked } from '@/lib/subscription';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { SkeletonDashboard } from '@/components/ui/Skeleton';
import { useDashboardSummary, usePackageAccessBulk, usePrefetchDashboard } from '@/hooks/useQueries';
import { EXAM_MAP, VALID_EXAM_KEYS, getValidLevelForExam, getValidLevelsForExam, getLevelLabel, getLevelShortLabel, SAT_THEMES, getSatTheme } from '@/constants/exams';
import { useLocale } from '@/hooks/useLocale';

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

// examInfo / getValidLevelForExam → @/constants/exams 에서 import

// Level info - exam-specific
const getLevelInfo = (exam: string, level: string, isEn = false) => {
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
      L1: { name: isEn ? 'Essential' : 'Essential 핵심필수', description: isEn ? 'Core TOEFL vocabulary' : '토플 핵심 필수 어휘', target: isEn ? 'Score target' : '기본필수', wordCount: 1994 },
      L2: { name: isEn ? 'Mastery' : 'Mastery 실전고난도', description: isEn ? 'Advanced academic vocabulary' : '실전 고난도 학술 어휘', target: isEn ? 'High score' : '고난도', wordCount: 1657 },
    };
    return toeflLevels[level] || toeflLevels.L1;
  }

  if (exam === 'TOEIC') {
    const toeicLevels: Record<string, { name: string; description: string; target: string; wordCount: number }> = {
      L1: { name: isEn ? 'Primer' : 'Primer 기초필수', description: isEn ? 'Business basics for 600~700' : '600~700점 목표 기초 비즈니스 어휘', target: isEn ? '600~700' : '600~700점', wordCount: 1370 },
      L2: { name: isEn ? 'Booster' : 'Booster 고득점', description: isEn ? 'Advanced business for 800+' : '800점+ 고득점 비즈니스 어휘', target: isEn ? '800+' : '800점+', wordCount: 1121 },
    };
    return toeicLevels[level] || toeicLevels.L1;
  }

  if (exam === 'SAT') {
    // 테마별 학습
    if (level.startsWith('THEME_')) {
      const theme = getSatTheme(level);
      return {
        name: theme ? theme.label : level,
        description: `SAT 테마별 학습 • ${theme?.label || level}`,
        target: '테마 정복',
        wordCount: 0, // API에서 반환되는 값 사용
      };
    }
    const satLevels: Record<string, { name: string; description: string; target: string; wordCount: number }> = {
      L1: { name: isEn ? 'Starter' : 'Starter 기초핵심', description: isEn ? 'SAT core vocabulary' : 'SAT 기초 핵심 어휘', target: isEn ? 'Foundation' : '기초 학습', wordCount: 1786 },
      L2: { name: isEn ? 'Advanced' : 'Advanced 실전고급', description: isEn ? 'SAT advanced vocabulary' : 'SAT 고급 실전 어휘', target: isEn ? 'Advanced' : '고급 정복', wordCount: 149 },
    };
    return satLevels[level] || satLevels.L1;
  }

  if (exam === 'GRE') {
    const greLevels: Record<string, { name: string; description: string; target: string; wordCount: number }> = {
      L1: { name: isEn ? 'Verbal' : 'Verbal 핵심', description: isEn ? 'GRE Verbal high-frequency words' : 'GRE Verbal 빈출 핵심 어휘', target: isEn ? 'Score target' : '기본 점수 목표', wordCount: 1858 },
      L2: { name: isEn ? 'Elite' : 'Elite 고급', description: isEn ? 'GRE Verbal advanced vocabulary' : 'GRE Verbal 고난도 어휘', target: isEn ? 'High score' : '고득점 목표', wordCount: 2488 },
    };
    return greLevels[level] || greLevels.L1;
  }

  if (exam === 'IELTS') {
    const ieltsLevels: Record<string, { name: string; description: string; target: string; wordCount: number }> = {
      L1: { name: 'Foundation', description: isEn ? 'IELTS Band 5~6.5 essential words' : 'IELTS Band 5~6.5 기초 필수 어휘', target: isEn ? 'Band 6.5' : 'Band 6.5 목표', wordCount: 401 },
      L2: { name: 'Academic', description: isEn ? 'IELTS Band 7~8 academic words' : 'IELTS Band 7~8 학술 핵심 어휘', target: isEn ? 'Band 8.0' : 'Band 8.0 목표', wordCount: 394 },
    };
    return ieltsLevels[level] || ieltsLevels.L1;
  }

  if (exam === 'ACT') {
    return {
      L1: {
        name: isEn ? 'Core' : 'Core 핵심',
        description: isEn ? 'High-frequency ACT vocabulary' : 'ACT 핵심 빈출 어휘',
        target: isEn ? 'Score boost' : '점수 향상',
        wordCount: 302,
      },
      L2: {
        name: isEn ? 'Plus' : 'Plus 확장',
        description: isEn ? 'Advanced ACT vocabulary' : 'ACT 고난도 어휘',
        target: isEn ? 'High score' : '고득점 목표',
        wordCount: 450,
      },
    }[level] || { name: 'ACT Core', description: '', target: '', wordCount: 302 };
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
  const locale = useLocale();
  const isEn = locale === 'en';
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const activeExam = useExamCourseStore((state) => state.activeExam);
  const activeLevel = useExamCourseStore((state) => state.activeLevel);
  const setActiveExam = useExamCourseStore((state) => state.setActiveExam);
  const setActiveLevel = useExamCourseStore((state) => state.setActiveLevel);
  const setActiveExamWithLevel = useExamCourseStore((state) => state.setActiveExamWithLevel);
  const examHasHydrated = useExamCourseStore((state) => state._hasHydrated);

  // dailyGoal: Zustand store에서 관리 (Hero.tsx와 동기화)
  const dailyGoal = useUserSettingsStore((state) => state.dailyGoal);
  const setDailyGoal = useUserSettingsStore((state) => state.setDailyGoal);

  // React Query: 대시보드 데이터 캐싱
  const defaultExam = isEn ? 'SAT' : 'CSAT';
  const examCategory = useMemo(() => activeExam || defaultExam, [activeExam, defaultExam]);
  const validLevel = useMemo(() => getValidLevelForExam(examCategory, activeLevel || 'L1'), [examCategory, activeLevel]);

  // 4개 패키지 접근 권한을 1번의 API 호출로 체크
  const { data: bulkAccessData } = usePackageAccessBulk(
    ['2026-csat-analysis', 'ebs-vocab', 'toefl-complete', 'toeic-complete', 'sat-complete', 'gre-complete'],
    !!user && hasHydrated
  );

  // 개별 데이터 추출 (기존 변수명 유지하여 하위 코드 변경 최소화)
  const accessData = bulkAccessData?.['2026-csat-analysis'] ? { hasAccess: bulkAccessData['2026-csat-analysis'].hasAccess } : undefined;
  const ebsAccessData = bulkAccessData?.['ebs-vocab'] ? { hasAccess: bulkAccessData['ebs-vocab'].hasAccess } : undefined;
  const toeflAccessData = bulkAccessData?.['toefl-complete'] ? { hasAccess: bulkAccessData['toefl-complete'].hasAccess } : undefined;
  const toeicAccessData = bulkAccessData?.['toeic-complete'] ? { hasAccess: bulkAccessData['toeic-complete'].hasAccess } : undefined;
  const satAccessData = bulkAccessData?.['sat-complete'] ? { hasAccess: bulkAccessData['sat-complete'].hasAccess } : undefined;
  const greAccessData = bulkAccessData?.['gre-complete'] ? { hasAccess: bulkAccessData['gre-complete'].hasAccess } : undefined;

  // stableQuery: effects 체인 완료 후의 최종 exam/level을 고정
  // → 이후 effects 체인이 state를 변경해도 queryKey는 변하지 않음
  // → 사용자가 UI에서 시험/레벨을 명시적으로 변경할 때만 업데이트
  const [stableQuery, setStableQuery] = useState<{exam: string, level: string} | null>(null);
  const [isCourseExpanded, setIsCourseExpanded] = useState(false);
  const [isThemeExpanded, setIsThemeExpanded] = useState(false);
  // ref 가드: fallback effect에서 stableQuery 초기화를 1회로 제한
  // → useEffect 재실행 시에도 중복 초기화 방지 (state 업데이트 + ref 이중 가드)
  const stableQueryInitRef = useRef(false);

  // dashboard-summary: stableQuery가 설정된 후에만 쿼리 시작
  // → exam/level이 완전히 안정된 후 1회만 호출
  const {
    data: summaryData,
    isLoading: summaryLoading,
    isFetching: summaryFetching
  } = useDashboardSummary(
    stableQuery?.exam || defaultExam,
    stableQuery?.level || 'L1',
    !!stableQuery && !!user && hasHydrated && examHasHydrated
  );

  // 프리패치 훅 (hover 시 미리 로딩)
  const prefetchDashboard = usePrefetchDashboard();

  // 페이지 포커스 시 데이터 갱신 (학습 후 복귀 시 최신 데이터 표시)
  // 30초 디바운스: 탭 전환, 창 클릭 등 빈번한 focus 이벤트에서 중복 refetch 방지
  // lastFocusRef: Date.now()로 초기화하여 마운트 직후 focus 이벤트에서 불필요한 refetch 방지
  const queryClient = useQueryClient();
  const lastFocusRef = useRef(Date.now());
  useEffect(() => {
    const handleFocus = () => {
      if (!stableQuery) return;
      const now = Date.now();
      if (now - lastFocusRef.current < 30_000) return;
      lastFocusRef.current = now;
      queryClient.invalidateQueries({
        queryKey: ['dashboardSummary', stableQuery.exam, stableQuery.level],
        refetchType: 'active',
      });
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [queryClient, stableQuery]);

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
  const hasSatAccess = satAccessData?.hasAccess || false;
  const hasGreAccess = greAccessData?.hasAccess || false;

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
  // useCallback으로 안정된 참조 유지 → fallback effect의 불필요한 재실행 방지
  const canAccessExam = useCallback((exam: string) => canAccessExamWithPurchase(user, exam, isEn), [user, isEn]);
  const canAccessLevel = (exam: string, level: string) => canAccessContentWithPurchase(user, exam, level, isEn);
  const availableExams = getAvailableExams(user, isEn);
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
    const validExams = VALID_EXAM_KEYS;
    if (validExams.includes(examParam)) {
      // 레벨도 함께 왔으면 설정
      const validLevel = getValidLevelForExam(examParam, levelParam || 'L1');
      setActiveExamWithLevel(examParam as ExamType, validLevel as 'L1' | 'L2' | 'L3');

      // 개별 localStorage도 업데이트 (시험 탭 전환 시 사용)
      localStorage.setItem(`dashboard_${examParam}_level`, validLevel);
    }
  }, [hasHydrated, examHasHydrated, searchParams, setActiveExamWithLevel]);

  // CSAT_2026/TEPS 접근권한 없으면 CSAT으로 fallback
  // bulkAccessData 로딩 전에는 실행하지 않음 (접근 권한 미확인 상태에서 시험 리셋 방지)
  useEffect(() => {
    if (!hasHydrated || !bulkAccessData) return;

    // 이미 초기화 완료 → fallback 체크 불필요 (사용자 명시적 변경은 onClick에서 처리)
    if (stableQueryInitRef.current) return;

    // 접근 불가 시험 → CSAT/L1로 fallback (이미 CSAT/L1이면 skip)
    const examEntry = availableExams.find(e => e.exam === activeExam);
    const needsFallback = !examEntry || examEntry.locked;

    if (needsFallback) {
      setActiveExamWithLevel((isEn ? 'SAT' : 'CSAT') as ExamType, 'L1');
      return;
    }

    // 모든 fallback 체크 통과 → exam/level 확정 → query 시작 허용 (1회만)
    stableQueryInitRef.current = true;
    setStableQuery({
      exam: activeExam || defaultExam,
      level: getValidLevelForExam(activeExam || defaultExam, activeLevel || 'L1'),
    });
  }, [hasHydrated, activeExam, activeLevel, availableExams, setActiveExamWithLevel, bulkAccessData]);

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

  const selectedExam = activeExam || defaultExam;
  const selectedLevel = activeLevel || 'L1';
  const examCfg = EXAM_MAP[selectedExam];
  const exam = { name: examCfg?.label || selectedExam, icon: examCfg?.icon || '📝', color: examCfg?.color || 'blue' };
  const level = getLevelInfo(selectedExam, selectedLevel, isEn);

  const totalWords = examLevelTotalWords || level.wordCount;
  // restart 세션: 세션 진도만 표시 (처음부터 다시 → 0→5)
  // resume 세션(이어서 학습): Math.max(세션, DB) → 누적값 유지
  // 세션 없음: DB값 사용
  const sessionLearnedWords = learningSession
    ? learningSession.totalReviewed + learningSession.currentIndex
    : 0;
  const learnedWords = !learningSession
    ? examLevelLearnedWords
    : learningSession.isRestart
      ? sessionLearnedWords
      : Math.max(sessionLearnedWords, examLevelLearnedWords);
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
      <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-4 lg:space-y-6">
        {/* 모바일 헤더 */}
        <div className="lg:hidden">
          <h1 className="text-xl font-bold text-gray-900">{isEn ? 'Dashboard' : '대시보드'}</h1>
        </div>

        {/* 바로 학습 이어가기 카드 (최상단) */}
        <section className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-teal-300 transition-all duration-200">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">{isEn ? 'Continue Learning' : '바로 학습 이어가기'}</h3>
            <span className="text-sm text-teal-600 font-medium flex items-center gap-1">
              {(stats?.currentStreak || 0) === 0
                ? (isEn ? '🔥 Start your streak!' : '🔥 스트릭을 시작하세요!')
                : (isEn ? `🔥 ${stats?.currentStreak} day streak` : `🔥 ${stats?.currentStreak}일 연속`)}
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
            <DashboardItem value={learnedWords} label={isEn ? 'Learned' : '학습 완료'} color="blue" loading={examLevelLoading} />
            <div className="w-px h-10 bg-gray-100" />
            <DashboardItem value={remainingWords} label={isEn ? 'Remaining' : '남은 단어'} color="amber" loading={examLevelLoading} />
            <div className="w-px h-10 bg-gray-100" />
            <DashboardItem
              value={progressPercent === 0 ? (isEn ? 'Not started' : '시작 전') : `${progressPercent}%`}
              label={progressPercent === 0 ? '' : (isEn ? 'Progress' : '진행률')}
              color="emerald"
              loading={examLevelLoading}
            />
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
            <span>{isEn ? 'Last study: ' : '마지막 학습: '}{stats?.lastActiveDate ? new Date(stats.lastActiveDate).toLocaleDateString(isEn ? 'en-US' : 'ko-KR') : (isEn ? 'Today' : '오늘')}</span>
            <span>{isEn ? `Daily goal: ${dailyGoal}` : `오늘 목표: ${dailyGoal}개`}</span>
          </div>

          {/* 버튼 */}
          {isCompleted ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50 rounded-xl">
                <span className="text-xl">✅</span>
                <span className="font-semibold text-emerald-600">{isEn ? 'Complete!' : '학습 완료!'}</span>
              </div>
              <Link
                href={`/learn?exam=${selectedExam}&level=${selectedLevel}&restart=true`}
                className="block w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 font-semibold text-center transition-colors"
              >
                {isEn ? 'Start Over' : '처음부터 다시 학습'}
              </Link>
            </div>
          ) : (
            <Link
              href={`/learn?exam=${selectedExam}&level=${selectedLevel}`}
              className="block w-full py-4 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl text-center transition-colors"
            >
              {learnedWords === 0 ? (isEn ? 'Start Learning' : '학습 시작하기') : (isEn ? 'Resume Learning' : '이어서 학습하기')}
            </Link>
          )}
        </section>

        {/* 오늘의 학습 목표 Hero */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6 relative overflow-hidden">
          <div className="relative">
            <span className={`text-sm font-semibold block mb-2 ${isCompleted ? 'text-emerald-600' : 'text-teal-600'}`}>
              {isCompleted ? '🎉 ' + (isEn ? 'Complete!' : '학습 완료!') : (isEn ? "Today's Goal" : '오늘의 학습 목표')}
            </span>

            {isCompleted ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-2">
                  {isEn ? `${exam.name} ${level.name} Complete!` : `${exam.name} ${level.name} 마스터!`}<br />
                  <span className="text-emerald-600">{totalWords}{isEn ? '' : '개'}</span> {isEn ? 'words completed!' : '단어 완료'}
                </h2>
                <p className="text-sm text-gray-500">
                  {isEn ? "You've learned all words! Try a quiz to test your knowledge." : '모든 단어를 학습했어요! 복습 퀴즈로 실력을 확인해보세요.'}
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-2">
                  {isEn ? 'Words to learn next' : '다음 학습할 단어'}<br />
                  <span className="text-teal-600">{todayRemaining}{isEn ? '' : '개'}</span>
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  {isEn ? <>Takes about <span className="font-semibold text-gray-900">{estimatedMinutes} min</span></> : <>지금 시작하면 <span className="font-semibold text-gray-900">{estimatedMinutes}분</span>이면 끝나요</>}
                </p>
              </>
            )}
          </div>

          {/* 장식 요소 */}
          <div className="absolute top-4 right-4 opacity-40 select-none pointer-events-none hidden md:flex gap-1">
            <span className="text-4xl transform -rotate-12">{isCompleted ? '🎉' : '📚'}</span>
            <span className="text-3xl transform rotate-6">{isCompleted ? '✅' : '✨'}</span>
          </div>
        </section>

        {/* Course Selection — Collapsible */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <button
            onClick={() => setIsCourseExpanded(!isCourseExpanded)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-900">
                {isEn ? 'Current Course' : '현재 코스'}
              </span>
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium">
                {examCfg?.label || selectedExam} · {level.name || selectedLevel}
              </span>
            </div>
            <span className={`text-gray-400 transition-transform duration-200 ${isCourseExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {isCourseExpanded && (
            <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
              {/* 시험 선택 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">{isEn ? 'Select Exam' : '시험 선택'}</h4>
                <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                  {availableExams.map(({ exam: key, locked }) => {
                    const cfg = EXAM_MAP[key];
                    if (!cfg) return null;
                    const activeColors: Record<string, string> = {
                      CSAT: 'bg-teal-500', TEPS: 'bg-purple-500', CSAT_2026: 'bg-emerald-500',
                      EBS: 'bg-green-500', TOEFL: 'bg-blue-600', TOEIC: 'bg-green-500',
                      SAT: 'bg-orange-500', GRE: 'bg-indigo-500', IELTS: 'bg-sky-500',
                    };
                    const defaultLevel = getValidLevelsForExam(key)[0];
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          if (locked) { router.push('/pricing'); return; }
                          const lastLevel = localStorage.getItem(`dashboard_${key}_level`) || defaultLevel;
                          const lvl = getValidLevelForExam(key, lastLevel);
                          setActiveExamWithLevel(key as ExamType, lvl as 'L1' | 'L2' | 'L3');
                          setStableQuery({ exam: key, level: lvl });
                          setIsCourseExpanded(false);
                        }}
                        className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all ${
                          locked
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : selectedExam === key
                            ? `${activeColors[key] || 'bg-teal-500'} text-white`
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <span className="text-2xl">{cfg.icon}</span>
                        <span className="font-semibold text-xs">{cfg.label}</span>
                        {locked && <span className="text-xs">🔒</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 레벨 선택 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  {isEn ? 'Select Level' : (selectedExam === 'CSAT_2026' || selectedExam === 'EBS') ? '유형 선택' : (selectedExam === 'TOEFL' || selectedExam === 'TOEIC' || selectedExam === 'SAT' || selectedExam === 'GRE' || selectedExam === 'IELTS') ? '난이도 선택' : '레벨 선택'}
                </h4>
                <div className="flex gap-3">
                  {getValidLevelsForExam(selectedExam).map((lvl) => {
                    const isLocked = isLevelLocked(user, selectedExam, lvl);
                    const useKeyDisplay = selectedExam === 'CSAT' || selectedExam === 'TEPS';
                    const levelLabel = useKeyDisplay ? getLevelShortLabel(selectedExam, lvl) : getLevelLabel(selectedExam, lvl);
                    const displayName = useKeyDisplay ? lvl : getLevelShortLabel(selectedExam, lvl);
                    return (
                      <button
                        key={lvl}
                        onClick={() => {
                          if (isLocked) {
                            router.push('/pricing');
                          } else {
                            setActiveLevel(lvl as 'L1' | 'L2' | 'L3');
                            localStorage.setItem(`dashboard_${selectedExam}_level`, lvl);
                            setStableQuery(prev => prev ? { ...prev, level: lvl } : null);
                            setIsCourseExpanded(false);
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
                          <span className="font-semibold text-sm">{levelLabel}</span>
                        ) : (
                          <>
                            <div className="flex items-center gap-1">
                              <span className="font-bold">{displayName}</span>
                              {isLocked && <span className="text-sm">🔒</span>}
                            </div>
                            {(!isEn || useKeyDisplay) && (
                              <span className={`text-xs mt-1 ${
                                isLocked ? 'text-gray-400' : selectedLevel === lvl ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {levelLabel}
                              </span>
                            )}
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SAT 테마별 학습 — Collapsible */}
        {selectedExam === 'SAT' && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <button
              onClick={() => setIsThemeExpanded(!isThemeExpanded)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition"
            >
              <span className="text-sm font-semibold text-gray-900">
                {isEn ? 'Theme Learning' : '테마별 학습'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {isEn ? '20 themes' : '20개 테마'}
                </span>
                <span className={`text-gray-400 transition-transform duration-200 ${isThemeExpanded ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </div>
            </button>

            {isThemeExpanded && (
              <div className="px-4 pb-4">
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {SAT_THEMES.map((theme) => (
                    <button
                      key={theme.key}
                      onClick={() => {
                        setActiveLevel(theme.key as any);
                        localStorage.setItem(`dashboard_SAT_level`, theme.key);
                        setStableQuery(prev => prev ? { ...prev, level: theme.key } : null);
                        setIsThemeExpanded(false);
                      }}
                      className={`flex flex-col items-center py-3 px-1 rounded-xl transition-all text-center ${
                        selectedLevel === theme.key
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span className="text-xl mb-1">{theme.emoji}</span>
                      <span className="font-medium text-[11px] leading-tight">{isEn ? (theme.labelEn || theme.label) : theme.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 연속 학습일 + 캘린더 */}
        {(stats?.currentStreak || 0) === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">
                {isEn ? 'Learning Streak' : '학습 스트릭'}
              </span>
              <span className="text-sm text-gray-500">
                {isEn
                  ? "🔥 Complete today's goal to start!"
                  : '🔥 오늘 목표를 달성하면 시작돼요!'}
              </span>
            </div>
          </div>
        ) : (
          <section className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">{isEn ? 'Learning Streak' : '연속 학습일'}</h3>
              <span className="text-sm text-gray-500">
                {isEn
                  ? new Date(currentYear, currentMonth).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                  : `${currentYear}년 ${currentMonth + 1}월`}
              </span>
            </div>

            <div className="flex gap-4 mb-4">
              <div className="flex-1 bg-teal-50 rounded-xl p-4 text-center">
                <span className="text-2xl mb-1 block">🔥</span>
                <p className="text-2xl font-bold text-teal-600">{stats?.currentStreak || 0}{isEn ? 'd' : '일'}</p>
                <p className="text-xs text-gray-500">{isEn ? 'Current' : '현재 연속'}</p>
              </div>
              <div className="flex-1 bg-amber-50 rounded-xl p-4 text-center">
                <span className="text-2xl mb-1 block">🏆</span>
                <p className="text-2xl font-bold text-amber-600">{stats?.longestStreak || 0}{isEn ? 'd' : '일'}</p>
                <p className="text-xs text-gray-500">{isEn ? 'Best' : '최장 기록'}</p>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {(isEn ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['일', '월', '화', '수', '목', '금', '토']).map((day, i) => (
                <div key={`${day}-${i}`} className="text-xs text-gray-400 py-1">{day}</div>
              ))}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="py-2" />
              ))}
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
        )}
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
