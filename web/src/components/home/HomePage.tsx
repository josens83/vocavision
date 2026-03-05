"use client";

import Hero from "./Hero";
import DDayBanner from "./DDayBanner";
import ProductPackageSection from "./ProductPackageSection";
import PopularWordsSection from "./PopularWordsSection";
import LearningMethodSection from "./LearningMethodSection";
import TrustStatsSection from "./TrustStatsSection";
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

      {/* 8섹션 학습법 소개 - 비로그인만 */}
      {!isLoggedIn && <LearningMethodSection />}

      {/* 단품 패키지 섹션 - 당신의 시험, 당신의 단어장 */}
      <ProductPackageSection />

      {/* 숫자로 증명합니다 - 비로그인만 */}
      {!isLoggedIn && <TrustStatsSection />}

      {/* BEST/NEW 인기 단어 섹션 - Lazy Load */}
      <LazySection minHeight={400} fallback={<PopularWordsSkeleton />}>
        <PopularWordsSection />
      </LazySection>

      {/* CTA 섹션 - 비로그인 사용자에게만 표시 */}
      {!isLoggedIn && (
        <section className="py-20 px-6 bg-gradient-to-br from-brand-primary to-brand-primary/80">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-display-md font-display font-bold mb-6">첫 단어부터 다릅니다</h2>
            <p className="text-xl text-white/80 mb-4 max-w-2xl mx-auto">
              수능 기초 어휘 383개 — 완전 무료, 기간 제한 없음.
              <br />
              회원가입 하나로 바로 시작하세요.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <a href="/auth/login" className="btn bg-white text-brand-primary hover:bg-white/90 hover:shadow-lg">무료로 시작하기</a>
            </div>
            <p className="text-white/60 text-sm">
              이미 계정이 있으신가요? <a href="/auth/login" className="text-white/80 underline hover:text-white">로그인</a>
              <span className="mx-3">|</span>
              수능 전 범위 · TEPS · TOEFL · TOEIC · EBS <a href="/pricing" className="text-white/80 underline hover:text-white ml-1">요금제 보기</a>
            </p>
          </div>
        </section>
      )}
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
