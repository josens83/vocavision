"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { PLATFORM_STATS } from "@/constants/stats";
import { useAuthStore, useUserSettingsStore } from "@/lib/store";
import { getPlanDisplay } from "@/lib/subscription";
import { progressAPI, userAPI } from "@/lib/api";

// ============================================
// 브랜드 컬러 시스템 (은행 앱 스타일)
// ============================================
const brandColors = {
  primary: '#14B8A6',      // 틸 (VocaVision 메인)
  primaryLight: '#ECFDF5', // 연틸 배경
  secondary: '#A855F7',    // 보라 (복습)
  secondaryLight: '#F3E8FF',
  success: '#00C7AE',      // 민트 (완료)
  warning: '#FFB300',      // 앰버

  // 텍스트
  textPrimary: '#1c1c1e',
  textSecondary: '#767676',
  textMuted: '#999999',

  // 배경/보더
  bgCard: '#F8F9FA',
  bgWhite: '#FFFFFF',
  border: '#f0f0f0',
  borderLight: '#f5f5f5',
};

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
const stats = [
  { label: "수능 필수", value: PLATFORM_STATS.totalWords.toLocaleString(), suffix: "개" },
  { label: "TEPS 어휘", value: PLATFORM_STATS.exams.TEPS.words.toLocaleString(), suffix: "개" },
  { label: "학습 모드", value: String(PLATFORM_STATS.learningModes), suffix: "가지" },
];

const features = [
  { icon: Icons.BookOpen, title: "스마트 플래시카드", description: "과학적 간격 반복으로 효율적 암기", href: "/learn", demoHref: "/learn?exam=CSAT&level=L1&demo=true" },
  { icon: Icons.Brain, title: "적응형 퀴즈", description: "오답 기반 난이도 조절 시스템", href: "/review", demoHref: "/review/quiz?demo=true" },
  { icon: Icons.ChartBar, title: "학습 분석", description: "상세한 진도 추적과 통계 제공", href: "/statistics", demoHref: "/statistics?demo=true" },
];

// ============================================
// DashboardItem 컴포넌트 (은행 앱 스타일)
// ============================================
function DashboardItem({ value, label, color }: { value: string | number, label: string, color: string }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-1">
      <span
        className="text-[22px] font-bold"
        style={{ color }}
      >
        {value}
      </span>
      <span className="text-[12px] text-gray-500">{label}</span>
    </div>
  );
}

// ============================================
// ActionCard 컴포넌트 (MenuCard 스타일)
// ============================================
function ActionCard({
  icon,
  iconBg,
  category,
  title,
  subtitle,
  href,
}: {
  icon: React.ReactNode,
  iconBg: string,
  category: string,
  title: string,
  subtitle?: string,
  href: string,
}) {
  return (
    <Link
      href={href}
      className="bg-gray-100 active:bg-[#F0F0F0] transition-colors rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:shadow-sm"
    >
      <div className="flex items-center gap-[18px]">
        {/* 아이콘 원형 배경 */}
        <div className={`w-[48px] h-[48px] rounded-full flex items-center justify-center shadow-sm ${iconBg}`}>
          {icon}
        </div>
        {/* 텍스트 */}
        <div className="flex flex-col">
          <span className="text-[12px] text-gray-500 font-medium mb-[2px]">{category}</span>
          <span className="text-[16px] font-bold text-[#1c1c1e]">{title}</span>
          {subtitle && (
            <span className="text-[13px] text-[#999999] mt-0.5">{subtitle}</span>
          )}
        </div>
      </div>
      {/* 화살표 */}
      <div className="text-[#C8C8C8]">
        <Icons.ChevronRight />
      </div>
    </Link>
  );
}

