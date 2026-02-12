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
  badges?: string[];
  badgeColor?: string;
  imageUrl?: string;
  isComingSoon: boolean;
  wordCount: number;
}

// 정적 패키지 데이터 (API 실패 또는 데이터 부족 시 사용)
function getStaticPackages(): ProductPackage[] {
  return [
    {
      id: "static-1",
      name: "2026 수능기출완전분석",
      slug: "2026-csat-analysis",
      shortDesc: "2026년 수능 기출문제 완전 분석, 출제 경향과 핵심 어휘",
      price: 3900,
      durationDays: 180, // 6개월
      badge: "BEST",
      isComingSoon: false,
      wordCount: 521,
    },
    {
      id: "static-2",
      name: "EBS 연계어휘",
      slug: "ebs-vocab",
      shortDesc: "수능특강 영어영역 3개 교재(영어·영어독해연습·영어듣기) 수록 단어·숙어 완벽 대비",
      price: 6900,
      durationDays: 180, // 6개월
      badges: ["NEW", "대용량"],
      isComingSoon: false,
      wordCount: 3837,
    },
  ];
}

// 메인페이지에 표시할 패키지 slug 목록
const MAIN_PAGE_SLUGS = ['2026-csat-analysis', 'ebs-vocab'];

// 표시용 단어 수 오버라이드 (교재별 레벨 중복 포함 수치)
const DISPLAY_WORD_COUNTS: Record<string, number> = {
  'ebs-vocab': 3837,
  '2026-csat-analysis': 521,
};

// 뱃지 스타일 결정
function getBadgeStyle(badge: string) {
  switch (badge) {
    case "BEST":
      return "bg-teal-100 text-teal-700";
    case "대용량":
      return "bg-blue-100 text-blue-700";
    case "출시예정":
      return "bg-gray-100 text-gray-500";
    case "NEW":
      return "bg-red-100 text-red-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

// 패키지 카드 컴포넌트 - 플랫 화이트 스타일
function PackageCard({ pkg }: { pkg: ProductPackage }) {
  const hasDiscount = pkg.originalPrice && pkg.originalPrice > pkg.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - pkg.price / pkg.originalPrice!) * 100)
    : 0;
  const durationText = pkg.durationDays >= 365 ? "1년" : pkg.durationDays >= 30 ? `${Math.floor(pkg.durationDays / 30)}개월` : `${pkg.durationDays}일`;

  return (
    <Link
      href={pkg.isComingSoon ? "#" : `/packages/${pkg.slug}`}
      className={`group block ${
        pkg.isComingSoon ? "cursor-not-allowed" : ""
      }`}
    >
      <div className={`bg-white border border-gray-200 rounded-2xl p-6 h-full flex flex-col transition-all duration-200 ${
        pkg.isComingSoon
          ? "opacity-70"
          : "hover:border-teal-300 hover:shadow-sm"
      }`}>
        {/* 뱃지 */}
        {(pkg.badges || (pkg.badge ? [pkg.badge] : [])).length > 0 && (
          <div className="flex gap-2">
            {(pkg.badges || [pkg.badge!]).map((b) => (
              <span key={b} className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getBadgeStyle(b)}`}>
                {b}
              </span>
            ))}
          </div>
        )}

        {/* 제목 */}
        <h3 className="text-xl font-bold text-gray-900 mt-4">
          {pkg.name}
        </h3>

        {/* 설명 */}
        <p className="text-gray-500 text-sm mt-2 line-clamp-2">
          {pkg.shortDesc || pkg.description || "핵심 어휘만 골라 담은 단어장"}
        </p>

        {/* 메타 정보 (단어 수, 기간) */}
        <div className="flex gap-2 mt-4">
          <div className="flex items-center gap-1.5 bg-gray-100 text-gray-600 rounded-full px-3 py-1 text-sm">
            <BookOpen className="w-4 h-4" />
            <span>{pkg.wordCount}개</span>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-100 text-gray-600 rounded-full px-3 py-1 text-sm">
            <Clock className="w-4 h-4" />
            <span>{durationText}</span>
          </div>
        </div>

        {/* 가격 영역 */}
        <div className="border-t border-gray-100 mt-auto pt-4 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            {hasDiscount && (
              <span className="text-xs text-red-500 font-bold">
                {discountPercent}%
              </span>
            )}
            <span className="text-2xl font-bold text-gray-900">
              {pkg.isComingSoon ? "준비 중" : `₩${pkg.price.toLocaleString()}`}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through">
                ₩{pkg.originalPrice!.toLocaleString()}
              </span>
            )}
          </div>
          {!pkg.isComingSoon && (
            <div className="flex items-center gap-1 text-teal-600 text-sm font-medium group-hover:text-teal-700">
              <span>자세히 보기</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// 스켈레톤 카드
function PackageCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 animate-pulse">
      <div className="h-6 w-16 bg-gray-100 rounded-full" />
      <div className="h-6 w-3/4 bg-gray-100 rounded mt-4" />
      <div className="h-4 w-full bg-gray-100 rounded mt-2" />
      <div className="flex gap-2 mt-4">
        <div className="h-7 w-20 bg-gray-100 rounded-full" />
        <div className="h-7 w-16 bg-gray-100 rounded-full" />
      </div>
      <div className="border-t border-gray-100 mt-6 pt-4">
        <div className="h-8 w-1/3 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

// 메인 섹션 컴포넌트
export default function ProductPackageSection() {
  const [packages, setPackages] = useState<ProductPackage[]>([]);
  const [loading, setLoading] = useState(true);

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
      const apiPackages = (data.packages || []) as ProductPackage[];

      // 메인페이지에 표시할 패키지만 필터링 + wordCount 오버라이드
      const filtered = apiPackages
        .filter((pkg) => MAIN_PAGE_SLUGS.includes(pkg.slug))
        .map((pkg) => ({
          ...pkg,
          wordCount: DISPLAY_WORD_COUNTS[pkg.slug] || pkg.wordCount,
        }));

      // 필터 후 2개 미만이면 정적 데이터 사용
      if (filtered.length < 2) {
        setPackages(getStaticPackages());
      } else {
        setPackages(filtered);
      }
    } catch (err) {
      console.error("Failed to fetch packages:", err);
      // 에러 시 정적 데이터 사용
      setPackages(getStaticPackages());
    } finally {
      setLoading(false);
    }
  };

  // 패키지가 없으면 섹션 숨김
  if (!loading && packages.length === 0) {
    return null;
  }

  return (
    <section className="py-12 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">나에게 딱 맞는 단어장</h2>
          <p className="text-gray-500 mt-2">목표에 맞는 핵심 어휘만 골라 학습하세요</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            {[1, 2].map((i) => (
              <PackageCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch max-w-3xl">
            {packages.map((pkg, index) => (
              <div
                key={pkg.id}
                className="opacity-0 animate-fade-in-up h-full"
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
