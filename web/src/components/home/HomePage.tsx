"use client";

import Hero from "./Hero";
import DDayBanner from "./DDayBanner";
import ExamIconGrid from "./ExamIconGrid";
import HeroCarousel from "./HeroCarousel";
import ProductPackageSection from "./ProductPackageSection";
import PopularWordsSection from "./PopularWordsSection";
import { LazySection } from "@/components/ui/LazySection";
import { useAuthStore } from "@/lib/store";

export default function HomePage() {
  const { user } = useAuthStore();
  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen bg-white">
      <Hero />

      {/* D-Day 카운트다운 배너 */}
      <DDayBanner />

      {/* 단품 패키지 섹션 - 나에게 딱 맞는 단어장 (비로그인 시에만) */}
      {!isLoggedIn && <ProductPackageSection />}

      {/* Hero Carousel - 프로모션/공지 슬라이드 (비로그인 시에만) */}
      {!isLoggedIn && (
        <section className="py-8 px-6">
          <div className="max-w-7xl mx-auto">
            <HeroCarousel />
          </div>
        </section>
      )}

      {/* 시험별 빠른 선택 (비로그인 시에만) */}
      {!isLoggedIn && (
        <section className="py-12 px-6 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <ExamIconGrid />
          </div>
        </section>
      )}

      {/* BEST/NEW 인기 단어 섹션 - Lazy Load */}
      <LazySection minHeight={400} fallback={<PopularWordsSkeleton />}>
        <PopularWordsSection />
      </LazySection>

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

// Skeleton for PopularWords section
function PopularWordsSkeleton() {
  return (
    <div className="py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-slate-100 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
              <div className="aspect-square bg-slate-100" />
              <div className="p-3">
                <div className="h-5 w-3/4 bg-slate-100 rounded mb-1" />
                <div className="h-3 w-1/2 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
