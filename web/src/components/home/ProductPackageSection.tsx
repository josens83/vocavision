"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SectionHeader } from "@/components/ui";
import { BookOpen, Clock, ArrowRight } from "lucide-react";
import { useLocale } from '@/hooks/useLocale';

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
function getStaticPackages(isEn: boolean): ProductPackage[] {
  return [
    {
      id: "static-1",
      name: "2026 수능기출 완전분석",
      slug: "2026-csat-analysis",
      shortDesc: isEn
        ? "521 words from the 2026 CSAT exam. Organized by listening, reading 2-point and 3-point sections."
        : "실제 수능 출제 단어 521개. 듣기·2점·3점 독해 영역별 분류로 시험에 나온 단어만 집중 학습.",
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
      shortDesc: isEn
        ? "3,837 words from 3 EBS textbooks. 70% of CSAT exam content comes from EBS — essential coverage."
        : "수능 연계율 70% 완벽 대비. EBS 3개 교재 핵심 어휘 3,837개 — EBS에서 나오면 수능에 나온다.",
      price: 6900,
      durationDays: 180,
      badges: ["NEW", "대용량"],
      isComingSoon: false,
      wordCount: 3837,
    },
    {
      id: "static-3",
      name: "TOEFL Core Vocabulary",
      slug: "toefl-complete",
      shortDesc: isEn
        ? "3,651 TOEFL words from Core to Advanced. Greek·Latin etymology makes them unforgettable."
        : "세계 6,000개 이상 대학이 요구하는 TOEFL. Core~Advanced 3,651개, Greek·Latin 어원으로 한 번 외우면 잊히지 않는다.",
      price: 9900,
      durationDays: 180,
      badge: "NEW",
      isComingSoon: false,
      wordCount: 3651,
    },
    {
      id: "static-toeic",
      name: "TOEIC Score Booster",
      slug: "toeic-complete",
      shortDesc: isEn
        ? "2,491 essential TOEIC words from Starter to Booster. AI visual mnemonics for exam-day recall."
        : "취업·승진을 결정짓는 TOEIC. Starter~Booster 2,491개 핵심 어휘, AI 이미지로 외우면 시험장에서 잊히지 않는다.",
      price: 7900,
      durationDays: 180,
      badge: "NEW",
      isComingSoon: false,
      wordCount: 2491,
    },
    {
      id: "static-sat",
      name: "SAT Advanced Vocabulary",
      slug: "sat-complete",
      shortDesc: isEn
        ? "1,935 SAT words organized by Greek·Latin roots. Theme-based (L1) + confusing words (L2)."
        : "미국 대학 입시의 관문 SAT. Greek·Latin 어근 기반 1,935개를 테마별(L1)·혼동어휘(L2)로 체계적으로 정복.",
      price: 9900,
      durationDays: 180,
      badge: "NEW",
      isComingSoon: false,
      wordCount: 1935,
    },
    {
      id: "static-gre",
      name: "GRE Verbal Mastery",
      slug: "gre-complete",
      shortDesc: isEn
        ? "4,346 GRE Verbal words. Core (L1) 1,858 + Advanced (L2) 2,488. Etymology-based mastery."
        : "대학원 유학의 관문 GRE Verbal. Greek·Latin 어근 기반 핵심(L1) 1,858개 + 고급(L2) 2,488개를 AI 이미지·어원·라임으로 단기 완성.",
      price: 12900,
      durationDays: 180,
      badge: "NEW",
      isComingSoon: false,
      wordCount: 4346,
    },
    {
      id: "static-ielts",
      name: "IELTS Academic Mastery",
      slug: "ielts-complete",
      shortDesc: isEn
        ? "795 IELTS words. Foundation (L1) 401 + Academic (L2) 394. Band 5~8 complete coverage."
        : "영국 유학·이민의 관문 IELTS. Foundation(L1) 330개 + Academic(L2) 258개를 AI 이미지·어원·라임으로 단기 완성.",
      price: 6900,
      durationDays: 180,
      badge: "NEW",
      isComingSoon: false,
      wordCount: 795,
    },
  ];
}

// 메인페이지에 표시할 패키지 slug 목록
const MAIN_PAGE_SLUGS = ['2026-csat-analysis', 'ebs-vocab', 'toefl-complete', 'toeic-complete', 'sat-complete', 'gre-complete', 'ielts-complete'];