// ============================================
// 단어 찾기 카드 컴포넌트
// ============================================
function WordSearchCard() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/words?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/words');  // 빈 검색 시 단어 목록 페이지로
    }
  };

  const popularWords = ['contemporary', 'circumstance', 'nevertheless', 'stimulate'];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
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

      {/* 인기 검색어 태그 - 모바일에서도 한 줄 표시 */}
      <div className="mt-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <span className="text-xs text-gray-500 flex-shrink-0">인기:</span>
        {popularWords.map((word) => (
          <button
            key={word}
            onClick={() => router.push(`/words?search=${word}`)}
            className="px-2 py-1 bg-gray-100 hover:bg-teal-50 text-gray-600 hover:text-teal-600 text-xs rounded-full transition-colors flex-shrink-0"
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
// 현재 플랜 배지 컴포넌트 -> 회원 정보 카드로 확장 (모바일 통합 카드)
// ============================================
function MemberInfoCard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<{
    currentStreak: number;
    todayWordsLearned: number;
    dueReviewCount: number;
    todayFlashcardAccuracy: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const daysRemaining = getDaysRemaining(user?.subscriptionEnd);
  const plan = (user as any)?.subscriptionPlan || 'FREE';

  useEffect(() => {
    if (!user) return;
    loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      const [progressData, reviewData] = await Promise.all([
        progressAPI.getUserProgress(),
        progressAPI.getDueReviews(),
      ]);

      setStats({
        currentStreak: progressData.stats?.currentStreak || 0,
        todayWordsLearned: progressData.stats?.todayWordsLearned || 0,
        dueReviewCount: reviewData.count || 0,
        todayFlashcardAccuracy: progressData.stats?.todayFlashcardAccuracy || 0,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
      setStats({
        currentStreak: 0,
        todayWordsLearned: 0,
        dueReviewCount: 0,
        todayFlashcardAccuracy: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
      {/* 상단: 프로필 + 플랜 배지 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* 프로필 아이콘 */}
          <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center">
            <span className="text-white text-lg font-bold">
              {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.name || '회원'}님</p>
          </div>
        </div>

        {/* 플랜 배지 + D-day */}
        <div className="text-right">
          {(plan === 'YEARLY' || plan === 'FAMILY') && (
            <>
              <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
                👑 프리미엄
              </span>
              {daysRemaining && (
                <p className="text-xs text-gray-500 mt-1">D-{daysRemaining}일</p>
              )}
            </>
          )}
          {plan === 'MONTHLY' && (
            <>
              <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm font-medium">
                ✨ 베이직
              </span>
              {daysRemaining && (
                <p className="text-xs text-gray-500 mt-1">D-{daysRemaining}일</p>
              )}
            </>
          )}
          {plan === 'FREE' && (
            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
              무료 플랜
            </span>
          )}
        </div>
      </div>

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
              value={`${stats?.todayFlashcardAccuracy || 0}%`}
              label="정답률"
              color="#10B981"
            />
          </div>
        )}
      </div>

      {/* 하단: 학습하기 / 복습하기 버튼 */}
      <div className="pt-4 border-t border-gray-100 flex gap-3">
        <Link
          href="/dashboard"
          className="flex-1 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl text-center transition-colors"
        >
          학습하기
        </Link>
        <Link
          href="/review"
          className="flex-1 py-3 bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold rounded-xl text-center transition-colors"
        >
          복습하기
        </Link>
      </div>
    </div>
  );
}

// 기존 CurrentPlanBadge 유지 (하위 호환성)
function CurrentPlanBadge() {
  const { user } = useAuthStore();
  if (!user) return null;

  const planInfo = getPlanDisplay(user);
  const daysRemaining = getDaysRemaining(user.subscriptionEnd);

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#14B8A6]/10 to-[#06B6D4]/10 rounded-xl mb-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">{planInfo.icon}</span>
        <span className={`font-semibold text-[14px] px-2.5 py-1 rounded-full ${planInfo.bgColor} ${planInfo.textColor}`}>
          {planInfo.text} 플랜
        </span>
      </div>
      {daysRemaining && (
        <span className="text-[13px] text-gray-500 font-medium">
          D-{daysRemaining}일
        </span>
      )}
    </div>
  );
}

// ============================================
// 로그인 사용자용 학습 현황 섹션
// ============================================
function UserStatsSection({ showStatsCard = true }: { showStatsCard?: boolean }) {
  const [stats, setStats] = useState<{
    currentStreak: number;
    totalWordsLearned: number;
    todayWordsLearned: number;
    dueReviewCount: number;
    todayFlashcardAccuracy: number;  // 오늘 플래시카드 정답률
    totalFlashcardAccuracy: number;  // 전체 플래시카드 정답률
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Zustand store에서 dailyGoal 관리 (전역 동기화)
  const dailyGoal = useUserSettingsStore((state) => state.dailyGoal);
  const setDailyGoal = useUserSettingsStore((state) => state.setDailyGoal);

  // Get last study info from localStorage (fallback to CSAT L1)
  const [lastStudy, setLastStudy] = useState<{ exam: string; level: string }>({ exam: 'CSAT', level: 'L1' });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('lastStudy');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.exam && parsed.level) {
          setLastStudy({ exam: parsed.exam, level: parsed.level });
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [progressData, reviewData] = await Promise.all([
        progressAPI.getUserProgress(),
        progressAPI.getDueReviews(),
      ]);

      // dailyGoal도 설정
      if (progressData.stats?.dailyGoal) {
        setDailyGoal(progressData.stats.dailyGoal);
      }

      setStats({
        currentStreak: progressData.stats?.currentStreak || 0,
        totalWordsLearned: progressData.stats?.totalWordsLearned || 0,
        todayWordsLearned: progressData.stats?.todayWordsLearned || 0,
        dueReviewCount: reviewData.count || 0,
        todayFlashcardAccuracy: progressData.stats?.todayFlashcardAccuracy || 0,
        totalFlashcardAccuracy: progressData.stats?.totalFlashcardAccuracy || 0,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
      setStats({
        currentStreak: 0,
        totalWordsLearned: 0,
        todayWordsLearned: 0,
        dueReviewCount: 0,
        todayFlashcardAccuracy: 0,
        totalFlashcardAccuracy: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const todayProgress = stats?.todayWordsLearned || 0;
  const progressPercent = Math.round((todayProgress / dailyGoal) * 100);
  const goalOptions = [20, 40, 60, 80];

  // Exam display name
  const examDisplayName = lastStudy.exam === 'CSAT' ? '수능' : lastStudy.exam;
  const levelDisplayName = lastStudy.level;

  return (
    <div className="flex flex-col gap-4">
      {/* 모바일용 회원 정보 카드 (데스크톱에서는 왼쪽 통합 카드 사용) */}
      {/* 회원정보 + 학습현황 + 버튼이 통합된 카드 */}
      <div className="lg:hidden">
        <MemberInfoCard />
      </div>

      {/* 단어 찾기 카드 */}
      <WordSearchCard />

      {/* 전체 학습 현황 카드 (누적 데이터) */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
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
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-purple-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-purple-600">{stats?.totalWordsLearned || 0}</p>
              <p className="text-xs text-gray-500">누적 학습 단어</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-purple-600">{stats?.totalFlashcardAccuracy || 0}%</p>
              <p className="text-xs text-gray-500">전체 정답률</p>
            </div>
          </div>
        )}

        {/* 자세히 보기 */}
        <Link
          href="/stats"
          className="flex items-center justify-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium py-2 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
        >
          자세히 보기
          <Icons.ChevronRight />
        </Link>
      </div>

      {/* 오늘의 목표 카드 (은행 앱 스타일) */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <h3 className="text-[15px] font-bold text-[#1c1c1e]">오늘의 목표</h3>
          </div>
          <span className="text-[13px] text-[#14B8A6] font-semibold">
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
        <div className="flex gap-2">
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
              className={`flex-1 py-2.5 rounded-[12px] text-[14px] font-semibold transition-all ${
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
    </div>
  );
}

// ============================================
// 데스크톱 왼쪽 열용 통합 카드 (회원정보 + 학습현황)
// ============================================
function UnifiedMemberCard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<{
    currentStreak: number;
    todayWordsLearned: number;  // 오늘 학습한 단어
    totalWordsLearned: number;  // 누적 학습한 단어
    dueReviewCount: number;
    todayFlashcardAccuracy: number;  // 오늘 플래시카드 정답률
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const daysRemaining = getDaysRemaining(user?.subscriptionEnd);
  const plan = (user as any)?.subscriptionPlan || 'FREE';

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [progressData, reviewData] = await Promise.all([
        progressAPI.getUserProgress(),
        progressAPI.getDueReviews(),
      ]);

      setStats({
        currentStreak: progressData.stats?.currentStreak || 0,
        todayWordsLearned: progressData.stats?.todayWordsLearned || 0,  // 오늘 데이터
        totalWordsLearned: progressData.stats?.totalWordsLearned || 0,  // 누적 데이터
        dueReviewCount: reviewData.count || 0,
        todayFlashcardAccuracy: progressData.stats?.todayFlashcardAccuracy || 0,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
      setStats({
        currentStreak: 0,
        todayWordsLearned: 0,
        totalWordsLearned: 0,
        dueReviewCount: 0,
        todayFlashcardAccuracy: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
      {/* 상단: 프로필 + 스트릭 + 플랜 */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          {/* 프로필 아이콘 */}
          <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center">
            <span className="text-white text-lg font-bold">
              {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.name || '회원'}님</p>
            <p className="text-sm text-gray-500 truncate max-w-[160px]">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* 스트릭 */}
          {!loading && stats && stats.currentStreak > 0 && (
            <div className="flex items-center gap-1 text-orange-500">
              <span>🔥</span>
              <span className="font-semibold text-sm">{stats.currentStreak}일 연속</span>
            </div>
          )}

          {/* 플랜 배지 */}
          <div className="text-right">
            {(plan === 'YEARLY' || plan === 'FAMILY') && (
              <>
                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
                  👑 프리미엄
                </span>
                {daysRemaining && (
                  <p className="text-xs text-gray-500 mt-1">D-{daysRemaining}일</p>
                )}
              </>
            )}
            {plan === 'MONTHLY' && (
              <>
                <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm font-medium">
                  ✨ 베이직
                </span>
                {daysRemaining && (
                  <p className="text-xs text-gray-500 mt-1">D-{daysRemaining}일</p>
                )}
              </>
            )}
            {plan === 'FREE' && (
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                무료 플랜
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 중단: 오늘의 학습 현황 통계 */}
      <div className="py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center mb-3">오늘의 학습</p>
        <div className="grid grid-cols-3 gap-4">
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center">
                  <div className="h-7 w-14 bg-slate-200 rounded animate-pulse mx-auto mb-1" />
                  <div className="h-3 w-16 bg-slate-100 rounded animate-pulse mx-auto" />
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#3B82F6]">{stats?.todayWordsLearned || 0}</p>
                <p className="text-xs text-gray-500">오늘 학습</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#F59E0B]">{stats?.dueReviewCount || 0}</p>
                <p className="text-xs text-gray-500">복습 대기</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#10B981]">{stats?.todayFlashcardAccuracy || 0}%</p>
                <p className="text-xs text-gray-500">정답률</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 하단: 학습하기 / 복습하기 버튼 */}
      <div className="pt-4 border-t border-gray-100 flex gap-3">
        <Link
          href="/dashboard"
          className="flex-1 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl text-center transition-colors"
        >
          학습하기
        </Link>
        <Link
          href="/review"
          className="flex-1 py-3 bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold rounded-xl text-center transition-colors"
        >
          복습하기
        </Link>
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

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative min-h-[70vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 hero-gradient hero-pattern" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-level-beginner/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-level-intermediate/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-level-advanced/5 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start justify-items-center lg:justify-items-start">
          {/* 왼쪽 열: 히어로 텍스트 + 데스크톱에서 학습 현황 */}
          <div className={`space-y-8 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-surface-border shadow-sm">
              <Icons.Sparkles />
              <span className="text-sm font-medium text-slate-600">스마트 영어 학습 플랫폼</span>
            </div>

            <h1 className="font-display">
              <span className="block text-[1.75rem] sm:text-4xl md:text-display-lg text-slate-900 whitespace-nowrap">
                영어 단어 학습의
              </span>
              <span className="block text-[1.75rem] sm:text-4xl md:text-display-xl text-gradient whitespace-nowrap">
                새로운 비전
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 max-w-xl leading-relaxed">
              과학적으로 검증된 <strong className="text-slate-800">간격 반복 학습</strong>과{' '}
              <strong className="text-slate-800">적응형 퀴즈</strong>로 효율적인 어휘력 향상을 경험하세요.
            </p>

            {/* 로그인 시: 버튼 숨김 (오른쪽 빠른 액션으로 대체) */}
            {/* 비로그인 시: 체험 버튼 */}
            {!isLoggedIn && (
              <div className="flex flex-wrap gap-4 pt-4">
                <Link href="/learn?exam=CSAT&level=L1&demo=true" className="btn btn-primary group">
                  <Icons.Play />
                  <span>60초 맛보기</span>
                </Link>
                <Link href="/auth/login" className="btn btn-outline text-brand-primary border-brand-primary hover:bg-brand-primary/5">
                  <Icons.Sparkles />
                  <span>무료 회원가입</span>
                </Link>
              </div>
            )}

            {/* 비로그인 시에만 통계 숫자 표시 */}
            {!isLoggedIn && (
              <div className="flex gap-8 pt-8 border-t border-slate-200">
                {stats.map((stat, index) => (
                  <div key={stat.label} className={`${isVisible ? "animate-fade-in-up" : "opacity-0"}`} style={{ animationDelay: `${0.3 + index * 0.1}s` }}>
                    <div className="text-3xl font-display font-bold text-slate-900">
                      {stat.value}<span className="text-lg text-slate-500">{stat.suffix}</span>
                    </div>
                    <div className="text-sm text-slate-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* 로그인 사용자: 데스크톱에서 왼쪽 아래에 학습 현황 카드 */}
            {isLoggedIn && <UnifiedMemberCard />}
          </div>

          {/* 오른쪽 열: 액션 카드들 */}
          <div className={`flex flex-col gap-4 w-full max-w-md mx-auto lg:mx-0 lg:max-w-lg ${isVisible ? "animate-slide-in-right" : "opacity-0"}`}>
            {/* 섹션 안내 - 비로그인 시에만 표시 */}
            {!isLoggedIn && (
              <p className="text-sm text-slate-500 text-center mb-2">클릭하여 기능을 체험해보세요 →</p>
            )}

            {/* 로그인 사용자: 학습 현황 카드 (모바일) + 액션 버튼들 */}
            {isLoggedIn && (
              <UserStatsSection />
            )}

            {/* 비로그인 사용자: 기능 체험 카드 */}
            {!isLoggedIn && features.map((feature, index) => (
              <Link key={feature.title} href={isLoggedIn ? feature.href : feature.demoHref} className="block">
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
                      <h3 className="text-base sm:text-lg font-semibold text-slate-900 whitespace-nowrap">{feature.title}</h3>
                      {!isLoggedIn && (
                        <span className="text-xs font-medium text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                          체험하기
                        </span>
                      )}
                    </div>
                    <p className="text-sm sm:text-base text-slate-600 whitespace-nowrap">{feature.description}</p>
                  </div>
                  <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}

            {/* 비로그인 시: 체험 유도 카드 (로그인 시 UserStatsSection에서 목표 카드 표시) */}
            {!isLoggedIn && (
              <div className="relative overflow-hidden card p-6 bg-gradient-to-br from-brand-primary to-brand-secondary text-white">
                <div className="relative z-10">
                  <h4 className="text-lg font-semibold mb-2">60초 안에 체험해보세요!</h4>
                  <p className="text-white/80 mb-4">회원가입 없이 샘플 단어로 빠르게 체험</p>
                  <Link href="/learn?exam=CSAT&level=L1&demo=true" className="inline-flex items-center gap-2 px-4 py-2 bg-white text-brand-primary hover:bg-white/90 rounded-lg font-medium transition-colors group">
                    <span>맛보기 시작</span>
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
