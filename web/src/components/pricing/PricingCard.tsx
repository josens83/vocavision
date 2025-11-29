"use client";

import { useState } from "react";

// ============================================
// Types
// ============================================

export type BillingPeriod = "monthly" | "yearly";

export interface PricingFeature {
  text: string;
  included: boolean;
}

export interface PricingPlan {
  name: string;
  description: string;
  price: number;
  period: string;
  features: PricingFeature[];
  cta: string;
  badge?: string;
}

export interface BillingToggleProps {
  value: BillingPeriod;
  onChange: (value: BillingPeriod) => void;
  savingsPercent?: number;
}

export interface PricingCardProps extends PricingPlan {
  highlighted?: boolean;
  onSelect?: () => void;
}

// ============================================
// VocaVision Plans Data
// ============================================

export const vocaVisionPlans = {
  free: {
    name: "무료",
    description: "기본 학습 기능으로 시작하기",
    price: 0,
    period: "영원히 무료",
    cta: "무료로 시작",
    features: [
      { text: "기본 단어장 접근", included: true },
      { text: "일일 퀴즈 5회", included: true },
      { text: "학습 진도 추적", included: true },
      { text: "플래시카드 기능", included: true },
      { text: "고급 단어장", included: false },
      { text: "무제한 퀴즈", included: false },
      { text: "AI 개인화 학습", included: false },
      { text: "오프라인 모드", included: false },
    ],
  },
  pro: {
    monthly: {
      name: "프로",
      description: "모든 기능을 제한 없이",
      price: 9900,
      period: "월",
      badge: "인기",
      cta: "프로 시작하기",
      features: [
        { text: "모든 단어장 무제한 접근", included: true },
        { text: "무제한 퀴즈", included: true },
        { text: "상세 학습 통계", included: true },
        { text: "AI 개인화 학습", included: true },
        { text: "오프라인 모드", included: true },
        { text: "우선 고객 지원", included: true },
        { text: "광고 제거", included: true },
        { text: "가족 공유 (5명)", included: false },
      ],
    },
    yearly: {
      name: "프로",
      description: "모든 기능을 제한 없이",
      price: 69900,
      period: "년",
      badge: "41% 할인",
      cta: "프로 시작하기",
      features: [
        { text: "모든 단어장 무제한 접근", included: true },
        { text: "무제한 퀴즈", included: true },
        { text: "상세 학습 통계", included: true },
        { text: "AI 개인화 학습", included: true },
        { text: "오프라인 모드", included: true },
        { text: "우선 고객 지원", included: true },
        { text: "광고 제거", included: true },
        { text: "가족 공유 (5명)", included: false },
      ],
    },
  },
  premium: {
    monthly: {
      name: "프리미엄",
      description: "가족과 함께하는 학습",
      price: 14900,
      period: "월",
      cta: "프리미엄 시작하기",
      features: [
        { text: "프로의 모든 기능", included: true },
        { text: "가족 공유 (5명)", included: true },
        { text: "1:1 학습 코칭", included: true },
        { text: "맞춤 학습 플랜", included: true },
        { text: "수능/TOEIC 특화 콘텐츠", included: true },
        { text: "학습 리포트 (주간/월간)", included: true },
        { text: "베타 기능 우선 접근", included: true },
        { text: "전용 Discord 채널", included: true },
      ],
    },
    yearly: {
      name: "프리미엄",
      description: "가족과 함께하는 학습",
      price: 99900,
      period: "년",
      badge: "44% 할인",
      cta: "프리미엄 시작하기",
      features: [
        { text: "프로의 모든 기능", included: true },
        { text: "가족 공유 (5명)", included: true },
        { text: "1:1 학습 코칭", included: true },
        { text: "맞춤 학습 플랜", included: true },
        { text: "수능/TOEIC 특화 콘텐츠", included: true },
        { text: "학습 리포트 (주간/월간)", included: true },
        { text: "베타 기능 우선 접근", included: true },
        { text: "전용 Discord 채널", included: true },
      ],
    },
  },
};

// ============================================
// BillingToggle Component
// ============================================

export function BillingToggle({ value, onChange, savingsPercent = 41 }: BillingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-4 mb-10">
      <span
        className={`text-sm font-medium transition-colors ${
          value === "monthly" ? "text-slate-900" : "text-slate-500"
        }`}
      >
        월간 결제
      </span>
      <button
        onClick={() => onChange(value === "monthly" ? "yearly" : "monthly")}
        className={`relative w-14 h-7 rounded-full transition-colors ${
          value === "yearly" ? "bg-pricing-cta" : "bg-slate-300"
        }`}
        aria-label="Toggle billing period"
      >
        <span
          className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
            value === "yearly" ? "translate-x-8" : "translate-x-1"
          }`}
        />
      </button>
      <div className="flex items-center gap-2">
        <span
          className={`text-sm font-medium transition-colors ${
            value === "yearly" ? "text-slate-900" : "text-slate-500"
          }`}
        >
          연간 결제
        </span>
        {savingsPercent > 0 && (
          <span className="bg-pricing-cta text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {savingsPercent}% 절약
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================
// PricingCard Component
// ============================================

export function PricingCard({
  name,
  description,
  price,
  period,
  features,
  cta,
  badge,
  highlighted = false,
  onSelect,
}: PricingCardProps) {
  const formattedPrice = price === 0 ? "무료" : `₩${price.toLocaleString()}`;

  return (
    <div
      className={`relative flex flex-col p-8 rounded-2xl transition-all duration-300 ${
        highlighted
          ? "bg-white shadow-xl ring-2 ring-pricing-cta scale-105"
          : "bg-white shadow-card hover:shadow-card-hover"
      }`}
    >
      {badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-pricing-badge text-white text-xs font-bold px-3 py-1 rounded-full">
          {badge}
        </span>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-900 mb-1">{name}</h3>
        <p className="text-sm text-slate-600">{description}</p>
      </div>

      <div className="mb-6">
        <span className="text-4xl font-bold text-slate-900">{formattedPrice}</span>
        {price > 0 && <span className="text-slate-500 ml-1">/ {period}</span>}
      </div>

      <ul className="flex-1 space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            {feature.included ? (
              <svg className="w-5 h-5 text-pricing-cta flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
            <span className={feature.included ? "text-slate-700" : "text-slate-400"}>
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
          highlighted
            ? "bg-pricing-cta text-white hover:bg-green-600 shadow-lg hover:shadow-xl"
            : "bg-slate-100 text-slate-900 hover:bg-slate-200"
        }`}
      >
        {cta}
      </button>
    </div>
  );
}

// ============================================
// PricingCards Container
// ============================================

export function PricingCards({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {children}
    </div>
  );
}

// ============================================
// PricingSection Component
// ============================================

export function PricingSection() {
  const [billing, setBilling] = useState<BillingPeriod>("yearly");

  return (
    <section className="py-20 bg-pricing-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-display-md font-bold text-slate-900 mb-4">
            나에게 맞는 플랜 선택
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            무료로 시작하고, 필요에 따라 업그레이드하세요.
            <br />
            모든 유료 플랜은 7일 무료 체험을 제공합니다.
          </p>
        </div>

        <BillingToggle value={billing} onChange={setBilling} savingsPercent={41} />

        <PricingCards>
          <PricingCard {...vocaVisionPlans.free} />
          <PricingCard {...vocaVisionPlans.pro[billing]} highlighted />
          <PricingCard {...vocaVisionPlans.premium[billing]} />
        </PricingCards>
      </div>
    </section>
  );
}

export default PricingCard;
