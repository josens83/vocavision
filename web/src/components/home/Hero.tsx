"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { PLATFORM_STATS } from "@/constants/stats";
import { useAuthStore, useUserSettingsStore, useExamCourseStore } from "@/lib/store";
import { userAPI } from "@/lib/api";
import { useDashboardSummary, usePrefetchDashboard, usePrefetchReviews } from "@/hooks/useQueries";
import { useLocale } from "@/hooks/useLocale";

const Icons = {
  Play: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Sparkles: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  BookOpen: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  Brain: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  ChartBar: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
    </svg>
  ),
};

// Hero 섹션 통계 (실제 데이터 기반)
const heroStatsKo = [
  { label: "영어 단어", value: PLATFORM_STATS.totalWords.toLocaleString() + "+" },
  { label: "시험 대비", value: "8" },
  { label: "예문 데이터", value: "40,000+" },
  { label: "AI 이미지", value: "10,000+" },
  { label: "AI 이미지 종류", value: "3" },
];

const heroStatsEn = [
  { label: "Vocabulary Words", value: PLATFORM_STATS.totalWords.toLocaleString() + "+" },
  { label: "Exams Covered", value: "7" },
  { label: "Example Sentences", value: "40,000+" },
  { label: "AI Images", value: "10,000+" },
  { label: "AI-Powered", value: "✓" },
];

const featuresKo = [
  { icon: Icons.Sparkles, title: "AI 이미지", description: "Concept · Rhyme 단어마다 자동 생성", href: "/help", demoHref: "/words/9428f46b-73f5-4495-a594-b7c609209336?exam=CSAT" },
  { icon: Icons.BookOpen, title: "스마트 플래시카드", description: "과학적 간격 반복으로 효율적 암기", href: "/learn", demoHref: "/learn?exam=CSAT&level=L1&demo=true" },
  { icon: Icons.Brain, title: "어원·형태 분석", description: "Greek · Latin 어근으로 단어족 확장", href: "/help", demoHref: "/words/9428f46b-73f5-4495-a594-b7c609209336?exam=CSAT#etymology" },
];

const featuresEn = [
  { icon: Icons.Sparkles, title: "AI Images / Word", description: "Concept + Rhyme images auto-generated per word", href: "/help", demoHref: "/words/177b6c91-fb4b-4314-8415-0922915583a3?exam=SAT" },
  { icon: Icons.BookOpen, title: "Smart Flashcards", description: "Scientifically proven spaced repetition", href: "/learn", demoHref: "/learn?exam=SAT&level=L1&demo=true" },
  { icon: Icons.Brain, title: "Etymology & Morphology", description: "Greek · Latin roots for word family mastery", href: "/help", demoHref: "/words/95887bd1-1da0-4597-9c99-d6efc59920b0?exam=SAT" },
];

// ============================================
// DashboardItem 컴포넌트 (은행 앱 스타일)
// ============================================
function DashboardItem({ value, label, color, suffix }: { value: string | number, label: string, color: string, suffix?: string }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-1">
      <span
        className="text-[22px] font-bold"
        style={{ color, fontVariantNumeric: 'tabular-nums' }}
      >
        {value}{suffix && <span className="text-[14px] font-medium ml-0.5">{suffix}</span>}
      </span>
      <span className="text-[12px] text-gray-500">{label}</span>
    </div>
  );
}

