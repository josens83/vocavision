"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

export default function CTASection() {
  return (
    <section className="bg-gray-900 py-20 lg:py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-blue-600/20 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl px-4 text-center relative">
        <h2 className="text-3xl font-bold text-white mb-4 md:text-4xl">
          지금 바로 시작하세요
        </h2>
        <p className="text-gray-400 mb-8 text-lg">
          회원가입 없이 데모 체험 가능 · 수능 L1 완전 무료
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 font-semibold text-gray-900 hover:bg-gray-100 transition-all duration-200 shadow-lg"
          >
            무료로 시작하기
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link
            href="/learn?exam=CSAT&level=L1&demo=true"
            className="inline-flex items-center justify-center rounded-xl border border-gray-700 bg-transparent px-8 py-4 font-semibold text-white hover:bg-gray-800 transition-all duration-200"
          >
            <Play className="mr-2 h-4 w-4" />
            데모 체험
          </Link>
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
          <span>✓ 신용카드 불필요</span>
          <span>✓ 7일 무료 체험</span>
          <span>✓ 언제든 취소 가능</span>
        </div>
      </div>
    </section>
  );
}
