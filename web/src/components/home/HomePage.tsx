"use client";

import Hero from "./Hero";
import DDayBanner from "./DDayBanner";
import ProductPackageSection from "./ProductPackageSection";
import PopularWordsSection from "./PopularWordsSection";
import { LazySection } from "@/components/ui/LazySection";
import { useAuthStore } from "@/lib/store";

// New Landing Page Components
import HeroSection from "./HeroSection";
import FeaturesSection from "./FeaturesSection";
import SocialProofSection from "./SocialProofSection";
import PricingPreviewSection from "./PricingPreviewSection";
import CTASection from "./CTASection";
import Footer from "./Footer";

export default function HomePage() {
  const { user, _hasHydrated } = useAuthStore();
  const isLoggedIn = !!user;

  // Show loading state while hydrating
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 w-8 rounded-lg bg-indigo-600" />
        </div>
      </div>
    );
  }

  // Non-logged-in users: Show new landing page
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-white">
        <HeroSection />
        <FeaturesSection />
        <SocialProofSection />
        <PricingPreviewSection />
        <CTASection />
        <Footer />
      </div>
    );
  }

  // Logged-in users: Show existing dashboard-style home
  return (
    <div className="min-h-screen bg-white">
      <Hero />

      {/* D-Day 카운트다운 배너 */}
      <DDayBanner />

      {/* BEST/NEW 인기 단어 섹션 - Lazy Load */}
      <LazySection minHeight={400} fallback={<PopularWordsSkeleton />}>
        <PopularWordsSection />
      </LazySection>

      {/* CTA 섹션 */}
      <section className="py-20 px-6 bg-gradient-to-br from-brand-primary to-brand-primary/80">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-display-md font-display font-bold mb-6">오늘도 학습을 시작하세요</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">매일 10분, 과학적인 학습 방법으로 영어 어휘력을 향상시키세요.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/learn?exam=CSAT" className="btn bg-white text-brand-primary hover:bg-white/90 hover:shadow-lg">학습 시작하기</a>
            <a href="/review" className="btn border-2 border-white/30 text-white hover:bg-white/10">복습하기</a>
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
