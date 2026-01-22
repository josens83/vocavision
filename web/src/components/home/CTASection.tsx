"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-20 lg:py-24 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-teal-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-cyan-500/20 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl px-4 text-center relative">
        <h2 className="text-3xl font-bold text-white mb-4 md:text-4xl">
          60초 안에 체험해보세요!
        </h2>
        <p className="text-gray-400 mb-8 text-lg">
          회원가입 없이 샘플 단어로 빠르게 체험
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/learn?exam=CSAT&level=L1&demo=true"
            className="inline-flex items-center justify-center rounded-xl bg-teal-500 hover:bg-teal-400 px-8 py-4 font-semibold text-white transition-all duration-200 shadow-lg shadow-teal-500/25"
          >
            맛보기 시작
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-teal-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            신용카드 불필요
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-teal-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            수능 L1 완전 무료
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-teal-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            언제든 취소 가능
          </span>
        </div>
      </div>
    </section>
  );
}
