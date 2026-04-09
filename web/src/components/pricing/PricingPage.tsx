"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, X, Sparkles, Crown, Zap } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useLocale } from "@/hooks/useLocale";

interface PlanFeature {
  name: string;
  free: boolean | string;
  basic: boolean | string;
  premium: boolean | string;
}

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const locale = useLocale();
  const isEn = locale === 'en';
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );

  const handlePlanSelect = (plan: "basic" | "premium") => {
    if (!user) {
      router.push(`/auth/login?redirect=/checkout?plan=${plan}`);
    } else {
      router.push(`/checkout?plan=${plan}`);
    }
  };

  const prices = {
    monthly: {
      basic: 4900,
      premium: 9900,
    },
    yearly: {
      basic: 47000,
      premium: 95000,
    },
  };

  const pricesUsd = {
    monthly: { basic: 4.99, premium: 9.99 },
    yearly: { basic: 47.88, premium: 95.88 },
  };

  const currentPrices = isEn ? pricesUsd[billingCycle] : prices[billingCycle];
  const currencySymbol = isEn ? '$' : '₩';
  const perMonth = isEn ? '/mo' : '/월';
  const perYear = isEn ? '/yr' : '/년';
  const isYearly = billingCycle === "yearly";

  const features: PlanFeature[] = isEn ? [
    { name: "SAT Starter (L1) — 1,300+ words", free: true, basic: true, premium: true },
    { name: "SAT Advanced (L2) — 340+ words", free: false, basic: true, premium: true },
    { name: "ACT Complete (822 words)", free: false, basic: true, premium: true },
    { name: "GRE / TOEFL / TOEIC Packs", free: false, basic: false, premium: true },
    { name: "AI Images (Concept + Rhyme) per word", free: "some", basic: true, premium: true },
    { name: "Flashcards", free: true, basic: true, premium: true },
    { name: "Quiz Mode", free: "all", basic: "all", premium: "all" },
    { name: "Learning Statistics", free: false, basic: "detailed", premium: "detailed" },
  ] : [
    { name: "수능 L1(기초)", free: true, basic: true, premium: true },
    { name: "수능 L2(중급)", free: false, basic: true, premium: true },
    { name: "수능 L3(고급)", free: false, basic: true, premium: true },
    { name: "TEPS L1(기본)/L2(필수)", free: false, basic: true, premium: true },
    { name: "단어장 (TOEFL/TOEIC/SAT/GRE/IELTS/EBS/기출)", free: false, basic: false, premium: true },
    { name: "AI 이미지 (Concept·Rhyme)", free: "일부", basic: true, premium: true },
    { name: "플래시카드", free: true, basic: true, premium: true },
    { name: "퀴즈 모드", free: "전체", basic: "전체", premium: "전체" },
    { name: "학습 통계", free: false, basic: "상세", premium: "상세" },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* 헤더 영역 */}
      <div className="pt-24 pb-12 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1c1c1e] mb-3">
          {isEn ? 'Choose Your Plan' : '나에게 맞는 플랜 선택'}
        </h1>
        <p className="text-[15px] text-gray-500 max-w-2xl mx-auto px-4">
          {isEn ? 'Start free, upgrade when you need more.' : '무료로 시작하고, 필요할 때 업그레이드하세요.'}
        </p>

        {/* 결제 주기 토글 */}
        <div className="mt-8 inline-flex items-center bg-gray-100 rounded-full p-1 border border-gray-200">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-6 py-2.5 rounded-full text-[14px] font-medium transition-all ${
              !isYearly
                ? "bg-white text-[#1c1c1e] shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                : "text-gray-500 hover:text-[#1c1c1e]"
            }`}
          >
            {isEn ? 'Monthly' : '월간 결제'}
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-6 py-2.5 rounded-full text-[14px] font-medium transition-all ${
              isYearly
                ? "bg-white text-[#1c1c1e] shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                : "text-gray-500 hover:text-[#1c1c1e]"
            }`}
          >
            {isEn ? 'Yearly' : '연간 결제'}
            <span className="ml-2 text-[12px] text-[#10B981] font-semibold">
              {isEn ? 'Save 20%' : '20% 할인'}
            </span>
          </button>
        </div>
      </div>

      {/* 요금제 카드 */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-8">
          {/* 무료 플랜 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-7 relative">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-gray-500" />
              </div>
              <h3 className="text-[18px] font-bold text-[#1c1c1e]">{isEn ? 'Free' : '무료'}</h3>
            </div>

            <div className="mb-5">
              <span className="text-[36px] font-bold text-gray-500">{currencySymbol}0</span>
              <span className="text-[#999999] text-[14px]">{perMonth}</span>
            </div>

            <p className="text-gray-500 text-[13px] mb-6">
              {isEn ? 'Perfect for getting started with VocaVision AI' : 'VocaVision AI를 처음 시작하는 분께 추천'}
            </p>

            <Link
              href="/auth/login"
              className="block w-full py-3.5 px-4 text-center rounded-xl font-semibold text-[14px] border-2 border-[#E8E8E8] text-gray-500 hover:bg-gray-100 transition-colors"
            >
              {isEn ? 'Start for Free' : '무료로 시작하기'}
            </Link>

            <ul className="mt-7 space-y-3">
              {isEn ? (
                <>
                  <li className="flex items-center gap-3 text-[13px] text-[#1c1c1e]">
                    <Check className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                    <span>SAT Starter vocabulary (1,300+ words)</span>
                  </li>
                  <li className="flex items-center gap-3 text-[13px] text-[#1c1c1e]">
                    <Check className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                    <span>Basic Flashcards</span>
                  </li>
                  <li className="flex items-center gap-3 text-[13px] text-[#1c1c1e]">
                    <Check className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                    <span>Full Quiz Mode</span>
                  </li>
                  <li className="flex items-center gap-3 text-[13px] text-[#C8C8C8]">
                    <X className="w-5 h-5 flex-shrink-0" />
                    <span>SAT Advanced / GRE</span>
                  </li>
                  <li className="flex items-center gap-3 text-[13px] text-[#C8C8C8]">
                    <X className="w-5 h-5 flex-shrink-0" />
                    <span>GRE / TOEFL / TOEIC / IELTS Packs</span>
                  </li>
                  <li className="flex items-center gap-3 text-[13px] text-[#C8C8C8]">
                    <X className="w-5 h-5 flex-shrink-0" />
                    <span>Learning Statistics</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-3 text-[13px] text-[#1c1c1e]">
                    <Check className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                    <span>수능 L1(기초) (951개)</span>
                  </li>
                  <li className="flex items-center gap-3 text-[13px] text-[#1c1c1e]">
                    <Check className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                    <span>기본 플래시카드</span>
                  </li>
                  <li className="flex items-center gap-3 text-[13px] text-[#1c1c1e]">
                    <Check className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                    <span>전체 퀴즈 모드</span>
                  </li>
                  <li className="flex items-center gap-3 text-[13px] text-[#C8C8C8]">
                    <X className="w-5 h-5 flex-shrink-0" />
                    <span>수능 L2(중급)/L3(고급)</span>
                  </li>
                  <li className="flex items-center gap-3 text-[13px] text-[#C8C8C8]">
                    <X className="w-5 h-5 flex-shrink-0" />
                    <span>TEPS</span>
                  </li>
                  <li className="flex items-center gap-3 text-[13px] text-[#C8C8C8]">
                    <X className="w-5 h-5 flex-shrink-0" />
                    <span>단어장 (TOEFL/TOEIC/GRE/IELTS/EBS/기출)</span>
                  </li>
                  <li className="flex items-center gap-3 text-[13px] text-[#C8C8C8]">
                    <X className="w-5 h-5 flex-shrink-0" />
                    <span>학습 통계</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* 프리미엄 플랜 - 가운데 배치 */}
          <div className="bg-gradient-to-br from-[#A855F7] to-[#7C3AED] rounded-2xl shadow-[0_4px_20px_rgba(168,85,247,0.25)] p-7 relative text-white">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-gradient-to-r from-[#F59E0B] to-[#EF4444] text-white text-[12px] font-bold px-5 py-1.5 rounded-full shadow-lg">
                {isEn ? 'Popular' : '인기'}
              </span>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                <Crown className="w-5 h-5 text-[#FCD34D]" />
              </div>
              <h3 className="text-[18px] font-bold">{isEn ? 'Premium' : '프리미엄'}</h3>
            </div>

            <div className="mb-5">
              <span className="text-[36px] font-bold">
                {currencySymbol}{isEn ? currentPrices.premium : currentPrices.premium.toLocaleString()}
              </span>
              <span className="text-white/60 text-[14px]">{isYearly ? perYear : perMonth}</span>
              {isYearly && (
                <p className="text-[13px] text-[#86EFAC] mt-1 font-medium">
                  {isEn
                    ? `$${(currentPrices.premium / 12).toFixed(2)}/mo (Save 20%)`
                    : `월 ₩${Math.round(currentPrices.premium / 12).toLocaleString()} (20% 할인)`
                  }
                </p>
              )}
            </div>

            <p className="text-white/70 text-[13px] mb-6">
              {isEn ? 'Best for SAT, ACT, GRE, TOEFL, IELTS learners' : '수능 + TEPS 완벽 대비를 원하는 분께 추천'}
            </p>

            <button
              onClick={() => handlePlanSelect("premium")}
              className="block w-full py-3.5 px-4 text-center rounded-xl font-semibold text-[14px] bg-white text-purple-500 hover:bg-gray-100 transition-colors"
            >
              {isEn ? 'Get Premium' : '프리미엄 시작하기'}
            </button>

            <ul className="mt-7 space-y-3">
              {isEn ? (
                <>
                  <li className="flex items-center gap-3 text-[13px]">
                    <Check className="w-5 h-5 text-[#86EFAC] flex-shrink-0" />
                    <span className="font-semibold">✨ All Vocab Packs included (GRE/TOEFL/TOEIC/IELTS)</span>
                  </li>
                  <li className="flex items-center gap-3 text-[13px]">
                    <Check className="w-5 h-5 text-[#86EFAC] flex-shrink-0" />
                    <span>SAT Full (Starter + Advanced)</span>
                  </li>
                  <li className="flex items-center gap-3 text-[13px]">
                    <Check className="w-5 h-5 text-[#86EFAC] flex-shrink-0" />
                    <span>All AI images (Concept + Rhyme per word)</span>
                  </li>
                  <li className="flex items-center gap-3 text-[13px]">
                    <Check className="w-5 h-5 text-[#86EFAC] flex-shrink-0" />
                    <span>Full Quiz Mode</span>
                  </li>
                  <li className="flex items-center gap-3 text-[13px]">
                    <Check className="w-5 h-5 text-[#86EFAC] flex-shrink-0" />
                    <span>Detailed Learning Statistics</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-3 text-[13px]">
                    <Check className="w-5 h-5 text-[#86EFAC] flex-shrink-0" />
                    <span className="font-semibold">모든 단어장(단품) 무료 이용</span>
                  </li>
                  <li className="flex items-center gap-3 text-[13px]">
                    <Check className="w-5 h-5 text-[#86EFAC] flex-shrink-0" />
                    <span>수능 L1(기초)/L2(중급)/L3(고급) 전체</span>
                  </li>
                  <li className="flex items-center gap-3 text-[13px]">
                    <Check className="w-5 h-5 text-[#86EFAC] flex-shrink-0" />
                    <span className="font-semibold">TEPS L1(기본)/L2(필수) 전체</span>
                  </li>
                  <li className="flex items-center gap-3 text-[13px]">
                    <Check className="w-5 h-5 text-[#86EFAC] flex-shrink-0" />
                    <span>AI 이미지 전체 (Concept·Rhyme)</span>
                  </li>
                  <li className="flex items-center gap-3 text-[13px]">
                    <Check className="w-5 h-5 text-[#86EFAC] flex-shrink-0" />
                    <span>전체 퀴즈 모드</span>
                  </li>
                  <li className="flex items-center gap-3 text-[13px]">
                    <Check className="w-5 h-5 text-[#86EFAC] flex-shrink-0" />
                    <span>상세 학습 통계</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* 베이직 플랜 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-7 relative">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 bg-[#ECFDF5] rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#14B8A6]" />
              </div>
              <h3 className="text-[18px] font-bold text-[#1c1c1e]">{isEn ? 'Basic' : '베이직'}</h3>
            </div>

            <div className="mb-5">
              <span className="text-[36px] font-bold text-[#14B8A6]">
                {currencySymbol}{isEn ? currentPrices.basic : currentPrices.basic.toLocaleString()}
              </span>
              <span className="text-[#999999] text-[14px]">{isYearly ? perYear : perMonth}</span>
              {isYearly && (
                <p className="text-[13px] text-[#10B981] mt-1 font-medium">
                  {isEn
                    ? `$${(currentPrices.basic / 12).toFixed(2)}/mo (Save 20%)`
                    : `월 ₩${Math.round(currentPrices.basic / 12).toLocaleString()} (20% 할인)`
                  }
                </p>
              )}
            </div>

            <p className="text-gray-500 text-[13px] mb-6">
              {isEn ? 'Perfect for SAT & ACT test-takers' : '수능 + TEPS 대비를 원하는 분께 추천'}
            </p>

            <button
              onClick={() => handlePlanSelect("basic")}
              className="block w-full py-3.5 px-4 text-center rounded-xl font-semibold text-[14px] bg-[#14B8A6] text-white hover:bg-[#0D9488] transition-colors shadow-[0_4px_12px_rgba(20,184,166,0.3)]"
            >
              {isEn ? 'Get Basic' : '베이직 시작하기'}
            </button>

            <ul className="mt-7 space-y-3">
              <li className="flex items-center gap-3 text-[13px] text-[#1c1c1e]">
                <Check className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                <span className="font-semibold">{isEn ? 'SAT Full (Starter + Advanced) — 2,120 words' : '수능 전체 (L1/L2/L3) — 1,724개 단어'}</span>
              </li>
              {isEn && (
                <>
                <li className="flex items-center gap-3 text-[13px] text-[#1c1c1e]">
                  <Check className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                  <span className="font-semibold">ACT Complete (Core + Plus) — 822 words</span>
                </li>
                <li className="flex items-center gap-3 text-[13px] text-[#1c1c1e]">
                  <Check className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                  <span className="font-semibold">IELTS Full (Foundation + Academic) — 691 words</span>
                </li>
                </>
              )}
              {!isEn && (
                <li className="flex items-center gap-3 text-[13px] text-[#1c1c1e]">
                  <Check className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                  <span className="font-semibold">TEPS 전체 (L1/L2) — 419개 단어</span>
                </li>
              )}
              <li className="flex items-center gap-3 text-[13px] text-[#1c1c1e]">
                <Check className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                <span>{isEn ? 'All AI images (Concept + Rhyme per word)' : 'AI 이미지 전체 (Concept·Rhyme)'}</span>
              </li>
              <li className="flex items-center gap-3 text-[13px] text-[#1c1c1e]">
                <Check className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                <span>{isEn ? 'Full Quiz Mode' : '전체 퀴즈 모드'}</span>
              </li>
              <li className="flex items-center gap-3 text-[13px] text-[#1c1c1e]">
                <Check className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                <span>{isEn ? 'Detailed Learning Statistics' : '상세 학습 통계'}</span>
              </li>
              <li className="flex items-center gap-3 text-[13px] text-[#C8C8C8]">
                <X className="w-5 h-5 flex-shrink-0" />
                <span>{isEn ? 'GRE / TOEFL / TOEIC Packs' : '단어장 (TOEFL/TOEIC/GRE/IELTS/EBS/기출)'}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 단품 상품 */}
        <div className="mt-16">
          <h2 className="text-[22px] font-bold text-[#1c1c1e] text-center mb-3">
            {isEn ? 'Vocab Packs' : '단품 상품'}
          </h2>
          <p className="text-[14px] text-gray-500 text-center mb-8">
            {isEn ? 'Buy only what you need. No subscription required.' : '필요한 콘텐츠만 골라서 구매하세요. 구독 없이 바로 이용!'}
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {/* 2026 수능기출완전분석 - 베스트 (글로벌 숨김) */}
            {!isEn && (<div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-shadow">
              <div className="absolute -top-3 right-4">
                <span className="bg-[#F59E0B] text-white text-[11px] font-bold px-3 py-1 rounded-full">
                  베스트
                </span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#F59E0B] to-[#EF4444] rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">📝</span>
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#1c1c1e]">2026 수능기출완전분석</h3>
                  <p className="text-[12px] text-[#999999]">521개 단어</p>
                </div>
              </div>
              <p className="text-gray-500 text-[13px] mb-4">
                2026년 수능 기출문제 완전 분석. 듣기/독해 영역별 핵심 어휘를 한 번에!
              </p>
              <div className="flex items-end gap-1 mb-4">
                <span className="text-[28px] font-bold text-[#1c1c1e]">₩3,900</span>
                <span className="text-[#999999] text-[12px] mb-1">6개월</span>
              </div>
              <button
                onClick={() => router.push("/checkout?package=2026-csat-analysis")}
                className="w-full py-3 px-4 text-center rounded-xl font-semibold text-[14px] bg-[#F59E0B] text-white hover:bg-[#D97706] transition-colors"
              >
                구매하기
              </button>
            </div>)}

            {/* EBS 연계어휘 */}
            {/* EBS 연계어휘 (글로벌 숨김) */}
            {!isEn && (<div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-shadow">
              <div className="absolute -top-3 right-4">
                <span className="bg-[#10B981] text-white text-[11px] font-bold px-3 py-1 rounded-full">
                  NEW
                </span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">📚</span>
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#1c1c1e]">EBS 연계어휘</h3>
                  <p className="text-[12px] text-[#999999]">3,546개 단어</p>
                </div>
              </div>
              <p className="text-gray-500 text-[13px] mb-4">
                3개 교재(영어듣기·영어·영어독해연습) 연계 어휘 완벽 대비
              </p>
              <div className="flex items-end gap-1 mb-4">
                <span className="text-[28px] font-bold text-[#1c1c1e]">₩6,900</span>
                <span className="text-[#999999] text-[12px] mb-1">6개월</span>
              </div>
              <button
                onClick={() => router.push("/checkout?package=ebs-vocab")}
                className="w-full py-3 px-4 text-center rounded-xl font-semibold text-[14px] bg-[#10B981] text-white hover:bg-[#059669] transition-colors"
              >
                구매하기
              </button>
            </div>)}

            {/* TOEFL 완전정복 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-shadow">
              <div className="absolute -top-3 right-4">
                <span className="bg-[#10B981] text-white text-[11px] font-bold px-3 py-1 rounded-full">
                  NEW
                </span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">🌍</span>
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#1c1c1e]">{isEn ? 'TOEFL Complete' : 'TOEFL 완전정복'}</h3>
                  <p className="text-[12px] text-[#999999]">{isEn ? '2,907 words' : '2,907개 단어'}</p>
                </div>
              </div>
              <p className="text-gray-500 text-[13px] mb-4">
                {isEn
                  ? 'TOEFL Essential + Mastery — systematic vocabulary mastery.'
                  : 'TOEFL Essential + Mastery 전체 단어를 체계적으로 학습하세요.'}
              </p>
              <div className="flex items-end gap-1 mb-4">
                <span className="text-[28px] font-bold text-[#1c1c1e]">{isEn ? '$9.99' : '₩9,900'}</span>
                <span className="text-[#999999] text-[12px] mb-1">{isEn ? '6 months' : '6개월'}</span>
              </div>
              <button
                onClick={() => router.push("/checkout?package=toefl-complete")}
                className="w-full py-3 px-4 text-center rounded-xl font-semibold text-[14px] bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-colors"
              >
                {isEn ? 'Buy Now' : '구매하기'}
              </button>
            </div>

            {/* TOEIC 점수폭발 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-shadow">
              <div className="absolute -top-3 right-4">
                <span className="bg-[#10B981] text-white text-[11px] font-bold px-3 py-1 rounded-full">
                  NEW
                </span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">🏢</span>
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#1c1c1e]">{isEn ? 'TOEIC Score Booster' : 'TOEIC 점수폭발'}</h3>
                  <p className="text-[12px] text-[#999999]">{isEn ? '2,357 words' : '2,357개 단어'}</p>
                </div>
              </div>
              <p className="text-gray-500 text-[13px] mb-4">
                {isEn
                  ? 'Essential TOEIC vocabulary with AI images. Primer + Booster two-stage system.'
                  : '취업·승진 필수! TOEIC 핵심 어휘를 AI 이미지로 한 번에 정복. Starter(기초) + Booster(실전) 2단계 구성.'}
              </p>
              <div className="flex items-end gap-1 mb-4">
                <span className="text-[28px] font-bold text-[#1c1c1e]">{isEn ? '$9.99' : '₩9,900'}</span>
                <span className="text-[#999999] text-[12px] mb-1">{isEn ? '6 months' : '6개월'}</span>
              </div>
              <button
                onClick={() => router.push("/checkout?package=toeic-complete")}
                className="w-full py-3 px-4 text-center rounded-xl font-semibold text-[14px] bg-[#10B981] text-white hover:bg-[#059669] transition-colors"
              >
                {isEn ? 'Buy Now' : '구매하기'}
              </button>
            </div>

            {/* SAT 핵심 어휘 - KR only (글로벌은 구독에 포함) */}
            {!isEn && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-shadow">
              <div className="absolute -top-3 right-4">
                <span className="bg-[#10B981] text-white text-[11px] font-bold px-3 py-1 rounded-full">
                  NEW
                </span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#F97316] to-[#EA580C] rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">🎯</span>
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#1c1c1e]">SAT 핵심 어휘</h3>
                  <p className="text-[12px] text-[#999999]">2,120개 단어</p>
                </div>
              </div>
              <p className="text-gray-500 text-[13px] mb-4">
                SAT/PSAT 고득점 필수 어휘. Greek·Latin 어근 기반 테마별(L1) + 혼동어휘(L2) 체계적 구성.
              </p>
              <div className="flex items-end gap-1 mb-4">
                <span className="text-[28px] font-bold text-[#1c1c1e]">₩9,900</span>
                <span className="text-[#999999] text-[12px] mb-1">6개월</span>
              </div>
              <button
                onClick={() => router.push("/checkout?package=sat-complete")}
                className="w-full py-3 px-4 text-center rounded-xl font-semibold text-[14px] bg-[#F97316] text-white hover:bg-[#EA580C] transition-colors"
              >
                구매하기
              </button>
            </div>
            )}

            {/* GRE 완전정복 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-shadow">
              <div className="absolute -top-3 right-4">
                <span className="bg-[#10B981] text-white text-[11px] font-bold px-3 py-1 rounded-full">
                  NEW
                </span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#6366F1] to-[#4338CA] rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">🎓</span>
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#1c1c1e]">{isEn ? 'GRE Verbal Mastery' : 'GRE 완전정복'}</h3>
                  <p className="text-[12px] text-[#999999]">{isEn ? '4,241 words' : '4,241개 단어'}</p>
                </div>
              </div>
              <p className="text-gray-500 text-[13px] mb-4">
                {isEn
                  ? 'GRE Verbal + Elite — 4,241 words. Greek & Latin root-based rapid mastery.'
                  : 'GRE Verbal + Elite 4,241개. Greek·Latin 어원 기반 단기 완성.'}
              </p>
              <div className="flex items-end gap-1 mb-4">
                <span className="text-[28px] font-bold text-[#1c1c1e]">{isEn ? '$12.99' : '₩12,900'}</span>
                <span className="text-[#999999] text-[12px] mb-1">{isEn ? '6 months' : '6개월'}</span>
              </div>
              <button
                onClick={() => router.push("/checkout?package=gre-complete")}
                className="w-full py-3 px-4 text-center rounded-xl font-semibold text-[14px] bg-[#6366F1] text-white hover:bg-[#4338CA] transition-colors"
              >
                {isEn ? 'Buy Now' : '구매하기'}
              </button>
            </div>

            {/* IELTS 완전정복 - 글로벌은 단품 구매 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-shadow">
              <div className="absolute -top-3 right-4">
                <span className="bg-[#10B981] text-white text-[11px] font-bold px-3 py-1 rounded-full">
                  NEW
                </span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] rounded-xl flex items-center justify-center">
                  <span className="text-white text-base font-bold">UK</span>
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#1c1c1e]">{isEn ? 'IELTS Academic Mastery' : 'IELTS 완전정복'}</h3>
                  <p className="text-[12px] text-[#999999]">{isEn ? '691 words' : '691개 단어'}</p>
                </div>
              </div>
              <p className="text-gray-500 text-[13px] mb-4">
                {isEn
                  ? 'IELTS Foundation + Academic — 691 words. Band 5–8 complete coverage.'
                  : 'IELTS Foundation + Academic 691개. Band 5~8 전 구간 단기 완성.'}
              </p>
              <div className="flex items-end gap-1 mb-4">
                <span className="text-[28px] font-bold text-[#1c1c1e]">{isEn ? '$4.99' : '₩4,900'}</span>
                <span className="text-[#999999] text-[12px] mb-1">{isEn ? '6 months' : '6개월'}</span>
              </div>
              <button
                onClick={() => router.push("/checkout?package=ielts-complete")}
                className="w-full py-3 px-4 text-center rounded-xl font-semibold text-[14px] bg-[#0EA5E9] text-white hover:bg-[#0284C7] transition-colors"
              >
                {isEn ? 'Buy Now' : '구매하기'}
              </button>
            </div>

            {/* ACT 핵심 어휘 - KR only (글로벌은 구독에 포함) */}
            {!isEn && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-shadow">
              <div className="absolute -top-3 right-4">
                <span className="bg-[#10B981] text-white text-[11px] font-bold px-3 py-1 rounded-full">
                  NEW
                </span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">📐</span>
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#1c1c1e]">ACT 완전정복</h3>
                  <p className="text-[12px] text-[#999999]">822개 단어</p>
                </div>
              </div>
              <p className="text-gray-500 text-[13px] mb-4">
                ACT Core(핵심) + Plus(확장) 전체 어휘. ACT 고득점 완벽 대비.
              </p>
              <div className="flex items-end gap-1 mb-4">
                <span className="text-[28px] font-bold text-[#1c1c1e]">₩9,900</span>
                <span className="text-[#999999] text-[12px] mb-1">6개월</span>
              </div>
              <button
                onClick={() => router.push("/checkout?package=act-complete")}
                className="w-full py-3 px-4 text-center rounded-xl font-semibold text-[14px] bg-[#8B5CF6] text-white hover:bg-[#7C3AED] transition-colors"
              >
                구매하기
              </button>
            </div>
            )}
          </div>
        </div>

        {/* 기능 비교 테이블 */}
        <div className="mt-16">
          <h2 className="text-[22px] font-bold text-[#1c1c1e] text-center mb-6">
            {isEn ? 'Plan Comparison' : '플랜 상세 비교'}
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left py-3 px-3 sm:py-4 sm:px-6 font-semibold text-[13px] sm:text-[14px] text-[#1c1c1e]">
                    {isEn ? 'Feature' : '기능'}
                  </th>
                  <th className="text-center py-3 px-2 sm:py-4 sm:px-6 font-semibold text-[13px] sm:text-[14px] text-gray-500">
                    {isEn ? 'Free' : '무료'}
                  </th>
                  <th className="text-center py-3 px-2 sm:py-4 sm:px-6 font-semibold text-[13px] sm:text-[14px] text-[#14B8A6]">
                    <span className="sm:hidden">{isEn ? 'Basic' : '베이직'}</span>
                    <span className="hidden sm:inline">{isEn ? 'Basic' : '베이직'}</span>
                  </th>
                  <th className="text-center py-3 px-2 sm:py-4 sm:px-6 font-semibold text-[13px] sm:text-[14px] text-purple-500">
                    <span className="sm:hidden">{isEn ? 'Pro' : '프리'}</span>
                    <span className="hidden sm:inline">{isEn ? 'Premium' : '프리미엄'}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr
                    key={feature.name}
                    className={index % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]"}
                  >
                    <td className="py-3 px-3 sm:py-4 sm:px-6 text-[12px] sm:text-[13px] text-[#1c1c1e]">{feature.name}</td>
                    <td className="py-3 px-2 sm:py-4 sm:px-6 text-center">
                      {typeof feature.free === "boolean" ? (
                        feature.free ? (
                          <Check className="w-5 h-5 text-[#10B981] mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-[#E8E8E8] mx-auto" />
                        )
                      ) : (
                        <span className="text-[11px] sm:text-[12px] text-gray-500">
                          {feature.free}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 sm:py-4 sm:px-6 text-center">
                      {typeof feature.basic === "boolean" ? (
                        feature.basic ? (
                          <Check className="w-5 h-5 text-[#10B981] mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-[#E8E8E8] mx-auto" />
                        )
                      ) : (
                        <span className="text-[11px] sm:text-[12px] text-[#14B8A6] font-medium">
                          {feature.basic}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 sm:py-4 sm:px-6 text-center">
                      {typeof feature.premium === "boolean" ? (
                        feature.premium ? (
                          <Check className="w-5 h-5 text-[#10B981] mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-[#E8E8E8] mx-auto" />
                        )
                      ) : (
                        <span className="text-[11px] sm:text-[12px] text-purple-500 font-medium">
                          {feature.premium}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ 섹션 */}
        <div className="mt-16">
          <h2 className="text-[22px] font-bold text-[#1c1c1e] text-center mb-6">
            {isEn ? 'FAQ' : '자주 묻는 질문'}
          </h2>

          <div className="max-w-3xl mx-auto space-y-3">
            <details className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 group">
              <summary className="font-semibold text-[14px] text-[#1c1c1e] cursor-pointer list-none flex justify-between items-center">
                {isEn ? 'Can I change my plan anytime?' : '언제든지 플랜을 변경할 수 있나요?'}
                <span className="text-[#C8C8C8] group-open:rotate-180 transition-transform text-[12px]">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-[13px] text-gray-500 leading-relaxed">
                {isEn
                  ? 'Yes, you can upgrade at any time and it takes effect immediately. Downgrades apply after the current billing period ends.'
                  : '네, 언제든지 플랜을 업그레이드할 수 있습니다. 업그레이드 시 즉시 적용됩니다. 다운그레이드는 현재 결제 기간 만료 후 자동 적용됩니다.'}
              </p>
            </details>

            <details className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 group">
              <summary className="font-semibold text-[14px] text-[#1c1c1e] cursor-pointer list-none flex justify-between items-center">
                {isEn ? 'What is your refund policy?' : '환불 정책은 어떻게 되나요?'}
                <span className="text-[#C8C8C8] group-open:rotate-180 transition-transform text-[12px]">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-[13px] text-gray-500 leading-relaxed">
                {isEn
                  ? 'Full refund within 7 days of purchase. After 7 days, partial refund based on remaining days. Contact support@vocavision.app for help.'
                  : '결제 후 7일 이내에 환불 요청하시면 전액 환불해 드립니다. 7일 이후에는 남은 기간에 따라 부분 환불이 가능하며, 자세한 사항은 고객센터로 문의해 주세요.'}
              </p>
            </details>

            <details className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 group">
              <summary className="font-semibold text-[14px] text-[#1c1c1e] cursor-pointer list-none flex justify-between items-center">
                {isEn ? 'What payment methods do you accept?' : '결제 수단은 무엇을 지원하나요?'}
                <span className="text-[#C8C8C8] group-open:rotate-180 transition-transform text-[12px]">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-[13px] text-gray-500 leading-relaxed">
                {isEn
                  ? 'We accept major credit cards via our secure payment processor.'
                  : '신용카드를 지원하며, 토스페이먼츠를 통해 안전하게 결제됩니다.'}
              </p>
            </details>
          </div>
        </div>

        {/* CTA 섹션 */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] rounded-2xl p-8 md:p-12 shadow-[0_4px_24px_rgba(20,184,166,0.25)]">
            <h2 className="text-[24px] md:text-[28px] font-bold text-white mb-3">
              {isEn ? 'Start Learning Vocabulary Today!' : '지금 바로 영어 단어 학습을 시작하세요!'}
            </h2>
            <p className="text-white/80 text-[14px] mb-8 max-w-2xl mx-auto leading-relaxed">
              {isEn ? (
                <>
                  Start free with SAT Starter vocabulary — no credit card required.
                  <br />
                  Upgrade anytime to unlock all 19,000+ words.
                </>
              ) : (
                <>
                  무료로 수능 L1(기초) 필수 단어 951개를 학습하고,
                  <br />
                  업그레이드해서 전체 2,000개+ 단어를 잠금 해제하세요.
                </>
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/login"
                className="inline-block px-8 py-4 bg-white text-[#14B8A6] font-bold text-[14px] rounded-xl hover:bg-gray-50 transition-colors shadow-lg"
              >
                {isEn ? 'Start for Free' : '무료로 시작하기'}
              </Link>
              <Link
                href={isEn ? '/learn?exam=SAT&level=L1&demo=true' : '/learn?exam=CSAT&demo=1'}
                className="inline-block px-8 py-4 bg-white/15 text-white font-semibold text-[14px] rounded-xl hover:bg-white/25 transition-colors border border-white/30"
              >
                {isEn ? 'Try Demo' : '먼저 맛보기'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
