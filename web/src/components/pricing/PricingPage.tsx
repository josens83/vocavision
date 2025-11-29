"use client";

import { useState } from "react";
import {
  BillingPeriod,
  BillingToggle,
  PricingCard,
  PricingCards,
  vocaVisionPlans,
} from "./PricingCard";
import { TestimonialCard, TestimonialsGrid, vocaVisionTestimonials } from "./Testimonial";
import { FAQSection, vocaVisionFAQ } from "./FAQ";

// ============================================
// PricingHero Component
// ============================================

function PricingHero() {
  return (
    <section className="pt-20 pb-10 bg-pricing-background">
      <div className="container mx-auto px-4 text-center">
        <span className="inline-block bg-pricing-badge text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
          7일 무료 체험
        </span>
        <h1 className="text-display-lg font-bold text-slate-900 mb-4">
          나에게 맞는 플랜을 선택하세요
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          무료로 시작하고, 학습 목표에 맞게 업그레이드하세요.
          <br />
          모든 유료 플랜은 환불을 보장합니다.
        </p>
      </div>
    </section>
  );
}

// ============================================
// ComparisonTable Component
// ============================================

function ComparisonTable() {
  const features = [
    { name: "기본 단어장", free: true, pro: true, premium: true },
    { name: "고급 단어장 (수능, TOEIC 등)", free: false, pro: true, premium: true },
    { name: "일일 퀴즈", free: "5회", pro: "무제한", premium: "무제한" },
    { name: "학습 진도 추적", free: true, pro: true, premium: true },
    { name: "플래시카드", free: true, pro: true, premium: true },
    { name: "상세 학습 통계", free: false, pro: true, premium: true },
    { name: "AI 개인화 학습", free: false, pro: true, premium: true },
    { name: "오프라인 모드", free: false, pro: true, premium: true },
    { name: "광고 제거", free: false, pro: true, premium: true },
    { name: "가족 공유", free: false, pro: false, premium: "5명" },
    { name: "1:1 학습 코칭", free: false, pro: false, premium: true },
    { name: "맞춤 학습 플랜", free: false, pro: false, premium: true },
  ];

  const renderCell = (value: boolean | string) => {
    if (typeof value === "string") {
      return <span className="text-slate-700 font-medium">{value}</span>;
    }
    if (value) {
      return (
        <svg className="w-5 h-5 text-pricing-cta mx-auto" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-slate-300 mx-auto" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    );
  };

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-display-md font-bold text-slate-900 mb-4">
            플랜 상세 비교
          </h2>
          <p className="text-lg text-slate-600">
            각 플랜에서 제공하는 기능을 비교해보세요.
          </p>
        </div>

        <div className="max-w-4xl mx-auto overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left py-4 px-4 font-semibold text-slate-900">기능</th>
                <th className="py-4 px-4 font-semibold text-slate-900 text-center">무료</th>
                <th className="py-4 px-4 font-semibold text-slate-900 text-center bg-pricing-background rounded-t-lg">프로</th>
                <th className="py-4 px-4 font-semibold text-slate-900 text-center">프리미엄</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr key={index} className="border-b border-slate-100">
                  <td className="py-4 px-4 text-slate-700">{feature.name}</td>
                  <td className="py-4 px-4 text-center">{renderCell(feature.free)}</td>
                  <td className="py-4 px-4 text-center bg-pricing-background">{renderCell(feature.pro)}</td>
                  <td className="py-4 px-4 text-center">{renderCell(feature.premium)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ============================================
// Guarantee Section
// ============================================

function GuaranteeSection() {
  return (
    <section className="py-16 bg-pricing-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-card text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-pricing-cta/10 rounded-full mb-6">
            <svg className="w-8 h-8 text-pricing-cta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-4">
            7일 무료 체험 & 100% 환불 보장
          </h3>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            모든 유료 플랜은 7일간 무료로 체험하실 수 있습니다.
            만족하지 않으시면 결제 후 7일 이내 전액 환불해 드립니다.
            <br />
            부담 없이 시작해보세요!
          </p>
        </div>
      </div>
    </section>
  );
}

// ============================================
// PricingPage Component
// ============================================

export default function PricingPage() {
  const [billing, setBilling] = useState<BillingPeriod>("yearly");

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <PricingHero />

      {/* Pricing Cards */}
      <section className="py-10 pb-20 bg-pricing-background">
        <div className="container mx-auto px-4">
          <BillingToggle value={billing} onChange={setBilling} savingsPercent={41} />

          <PricingCards>
            <PricingCard {...vocaVisionPlans.free} />
            <PricingCard {...vocaVisionPlans.pro[billing]} highlighted />
            <PricingCard {...vocaVisionPlans.premium[billing]} />
          </PricingCards>
        </div>
      </section>

      {/* Comparison Table */}
      <ComparisonTable />

      {/* Guarantee Section */}
      <GuaranteeSection />

      {/* Testimonials */}
      <section className="py-20 bg-surface-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-display-md font-bold text-slate-900 mb-4">
              사용자 후기
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              VocaVision으로 영어 실력을 향상시킨 학습자들의 이야기입니다.
            </p>
          </div>

          <TestimonialsGrid columns={3}>
            {vocaVisionTestimonials.slice(0, 3).map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} />
            ))}
          </TestimonialsGrid>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection
        title="자주 묻는 질문"
        subtitle="플랜에 관한 궁금한 점을 확인하세요."
        contactLink="/contact"
        items={vocaVisionFAQ}
      />

      {/* CTA Section */}
      <section className="py-20 bg-brand-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-display-sm font-bold text-white mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            무료로 시작해서 당신의 영어 학습을 한 단계 업그레이드하세요.
          </p>
          <a
            href="/auth/register"
            className="inline-block bg-white text-brand-primary font-bold px-8 py-4 rounded-lg hover:bg-slate-100 transition-colors shadow-lg"
          >
            무료로 시작하기
          </a>
        </div>
      </section>
    </main>
  );
}
