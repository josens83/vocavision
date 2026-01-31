'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, useExamCourseStore, useUserSettingsStore, ExamType } from '@/lib/store';
import { progressAPI, wordsAPI, learningAPI, api } from '@/lib/api';
import { canAccessExamWithPurchase, canAccessContentWithPurchase, getAvailableExams, getSubscriptionTier } from '@/lib/subscription';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { SkeletonDashboard } from '@/components/ui/Skeleton';

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

// Exam info
const examInfo: Record<string, { name: string; icon: string; color: string }> = {
  CSAT: { name: '수능', icon: '📝', color: 'blue' },
  CSAT_2026: { name: '2026 기출', icon: '📋', color: 'emerald' },
  TEPS: { name: 'TEPS', icon: '🎓', color: 'purple' },
};

// Get valid level for exam (TEPS only has L1, L2)
const getValidLevelForExam = (exam: string, level: string): string => {
  if (exam === 'TEPS') {
    return ['L1', 'L2'].includes(level) ? level : 'L1';
  }
  if (exam === 'CSAT_2026') {
    return ['LISTENING', 'READING_2', 'READING_3'].includes(level) ? level : 'LISTENING';
  }
  return ['L1', 'L2', 'L3'].includes(level) ? level : 'L1';
};

// Level info - exam-specific
const getLevelInfo = (exam: string, level: string) => {
  if (exam === 'CSAT_2026') {
    const csat2026Levels: Record<string, { name: string; description: string; target: string; wordCount: number }> = {
      LISTENING: { name: '듣기', description: '듣기 영역 1~17번', target: '듣기 만점', wordCount: 100 },
      READING_2: { name: '독해 2점', description: '독해 2점 문항', target: '기본 확보', wordCount: 191 },
      READING_3: { name: '독해 3점', description: '고난도 3점 문항', target: '고득점', wordCount: 91 },
    };
    return csat2026Levels[level] || csat2026Levels.LISTENING;
  }

  if (exam === 'TEPS') {
    const tepsLevels: Record<string, { name: string; description: string; target: string; wordCount: number }> = {
      L1: { name: '기본', description: 'TEPS 기본 어휘', target: '기본 점수 목표', wordCount: 369 },
      L2: { name: '필수', description: 'TEPS 필수 어휘', target: '고득점 목표', wordCount: 136 },
    };
    return tepsLevels[level] || tepsLevels.L1;
  }

  const defaultLevels: Record<string, { name: string; description: string; target: string; wordCount: number }> = {
    L1: { name: '초급', description: '기초 필수 단어', target: '3등급 목표', wordCount: 882 },
    L2: { name: '중급', description: '핵심 심화 단어', target: '2등급 목표', wordCount: 748 },
    L3: { name: '고급', description: '고난도 단어', target: '1등급 목표', wordCount: 157 },
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

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const activeExam = useExamCourseStore((state) => state.activeExam);
  const activeLevel = useExamCourseStore((state) => state.activeLevel);
  const setActiveExam = useExamCourseStore((state) => state.setActiveExam);
  const setActiveLevel = useExamCourseStore((state) => state.setActiveLevel);

  // dailyGoal: Zustand store에서 관리 (Hero.tsx와 동기화)
  const dailyGoal = useUserSettingsStore((state) => state.dailyGoal);
  const setDailyGoal = useUserSettingsStore((state) => state.setDailyGoal);

  const [stats, setStats] = useState<UserStats | null>(null);
  const [dueReviewCount, setDueReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [examLevelTotalWords, setExamLevelTotalWords] = useState(0);
  const [examLevelLearnedWords, setExamLevelLearnedWords] = useState(0);
  const [examLevelLoading, setExamLevelLoading] = useState(false);
  const [weakWordCount, setWeakWordCount] = useState(0);
  const [learningSession, setLearningSession] = useState<LearningSessionData | null>(null);
  const [hasCsat2026Access, setHasCsat2026Access] = useState(false);

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

  // 이전 시험/레벨 추적 (부분 로딩용)
  const prevExamRef = useRef(activeExam);
  const prevLevelRef = useRef(activeLevel);
  const isInitialLoadRef = useRef(true);

  // 통합 대시보드 로딩 함수 (최적화)
  const loadDashboard = async (isPartialLoad = false) => {
    // 부분 로딩: examLevelLoading만, 전체 로딩: 둘 다
    if (isPartialLoad) {
      setExamLevelLoading(true);
    } else {
      setLoading(true);
      setExamLevelLoading(true);
    }

    try {
      const examCategory = activeExam || 'CSAT';
      const level = getValidLevelForExam(examCategory, activeLevel || 'L1');

      // 병렬 요청: 대시보드 요약 + 2026 기출 접근 권한
      const [summaryData, csat2026Access] = await Promise.all([
        progressAPI.getDashboardSummary(examCategory, level),
        api.get('/packages/check-access?slug=2026-csat-analysis').catch(() => ({ data: { hasAccess: false } }))
      ]);

      // 대시보드 요약 데이터 설정
      setStats(summaryData.stats);
      setDueReviewCount(summaryData.dueReviewCount || 0);
      setExamLevelTotalWords(summaryData.totalWords || 0);
      setExamLevelLearnedWords(summaryData.learnedWords || 0);
      setWeakWordCount(summaryData.weakWordsCount || 0);
      setLearningSession(summaryData.learningSession);
      setHasCsat2026Access(csat2026Access.data?.hasAccess || false);

      // dailyGoal 동기화
      if (summaryData.stats?.dailyGoal) {
        setDailyGoal(summaryData.stats.dailyGoal);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
      setExamLevelLoading(false);
    }
  };

  // 초기 로딩 (로그인 체크)
  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      loadDashboard(false);  // 전체 로딩
    }
  }, [user, hasHydrated, router]);

  // 시험/레벨 변경 시 부분 로딩
  useEffect(() => {
    if (!hasHydrated || !user || isInitialLoadRef.current) return;

    if (prevExamRef.current !== activeExam || prevLevelRef.current !== activeLevel) {
      prevExamRef.current = activeExam;
      prevLevelRef.current = activeLevel;
      loadDashboard(true);  // 부분 로딩
    }
  }, [activeExam, activeLevel, hasHydrated, user]);

  // CSAT_2026 접근권한 없으면 CSAT으로 fallback
  useEffect(() => {
    if (hasHydrated && activeExam === 'CSAT_2026' && !hasCsat2026Access) {
      setActiveExam('CSAT' as ExamType);
      setActiveLevel('L1');
    }
  }, [hasHydrated, activeExam, hasCsat2026Access, setActiveExam, setActiveLevel]);

  // 잘못된 시험/레벨 조합 수정 (예: TEPS + L3 → TEPS + L1)
  useEffect(() => {
    if (!hasHydrated || !activeExam) return;
    const validLevel = getValidLevelForExam(activeExam, activeLevel || 'L1');
    if (validLevel !== activeLevel) {
      setActiveLevel(validLevel as 'L1' | 'L2' | 'L3');
    }
  }, [hasHydrated, activeExam, activeLevel, setActiveLevel]);

  const selectedExam = activeExam || 'CSAT';
  const selectedLevel = activeLevel || 'L1';
  const exam = examInfo[selectedExam];
  const level = getLevelInfo(selectedExam, selectedLevel);

  const totalWords = examLevelTotalWords || level.wordCount;
  // learningSession이 있으면 totalReviewed + currentIndex 사용 (현재 Set 진행분 포함)
  const learnedWords = learningSession
    ? learningSession.totalReviewed + learningSession.currentIndex
    : examLevelLearnedWords;
  const remainingWords = Math.max(totalWords - learnedWords, 0);
  const progressPercent = totalWords > 0 ? Math.min(Math.round((learnedWords / totalWords) * 100), 100) : 0;

  // Set 계산 (세션의 totalWords 또는 전체 totalWords 기준으로 계산)
  const totalSets = Math.ceil((learningSession?.totalWords || totalWords) / 20);
  const currentSet = learningSession
    ? learningSession.currentSet + 1  // 서버는 0-indexed, UI는 1-indexed
    : (learnedWords > 0 ? Math.floor((learnedWords - 1) / 20) + 1 : 1);
  const wordsInCurrentSet = learningSession
    ? learningSession.currentIndex + 1  // 서버는 0-indexed, UI는 1-indexed (0 → "1/20")
    : (learnedWords > 0 ? ((learnedWords - 1) % 20) + 1 : 1);  // 학습 시작 전에도 1/20

  // 마지막 Set의 단어 수 계산 (158개면 마지막 Set은 18개)
  const isLastSet = currentSet === totalSets;
  const wordsInLastSet = totalWords % 20 || 20;  // 나머지가 0이면 20
  const wordsPerCurrentSet = isLastSet ? wordsInLastSet : 20;

  // 학습 완료 여부 (세션 상태 또는 남은 단어 기준)
  const isCompleted = (learningSession?.status === 'COMPLETED') ||
    (remainingWords === 0 && totalWords > 0) ||
    (learningSession && learningSession.totalReviewed >= totalWords && totalWords > 0);

  // 현재 Set에서 남은 단어 수 (Set당 최대 20개)
  const currentSetRemaining = wordsPerCurrentSet - wordsInCurrentSet + 1;
  const todayRemaining = Math.min(currentSetRemaining, remainingWords);
  const estimatedMinutes = Math.ceil(todayRemaining * 0.3);

  if (!hasHydrated || loading) {
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
                  {weakWordCount > 0
                    ? `잘 모르는 단어 ${weakWordCount}개를 복습해보세요!`
                    : '완벽하게 암기했어요! 다음 레벨에 도전해보세요.'}
                </p>
                <div className="space-y-2">
                  <Link
                    href={`/learn?exam=${selectedExam.toLowerCase()}&level=${selectedLevel}&restart=true`}
                    className="block w-full bg-emerald-50 hover:bg-emerald-100 rounded-xl py-4 text-emerald-600 font-semibold text-center transition-colors"
                  >
                    처음부터 다시 학습
                  </Link>
                  {weakWordCount > 0 && (
                    <Link
                      href={`/learn?exam=${selectedExam.toLowerCase()}&level=${selectedLevel}&mode=weak`}
                      className="block w-full bg-amber-50 hover:bg-amber-100 rounded-xl py-4 text-amber-600 font-semibold text-center transition-colors"
                    >
                      잘 모르는 {weakWordCount}개만 학습
                    </Link>
                  )}
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
                  href={`/learn?exam=${selectedExam.toLowerCase()}&level=${selectedLevel}`}
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

          <div className={`grid gap-3 ${hasCsat2026Access ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {/* 수능 버튼 */}
            <button
              onClick={() => {
                setActiveExam('CSAT' as ExamType);
                const lastLevel = localStorage.getItem('dashboard_CSAT_level') || 'L1';
                setActiveLevel(lastLevel as 'L1' | 'L2' | 'L3');
              }}
              className={`flex items-center justify-center gap-2 py-4 rounded-xl transition-all ${
                selectedExam === 'CSAT'
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="text-xl">📝</span>
              <span className="font-semibold text-sm">수능</span>
            </button>

            {/* 2026 기출 버튼 - 단품 구매자만 표시 */}
            {hasCsat2026Access && (
              <button
                onClick={() => {
                  setActiveExam('CSAT_2026' as ExamType);
                  const lastLevel = localStorage.getItem('dashboard_CSAT_2026_level') || 'LISTENING';
                  setActiveLevel(lastLevel as 'L1' | 'L2' | 'L3');
                }}
                className={`flex items-center justify-center gap-2 py-4 rounded-xl transition-all ${
                  selectedExam === 'CSAT_2026'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="text-xl">📋</span>
                <span className="font-semibold text-sm">2026 기출</span>
              </button>
            )}

            {/* TEPS 버튼 */}
            <button
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
              className={`flex items-center justify-center gap-2 py-4 rounded-xl transition-all ${
                !canAccessExam('TEPS')
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : selectedExam === 'TEPS'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="text-xl">🎓</span>
              <span className="font-semibold text-sm">TEPS</span>
              {!canAccessExam('TEPS') && <span className="text-xs">🔒</span>}
            </button>
          </div>
        </section>

        {/* 레벨/유형 선택 섹션 */}
        <section className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            {selectedExam === 'CSAT_2026' ? '유형 선택' : '레벨 선택'}
          </h3>

          <div className="flex gap-3">
            {(selectedExam === 'CSAT_2026'
              ? ['LISTENING', 'READING_2', 'READING_3'] as const
              : selectedExam === 'TEPS'
                ? ['L1', 'L2'] as const
                : ['L1', 'L2', 'L3'] as const
            ).map((lvl) => {
              const isLocked = selectedExam !== 'CSAT_2026' && !canAccessLevel(selectedExam, lvl as 'L1' | 'L2' | 'L3');
              const levelLabel = selectedExam === 'CSAT_2026'
                ? (lvl === 'LISTENING' ? '듣기영역' : lvl === 'READING_2' ? '독해 2점' : '독해 3점')
                : selectedExam === 'TEPS'
                  ? (lvl === 'L1' ? '기본' : '필수')
                  : (lvl === 'L1' ? '초급' : lvl === 'L2' ? '중급' : '고급');
              const displayName = selectedExam === 'CSAT_2026'
                ? (lvl === 'LISTENING' ? '듣기' : lvl === 'READING_2' ? '2점' : '3점')
                : lvl;
              return (
                <button
                  key={lvl}
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
                      ? selectedExam === 'CSAT_2026' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {selectedExam === 'CSAT_2026' ? (
                    // CSAT_2026: 한 줄로 표시
                    <span className="font-semibold text-sm">
                      {lvl === 'LISTENING' ? '듣기영역' : lvl === 'READING_2' ? '독해영역 2점' : '독해영역 3점'}
                    </span>
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
                href={`/learn?exam=${selectedExam.toLowerCase()}&level=${selectedLevel}&restart=true`}
                className="block w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 font-semibold text-center transition-colors"
              >
                처음부터 다시 학습
              </Link>
              {weakWordCount > 0 && (
                <Link
                  href={`/learn?exam=${selectedExam.toLowerCase()}&level=${selectedLevel}&mode=weak`}
                  className="block w-full py-3 bg-amber-50 hover:bg-amber-100 rounded-xl text-amber-600 font-semibold text-center transition-colors"
                >
                  잘 모르는 단어 {weakWordCount}개만 학습
                </Link>
              )}
            </div>
          ) : (
            <Link
              href={`/learn?exam=${selectedExam.toLowerCase()}&level=${selectedLevel}`}
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
