"use client";

import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";

const plans = [
  {
    name: "무료",
    price: "0",
    period: "",
    description: "수능 L1 완전 무료",
    features: ["수능 L1 (810단어)", "AI 이미지 3종", "플래시카드 학습", "기본 복습 기능"],
    cta: "무료로 시작",
    href: "/auth/register",
    highlighted: false,
  },
  {
    name: "베이직",
    price: "4,900",
    period: "/월",
    description: "수능 완벽 대비",
    features: [
      "수능 전체 (3,335단어)",
      "L1 + L2 + L3 모든 레벨",
      "퀴즈 & 복습 시스템",
      "학습 통계 대시보드",
    ],
    cta: "베이직 시작",
    href: "/checkout?plan=basic",
    highlighted: true,
  },
  {
    name: "프리미엄",
    price: "9,900",
    period: "/월",
    description: "수능 + TEPS 완벽 대비",
    features: [
      "수능 + TEPS (9,900+ 단어)",
      "모든 레벨 무제한",
      "고급 학습 분석",
      "우선 고객 지원",
    ],
    cta: "프리미엄 시작",
    href: "/checkout?plan=premium",
    highlighted: false,
  },
];

export default function PricingPreviewSection() {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="mx-auto max-w-5xl px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block rounded-full bg-indigo-50 border border-indigo-100 px-4 py-1.5 text-sm font-medium text-indigo-700 mb-4">
            요금제
          </span>
          <h2 className="text-3xl font-bold text-gray-900 mb-4 md:text-4xl">
            심플한 요금제
          </h2>
          <p className="text-gray-600 text-lg">
            수능 L1 단어는{" "}
            <span className="font-semibold text-indigo-600">완전 무료</span>
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-6 transition-all duration-200 ${
                plan.highlighted
                  ? "border-2 border-indigo-500 bg-white shadow-lg scale-[1.02]"
                  : "border border-gray-200 bg-white hover:shadow-md hover:border-gray-300"
              }`}
            >
              {/* Recommended Badge */}
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-semibold text-white">
                  추천
                </div>
              )}

              {/* Plan Name */}
              <div
                className={`text-sm font-medium mb-2 ${
                  plan.highlighted ? "text-indigo-600" : "text-gray-500"
                }`}
              >
                {plan.name}
              </div>

              {/* Price */}
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">
                  ₩{plan.price}
                </span>
                {plan.period && (
                  <span className="text-base font-normal text-gray-500">
                    {plan.period}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-6">{plan.description}</p>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, featureIndex) => (
                  <li
                    key={featureIndex}
                    className="flex items-start gap-2 text-sm text-gray-600"
                  >
                    <Check className="h-5 w-5 text-emerald-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link
                href={plan.href}
                className={`block w-full rounded-xl py-3 text-center font-semibold transition-all duration-200 ${
                  plan.highlighted
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Link to Full Pricing */}
        <div className="text-center mt-10">
          <Link
            href="/pricing"
            className="inline-flex items-center text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
          >
            자세한 요금제 보기
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
