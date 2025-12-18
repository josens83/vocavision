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
  { name: "수능 L1 단어", free: true, basic: true, premium: true },
  { name: "수능 L2 단어", free: false, basic: true, premium: true },
  { name: "수능 L3 단어", free: false, basic: true, premium: true },
  { name: "TEPS L1/L2/L3", free: false, basic: false, premium: true },
  { name: "AI 생성 이미지", free: "일부", basic: true, premium: true },
  { name: "플래시카드", free: true, basic: true, premium: true },
  { name: "퀴즈 모드", free: "기본", basic: "전체", premium: "전체" },
  { name: "학습 통계", free: "기본", basic: "상세", premium: "상세" },
  { name: "오프라인 학습", free: false, basic: true, premium: true },
  { name: "광고 없음", free: false, basic: true, premium: true },
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
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-pink-50">
      {/* 헤더 영역 */}
      <div className="pt-24 pb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          나에게 맞는 플랜 선택
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto px-4">
          무료로 시작하고, 필요할 때 업그레이드하세요.
          <br />
          베이직 플랜 가입 시{" "}
          <span className="text-indigo-600 font-semibold">
            프리미엄 7일 무료 체험
          </span>{" "}
          제공!
        </p>

        {/* 결제 주기 토글 */}
        <div className="mt-8 inline-flex items-center bg-gray-100 rounded-full p-1">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              !isYearly
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            월간 결제
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              isYearly
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            연간 결제
            <span className="ml-2 text-xs text-green-600 font-semibold">
              20% 할인
            </span>
          </button>
        </div>
      </div>

      {/* 요금제 카드 */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-8">
          {/* 무료 플랜 */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">무료</h3>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">₩0</span>
              <span className="text-gray-500">/월</span>
            </div>

            <p className="text-gray-600 text-sm mb-6">
              VocaVision을 처음 시작하는 분께 추천
            </p>

            <Link
              href="/auth/login"
              className="block w-full py-3 px-4 text-center rounded-xl font-medium border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              무료로 시작하기
            </Link>

            <ul className="mt-8 space-y-3">
              <li className="flex items-center gap-3 text-sm">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>수능 L1 단어 (1,000+개)</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>기본 플래시카드</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>기본 퀴즈 모드</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <X className="w-5 h-5 flex-shrink-0" />
                <span>수능 L2/L3 단어</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <X className="w-5 h-5 flex-shrink-0" />
                <span>TEPS 단어</span>
              </li>
            </ul>
          </div>

          {/* 베이직 플랜 */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-indigo-500 p-8 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-indigo-500 text-white text-xs font-semibold px-4 py-1 rounded-full">
                인기
              </span>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">베이직</h3>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">
                ₩{currentPrices.basic.toLocaleString()}
              </span>
              <span className="text-gray-500">/{isYearly ? "년" : "월"}</span>
              {isYearly && (
                <p className="text-sm text-green-600 mt-1">
                  월 ₩{Math.round(currentPrices.basic / 12).toLocaleString()}{" "}
                  (20% 할인)
                </p>
              )}
            </div>

            <p className="text-gray-600 text-sm mb-6">
              수능 영어 완벽 대비를 원하는 분께 추천
            </p>

            <button
              onClick={() => handlePlanSelect("basic")}
              className="block w-full py-3 px-4 text-center rounded-xl font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              베이직 시작하기
            </button>

            <p className="text-center text-xs text-indigo-600 mt-2">
              프리미엄 7일 무료 체험 포함
            </p>

            <ul className="mt-8 space-y-3">
              <li className="flex items-center gap-3 text-sm">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>수능 L1/L2/L3 전체 (3,300+개)</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>AI 생성 이미지 전체</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>전체 퀴즈 모드</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>상세 학습 통계</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>광고 없음</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <X className="w-5 h-5 flex-shrink-0" />
                <span>TEPS 단어</span>
              </li>
            </ul>
          </div>

          {/* 프리미엄 플랜 */}
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl shadow-lg p-8 relative text-white">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Crown className="w-5 h-5 text-yellow-300" />
              </div>
              <h3 className="text-xl font-bold">프리미엄</h3>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold">
                ₩{currentPrices.premium.toLocaleString()}
              </span>
              <span className="text-white/70">/{isYearly ? "년" : "월"}</span>
              {isYearly && (
                <p className="text-sm text-green-300 mt-1">
                  월 ₩{Math.round(currentPrices.premium / 12).toLocaleString()}{" "}
                  (20% 할인)
                </p>
              )}
            </div>

            <p className="text-white/80 text-sm mb-6">
              수능 + TEPS 완벽 대비를 원하는 분께 추천
            </p>

            <button
              onClick={() => handlePlanSelect("premium")}
              className="block w-full py-3 px-4 text-center rounded-xl font-medium bg-white text-indigo-700 hover:bg-gray-100 transition-colors"
            >
              프리미엄 시작하기
            </button>

            <ul className="mt-8 space-y-3">
              <li className="flex items-center gap-3 text-sm">
                <Check className="w-5 h-5 text-green-300 flex-shrink-0" />
                <span>수능 L1/L2/L3 전체</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Check className="w-5 h-5 text-green-300 flex-shrink-0" />
                <span className="font-semibold">TEPS L1/L2/L3 전체</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Check className="w-5 h-5 text-green-300 flex-shrink-0" />
                <span>AI 생성 이미지 전체</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Check className="w-5 h-5 text-green-300 flex-shrink-0" />
                <span>전체 퀴즈 모드</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Check className="w-5 h-5 text-green-300 flex-shrink-0" />
                <span>상세 학습 통계</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Check className="w-5 h-5 text-green-300 flex-shrink-0" />
                <span>오프라인 학습</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Check className="w-5 h-5 text-green-300 flex-shrink-0" />
                <span>광고 없음</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 기능 비교 테이블 */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            플랜 상세 비교
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl shadow-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">
                    기능
                  </th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900">
                    무료
                  </th>
                  <th className="text-center py-4 px-6 font-semibold text-indigo-600">
                    베이직
                  </th>
                  <th className="text-center py-4 px-6 font-semibold text-purple-600">
                    프리미엄
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr
                    key={feature.name}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="py-4 px-6 text-gray-700">{feature.name}</td>
                    <td className="py-4 px-6 text-center">
                      {typeof feature.free === "boolean" ? (
                        feature.free ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm text-gray-600">
                          {feature.free}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {typeof feature.basic === "boolean" ? (
                        feature.basic ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm text-indigo-600 font-medium">
                          {feature.basic}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {typeof feature.premium === "boolean" ? (
                        feature.premium ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm text-purple-600 font-medium">
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
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            자주 묻는 질문
          </h2>

          <div className="max-w-3xl mx-auto space-y-4">
            <details className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 group">
              <summary className="font-semibold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                언제든지 플랜을 변경할 수 있나요?
                <span className="text-gray-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-gray-600">
                네, 언제든지 플랜을 업그레이드하거나 다운그레이드할 수 있습니다.
                업그레이드 시 즉시 적용되며, 다운그레이드는 현재 결제 기간이
                끝난 후 적용됩니다.
              </p>
            </details>

            <details className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 group">
              <summary className="font-semibold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                프리미엄 7일 무료 체험은 어떻게 작동하나요?
                <span className="text-gray-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-gray-600">
                베이직 플랜에 가입하시면 자동으로 7일간 프리미엄 기능을 무료로
                체험하실 수 있습니다. 체험 기간이 끝나면 베이직 플랜으로 자동
                전환됩니다.
              </p>
            </details>

            <details className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 group">
              <summary className="font-semibold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                환불 정책은 어떻게 되나요?
                <span className="text-gray-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-gray-600">
                결제 후 7일 이내에 환불 요청하시면 전액 환불해 드립니다. 7일
                이후에는 남은 기간에 대한 부분 환불이 가능합니다.
              </p>
            </details>

            <details className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 group">
              <summary className="font-semibold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                결제 수단은 무엇을 지원하나요?
                <span className="text-gray-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-gray-600">
                신용카드, 체크카드, 계좌이체를 지원합니다. 토스페이먼츠를 통해
                안전하게 결제됩니다.
              </p>
            </details>
          </div>
        </div>

        {/* CTA 섹션 */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              지금 바로 영어 단어 학습을 시작하세요!
            </h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              무료로 수능 L1 필수 단어 1,000개를 학습하고,
              <br />
              업그레이드하면 전체 3,300개+ 단어를 잠금 해제하세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/login"
                className="inline-block px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
              >
                무료로 시작하기
              </Link>
              <Link
                href="/learn?exam=CSAT&demo=1"
                className="inline-block px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/30"
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
