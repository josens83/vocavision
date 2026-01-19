"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PLATFORM_STATS } from "@/constants/stats";
import { useAuthStore, useExamCourseStore } from "@/lib/store";
import { progressAPI } from "@/lib/api";

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
};

// Hero 섹션 통계 (실제 데이터 기반)
const stats = [
  { label: "수능 필수", value: PLATFORM_STATS.totalWords.toLocaleString(), suffix: "개" },
  { label: "TEPS 어휘", value: PLATFORM_STATS.exams.TEPS.words.toLocaleString(), suffix: "개" },
  { label: "학습 모드", value: String(PLATFORM_STATS.learningModes), suffix: "가지" },
];

const features = [
  { icon: Icons.BookOpen, title: "스마트 플래시카드", description: "과학적 간격 반복으로 효율적 암기", href: "/learn", demoHref: "/learn?exam=CSAT&level=L1&demo=true" },
  { icon: Icons.Brain, title: "적응형 퀴즈", description: "오답 기반 난이도 조절 시스템", href: "/review", demoHref: "/review?demo=true" },
  { icon: Icons.ChartBar, title: "학습 분석", description: "상세한 진도 추적과 통계 제공", href: "/statistics", demoHref: "/statistics?demo=true" },
];

// 로그인 사용자용 학습 현황 섹션
function UserStatsSection() {
  const [stats, setStats] = useState<{
    currentStreak: number;
    totalWordsLearned: number;
    dueReviewCount: number;
    accuracy: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [dailyGoal, setDailyGoal] = useState(60);
  const [showGoalOptions, setShowGoalOptions] = useState(false);
  const activeExam = useExamCourseStore((state) => state.activeExam) || 'CSAT';
  const activeLevel = useExamCourseStore((state) => state.activeLevel) || 'L1';

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
        totalWordsLearned: progressData.stats?.totalWordsLearned || 0,
        dueReviewCount: reviewData.count || 0,
        accuracy: reviewData.accuracy || 0,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
      setStats({
        currentStreak: 0,
        totalWordsLearned: 0,
        dueReviewCount: 0,
        accuracy: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const todayProgress = stats?.totalWordsLearned || 0;
  const progressPercent = Math.round((todayProgress / dailyGoal) * 100);
  const goalOptions = [20, 40, 60, 80, 100];

  return (
    <>
      {/* 오늘의 학습 현황 카드 */}
      <div className="card p-5 md:p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">오늘의 학습 현황</h3>
          {!loading && stats && stats.currentStreak > 0 && (
            <span className="text-orange-500 font-medium text-sm">🔥 {stats.currentStreak}일 연속 학습 중!</span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center">
                <div className="h-8 w-12 bg-slate-200 rounded animate-pulse mx-auto mb-1" />
                <div className="h-4 w-16 bg-slate-100 rounded animate-pulse mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats?.totalWordsLearned || 0}</p>
              <p className="text-xs text-slate-500">학습한 단어</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-pink-500">{stats?.dueReviewCount || 0}</p>
              <p className="text-xs text-slate-500">복습 대기</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-500">{stats?.accuracy || 0}%</p>
              <p className="text-xs text-slate-500">정답률</p>
            </div>
          </div>
        )}
      </div>

      {/* 빠른 액션 버튼 */}
      <div className="card p-5 md:p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">빠른 액션</h3>
        <div className="grid grid-cols-3 gap-3">
          <Link
            href={`/learn?exam=${activeExam.toLowerCase()}&level=${activeLevel}`}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition group"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center group-hover:scale-110 transition">
              <Icons.BookOpen />
            </div>
            <span className="text-sm font-medium text-slate-700">이어서 학습</span>
          </Link>
          <Link
            href="/review"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-pink-50 hover:bg-pink-100 transition group"
          >
            <div className="w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center group-hover:scale-110 transition">
              <Icons.Brain />
            </div>
            <span className="text-sm font-medium text-slate-700">복습하기</span>
          </Link>
          <Link
            href="/stats"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-green-50 hover:bg-green-100 transition group"
          >
            <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center group-hover:scale-110 transition">
              <Icons.ChartBar />
            </div>
            <span className="text-sm font-medium text-slate-700">학습 통계</span>
          </Link>
        </div>
      </div>

      {/* 오늘의 목표 진행률 - 에너지 게이지 스타일 */}
      <div className="card p-5 md:p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
        {/* 배경 장식 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-orange-500/10 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              ⚡ 오늘의 목표
            </h3>
            <span className="text-white/80 text-sm font-medium">{todayProgress}/{dailyGoal}개</span>
          </div>

          {/* 에너지 게이지 바 */}
          <div className="relative w-full h-4 bg-slate-700/50 rounded-full mb-3 overflow-hidden">
            {/* 게이지 배경 그리드 */}
            <div className="absolute inset-0 flex">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex-1 border-r border-slate-600/30 last:border-r-0" />
              ))}
            </div>
            {/* 게이지 채우기 - 그라데이션 + 글로우 */}
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${
                progressPercent >= 100
                  ? 'bg-gradient-to-r from-green-400 via-emerald-500 to-green-400 shadow-[0_0_20px_rgba(52,211,153,0.5)]'
                  : progressPercent >= 70
                    ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                    : 'bg-gradient-to-r from-orange-400 via-orange-500 to-amber-400 shadow-[0_0_10px_rgba(251,146,60,0.3)]'
              }`}
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            >
              {/* 반짝이는 효과 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </div>
          </div>

          <p className="text-white/80 text-sm mb-4">
            {progressPercent >= 100
              ? '🎉 목표 달성! 대단해요!'
              : progressPercent >= 70
                ? `거의 다 왔어요! ${dailyGoal - todayProgress}개 남음`
                : `${dailyGoal - todayProgress}개만 더 학습하면 목표 달성!`}
          </p>

          {/* 목표 조정 버튼 그룹 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60 mr-1">목표:</span>
            {goalOptions.map((goal) => (
              <button
                key={goal}
                onClick={() => setDailyGoal(goal)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  dailyGoal === goal
                    ? 'bg-white text-slate-900 shadow-lg'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                }`}
              >
                {goal}개
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

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

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
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
          </div>

          <div className={`flex flex-col gap-5 md:gap-6 ${isVisible ? "animate-slide-in-right" : "opacity-0"}`}>
            {/* 섹션 안내 - 비로그인 시에만 표시 */}
            {!isLoggedIn && (
              <p className="text-sm text-slate-500 text-center mb-2">클릭하여 기능을 체험해보세요 →</p>
            )}

            {/* 로그인 사용자: 학습 현황 카드 */}
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
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                      {!isLoggedIn && (
                        <span className="text-xs font-medium text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">
                          체험하기
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600">{feature.description}</p>
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
