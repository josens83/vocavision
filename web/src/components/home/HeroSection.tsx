"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-b from-slate-50 to-white overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-100/20 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-16 md:py-24 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full bg-teal-50 border border-teal-100 px-4 py-1.5">
              <span className="text-sm font-medium text-teal-700">
                수능 · TEPS 특화 단어장
              </span>
            </div>

            <h1 className="text-4xl font-bold leading-tight text-gray-900 md:text-5xl lg:text-[3.25rem]">
              AI가 만든 이미지로
              <br />
              <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                단어가 눈에 박힌다
              </span>
            </h1>

            <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
              어원 분석 · 창의적 암기법 · AI 이미지 시각화
              <br />
              <span className="font-medium text-gray-700">8가지 학습 요소</span>로 완벽하게 기억하는 영단어
            </p>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="font-bold text-gray-900">7,600+</span> 단어
              </span>
              <span className="h-4 w-px bg-gray-300" />
              <span className="flex items-center gap-1.5">
                <span className="font-bold text-gray-900">3종</span> AI 이미지
              </span>
              <span className="h-4 w-px bg-gray-300" />
              <span className="flex items-center gap-1.5">
                <span className="font-bold text-gray-900">무료</span> 체험
              </span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row pt-2">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-6 py-3.5 font-semibold text-white hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                무료로 시작하기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/learn?exam=CSAT&level=L1&demo=true"
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3.5 font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
              >
                <Play className="mr-2 h-4 w-4" />
                데모 체험하기
              </Link>
            </div>
          </div>

          <div className="relative lg:pl-8">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl shadow-gray-200/50">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-teal-50 border border-teal-100 px-3 py-1 text-sm font-medium text-teal-700">
                    수능 L2
                  </span>
                  <span className="text-sm text-gray-400">1 / 20</span>
                </div>

                <div className="py-2">
                  <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                    CONJECTURE
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">/kənˈdʒek.tʃər/</p>
                </div>

                <p className="text-xl text-gray-700 font-medium">추측, 가설</p>

                <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-teal-50 via-cyan-50 to-slate-50 flex items-center justify-center overflow-hidden border border-gray-100">
                  <div className="text-center p-6">
                    <div className="text-6xl mb-3">🔮</div>
                    <p className="text-sm text-gray-500">AI 생성 이미지</p>
                  </div>
                </div>

                <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
                  <p className="text-sm font-medium text-amber-800">
                    💡 "컨젝쳐 = 근데 저? 추측이에요."
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <button className="rounded-xl bg-rose-50 text-rose-600 py-2.5 text-sm font-medium hover:bg-rose-100 transition-colors border border-rose-100">
                    모름
                  </button>
                  <button className="rounded-xl bg-amber-50 text-amber-600 py-2.5 text-sm font-medium hover:bg-amber-100 transition-colors border border-amber-100">
                    애매함
                  </button>
                  <button className="rounded-xl bg-emerald-50 text-emerald-600 py-2.5 text-sm font-medium hover:bg-emerald-100 transition-colors border border-emerald-100">
                    알았음
                  </button>
                </div>
              </div>
            </div>

            <div className="absolute -z-10 -top-4 -right-4 h-full w-full rounded-2xl bg-teal-100/40" />
            <div className="absolute -z-20 -top-8 -right-8 h-full w-full rounded-2xl bg-teal-50/40" />
          </div>
        </div>
      </div>
    </section>
  );
}
