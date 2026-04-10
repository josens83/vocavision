"use client";

import dynamic from "next/dynamic";
import Hero from "./Hero";
import DDayBanner from "./DDayBanner";
import PopularWordsSection from "./PopularWordsSection";
import { LazySection } from "@/components/ui/LazySection";
import { useAuthStore } from "@/lib/store";
import { useLocale } from "@/hooks/useLocale";
import Link from "next/link";

// Lazy load heavy sections below the fold
const ProductPackageSection = dynamic(() => import("./ProductPackageSection"), { ssr: false });

export default function HomePage() {
  const { user } = useAuthStore();
  const isLoggedIn = !!user;
  const locale = useLocale();

  return (
    <div className="min-h-screen bg-white">
      <Hero />

      {/* D-Day 카운트다운 배너 */}
      <DDayBanner />

      {/* 글로벌: 구독 플랜 카드 */}
      {locale === 'en' && (
        <section className="py-12 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-2">
              Subscription Plans
            </h2>
            <p className="text-gray-500 text-center mb-8 text-sm">
              Unlock SAT & ACT vocabulary with a monthly plan
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <Link
                href="/pricing"
                className="bg-white rounded-xl p-6 border-2 border-teal-200 shadow-sm hover:shadow-md hover:border-teal-400 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg text-gray-900">Basic</h3>
                  <span className="bg-teal-50 text-teal-700 text-xs px-2 py-1 rounded-full font-medium">Popular</span>
                </div>
                <p className="text-sm text-gray-500 mb-4">SAT + ACT Full Access</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-cyan-50 text-cyan-700 text-xs px-2 py-1 rounded-full font-medium">2,000+ + 822 words</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">$4.99<span className="text-sm text-gray-500 font-normal">/mo</span></span>
              </Link>
              <Link
                href="/pricing"
                className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-200 shadow-sm hover:shadow-md hover:border-purple-400 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg text-gray-900">Premium</h3>
                  <span className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">All Access</span>
                </div>
                <p className="text-sm text-gray-500 mb-4">All Vocab Packs Unlimited</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-cyan-50 text-cyan-700 text-xs px-2 py-1 rounded-full font-medium">19,000+ words</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">$9.99<span className="text-sm text-gray-500 font-normal">/mo</span></span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 단품 패키지 섹션 - 당신의 시험, 당신의 단어장 */}
      <ProductPackageSection />

      {/* BEST/NEW 인기 단어 섹션 - Lazy Load */}
      <LazySection minHeight={400} fallback={<PopularWordsSkeleton />}>
        <PopularWordsSection />
      </LazySection>

      {/* CTA 섹션 - 비로그인 사용자에게만 표시 */}
      {!isLoggedIn && (
        <section className="py-20 px-6 bg-gradient-to-br from-brand-primary to-brand-primary/80">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-display-md font-display font-bold mb-6">
              {locale === 'en' ? 'Start Learning Today' : '지금 바로 시작하세요'}
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              {locale === 'en'
                ? 'SAT Starter vocabulary — completely free, no time limit.'
                : '수능 기초 어휘 951개 — 완전 무료, 기간 제한 없음.'}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="/auth/login" className="btn bg-white text-brand-primary hover:bg-white/90 hover:shadow-lg">
                {locale === 'en' ? 'Start for Free' : '무료로 시작하기'}
              </a>
              <a href="/pricing" className="btn border-2 border-white/30 text-white hover:bg-white/10">
                {locale === 'en' ? 'View Plans' : '요금제 보기'}
              </a>
            </div>
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
