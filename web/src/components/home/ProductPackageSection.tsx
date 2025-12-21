"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SectionHeader } from "@/components/ui";

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

// 배지 색상 매핑
const badgeColors: Record<string, string> = {
  BEST: "bg-emerald-500",
  NEW: "bg-blue-500",
  EVENT: "bg-orange-500",
  HOT: "bg-red-500",
};

// 패키지 카드 컴포넌트
function PackageCard({ pkg }: { pkg: ProductPackage }) {
  const badgeClass = pkg.badge ? badgeColors[pkg.badge] || "bg-slate-500" : "";
  const hasDiscount = pkg.originalPrice && pkg.originalPrice > pkg.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - pkg.price / pkg.originalPrice!) * 100)
    : 0;

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-brand-primary/30 transition-all duration-300">
      {/* 배지 */}
      {pkg.badge && (
        <div
          className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold text-white z-10 ${badgeClass}`}
          style={pkg.badgeColor ? { backgroundColor: pkg.badgeColor } : {}}
        >
          {pkg.badge}
        </div>
      )}

      {/* 상품 이미지 영역 */}
      <div className="aspect-[4/3] bg-gradient-to-br from-brand-primary/10 to-brand-primary/5 flex items-center justify-center">
        {pkg.imageUrl ? (
          <img
            src={pkg.imageUrl}
            alt={pkg.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center p-6">
            <div className="text-5xl mb-2">📚</div>
            <div className="text-sm font-medium text-brand-primary">
              {pkg.wordCount}개 단어
            </div>
          </div>
        )}
      </div>

      {/* 상품 정보 */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-brand-primary transition-colors">
          {pkg.name}
        </h3>
        <p className="text-sm text-slate-500 mb-3 line-clamp-2">
          {pkg.shortDesc || pkg.description || `${pkg.wordCount}개 핵심 어휘 수록`}
        </p>

        {/* 가격 */}
        <div className="flex items-baseline gap-2 mb-4">
          {hasDiscount && (
            <>
              <span className="text-xs text-red-500 font-bold">
                {discountPercent}%
              </span>
              <span className="text-sm text-slate-400 line-through">
                ₩{pkg.originalPrice!.toLocaleString()}
              </span>
            </>
          )}
          <span className="text-xl font-bold text-slate-900">
            ₩{pkg.price.toLocaleString()}
          </span>
          <span className="text-sm text-slate-500">
            / {pkg.durationDays >= 365 ? "1년" : `${pkg.durationDays}일`}
          </span>
        </div>

        {/* 버튼 */}
        {pkg.isComingSoon ? (
          <button
            className="w-full py-2.5 px-4 rounded-lg bg-slate-100 text-slate-500 font-medium cursor-not-allowed"
            disabled
          >
            준비 중
          </button>
        ) : (
          <Link
            href={`/checkout?package=${pkg.slug}`}
            className="block w-full py-2.5 px-4 rounded-lg bg-brand-primary text-white font-medium text-center hover:bg-brand-primary/90 transition-colors"
          >
            구매하기
          </Link>
        )}
      </div>
    </div>
  );
}

// 스켈레톤 카드
function PackageCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-slate-100" />
      <div className="p-5">
        <div className="h-6 w-3/4 bg-slate-100 rounded mb-2" />
        <div className="h-4 w-full bg-slate-100 rounded mb-4" />
        <div className="h-6 w-1/2 bg-slate-100 rounded mb-4" />
        <div className="h-10 w-full bg-slate-100 rounded" />
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
          shortDesc: "TEPS 고득점 필수 어휘",
          price: 3900,
          durationDays: 365,
          badge: "BEST",
          badgeColor: "#10B981",
          isComingSoon: false,
          wordCount: 105,
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
          viewAllHref="/packages"
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