// ============================================
// 단어 찾기 카드 컴포넌트
// ============================================
function WordSearchCard({ className = '' }: { className?: string }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/words?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/words');
    }
  };

  const popularWords = ['contemporary', 'circumstance', 'nevertheless', 'stimulate'];

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 w-full overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Search className="w-5 h-5 text-teal-600" />
        <h3 className="font-semibold text-gray-900">단어 찾기</h3>
      </div>

      {/* 검색창 */}
      <div className="relative">
        <input
          type="text"
          placeholder="영어 단어를 검색하세요"
          className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          onClick={handleSearch}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* 인기 검색어 태그 */}
      <div className="mt-3 flex items-center flex-wrap gap-2">
        <span className="text-xs text-gray-500">인기:</span>
        {popularWords.map((word) => (
          <button
            key={word}
            onClick={() => router.push(`/words?search=${word}`)}
            className="px-2 py-1 bg-gray-100 hover:bg-teal-50 text-gray-600 hover:text-teal-600 text-xs rounded-full transition-colors"
          >
            {word}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================
// 남은 일수 계산 헬퍼 함수
// ============================================
function getDaysRemaining(subscriptionEnd?: string) {
  if (!subscriptionEnd) return null;
  const end = new Date(subscriptionEnd);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : null;
}

// ============================================
// 회원 정보 카드 (모바일용)
// ============================================
function MemberInfoCard() {
  const { user, _hasHydrated } = useAuthStore();
  const activeExam = useExamCourseStore((state) => state.activeExam);
  const activeLevel = useExamCourseStore((state) => state.activeLevel);
  const examHasHydrated = useExamCourseStore((state) => state._hasHydrated);
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  const daysRemaining = getDaysRemaining(user?.subscriptionEnd);
  const rawPlan = (user as any)?.subscriptionPlan || 'FREE';
  const plan = daysRemaining !== null ? rawPlan : 'FREE';

  // 프리패치 훅
  const prefetchDashboard = usePrefetchDashboard();
  const prefetchReviews = usePrefetchReviews();

  // React Query: 캐싱된 대시보드 데이터 사용
  // 홈페이지(/)에서만 활성화 — 다른 페이지에서 렌더되더라도 API 호출 방지
  const { data: summaryData, isLoading: loading, isError, refetch } = useDashboardSummary(
    activeExam || 'CSAT',
    activeLevel || 'L1',
    isHomePage && !!user && _hasHydrated && examHasHydrated
  );

  // 데이터 추출
  const stats = summaryData ? {
    currentStreak: summaryData.stats?.currentStreak || 0,
    todayWordsLearned: summaryData.stats?.todayWordsLearned || 0,
    dueReviewCount: summaryData.dueReviewCount || 0,
    todayFlashcardAccuracy: summaryData.stats?.todayFlashcardAccuracy || 0,
  } : null;

  if (!user) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 w-full max-w-full overflow-hidden">
      {/* 상단: 프로필 한 줄 (이름 · 플랜 D-day) */}
      <div className="flex items-center gap-3 mb-4 min-w-0">
        <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-bold">
            {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
          </span>
        </div>
        <p className="text-[15px] text-gray-900 truncate min-w-0">
          <span className="font-semibold">{user?.name || '회원'}</span>
          <span className="text-gray-300 mx-1.5">·</span>
          {(plan === 'YEARLY' || plan === 'FAMILY') && (
            <span className="text-amber-600 font-medium text-sm">
              👑 프리미엄{daysRemaining ? ` (D-${daysRemaining})` : ''}
            </span>
          )}
          {plan === 'MONTHLY' && (
            <span className="text-teal-600 font-medium text-sm">
              ✨ 베이직{daysRemaining ? ` (D-${daysRemaining})` : ''}
            </span>
          )}
          {plan === 'FREE' && (
            <span className="text-gray-500 font-medium text-sm">무료 플랜</span>
          )}
        </p>
      </div>

      {/* 활성 단품 구매 표시 */}
      {(() => {
        const activePurchases = (user as any)?.purchases?.filter(
          (p: any) => new Date(p.expiresAt) > new Date()
        ) || [];
        return activePurchases.length > 0 ? (
          <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3 -mt-2">
            {activePurchases.map((p: any) => (
              <span key={p.id} className="text-xs text-blue-600">
                📦 {p.package?.name || p.packageName} (~{new Date(p.expiresAt).toLocaleDateString('ko-KR')})
              </span>
            ))}
          </div>
        ) : null;
      })()}

      {/* 중단: 오늘의 학습 현황 통계 */}
      <div className="py-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-400">오늘의 학습</p>
          {!loading && stats && stats.currentStreak > 0 && (
            <span className="text-xs text-orange-500 font-medium flex items-center gap-1">
              🔥 {stats.currentStreak}일 연속
            </span>
          )}
        </div>
        {loading ? (
          <div className="flex justify-between items-center">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="h-6 w-12 bg-slate-200 rounded animate-pulse" />
                <div className="h-3 w-14 bg-slate-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <p className="text-sm text-gray-500">데이터를 불러올 수 없습니다</p>
            <button
              onClick={() => refetch()}
              className="text-sm text-teal-600 font-medium hover:text-teal-700"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <DashboardItem
              value={stats?.todayWordsLearned || 0}
              label="오늘 학습"
              color="#3B82F6"
            />
            <div className="w-[1px] h-10 bg-[#f0f0f0]" />
            <DashboardItem
              value={stats?.dueReviewCount || 0}
              label="복습 대기"
              color="#F59E0B"
            />
            <div className="w-[1px] h-10 bg-[#f0f0f0]" />
            <DashboardItem
              value={stats?.todayFlashcardAccuracy || 0}
              label="정답률"
              color="#10B981"
              suffix="%"
            />
          </div>
        )}
      </div>

      {/* 하단: 학습하기 / 복습하기 버튼 */}
      <div className="pt-4 border-t border-gray-100 flex gap-3">
        <Link
          href="/dashboard"
          onMouseEnter={() => prefetchDashboard(activeExam || 'CSAT', activeLevel || 'L1')}
          className="flex-1 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl text-center transition-colors"
        >
          학습하기
        </Link>
        <Link
          href="/review"
          onMouseEnter={() => prefetchReviews(activeExam || 'CSAT', activeLevel || 'L1')}
          className="flex-1 py-3 bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold rounded-xl text-center transition-colors"
        >
          복습하기
        </Link>
      </div>
    </div>
  );
}

// ============================================
// 전체 학습 현황 카드
// ============================================
function TotalStatsCard({
  stats,
  loading,
  isError,
  refetch,
  className = '',
}: {
  stats: { totalWordsLearned: number; totalFlashcardAccuracy: number } | null;
  loading: boolean;
  isError: boolean;
  refetch: () => void;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-200 w-full overflow-hidden ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <Icons.ChartBar />
        </div>
        <h3 className="font-semibold text-gray-900">전체 학습 현황</h3>
      </div>

      {/* 누적 통계 그리드 */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="h-7 w-14 bg-slate-200 rounded animate-pulse mx-auto mb-1" />
              <div className="h-3 w-16 bg-slate-100 rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-2 py-4 mb-4">
          <p className="text-sm text-gray-500">데이터를 불러올 수 없습니다</p>
          <button
            onClick={refetch}
            className="text-sm text-purple-600 font-medium hover:text-purple-700"
          >
            다시 시도
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-purple-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-purple-600" style={{ fontVariantNumeric: 'tabular-nums' }}>{stats?.totalWordsLearned || 0}</p>
            <p className="text-xs text-gray-500">누적 학습 단어</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-purple-600" style={{ fontVariantNumeric: 'tabular-nums' }}>{stats?.totalFlashcardAccuracy || 0}<span className="text-base font-medium ml-0.5">%</span></p>
            <p className="text-xs text-gray-500">전체 정답률</p>
          </div>
        </div>
      )}

      {/* 자세히 보기 */}
      <Link
        href="/statistics"
        className="flex items-center justify-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium py-2 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
      >
        자세히 보기
        <Icons.ChevronRight />
      </Link>
    </div>
  );
}

// ============================================
// 오늘의 목표 카드
// ============================================
function DailyGoalCard({
  todayProgress,
  dailyGoal,
  setDailyGoal,
  progressPercent,
  goalOptions,
  className = '',
}: {
  todayProgress: number;
  dailyGoal: number;
  setDailyGoal: (goal: number) => void;
  progressPercent: number;
  goalOptions: number[];
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-200 w-full overflow-hidden ${className}`}>
      <div className="flex items-center justify-between mb-4 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg flex-shrink-0">⚡</span>
          <h3 className="text-[15px] font-bold text-[#1c1c1e] truncate">오늘의 목표</h3>
        </div>
        <span className="text-[13px] text-[#14B8A6] font-semibold flex-shrink-0 whitespace-nowrap">
          {progressPercent >= 100 ? '🎉 ' : ''}{progressPercent}% 달성
        </span>
      </div>

      {/* 프로그레스 바 */}
      <div className="w-full h-2 bg-[#f0f0f0] rounded-full mb-4 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            progressPercent >= 100
              ? 'bg-gradient-to-r from-[#10B981] to-[#059669]'
              : 'bg-gradient-to-r from-[#14B8A6] to-[#06B6D4]'
          }`}
          style={{ width: `${Math.min(progressPercent, 100)}%` }}
        />
      </div>

      <p className="text-[14px] text-gray-500 mb-4">
        {progressPercent >= 100
          ? `목표 달성! 오늘 ${todayProgress}개 학습 완료!`
          : `${dailyGoal - todayProgress}개만 더 학습하면 목표 달성!`}
      </p>

      {/* 목표 선택 버튼들 */}
      <div className="flex gap-2 min-w-0">
        {goalOptions.map((goal) => (
          <button
            key={goal}
            onClick={async () => {
              setDailyGoal(goal);
              try {
                await userAPI.updateDailyGoal(goal);
              } catch (error) {
                console.error('Failed to update daily goal:', error);
              }
            }}
            className={`flex-1 min-w-0 py-2.5 rounded-[12px] text-[14px] font-semibold transition-all ${
              dailyGoal === goal
                ? 'bg-[#14B8A6] text-white shadow-sm'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {goal}개
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================
// 데스크톱용 회원정보 카드 (2x2 그리드용)
// ============================================
function DesktopMemberCard({
  user,
  plan,
  daysRemaining,
  stats,
  loading,
  isError,
  refetch,
  prefetchDashboard,
  prefetchReviews,
  activeExam,
  activeLevel,
}: {
  user: any;
  plan: string;
  daysRemaining: number | null;
  stats: { currentStreak: number; todayWordsLearned: number; dueReviewCount: number; todayFlashcardAccuracy: number } | null;
  loading: boolean;
  isError: boolean;
  refetch: () => void;
  prefetchDashboard: (exam: string, level: string) => void;
  prefetchReviews: (exam: string, level: string) => void;
  activeExam: string | null;
  activeLevel: string | null;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 h-full flex flex-col">
      {/* 상단: 프로필 + 플랜 (D-day) - 한 줄 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm font-bold">
            {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
          </span>
        </div>
        <p className="text-[15px] text-gray-900 truncate min-w-0">
          <span className="font-semibold">{user?.name || '회원'}</span>
          <span className="text-gray-300 mx-1.5">·</span>
          {(plan === 'YEARLY' || plan === 'FAMILY') && (
            <span className="text-amber-600 font-medium text-sm">
              👑 프리미엄{daysRemaining ? ` (D-${daysRemaining})` : ''}
            </span>
          )}
          {plan === 'MONTHLY' && (
            <span className="text-teal-600 font-medium text-sm">
              ✨ 베이직{daysRemaining ? ` (D-${daysRemaining})` : ''}
            </span>
          )}
          {plan === 'FREE' && (
            <span className="text-gray-500 font-medium text-sm">무료 플랜</span>
          )}
        </p>
      </div>

      {/* 활성 단품 구매 표시 */}
      {(() => {
        const activePurchases = (user as any)?.purchases?.filter(
          (p: any) => new Date(p.expiresAt) > new Date()
        ) || [];
        return activePurchases.length > 0 ? (
          <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3 -mt-2">
            {activePurchases.map((p: any) => (
              <span key={p.id} className="text-xs text-blue-600">
                📦 {p.package?.name || p.packageName} (~{new Date(p.expiresAt).toLocaleDateString('ko-KR')})
              </span>
            ))}
          </div>
        ) : null;
      })()}

      {/* 중단: 오늘의 학습 현황 */}
      <div className="flex-1 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700">오늘의 학습</p>
          {!loading && stats && stats.currentStreak > 0 && (
            <span className="text-xs text-orange-500 font-medium flex items-center gap-1">
              🔥 {stats.currentStreak}일 연속
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-between items-center">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="h-6 w-12 bg-slate-200 rounded animate-pulse" />
                <div className="h-3 w-14 bg-slate-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <p className="text-sm text-gray-500">데이터를 불러올 수 없습니다</p>
            <button
              onClick={refetch}
              className="text-sm text-teal-600 font-medium hover:text-teal-700"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <DashboardItem value={stats?.todayWordsLearned || 0} label="오늘 학습" color="#3B82F6" />
            <div className="w-[1px] h-10 bg-[#f0f0f0]" />
            <DashboardItem value={stats?.dueReviewCount || 0} label="복습 대기" color="#F59E0B" />
            <div className="w-[1px] h-10 bg-[#f0f0f0]" />
            <DashboardItem value={stats?.todayFlashcardAccuracy || 0} label="정답률" color="#10B981" suffix="%" />
          </div>
        )}
      </div>

      {/* 하단: 버튼 */}
      <div className="pt-3 border-t border-gray-100 flex gap-3 mt-auto">
        <Link
          href="/dashboard"
          onMouseEnter={() => prefetchDashboard(activeExam || 'CSAT', activeLevel || 'L1')}
          className="flex-1 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl text-center transition-colors text-sm"
        >
          학습하기
        </Link>
        <Link
          href="/review"
          onMouseEnter={() => prefetchReviews(activeExam || 'CSAT', activeLevel || 'L1')}
          className="flex-1 py-2.5 bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold rounded-xl text-center transition-colors text-sm"
        >
          복습하기
        </Link>
      </div>
    </div>
  );
}

// ============================================
// 로그인 후 대시보드 (2x2 그리드)
// ============================================
function LoggedInDashboard({ isVisible }: { isVisible: boolean }) {
  const { user, _hasHydrated } = useAuthStore();
  const activeExam = useExamCourseStore((state) => state.activeExam);
  const activeLevel = useExamCourseStore((state) => state.activeLevel);
  const examHasHydrated = useExamCourseStore((state) => state._hasHydrated);
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  const daysRemaining = getDaysRemaining(user?.subscriptionEnd);
  const rawPlan = (user as any)?.subscriptionPlan || 'FREE';
  const plan = daysRemaining !== null ? rawPlan : 'FREE';

  // 프리패치 훅
  const prefetchDashboard = usePrefetchDashboard();
  const prefetchReviews = usePrefetchReviews();

  // Zustand store에서 dailyGoal 관리
  const dailyGoal = useUserSettingsStore((state) => state.dailyGoal);
  const setDailyGoal = useUserSettingsStore((state) => state.setDailyGoal);

  // React Query: 캐싱된 대시보드 데이터 사용
  // 홈페이지(/)에서만 활성화 — 다른 페이지에서 렌더되더라도 API 호출 방지
  const { data: summaryData, isLoading: loading, isError, refetch } = useDashboardSummary(
    activeExam || 'CSAT',
    activeLevel || 'L1',
    isHomePage && !!user && _hasHydrated && examHasHydrated
  );

  // dailyGoal 동기화
  useEffect(() => {
    if (summaryData?.stats?.dailyGoal) {
      setDailyGoal(summaryData.stats.dailyGoal);
    }
  }, [summaryData?.stats?.dailyGoal, setDailyGoal]);

  // 데이터 추출
  const stats = summaryData ? {
    currentStreak: summaryData.stats?.currentStreak || 0,
    todayWordsLearned: summaryData.stats?.todayWordsLearned || 0,
    totalWordsLearned: summaryData.stats?.totalWordsLearned || 0,
    dueReviewCount: summaryData.dueReviewCount || 0,
    todayFlashcardAccuracy: summaryData.stats?.todayFlashcardAccuracy || 0,
    totalFlashcardAccuracy: summaryData.stats?.totalFlashcardAccuracy || 0,
  } : null;

  const todayProgress = stats?.todayWordsLearned || 0;
  const progressPercent = Math.round((todayProgress / dailyGoal) * 100);
  const goalOptions = [20, 40, 60, 80];

  if (!user) return null;

  return (
    <div className={`${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
      {/* ========== 모바일: 세로 배치 ========== */}
      <div className="lg:hidden flex flex-col gap-4">
        <MemberInfoCard />
        <WordSearchCard />
        <TotalStatsCard stats={stats} loading={loading} isError={isError} refetch={() => refetch()} />
        <DailyGoalCard
          todayProgress={todayProgress}
          dailyGoal={dailyGoal}
          setDailyGoal={setDailyGoal}
          progressPercent={progressPercent}
          goalOptions={goalOptions}
        />
      </div>

      {/* ========== 데스크톱: 2x2 그리드 ========== */}
      <div className="hidden lg:grid grid-cols-2 gap-5">
        {/* 좌상: 회원정보 카드 */}
        <DesktopMemberCard
          user={user}
          plan={plan}
          daysRemaining={daysRemaining}
          stats={stats}
          loading={loading}
          isError={isError}
          refetch={() => refetch()}
          prefetchDashboard={prefetchDashboard}
          prefetchReviews={prefetchReviews}
          activeExam={activeExam}
          activeLevel={activeLevel}
        />

        {/* 우상: 단어 찾기 */}
        <WordSearchCard className="h-full" />

        {/* 좌하: 전체 학습 현황 */}
        <TotalStatsCard stats={stats} loading={loading} isError={isError} refetch={() => refetch()} className="h-full" />

        {/* 우하: 오늘의 목표 */}
        <DailyGoalCard
          todayProgress={todayProgress}
          dailyGoal={dailyGoal}
          setDailyGoal={setDailyGoal}
          progressPercent={progressPercent}
          goalOptions={goalOptions}
          className="h-full"
        />
      </div>
    </div>
  );
}

// ============================================
// 메인 Hero 컴포넌트
// ============================================
export default function Hero() {
  const [isVisible, setIsVisible] = useState(false);
  const { user, _hasHydrated } = useAuthStore();
  const isLoggedIn = !!user;
  const locale = useLocale();
  const heroStats = locale === 'en' ? heroStatsEn : heroStatsKo;
  const features = locale === 'en' ? featuresEn : featuresKo;

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className={`relative ${isLoggedIn ? 'min-h-0' : 'min-h-[70vh]'} flex items-center overflow-hidden`}>
      <div className="absolute inset-0 hero-gradient hero-pattern" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-level-beginner/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-level-intermediate/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-level-advanced/5 rounded-full blur-3xl" />

      <div className={`relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 ${isLoggedIn ? 'pt-2 pb-6 lg:py-8' : 'py-12'}`}>

        {/* ========== 로그인 시: 2x2 그리드 레이아웃 ========== */}
        {isLoggedIn && (
          <LoggedInDashboard isVisible={isVisible} />
        )}

        {/* ========== 비로그인 시: 기존 Hero 레이아웃 ========== */}
        {!isLoggedIn && (
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start justify-items-center lg:justify-items-start">
            {/* 왼쪽 열: Hero 텍스트 */}
            <div className={`space-y-8 min-w-0 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-surface-border shadow-sm">
                <Icons.Sparkles />
                <span className="text-sm font-medium text-slate-600">
                  {locale === 'en' ? 'Every word. AI-visualized.' : '단어마다 AI 이미지 학습.'}
                </span>
              </div>

              <h1 className="font-display leading-snug">
                {locale === 'en' ? (
                  <>
                    <span className="block text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-2">
                      See a word, <span className="text-cyan-500 font-black">remember it.</span>
                    </span>
                    <span className="block text-lg md:text-xl lg:text-2xl text-slate-600 mt-3">
                      Master SAT · GRE · TOEFL · IELTS with <span className="font-semibold text-cyan-600">Concept + Rhyme AI images</span>, etymology & mnemonics.
                    </span>
                  </>
                ) : (
                  <>
                    <span className="block text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-2">
                      단어를 <span className="text-cyan-500 font-black">보면,</span>
                    </span>
                    <span className="block text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900">
                      기억됩니다.
                    </span>
                    <span className="block text-lg md:text-xl lg:text-2xl text-slate-600 mt-3">
                      <span className="font-semibold text-cyan-600">Concept · Mnemonic · Rhyme</span> — AI가 만든 3가지 이미지로 수능 · TOEFL · SAT 단어를 눈으로 기억하세요.
                    </span>
                  </>
                )}
              </h1>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link href="/auth/login" className="btn bg-emerald-500 hover:bg-emerald-600 text-white focus:ring-emerald-500 group">
                  <Icons.Sparkles />
                  <span>{locale === 'en' ? 'Start for Free' : '무료로 시작하기'}</span>
                </Link>
                <Link href={locale === 'en' ? '/learn?exam=SAT&level=L1&demo=true' : '/learn?exam=CSAT&level=L1&demo=true'} className="btn btn-outline text-brand-primary border-brand-primary hover:bg-brand-primary/5">
                  <Icons.Play />
                  <span>{locale === 'en' ? '60s Demo' : '60초 체험'}</span>
                </Link>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-4 pt-8 border-t border-slate-200">
                {heroStats.map((stat, index) => (
                  <div key={stat.label} className={`min-w-0 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`} style={{ animationDelay: `${0.3 + index * 0.1}s` }}>
                    <div className="text-xl md:text-2xl font-display font-bold text-slate-900 tabular-nums">
                      {stat.value}
                    </div>
                    <div className="text-xs text-slate-500 whitespace-nowrap">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 오른쪽 열: 체험 카드들 */}
            <div className={`flex flex-col gap-4 w-full max-w-full sm:max-w-md mx-auto lg:mx-0 lg:max-w-lg overflow-hidden ${isVisible ? "animate-slide-in-right" : "opacity-0"}`}>
              <p className="text-sm text-slate-500 text-center mb-2">
                {locale === 'en' ? 'Click to try each feature →' : '클릭하여 기능을 체험해보세요 →'}
              </p>

              {features.map((feature, index) => (
                <Link key={feature.title} href={feature.demoHref} className="block">
                  <div className="group card p-5 md:p-6 flex items-start gap-5 cursor-pointer
                                  hover:shadow-lg hover:scale-[1.02] hover:border-brand-primary/30
                                  transition-all duration-200 border border-transparent"
                       style={{ animationDelay: `${0.2 + index * 0.15}s` }}>
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110
                      ${index === 0 ? "bg-level-beginner-light text-level-beginner" : ""}
                      ${index === 1 ? "bg-level-intermediate-light text-level-intermediate" : ""}
                      ${index === 2 ? "bg-level-advanced-light text-level-advanced" : ""}`}>
                      <feature.icon />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base sm:text-lg font-semibold text-slate-900 truncate">{feature.title}</h3>
                        <span className="text-xs font-medium text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {locale === 'en' ? 'Try it' : '체험하기'}
                        </span>
                      </div>
                      <p className="text-sm sm:text-base text-slate-600 line-clamp-2">{feature.description}</p>
                    </div>
                    <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}

              {/* 체험 유도 카드 */}
              <div className="relative overflow-hidden card p-6 bg-gradient-to-br from-brand-primary to-brand-secondary text-white">
                <div className="relative z-10">
                  <h4 className="text-lg font-semibold mb-2">
                    {locale === 'en' ? 'Try it in 60 seconds!' : '60초 안에 체험해보세요!'}
                  </h4>
                  <p className="text-white/80 mb-4">
                    {locale === 'en' ? 'Quick demo with sample words — no sign-up required' : '회원가입 없이 샘플 단어로 빠르게 체험'}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link href={locale === 'en' ? '/learn?exam=SAT&level=L1&demo=true' : '/learn?exam=CSAT&level=L1&demo=true'} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-brand-primary hover:bg-white/90 rounded-lg font-medium transition-colors group">
                      <span>{locale === 'en' ? 'Start Demo' : '맛보기 시작'}</span>
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                    <Link href="/auth/login" className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/20 text-white hover:bg-white/30 border border-white/30 rounded-lg font-medium transition-colors">
                      <span>{locale === 'en' ? 'Start for Free' : '무료로 시작하기'}</span>
                    </Link>
                  </div>
                </div>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full" />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
