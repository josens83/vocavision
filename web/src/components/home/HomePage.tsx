"use client";

import Hero from "./Hero";
import { CategoryGrid, StudyTypeCard, ExamCategoryCard, examCategories } from "./CategoryCard";
import { PLATFORM_STATS } from "@/constants/stats";

const studyTypes = [
  { title: "플래시카드", description: "카드 뒤집기로 단어 암기", type: "flashcard" as const, href: "/learn?exam=CSAT", countLabel: "SM-2 학습" },
  { title: "퀴즈 도전", description: "4지선다 문제 풀기", type: "quiz" as const, href: "/quiz?exam=CSAT", countLabel: "객관식 퀴즈" },
  { title: "복습하기", description: "잊어버린 단어 다시 학습", type: "review" as const, href: "/review?exam=CSAT", countLabel: "복습 필요" },
  { title: "단어장", description: "전체 단어 목록 보기", type: "vocabulary" as const, href: "/words?exam=CSAT", count: PLATFORM_STATS.totalWords, countLabel: "총 단어" },
];

const recentActivity = [
  { word: "ubiquitous", meaning: "어디에나 있는", masteryLevel: 4, level: "advanced" },
  { word: "ephemeral", meaning: "일시적인", masteryLevel: 3, level: "expert" },
  { word: "pragmatic", meaning: "실용적인", masteryLevel: 5, level: "intermediate" },
  { word: "meticulous", meaning: "꼼꼼한", masteryLevel: 2, level: "advanced" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Hero />

      {/* 시험별 학습 섹션 */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-display-md font-display font-bold text-slate-900 mb-4">
              시험별 <span className="text-gradient">단어 학습</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              목표 시험에 맞는 필수 어휘를 체계적으로 학습하세요.
            </p>
          </div>

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
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div>
              <h2 className="text-display-sm font-display font-bold text-slate-900 mb-2">학습 방법 선택</h2>
              <p className="text-slate-600">다양한 학습 방법으로 효과적으로 단어를 암기하세요.</p>
            </div>
            <a href="/study" className="text-brand-primary font-medium hover:underline flex items-center gap-1">
              전체 보기
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studyTypes.map((type, index) => (
              <div key={type.title} className="opacity-0 animate-fade-in" style={{ animationDelay: `${index * 0.1}s`, animationFillMode: "forwards" }}>
                <StudyTypeCard {...type} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 최근 학습 활동 섹션 */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-display-sm font-display font-bold text-slate-900 mb-6">최근 학습한 단어</h2>
              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-surface-border">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">단어</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">의미</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">난이도</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">숙련도</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.map((item) => (
                      <tr key={item.word} className="border-b border-surface-border last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4"><span className="font-medium text-slate-900">{item.word}</span></td>
                        <td className="px-6 py-4 text-slate-600">{item.meaning}</td>
                        <td className="px-6 py-4"><span className={`badge badge-${item.level}`}>{item.level}</span></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 max-w-[100px]">
                              <div className="progress-bar h-1.5"><div className="progress-bar__fill" style={{ width: `${(item.masteryLevel / 5) * 100}%` }} /></div>
                            </div>
                            <span className="text-sm text-slate-500">{item.masteryLevel}/5</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="text-display-sm font-display font-bold text-slate-900 mb-6">오늘의 목표</h2>
              <div className="space-y-4">
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
                    <div className="w-16 h-16 rounded-2xl bg-study-flashcard flex items-center justify-center">
                      <span className="text-3xl">🔥</span>
                    </div>
                    <div>
                      <div className="text-3xl font-display font-bold text-slate-900">7일</div>
                      <div className="text-sm text-slate-600">연속 학습 중!</div>
                    </div>
                  </div>
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
            <a href="/study" className="btn bg-white text-brand-primary hover:bg-white/90 hover:shadow-lg">무료로 시작하기</a>
            <a href="/about" className="btn border-2 border-white/30 text-white hover:bg-white/10">더 알아보기</a>
          </div>
        </div>
      </section>
    </div>
  );
}
