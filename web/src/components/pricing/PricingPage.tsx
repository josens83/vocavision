"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, X, Sparkles, Crown, Zap } from "lucide-react";
import { useAuthStore } from "@/lib/store";

interface PlanFeature {
  name: string;
  free: boolean | string;
  basic: boolean | string;
  premium: boolean | string;
}

const features: PlanFeature[] = [
  { name: "수능 L1(기초)", free: true, basic: true, premium: true },
  { name: "수능 L2(중급)", free: false, basic: true, premium: true },
  { name: "수능 L3(고급)", free: false, basic: true, premium: true },
  { name: "TEPS L1(기본)/L2(필수)", free: false, basic: false, premium: true },
  { name: "AI 생성 이미지", free: "일부", basic: true, premium: true },
  { name: "플래시카드", free: true, basic: true, premium: true },
  { name: "퀴즈 모드", free: "전체", basic: "전체", premium: "전체" },
  { name: "학습 통계", free: false, basic: "상세", premium: "상세" },
];

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
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

  const currentPrices = prices[billingCycle];
  const isYearly = billingCycle === "yearly";

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* 헤더 영역 */}
      <div className="pt-24 pb-12 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1c1c1e] mb-3">
          나에게 맞는 플랜 선택
        </h1>
        <p className="text-[15px] text-gray-500 max-w-2xl mx-auto px-4">
          무료로 시작하고, 필요할 때 업그레이드하세요.
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
            월간 결제
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-6 py-2.5 rounded-full text-[14px] font-medium transition-all ${
              isYearly
                ? "bg-white text-[#1c1c1e] shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                : "text-gray-500 hover:text-[#1c1c1e]"
            }`}
          >
            연간 결제
            <span className="ml-2 text-[12px] text-[#10B981] font-semibold">
              20% 할인
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
              <h3 className="text-[18px] font-bold text-[#1c1c1e]">무료</h3>
            </div>

            <div className="mb-5">
              <span className="text-[36px] font-bold text-gray-500">₩0</span>
              <span className="text-[#999999] text-[14px]">/월</span>
            </div>

            <p className="text-gray-500 text-[13px] mb-6">
              VocaVision AI를 처음 시작하는 분께 추천
            </p>

            <Link
              href="/auth/login"
              className="block w-full py-3.5 px-4 text-center rounded-xl font-semibold text-[14px] border-2 border-[#E8E8E8] text-gray-500 hover:bg-gray-100 transition-colors"
            >
              무료로 시작하기
            </Link>

            <ul className="mt-7 space-y-3">
              <li className="flex items-center gap-3 text-[13px] text-[#1c1c1e]">
                <Check className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                <span>수능 L1(기초) (800+개)</span>
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
                <span>학습 통계</span>
              </li>
            </ul>
          </div>

          {/* 프리미엄 플랜 - 가운데 배치 */}
          <div className="bg-gradient-to-br from-[#A855F7] to-[#7C3AED] rounded-2xl shadow-[0_4px_20px_rgba(168,85,247,0.25)] p-7 relative text-white">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-gradient-to-r from-[#F59E0B] to-[#EF4444] text-white text-[12px] font-bold px-5 py-1.5 rounded-full shadow-lg">
                인기
              </span>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                <Crown className="w-5 h-5 text-[#FCD34D]" />
              </div>
              <h3 className="text-[18px] font-bold">프리미엄</h3>
            </div>

            <div className="mb-5">
              <span className="text-[36px] font-bold">
                ₩{currentPrices.premium.toLocaleString()}
              </span>
              <span className="text-white/60 text-[14px]">/{isYearly ? "년" : "월"}</span>
              {isYearly && (
                <p className="text-[13px] text-[#86EFAC] mt-1 font-medium">
                  월 ₩{Math.round(currentPrices.premium / 12).toLocaleString()}{" "}
                  (20% 할인)
                </p>
              )}
            </div>

            <p className="text-white/70 text-[13px] mb-6">
              수능 + TEPS 완벽 대비를 원하는 분께 추천
            </p>

            <button
              onClick={() => handlePlanSelect("premium")}
              className="block w-full py-3.5 px-4 text-center rounded-xl font-semibold text-[14px] bg-white text-purple-500 hover:bg-gray-100 transition-colors"
            >
              프리미엄 시작하기
            </button>

            <ul className="mt-7 space-y-3">
              <li className="flex items-center gap-3 text-[13px]">
                <Check className="w-5 h-5 text-[#86EFAC] flex-shrink-0" />
                <span className="font-semibold">✨ 모든 단어장(단품) 무료 이용</span>
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
                <span>AI 생성 이미지 전체</span>
              </li>
              <li className="flex items-center gap-3 text-[13px]">
                <Check className="w-5 h-5 text-[#86EFAC] flex-shrink-0" />
                <span>전체 퀴즈 모드</span>
              </li>
              <li className="flex items-center gap-3 text-[13px]">
                <Check className="w-5 h-5 text-[#86EFAC] flex-shrink-0" />
                <span>상세 학습 통계</span>
              </li>
            </ul>
          </div>

          {/* 베이직 플랜 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-7 relative">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 bg-[#ECFDF5] rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#14B8A6]" />
              </div>
              <h3 className="text-[18px] font-bold text-[#1c1c1e]">베이직</h3>
            </div>

            <div className="mb-5">
              <span className="text-[36px] font-bold text-[#14B8A6]">
                ₩{currentPrices.basic.toLocaleString()}
              </span>
              <span className="text-[#999999] text-[14px]">/{isYearly ? "년" : "월"}</span>
              {isYearly && (
                <p className="text-[13px] text-[#10B981] mt-1 font-medium">
                  월 ₩{Math.round(currentPrices.basic / 12).toLocaleString()}{" "}
                  (20% 할인)
                </p>
              )}
            </div>

            <p className="text-gray-500 text-[13px] mb-6">
              수능 영어 완벽 대비를 원하는 분께 추천
            </p>

            <button
              onClick={() => handlePlanSelect("basic")}
              className="block w-full py-3.5 px-4 text-center rounded-xl font-semibold text-[14px] bg-[#14B8A6] text-white hover:bg-[#0D9488] transition-colors shadow-[0_4px_12px_rgba(20,184,166,0.3)]"
            >
              베이직 시작하기
            </button>

            <ul className="mt-7 space-y-3">
              <li className="flex items-center gap-3 text-[13px] text-[#1c1c1e]">
                <Check className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                <span>수능 L1(기초)/L2(중급)/L3(고급) 전체 (1,700+개)</span>
              </li>
              <li className="flex items-center gap-3 text-[13px] text-[#1c1c1e]">
                <Check className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                <span>AI 생성 이미지 전체</span>
              </li>
              <li className="flex items-center gap-3 text-[13px] text-[#1c1c1e]">
                <Check className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                <span>전체 퀴즈 모드</span>
              </li>
              <li className="flex items-center gap-3 text-[13px] text-[#1c1c1e]">
                <Check className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                <span>상세 학습 통계</span>
              </li>
              <li className="flex items-center gap-3 text-[13px] text-[#C8C8C8]">
                <X className="w-5 h-5 flex-shrink-0" />
                <span>TEPS 단어</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 단품 상품 */}
        <div className="mt-16">
          <h2 className="text-[22px] font-bold text-[#1c1c1e] text-center mb-3">
            단품 상품
          </h2>
          <p className="text-[14px] text-gray-500 text-center mb-8">
            필요한 콘텐츠만 골라서 구매하세요. 구독 없이 바로 이용!
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* 2026 수능기출완전분석 - 베스트 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-shadow">
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
            </div>

            {/* EBS 연계어휘 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-shadow">
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
                  <p className="text-[12px] text-[#999999]">3,837개 단어</p>
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
            </div>
          </div>
        </div>

        {/* 기능 비교 테이블 */}
        <div className="mt-16">
          <h2 className="text-[22px] font-bold text-[#1c1c1e] text-center mb-6">
            플랜 상세 비교
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left py-3 px-3 sm:py-4 sm:px-6 font-semibold text-[13px] sm:text-[14px] text-[#1c1c1e]">
                    기능
                  </th>
                  <th className="text-center py-3 px-2 sm:py-4 sm:px-6 font-semibold text-[13px] sm:text-[14px] text-gray-500">
                    무료
                  </th>
                  <th className="text-center py-3 px-2 sm:py-4 sm:px-6 font-semibold text-[13px] sm:text-[14px] text-[#14B8A6]">
                    <span className="sm:hidden">베이직</span>
                    <span className="hidden sm:inline">베이직</span>
                  </th>
                  <th className="text-center py-3 px-2 sm:py-4 sm:px-6 font-semibold text-[13px] sm:text-[14px] text-purple-500">
                    <span className="sm:hidden">프리</span>
                    <span className="hidden sm:inline">프리미엄</span>
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
            자주 묻는 질문
          </h2>

          <div className="max-w-3xl mx-auto space-y-3">
            <details className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 group">
              <summary className="font-semibold text-[14px] text-[#1c1c1e] cursor-pointer list-none flex justify-between items-center">
                언제든지 플랜을 변경할 수 있나요?
                <span className="text-[#C8C8C8] group-open:rotate-180 transition-transform text-[12px]">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-[13px] text-gray-500 leading-relaxed">
                네, 언제든지 플랜을 업그레이드할 수 있습니다. 업그레이드 시 즉시
                적용됩니다. 다운그레이드는 현재 결제 기간 만료 후 자동 적용됩니다.
              </p>
            </details>

            <details className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 group">
              <summary className="font-semibold text-[14px] text-[#1c1c1e] cursor-pointer list-none flex justify-between items-center">
                환불 정책은 어떻게 되나요?
                <span className="text-[#C8C8C8] group-open:rotate-180 transition-transform text-[12px]">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-[13px] text-gray-500 leading-relaxed">
                결제 후 7일 이내에 환불 요청하시면 전액 환불해 드립니다. 7일
                이후에는 남은 기간에 따라 부분 환불이 가능하며, 자세한 사항은
                고객센터로 문의해 주세요.
              </p>
            </details>

            <details className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 group">
              <summary className="font-semibold text-[14px] text-[#1c1c1e] cursor-pointer list-none flex justify-between items-center">
                결제 수단은 무엇을 지원하나요?
                <span className="text-[#C8C8C8] group-open:rotate-180 transition-transform text-[12px]">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-[13px] text-gray-500 leading-relaxed">
                신용카드를 지원하며, 토스페이먼츠를 통해 안전하게 결제됩니다.
              </p>
            </details>
          </div>
        </div>

        {/* CTA 섹션 */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] rounded-2xl p-8 md:p-12 shadow-[0_4px_24px_rgba(20,184,166,0.25)]">
            <h2 className="text-[24px] md:text-[28px] font-bold text-white mb-3">
              지금 바로 영어 단어 학습을 시작하세요!
            </h2>
            <p className="text-white/80 text-[14px] mb-8 max-w-2xl mx-auto leading-relaxed">
              무료로 수능 L1(기초) 필수 단어 880개+를 학습하고,
              <br />
              업그레이드해서 전체 2,000개+ 단어를 잠금 해제하세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/login"
                className="inline-block px-8 py-4 bg-white text-[#14B8A6] font-bold text-[14px] rounded-xl hover:bg-gray-50 transition-colors shadow-lg"
              >
                무료로 시작하기
              </Link>
              <Link
                href="/learn?exam=CSAT&demo=1"
                className="inline-block px-8 py-4 bg-white/15 text-white font-semibold text-[14px] rounded-xl hover:bg-white/25 transition-colors border border-white/30"
              >
                먼저 맛보기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
