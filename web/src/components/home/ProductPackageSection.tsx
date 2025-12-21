"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SectionHeader } from "@/components/ui";
import { BookOpen, Clock, ArrowRight } from "lucide-react";

// 패키지 타입 정의
interface ProductPackage {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDesc?: string;
  price: number;
  originalPrice?: number;
  durationDays: number;
  badge?: string;
  badgeColor?: string;
  imageUrl?: string;
  isComingSoon: boolean;
  wordCount: number;
}

// 패키지 카드 컴포넌트 - 배너 스타일
function PackageCard({ pkg }: { pkg: ProductPackage }) {
  const hasDiscount = pkg.originalPrice && pkg.originalPrice > pkg.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - pkg.price / pkg.originalPrice!) * 100)
    : 0;
  const durationText = pkg.durationDays >= 365 ? "1년" : pkg.durationDays >= 30 ? `${Math.floor(pkg.durationDays / 30)}개월` : `${pkg.durationDays}일`;

  return (
    <Link
      href={pkg.isComingSoon ? "#" : `/packages/${pkg.slug}`}
      className={`group block relative rounded-2xl overflow-hidden transition-all duration-300 ${
        pkg.isComingSoon
          ? "cursor-not-allowed opacity-70"
          : "hover:shadow-xl hover:-translate-y-1"
      }`}
    >
      {/* 배너 이미지 영역 - 그라데이션 배경 */}
      <div className="relative aspect-[16/9] bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 overflow-hidden">
        {/* 배경 패턴 */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 right-4 w-24 h-24 border-4 border-white rounded-full" />
          <div className="absolute bottom-4 left-4 w-16 h-16 border-4 border-white rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-4 border-white rounded-full" />
        </div>

        {/* 배지 */}
        {pkg.badge && (
          <div className="absolute top-4 left-4 z-10">
            <span className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-lg">
              {pkg.badge}
            </span>
          </div>
        )}

        {/* Coming Soon 오버레이 */}
        {pkg.isComingSoon && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
            <span className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white font-bold rounded-lg">
              준비 중
            </span>
          </div>
        )}

        {/* 메인 컨텐츠 */}
        <div className="absolute inset-0 p-6 flex flex-col justify-end text-white z-10">
          <h3 className="text-2xl font-bold mb-2 group-hover:translate-x-1 transition-transform">
            {pkg.name}
          </h3>
          <p className="text-white/80 text-sm mb-4 line-clamp-2">
            {pkg.shortDesc || pkg.description || "핵심 어휘만 골라 담은 단어장"}
          </p>

          {/* 태그들 */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <BookOpen className="w-4 h-4" />
              <span className="font-medium">{pkg.wordCount}개</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{durationText}</span>
            </div>
          </div>
        </div>

        {/* 호버 시 화살표 */}
        {!pkg.isComingSoon && (
          <div className="absolute bottom-6 right-6 w-10 h-10 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <ArrowRight className="w-5 h-5 text-violet-600" />
          </div>
        )}
      </div>

      {/* 하단 가격 영역 */}
      <div className="bg-white p-4 flex items-center justify-between border-x border-b border-slate-200 rounded-b-2xl">
        <div className="flex items-baseline gap-2">
          {hasDiscount && (
            <span className="text-xs text-red-500 font-bold">
              {discountPercent}%
            </span>
          )}
          <span className="text-xl font-bold text-slate-900">
            ₩{pkg.price.toLocaleString()}
          </span>
          {hasDiscount && (
            <span className="text-sm text-slate-400 line-through">
              ₩{pkg.originalPrice!.toLocaleString()}
            </span>
          )}
        </div>
        {!pkg.isComingSoon && (
          <span className="text-sm text-brand-primary font-medium group-hover:underline">
            자세히 보기
          </span>
        )}
      </div>
    </Link>
  );
}

// 스켈레톤 카드
function PackageCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-[16/9] bg-slate-200" />
      <div className="bg-white p-4 border-x border-b border-slate-200 rounded-b-2xl">
        <div className="h-6 w-1/3 bg-slate-200 rounded" />
      </div>
    </div>
  );
}

// 메인 섹션 컴포넌트
export default function ProductPackageSection() {
  const [packages, setPackages] = useState<ProductPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/packages`
      );
      if (!response.ok) throw new Error("Failed to fetch packages");
      const data = await response.json();
      setPackages(data.packages || []);
    } catch (err) {
      console.error("Failed to fetch packages:", err);
      setError("패키지를 불러오는 중 오류가 발생했습니다.");
      // 에러 시 하드코딩된 샘플 데이터 사용
      setPackages([
        {
          id: "sample-1",
          name: "TEPS 최다 빈출 100",
          slug: "teps-top-100",
          shortDesc: "TEPS 고득점을 위한 필수 단어장",
          price: 3900,
          durationDays: 180,
          badge: "BEST",
          isComingSoon: false,
          wordCount: 127,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 패키지가 없으면 섹션 숨김
  if (!loading && packages.length === 0) {
    return null;
  }

  return (
    <section className="py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          title="나에게 딱 맞는 단어장"
          subtitle="목표에 맞는 핵심 어휘만 골라 학습하세요"
        />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <PackageCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg, index) => (
              <div
                key={pkg.id}
                className="opacity-0 animate-fade-in-up"
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animationFillMode: "forwards",
                }}
              >
                <PackageCard pkg={pkg} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
