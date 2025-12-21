"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/navigation/Navigation";
import { Check, ArrowLeft, Loader2, BookOpen, Clock, CreditCard } from "lucide-react";

interface PackageInfo {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDesc?: string;
  price: number;
  originalPrice?: number;
  durationDays: number;
  badge?: string;
  wordCount: number;
}

export default function PackageDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [packageInfo, setPackageInfo] = useState<PackageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchPackageInfo();
    }
  }, [slug]);

  const fetchPackageInfo = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/packages/${slug}`
      );
      if (!response.ok) throw new Error("패키지를 찾을 수 없습니다.");
      const data = await response.json();
      setPackageInfo(data.package);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        </main>
      </>
    );
  }

  if (error || !packageInfo) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-gray-50 pt-20">
          <div className="max-w-4xl mx-auto px-4 py-16 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              패키지를 찾을 수 없습니다
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-primary/90 transition-colors"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </main>
      </>
    );
  }

  const hasDiscount = packageInfo.originalPrice && packageInfo.originalPrice > packageInfo.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - packageInfo.price / packageInfo.originalPrice!) * 100)
    : 0;
  const durationText = packageInfo.durationDays >= 365 ? "1년" : `${packageInfo.durationDays}일`;

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gray-50 pt-20">
        {/* 히어로 배너 */}
        <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white overflow-hidden">
          {/* 배경 패턴 */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 border-4 border-white rounded-full" />
            <div className="absolute bottom-10 right-10 w-48 h-48 border-4 border-white rounded-full" />
            <div className="absolute top-1/2 left-1/3 w-24 h-24 border-4 border-white rounded-full" />
          </div>

          <div className="max-w-4xl mx-auto px-4 py-16 relative z-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              홈으로
            </Link>

            {packageInfo.badge && (
              <span className="inline-block px-3 py-1 bg-emerald-500 text-white text-sm font-bold rounded-full mb-4">
                {packageInfo.badge}
              </span>
            )}

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {packageInfo.name}
            </h1>

            <p className="text-xl text-white/90 mb-8 max-w-2xl">
              {packageInfo.description || packageInfo.shortDesc || "TEPS 고득점을 위한 필수 단어장"}
            </p>

            <div className="flex flex-wrap items-center gap-6 text-lg">
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6" />
                <span className="font-semibold">{packageInfo.wordCount}개</span>
                <span className="text-white/80">단어</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-6 h-6" />
                <span className="font-semibold">{durationText}</span>
                <span className="text-white/80">이용</span>
              </div>
            </div>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            {/* 왼쪽: 상품 설명 */}
            <div className="md:col-span-2 space-y-8">
              {/* 이런 분께 추천 */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  이런 분께 추천해요
                </h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-gray-700">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>TEPS 고득점을 목표로 하는 분</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-700">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>핵심 빈출 단어만 집중적으로 학습하고 싶은 분</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-700">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>단기간에 효율적으로 어휘력을 향상시키고 싶은 분</span>
                  </li>
                </ul>
              </div>

              {/* 포함 내용 */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  포함된 학습 콘텐츠
                </h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-gray-700">
                    <Check className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                    <span><strong>{packageInfo.wordCount}개</strong> TEPS 최다 빈출 단어</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-700">
                    <Check className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                    <span>단어별 <strong>상세 해설</strong> 및 예문</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-700">
                    <Check className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                    <span><strong>플래시카드</strong> 학습 모드</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-700">
                    <Check className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                    <span><strong>퀴즈</strong> 테스트 모드</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-700">
                    <Check className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                    <span><strong>학습 진도</strong> 추적</span>
                  </li>
                </ul>
              </div>

              {/* 이용 안내 */}
              <div className="bg-gray-100 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  이용 안내
                </h2>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• 결제 완료 즉시 이용 가능합니다.</li>
                  <li>• 구매일로부터 {durationText}간 이용할 수 있습니다.</li>
                  <li>• 일회성 결제로 자동 갱신되지 않습니다.</li>
                  <li>• 결제 후 7일 이내 미이용 시 전액 환불 가능합니다.</li>
                </ul>
              </div>
            </div>

            {/* 오른쪽: 구매 카드 */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sticky top-24">
                {hasDiscount && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-red-500 font-bold text-sm">
                      {discountPercent}% 할인
                    </span>
                    <span className="text-gray-400 line-through text-sm">
                      ₩{packageInfo.originalPrice!.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold text-gray-900">
                    ₩{packageInfo.price.toLocaleString()}
                  </span>
                  <span className="text-gray-500">/ {durationText}</span>
                </div>

                <p className="text-sm text-gray-500 mb-6">
                  일회성 결제 · 자동 갱신 없음
                </p>

                <Link
                  href={`/checkout?package=${packageInfo.slug}`}
                  className="flex items-center justify-center gap-2 w-full py-4 px-6 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-primary/90 transition-colors"
                >
                  <CreditCard className="w-5 h-5" />
                  구매하기
                </Link>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    요약
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex justify-between">
                      <span>단어 수</span>
                      <span className="font-medium">{packageInfo.wordCount}개</span>
                    </li>
                    <li className="flex justify-between">
                      <span>이용 기간</span>
                      <span className="font-medium">{durationText}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>결제 방식</span>
                      <span className="font-medium">일회성</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
