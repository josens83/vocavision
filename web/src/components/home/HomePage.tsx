"use client";

import { useState } from "react";
import Hero from "./Hero";
import DDayBanner from "./DDayBanner";
import ExamIconGrid from "./ExamIconGrid";
import { CategoryGrid, StudyTypeCard, ExamCategoryCard, examCategories } from "./CategoryCard";
import { LevelFilter, SectionHeader } from "@/components/ui";
import { StreakCalendar, ContinueLearning } from "@/components/dashboard";
import { PLATFORM_STATS } from "@/constants/stats";

const studyTypes = [
  { title: "플래시카드", description: "카드 뒤집기로 단어 암기", type: "flashcard" as const, href: "/learn?exam=CSAT", countLabel: "SM-2 학습" },
  { title: "퀴즈 도전", description: "4지선다 문제 풀기", type: "quiz" as const, href: "/quiz?exam=CSAT", countLabel: "객관식 퀴즈" },
  { title: "복습하기", description: "잊어버린 단어 다시 학습", type: "review" as const, href: "/review?exam=CSAT", countLabel: "복습 필요" },
  { title: "단어장", description: "전체 단어 목록 보기", type: "vocabulary" as const, href: "/words?exam=CSAT", count: PLATFORM_STATS.totalWords, countLabel: "총 단어" },
];

// 인기 단어 샘플 (실제로는 API에서 가져옴)
const popularWords = [
  { id: "1", word: "ubiquitous", meaning: "어디에나 있는", level: "L2", views: 1234 },
  { id: "2", word: "ephemeral", meaning: "일시적인", level: "L3", views: 987 },
  { id: "3", word: "pragmatic", meaning: "실용적인", level: "L2", views: 876 },
  { id: "4", word: "meticulous", meaning: "꼼꼼한", level: "L2", views: 765 },
  { id: "5", word: "resilient", meaning: "회복력 있는", level: "L3", views: 654 },
  { id: "6", word: "abundant", meaning: "풍부한", level: "L1", views: 543 },
];

// 샘플 학습 세션 데이터
const sampleSession = {
  id: "1",
  title: "수능 필수 단어 L1",
  exam: "CSAT",
  level: "L1",
  wordsLearned: 45,
  totalWords: 100,
  lastStudied: new Date(Date.now() - 1000 * 60 * 30), // 30분 전
  mode: "flashcard" as const,
};

// 샘플 스트릭 데이터
const generateStudiedDays = (): string[] => {
  const days: string[] = [];
  const today = new Date();

  // 지난 7일 중 5일 학습
  for (let i = 0; i < 7; i++) {
    if (i !== 2 && i !== 5) { // 2일, 5일 전은 쉼
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split("T")[0]);
    }
  }

  // 이전 주에도 몇 일 추가
  for (let i = 8; i < 15; i++) {
    if (Math.random() > 0.3) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split("T")[0]);
    }
  }

  return days;
};

const levelColors: Record<string, string> = {
  L1: "bg-green-100 text-green-700",
  L2: "bg-blue-100 text-blue-700",
  L3: "bg-purple-100 text-purple-700",
};

export default function HomePage() {
  const [activeLevel, setActiveLevel] = useState("all");
  const studiedDays = generateStudiedDays();

  // 레벨별 필터링
  const filteredWords = activeLevel === "all"
    ? popularWords
    : popularWords.filter(w => w.level === activeLevel);

  return (
    <div className="min-h-screen bg-white">
      <Hero />

      {/* D-Day 카운트다운 배너 */}
      <DDayBanner />

      {/* 시험별 빠른 선택 (Fast Campus 스타일 아이콘 그리드) */}
      <section className="py-12 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <ExamIconGrid />
        </div>
      </section>

      {/* BEST 인기 단어 섹션 */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            badge="best"
            title="인기 단어"
            subtitle="다른 학습자들이 가장 많이 학습한 단어"
            viewAllHref="/words?sort=popular"
          />

          {/* 레벨 필터 */}
          <LevelFilter
            activeLevel={activeLevel}
            onLevelChange={setActiveLevel}
            counts={{
              all: PLATFORM_STATS.totalWords,
              L1: PLATFORM_STATS.levels.L1,
              L2: PLATFORM_STATS.levels.L2,
              L3: PLATFORM_STATS.levels.L3,
            }}
            className="mb-6"
          />

          {/* 단어 카드 그리드 */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {filteredWords.map((word, index) => (
              <a
                key={word.id}
                href={`/words/${word.id}`}
                className="
                  group bg-white rounded-xl p-4 border border-slate-100
                  hover:border-brand-primary hover:shadow-lg
                  transition-all duration-200
                  opacity-0 animate-fade-in-up
                "
                style={{ animationDelay: `${index * 0.05}s`, animationFillMode: "forwards" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${levelColors[word.level]}`}>
                    {word.level}
                  </span>
                  <span className="text-xs text-slate-400">{word.views.toLocaleString()}회</span>
                </div>
                <h4 className="font-semibold text-slate-900 group-hover:text-brand-primary transition-colors">
                  {word.word}
                </h4>
                <p className="text-sm text-slate-500 mt-1 line-clamp-1">{word.meaning}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

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
            {studyTypes.map((type, index) => (
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
            subtitle="학습 진행 상황을 확인하고 스트릭을 유지하세요"
            viewAllHref="/my"
          />

          <div className="grid lg:grid-cols-2 gap-6">
            {/* 이어서 학습하기 */}
            <ContinueLearning session={sampleSession} />

            {/* 스트릭 캘린더 */}
            <StreakCalendar
              studiedDays={studiedDays}
              currentStreak={5}
              bestStreak={12}
            />
          </div>
        </div>
      </section>

      {/* 오늘의 목표 섹션 */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            title="오늘의 목표"
            subtitle="매일 조금씩, 꾸준히 학습하세요"
          />

          <div className="grid md:grid-cols-4 gap-4">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-600">새 단어 학습</span>
                <span className="text-sm text-slate-500">7/10</span>
              </div>
              <div className="progress-bar mb-2"><div className="progress-bar__fill" style={{ width: "70%" }} /></div>
              <p className="text-xs text-slate-400">3개 더 학습하면 목표 달성!</p>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-600">복습 완료</span>
                <span className="text-sm text-slate-500">12/15</span>
              </div>
              <div className="progress-bar mb-2"><div className="progress-bar__fill" style={{ width: "80%" }} /></div>
              <p className="text-xs text-slate-400">오늘 복습할 단어가 3개 남았어요</p>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-600">퀴즈 점수</span>
                <span className="text-sm text-slate-500">85%</span>
              </div>
              <div className="progress-bar mb-2"><div className="progress-bar__fill bg-gradient-to-r from-level-beginner to-level-intermediate" style={{ width: "85%" }} /></div>
              <p className="text-xs text-slate-400">평균 이상의 정답률이에요</p>
            </div>

            <div className="card p-6 bg-gradient-to-br from-study-flashcard-light to-white">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-study-flashcard flex items-center justify-center">
                  <span className="text-2xl">🔥</span>
                </div>
                <div>
                  <div className="text-2xl font-display font-bold text-slate-900">5일</div>
                  <div className="text-sm text-slate-600">연속 학습 중!</div>
                </div>
              </div>
            </div>
          </div>
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
