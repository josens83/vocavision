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
      shortDesc: "2026학년도 수능 영어 실전 기출 521단어 완벽 분석. 듣기·독해 영역별 분류 + 배점별 핵심 어휘 정리. 기출에서 출발하는 가장 확실한 수능 대비!",
      price: 3900,
      durationDays: 180,
      badge: "BEST",
      isComingSoon: false,
      wordCount: 521,
    },
    {
      id: "static-2",
      name: "EBS 연계어휘",
      slug: "ebs-vocab",
      shortDesc: "영어듣기·영어·영어독해연습 3개 교재 연계 어휘 총망라. EBS-수능 연계율 50% 시대, 교재 속 단어를 미리 정복하면 시험장에서 아는 단어가 보입니다.",
      price: 6900,
      durationDays: 180,
      badges: ["NEW", "대용량"],
      isComingSoon: false,
      wordCount: 3837,
    },
    {
      id: "static-3",
      name: "TOEFL 완전정복",
      slug: "toefl-complete",
      shortDesc: "토플 빈출 3,651단어를 AI 이미지·어원·동의어로 완전 정복. Reading·Listening 지문에서 반복 출제되는 학술 어휘 집중 수록. 단어만 알아도 점수가 오르는 토플, 여기서 시작하세요.",
      price: 9900,
      durationDays: 180,
      badge: "NEW",
      isComingSoon: false,
      wordCount: 3651,
    },
    {
      id: "static-toeic",
      name: "TOEIC 점수폭발",
      slug: "toeic-complete",
      shortDesc: "취업·승진 필수! TOEIC 핵심 2,491단어를 AI 이미지로 정복. Starter(기초 1,370) + Booster(실전 1,121) 2단계 구성으로 파트별 빈출 어휘를 빠르게 흡수합니다.",
      price: 9900,
      durationDays: 180,
      badge: "NEW",
      isComingSoon: false,
      wordCount: 2491,
    },
    {
      id: "static-sat",
      name: "SAT 완전정복",
      slug: "sat-complete",
      shortDesc: "SAT/PSAT 고득점 필수! 1,935단어를 AI 이미지로 정복. 테마별 핵심어휘(L1) 1,784개 + 혼동어(L2) 150개 구성으로 어원·라임 8단계 학습하면 단기간에 완성됩니다.",
      price: 9900,
      durationDays: 180,
      badge: "NEW",
      isComingSoon: false,
      wordCount: 1935,
    },
  ];
}

// 메인페이지에 표시할 패키지 slug 목록
const MAIN_PAGE_SLUGS = ['2026-csat-analysis', 'ebs-vocab', 'toefl-complete', 'toeic-complete', 'sat-complete'];

// 표시용 단어 수 오버라이드 (교재별 레벨 중복 포함 수치)
const DISPLAY_WORD_COUNTS: Record<string, number> = {
  'ebs-vocab': 3837,
  '2026-csat-analysis': 521,
  'toefl-complete': 3651,
  'toeic-complete': 2491,
  'sat-complete': 1935,
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
      className={`group block h-full ${
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
        <p className="text-gray-500 text-sm mt-2 line-clamp-2 flex-1">
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

      // 필터 후 부족하면 정적 데이터 사용
      if (filtered.length < 1) {
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
          <h2 className="text-2xl font-bold text-gray-900">당신의 시험, 당신의 단어장</h2>
          <p className="text-gray-500 mt-2">목표 시험에 최적화된 핵심 어휘만 학습하세요. 모든 단어는 AI가 시험별 출제 경향을 분석하여 선정했습니다.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <PackageCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
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
