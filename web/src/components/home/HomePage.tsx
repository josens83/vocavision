"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Hero from "./Hero";
import DDayBanner from "./DDayBanner";
import ExamIconGrid from "./ExamIconGrid";
import HeroCarousel from "./HeroCarousel";
import { CategoryGrid, StudyTypeCard, ExamCategoryCard, examCategories } from "./CategoryCard";
import PopularWordsSection, { sampleBestWords, sampleNewWords } from "./PopularWordsSection";
import { SectionHeader } from "@/components/ui";
import { StreakCalendar, ContinueLearning } from "@/components/dashboard";
import { PLATFORM_STATS, GUEST_SAMPLE_WORDS } from "@/constants/stats";
import { useAuthStore } from "@/lib/store";
import { progressAPI } from "@/lib/api";

// 비로그인용 학습 방법 (숫자 없이 설명만, 힌트 메시지 표시)
const guestStudyTypes = [
  { title: "플래시카드", description: "간격 반복으로 효율적 암기", type: "flashcard" as const, href: "/learn?exam=CSAT", guestHint: "로그인 후 확인" },
  { title: "퀴즈 도전", description: "오답 기반 난이도 조절", type: "quiz" as const, href: "/quiz?exam=CSAT", guestHint: "로그인 후 확인" },
  { title: "복습하기", description: "잊어버린 단어 다시 학습", type: "review" as const, href: "/review?exam=CSAT", guestHint: "로그인 후 확인" },
  { title: "단어장", description: "전체 단어 목록 보기", type: "vocabulary" as const, href: "/words?exam=CSAT", count: PLATFORM_STATS.totalWords, countLabel: "총 단어" },
];


// 사용자 학습 통계 타입
interface UserLearningStats {
  flashcardDue: number;
  reviewNeeded: number;
  todayNewWords: number;
  todayNewWordsTarget: number;
  todayReviewed: number;
  todayReviewTarget: number;
  quizAccuracy: number;
  currentStreak: number;
  bestStreak: number;
  studiedDays: string[];
  lastSession?: {
    id: string;
    title: string;
    exam: string;
    level: string;
    wordsLearned: number;
    totalWords: number;
    lastStudied: Date;
    mode: "flashcard" | "quiz" | "review";
  };
}