// 표시용 단어 수 오버라이드 (교재별 레벨 중복 포함 수치)
const DISPLAY_WORD_COUNTS: Record<string, number> = {
  'ebs-vocab': 3837,
  '2026-csat-analysis': 521,
  'toefl-complete': 3651,
  'toeic-complete': 2491,
  'sat-complete': 1935,
  'gre-complete': 4346,
  'ielts-complete': 795,
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

// USD 가격 매핑 (글로벌 유저용)
const usdPrices: Record<string, string> = {
  '2026-csat-analysis': '$3.99',
  'ebs-vocab': '$6.99',
  'toefl-complete': '$9.99',
  'toeic-complete': '$7.99',
  'sat-complete': '$9.99',
  'gre-complete': '$12.99',
  'ielts-complete': '$6.99',
};

// 패키지 카드 컴포넌트 - 플랫 화이트 스타일
function PackageCard({ pkg, isEn }: { pkg: ProductPackage; isEn: boolean }) {
  const hasDiscount = pkg.originalPrice && pkg.originalPrice > pkg.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - pkg.price / pkg.originalPrice!) * 100)
    : 0;
  const durationText = isEn
    ? (pkg.durationDays >= 365 ? "1 year" : pkg.durationDays >= 30 ? `${Math.floor(pkg.durationDays / 30)} months` : `${pkg.durationDays} days`)
    : (pkg.durationDays >= 365 ? "1년" : pkg.durationDays >= 30 ? `${Math.floor(pkg.durationDays / 30)}개월` : `${pkg.durationDays}일`);

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
        <p className="text-gray-500 text-sm mt-2 line-clamp-4 flex-1">
          {pkg.shortDesc || pkg.description || "핵심 어휘만 골라 담은 단어장"}
        </p>

        {/* 메타 정보 (단어 수, 기간) */}
        <div className="flex gap-2 mt-4">
          <div className="flex items-center gap-1.5 bg-gray-100 text-gray-600 rounded-full px-3 py-1 text-sm">
            <BookOpen className="w-4 h-4" />
            <span>{pkg.wordCount}{isEn ? ' words' : '개'}</span>
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
              {pkg.isComingSoon ? (isEn ? "Coming Soon" : "준비 중") : isEn ? (usdPrices[pkg.slug] || `$${(pkg.price / 1300).toFixed(2)}`) : `₩${pkg.price.toLocaleString()}`}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through">
                ₩{pkg.originalPrice!.toLocaleString()}
              </span>
            )}
          </div>
          {!pkg.isComingSoon && (
            <div className="flex items-center gap-1 text-teal-600 text-sm font-medium group-hover:text-teal-700">
              <span>{isEn ? 'Learn More' : '자세히 보기'}</span>
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
  const locale = useLocale();
  const isEn = locale === 'en';
  const [packages, setPackages] = useState<ProductPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

  // 영어 shortDesc 오버라이드 (API 패키지용)
  const englishShortDescs: Record<string, string> = {
    '2026-csat-analysis': '521 words from the 2026 CSAT exam. Organized by listening, reading 2-point and 3-point sections.',
    'ebs-vocab': '3,837 words from 3 EBS textbooks. 70% of CSAT exam content comes from EBS — essential coverage.',
    'toefl-complete': '3,651 TOEFL words from Core to Advanced. Greek·Latin etymology makes them unforgettable.',
    'toeic-complete': '2,491 essential TOEIC words from Starter to Booster. AI visual mnemonics for exam-day recall.',
    'sat-complete': '1,935 SAT words organized by Greek·Latin roots. Theme-based (L1) + confusing words (L2).',
    'gre-complete': '4,346 GRE Verbal words. Core (L1) 1,858 + Advanced (L2) 2,488. Etymology-based mastery.',
    'ielts-complete': '795 IELTS words. Foundation (L1) 401 + Academic (L2) 394. Band 5~8 complete coverage.',
  };

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
          ...(isEn && englishShortDescs[pkg.slug] ? { shortDesc: englishShortDescs[pkg.slug] } : {}),
        }));

      // 필터 후 부족하면 정적 데이터 사용
      if (filtered.length < 1) {
        setPackages(getStaticPackages(isEn));
      } else {
        setPackages(filtered);
      }
    } catch (err) {
      console.error("Failed to fetch packages:", err);
      // 에러 시 정적 데이터 사용
      setPackages(getStaticPackages(isEn));
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
          <h2 className="text-2xl font-bold text-gray-900">{isEn ? 'AI Vocabulary Packs for Your Exam' : '당신의 시험에 맞는 AI 단어 패키지'}</h2>
          <p className="text-gray-500 mt-2">{isEn ? 'Study only the vocabulary that matters for your target exam.' : '목표 시험에 맞는 핵심 어휘만 AI 분석 기반으로 학습하세요.'}</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <PackageCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {packages
              .filter((pkg) => !(isEn && ['2026-csat-analysis', 'ebs-vocab', 'ielts-complete', 'sat-complete'].includes(pkg.slug)))
              .map((pkg, index) => (
              <div
                key={pkg.id}
                className="opacity-0 animate-fade-in-up h-full"
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animationFillMode: "forwards",
                }}
              >
                <PackageCard pkg={pkg} isEn={isEn} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