export default function HomePage() {
  const { user, _hasHydrated } = useAuthStore();
  const isLoggedIn = !!user;

  // 로그인 사용자용 학습 통계
  const [userStats, setUserStats] = useState<UserLearningStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // 로그인 시 사용자 통계 로드
  useEffect(() => {
    if (isLoggedIn && _hasHydrated) {
      loadUserStats();
    }
  }, [isLoggedIn, _hasHydrated]);

  const loadUserStats = async () => {
    setStatsLoading(true);
    try {
      // 복습 대기 단어 수 가져오기
      const dueResponse = await progressAPI.getDueReviews();
      const progressResponse = await progressAPI.getUserProgress();

      // 오늘 학습 통계 계산
      const today = new Date().toISOString().split('T')[0];
      const todayReviews = progressResponse.progress?.filter((p: any) =>
        p.lastReviewDate && p.lastReviewDate.startsWith(today)
      ) || [];

      // 스트릭 데이터 (학습한 날짜들)
      const studiedDays = progressResponse.progress
        ?.filter((p: any) => p.lastReviewDate)
        .map((p: any) => p.lastReviewDate.split('T')[0])
        .filter((date: string, index: number, self: string[]) => self.indexOf(date) === index) || [];

      setUserStats({
        flashcardDue: dueResponse.count || 0,
        reviewNeeded: dueResponse.count || 0,
        todayNewWords: todayReviews.filter((p: any) => p.totalReviews === 1).length,
        todayNewWordsTarget: (user as any)?.dailyGoal || 10,
        todayReviewed: todayReviews.length,
        todayReviewTarget: 15,
        quizAccuracy: progressResponse.progress?.length > 0
          ? Math.round(progressResponse.progress.reduce((acc: number, p: any) =>
              acc + (p.totalReviews > 0 ? p.correctCount / p.totalReviews : 0), 0)
              / progressResponse.progress.length * 100)
          : 0,
        currentStreak: progressResponse.stats?.currentStreak || 0,
        bestStreak: progressResponse.stats?.longestStreak || 0,
        studiedDays,
      });
    } catch (error) {
      console.error('Failed to load user stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // 로그인 사용자용 학습 방법 (실제 숫자 포함)
  const getStudyTypes = () => {
    if (!isLoggedIn || !userStats) return guestStudyTypes;

    return [
      { title: "플래시카드", description: "카드 뒤집기로 단어 암기", type: "flashcard" as const, href: "/learn?exam=CSAT", count: userStats.flashcardDue, countLabel: "복습 대기" },
      { title: "퀴즈 도전", description: "4지선다 문제 풀기", type: "quiz" as const, href: "/quiz?exam=CSAT", count: 10, countLabel: "오늘의 문제" },
      { title: "복습하기", description: "잊어버린 단어 다시 학습", type: "review" as const, href: "/review?exam=CSAT", count: userStats.reviewNeeded, countLabel: "복습 필요" },
      { title: "단어장", description: "전체 단어 목록 보기", type: "vocabulary" as const, href: "/words?exam=CSAT", count: PLATFORM_STATS.totalWords, countLabel: "총 단어" },
    ];
  };

  return (
    <div className="min-h-screen bg-white">
      <Hero />

      {/* D-Day 카운트다운 배너 */}
      <DDayBanner />

      {/* Hero Carousel - 프로모션/공지 슬라이드 */}
      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <HeroCarousel />
        </div>
      </section>

      {/* 시험별 빠른 선택 (Fast Campus 스타일 아이콘 그리드) */}
      <section className="py-12 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <ExamIconGrid />
        </div>
      </section>

      {/* BEST/NEW 인기 단어 섹션 - Phase 1 */}
      <PopularWordsSection
        bestWords={sampleBestWords}
        newWords={sampleNewWords}
        isSampleData={!isLoggedIn}
      />

      {/* 시험별 학습 섹션 */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            title="시험별 단어 학습"
            subtitle="목표 시험에 맞는 필수 어휘를 체계적으로 학습하세요"
            viewAllHref="/courses"
          />

          <CategoryGrid columns={3}>
            {examCategories.map((category, index) => (
              <div key={category.title} className="opacity-0 animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s`, animationFillMode: "forwards" }}>
                <ExamCategoryCard {...category} />
              </div>
            ))}
          </CategoryGrid>
        </div>
      </section>

      {/* 학습 방법 섹션 */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            title="학습 방법 선택"
            subtitle="다양한 학습 방법으로 효과적으로 단어를 암기하세요"
            viewAllHref="/learn"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getStudyTypes().map((type, index) => (
              <div key={type.title} className="opacity-0 animate-fade-in" style={{ animationDelay: `${index * 0.1}s`, animationFillMode: "forwards" }}>
                <StudyTypeCard {...type} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 나의 학습 현황 섹션 */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            title="나의 학습 현황"
            subtitle={isLoggedIn ? "학습 진행 상황을 확인하고 스트릭을 유지하세요" : "로그인하고 학습 기록을 관리하세요"}
            viewAllHref={isLoggedIn ? "/my" : undefined}
          />

          {/* 비로그인 시: 로그인 유도 UI */}
          {!isLoggedIn ? (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="card p-8 text-center bg-gradient-to-br from-brand-primary/5 to-brand-primary/10">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                  <span className="text-3xl">📚</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">이어서 학습하기</h3>
                <p className="text-sm text-slate-500 mb-4">
                  로그인하면 마지막 학습 위치에서<br />바로 이어서 학습할 수 있어요
                </p>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg font-medium hover:bg-brand-primary/90 transition-colors"
                >
                  로그인하고 시작하기
                </Link>
              </div>

              <div className="card p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-study-flashcard-light flex items-center justify-center">
                  <span className="text-3xl">🔥</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">스트릭 캘린더</h3>
                <p className="text-sm text-slate-500 mb-4">
                  로그인하면 연속 학습일을 기록하고<br />동기부여를 받을 수 있어요
                </p>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-brand-primary text-brand-primary rounded-lg font-medium hover:bg-brand-primary/5 transition-colors"
                >
                  로그인하기
                </Link>
              </div>
            </div>
          ) : (
            /* 로그인 시: 실제 데이터 */
            <div className="grid lg:grid-cols-2 gap-6">
              {/* 이어서 학습하기 */}
              {userStats?.lastSession ? (
                <ContinueLearning session={userStats.lastSession} />
              ) : (
                <div className="card p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                    <span className="text-3xl">🚀</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">첫 학습을 시작하세요!</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    아직 학습 기록이 없어요.<br />지금 바로 단어 학습을 시작해보세요!
                  </p>
                  <Link
                    href="/learn?exam=CSAT"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg font-medium hover:bg-brand-primary/90 transition-colors"
                  >
                    학습 시작하기
                  </Link>
                </div>
              )}

              {/* 스트릭 캘린더 */}
              <StreakCalendar
                studiedDays={userStats?.studiedDays || []}
                currentStreak={userStats?.currentStreak || 0}
                bestStreak={userStats?.bestStreak || 0}
              />
            </div>
          )}
        </div>
      </section>

      {/* 오늘의 목표 섹션 */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            title="오늘의 학습 목표"
            subtitle={isLoggedIn ? "매일 조금씩, 꾸준히 학습하세요" : "로그인하고 나만의 학습 목표를 설정하세요"}
          />

          {/* 비로그인 시: 로그인 유도 UI */}
          {!isLoggedIn ? (
            <div className="card p-8 bg-gradient-to-br from-brand-primary/5 to-brand-primary/10 text-center">
              <div className="max-w-md mx-auto">
                <div className="text-5xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  나만의 학습 목표를 설정하세요
                </h3>
                <p className="text-slate-600 mb-6">
                  로그인하면 매일 학습 목표를 추적하고<br />
                  스트릭을 유지하며 성취감을 느낄 수 있어요!
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    href="/auth/login"
                    className="px-6 py-3 bg-brand-primary text-white rounded-lg font-medium hover:bg-brand-primary/90 transition-colors"
                  >
                    로그인하고 시작하기
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-6 py-3 border border-brand-primary text-brand-primary rounded-lg font-medium hover:bg-brand-primary/5 transition-colors"
                  >
                    무료 가입하기
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* 로그인 시: 실제 데이터 */
            <div className="grid md:grid-cols-4 gap-4">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-600">새 단어 학습</span>
                  <span className="text-sm text-slate-500">
                    {userStats?.todayNewWords || 0}/{userStats?.todayNewWordsTarget || 10}
                  </span>
                </div>
                <div className="progress-bar mb-2">
                  <div
                    className="progress-bar__fill"
                    style={{ width: `${Math.min(100, ((userStats?.todayNewWords || 0) / (userStats?.todayNewWordsTarget || 10)) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">
                  {(userStats?.todayNewWordsTarget || 10) - (userStats?.todayNewWords || 0) > 0
                    ? `${(userStats?.todayNewWordsTarget || 10) - (userStats?.todayNewWords || 0)}개 더 학습하면 목표 달성!`
                    : "오늘 목표 달성! 🎉"}
                </p>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-600">복습 완료</span>
                  <span className="text-sm text-slate-500">
                    {userStats?.todayReviewed || 0}/{userStats?.todayReviewTarget || 15}
                  </span>
                </div>
                <div className="progress-bar mb-2">
                  <div
                    className="progress-bar__fill"
                    style={{ width: `${Math.min(100, ((userStats?.todayReviewed || 0) / (userStats?.todayReviewTarget || 15)) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">
                  {(userStats?.todayReviewTarget || 15) - (userStats?.todayReviewed || 0) > 0
                    ? `오늘 복습할 단어가 ${(userStats?.todayReviewTarget || 15) - (userStats?.todayReviewed || 0)}개 남았어요`
                    : "복습 완료! 🎉"}
                </p>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-600">퀴즈 정답률</span>
                  <span className="text-sm text-slate-500">{userStats?.quizAccuracy || 0}%</span>
                </div>
                <div className="progress-bar mb-2">
                  <div
                    className="progress-bar__fill bg-gradient-to-r from-level-beginner to-level-intermediate"
                    style={{ width: `${userStats?.quizAccuracy || 0}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">
                  {(userStats?.quizAccuracy || 0) >= 80
                    ? "훌륭해요! 정답률이 높아요 👍"
                    : "꾸준히 학습하면 정답률이 올라가요!"}
                </p>
              </div>

              <div className="card p-6 bg-gradient-to-br from-study-flashcard-light to-white">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-study-flashcard flex items-center justify-center">
                    <span className="text-2xl">🔥</span>
                  </div>
                  <div>
                    <div className="text-2xl font-display font-bold text-slate-900">
                      {userStats?.currentStreak || 0}일
                    </div>
                    <div className="text-sm text-slate-600">
                      {(userStats?.currentStreak || 0) > 0 ? "연속 학습 중!" : "오늘 학습을 시작하세요!"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-20 px-6 bg-gradient-to-br from-brand-primary to-brand-primary/80">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-display-md font-display font-bold mb-6">지금 바로 시작하세요</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">매일 10분, 과학적인 학습 방법으로 영어 어휘력을 향상시키세요.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/learn?exam=CSAT" className="btn bg-white text-brand-primary hover:bg-white/90 hover:shadow-lg">무료로 시작하기</a>
            <a href="/pricing" className="btn border-2 border-white/30 text-white hover:bg-white/10">요금제 보기</a>
          </div>
        </div>
      </section>
    </div>
  );
}
