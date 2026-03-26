"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/navigation/Navigation";
import { Check, ArrowLeft, Loader2, BookOpen, Clock, CreditCard } from "lucide-react";
import { useLocale } from '@/hooks/useLocale';
import { useWordCounts } from '@/hooks/useWordCounts';
import { usePackages } from '@/hooks/usePackages';

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

// 정적 패키지 데이터 (API 실패 시 fallback)
const STATIC_PACKAGES: Record<string, PackageInfo> = {
  '2026-csat-analysis': {
    id: 'static-csat',
    name: '2026 수능기출완전분석',
    slug: '2026-csat-analysis',
    description: '2026학년도 수능 영어영역 기출 단어 521개 완벽 분석. 듣기영역, 독해영역 2점, 독해영역 3점 유형별 학습.',
    price: 3900,
    durationDays: 180,
    badge: 'BEST',
    wordCount: 521,
  },
  'ebs-vocab': {
    id: 'static-ebs',
    name: 'EBS 연계어휘',
    slug: 'ebs-vocab',
    description: 'EBSi 공식 단어장 PDF 기반, 수능특강 영어영역 3개 교재(영어, 영어독해연습, 영어듣기)에 수록된 영단어·숙어 3,837개를 AI 학습 콘텐츠로 제공합니다.',
    price: 6900,
    durationDays: 180,
    badge: 'NEW',
    wordCount: 3837,
  },
  'toefl-complete': {
    id: 'static-toefl',
    name: 'TOEFL 완전정복',
    slug: 'toefl-complete',
    description: '2026 Updated TOEFL 완벽 대비. 적응형 시험, 새로운 문제 유형에 필요한 3,651개 핵심 어휘를 Core(기본필수)와 Advanced(실전고난도)로 나누어 체계적으로 학습합니다.',
    price: 9900,
    durationDays: 180,
    badge: 'NEW',
    wordCount: 3651,
  },
  'toeic-complete': {
    id: 'static-toeic',
    name: 'TOEIC 점수폭발',
    slug: 'toeic-complete',
    description: '매일 나오는 그 단어, 이제 확실하게. 취업·이직·승진에 필수인 TOEIC 핵심 어휘를 AI 이미지 (Concept·Rhyme)로 한 번에 정복하세요. Starter(기초)부터 Booster(고득점)까지 단계별로 학습합니다.',
    price: 9900,
    durationDays: 180,
    badge: 'NEW',
    wordCount: 2491,
  },
  'sat-complete': {
    id: 'static-sat',
    name: 'SAT 핵심 어휘',
    slug: 'sat-complete',
    description: '미국 대학 입시의 관문, SAT 어휘를 단기간에 완성. Greek·Latin 어근 기반 테마별 핵심어휘(L1)와 혼동하기 쉬운 어휘(L2)로 1,935개를 체계적으로 정복.',
    price: 9900,
    durationDays: 180,
    badge: 'NEW',
    wordCount: 1935,
  },
  'gre-complete': {
    id: 'static-gre',
    name: 'GRE 완전정복',
    slug: 'gre-complete',
    description: 'GRE Verbal 핵심~고급 어휘 4,346개를 단기간에 완성. Greek·Latin 어근 기반 어휘를 AI 이미지·어원·라임 8단계 학습으로 완전 정복.',
    price: 9900,
    durationDays: 180,
    badge: 'NEW',
    wordCount: 4346,
  },
  'ielts-complete': {
    id: 'static-ielts',
    name: 'IELTS 완전정복',
    slug: 'ielts-complete',
    description: 'IELTS Foundation~Academic 어휘 795개를 단기간에 완성. Band 5~8 전 구간을 AI 이미지·어원·라임 8단계 학습으로 완전 정복.',
    price: 9900,
    durationDays: 180,
    badge: 'NEW',
    wordCount: 795,
  },
  'act-complete': {
    id: 'static-act',
    name: 'ACT 완전정복',
    slug: 'act-complete',
    description: 'ACT 핵심 어휘. Core, Tone, Transition, Science, Reading 카테고리로 구성. AI 이미지·어원·라임으로 단기간에 완성.',
    price: 9900,
    durationDays: 180,
    badge: 'NEW',
    wordCount: 772,
  },
};

export default function PackageDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const locale = useLocale();
  const isEn = locale === 'en';
  const wordCounts = useWordCounts();
  const { getBySlug } = usePackages();

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
      if (!response.ok) throw new Error(isEn ? "Package not found." : "패키지를 찾을 수 없습니다.");
      const data = await response.json();
      const pkg = data.package;
      // API wordCount를 동적 수치로 오버라이드
      if (wordCounts.packages[slug]) {
        pkg.wordCount = wordCounts.packages[slug];
      }
      setPackageInfo(pkg);
    } catch (err: any) {
      // API 실패 시 정적 데이터 fallback
      const staticPkg = STATIC_PACKAGES[slug];
      if (staticPkg) {
        setPackageInfo(staticPkg);
      } else {
        setError(err.message);
      }
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
              {isEn ? 'Package not found' : '패키지를 찾을 수 없습니다'}
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-primary/90 transition-colors"
            >
              {isEn ? 'Back to Home' : '홈으로 돌아가기'}
            </Link>
          </div>
        </main>
      </>
    );
  }

  const dbPkg = getBySlug(slug);
  const displayName = isEn ? (dbPkg?.nameEn || packageInfo.name) : packageInfo.name;
  const displayDescription = isEn ? (dbPkg?.descriptionEn || packageInfo.description) : (packageInfo.description || packageInfo.shortDesc);
  const displayPrice = isEn ? (dbPkg?.priceGlobal || null) : null;

  const hasDiscount = packageInfo.originalPrice && packageInfo.originalPrice > packageInfo.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - packageInfo.price / packageInfo.originalPrice!) * 100)
    : 0;
  const durationText = isEn
    ? (packageInfo.durationDays >= 365 ? "1 year" : packageInfo.durationDays >= 30 ? `${Math.floor(packageInfo.durationDays / 30)} months` : `${packageInfo.durationDays} days`)
    : (packageInfo.durationDays >= 365 ? "1년" : packageInfo.durationDays >= 30 ? `${Math.floor(packageInfo.durationDays / 30)}개월` : `${packageInfo.durationDays}일`);

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gray-50 pt-20">
        {/* 히어로 배너 */}
        <div className="relative bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-700 text-white overflow-hidden">
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
              {isEn ? 'Home' : '홈으로'}
            </Link>

            {packageInfo.badge && (
              <span className="inline-block px-3 py-1 bg-emerald-500 text-white text-sm font-bold rounded-full mb-4">
                {packageInfo.badge}
              </span>
            )}

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {displayName}
            </h1>

            <p className="text-xl text-white/90 mb-8 max-w-2xl">
              {isEn ? displayDescription : (
                slug === 'ielts-complete' ? (
                  <>IELTS Band 5~8 필수 어휘 795개.<br />Foundation(L1) 401개와 Academic(L2) 394개로 구성.<br />AI 이미지·어원·라임 8단계 학습으로 단기간에 완성.</>
                ) : slug === 'gre-complete' ? (
                  <>GRE Verbal 핵심~고급 어휘 4,346개.<br />Verbal 핵심(L1) 1,858개와 고급(L2) 2,488개로 구성.<br />AI 이미지·어원·라임 8단계 학습으로 단기간에 완성.</>
                ) : slug === 'sat-complete' ? (
                  <>SAT/PSAT 고득점을 위한 필수 어휘.<br />테마별 핵심어휘(L1)와 혼동하기 쉬운 어휘(L2)로 구성.<br />AI 이미지·어원·라임으로 단기간에 완성.</>
                ) : slug === 'act-complete' ? (
                  <>ACT 핵심 어휘. Core, Tone, Transition, Science, Reading 카테고리로 구성.<br />AI 이미지·어원·라임으로 단기간에 완성.</>
                ) : (packageInfo.description || packageInfo.shortDesc ||
                  (slug === '2026-csat-analysis'
                    ? '2026학년도 수능 영어영역 기출 단어 521개 완벽 분석. 듣기영역, 독해영역 2점, 독해영역 3점 유형별 학습.'
                    : slug === 'ebs-vocab'
                    ? '2026학년도 EBS 수능특강 영어영역 단어·숙어 완벽 대비. 3개 교재(영어, 영어독해연습, 영어듣기) 수록 어휘 3,837개.'
                    : slug === 'toefl-complete'
                    ? '2026 Updated TOEFL 완벽 대비. 적응형 시험·새 문제 유형에 필요한 3,651개 핵심 어휘를 Core와 Advanced로 나누어 체계적으로 학습합니다.'
                    : '고득점을 위한 필수 단어장'))
              )}
            </p>

            <div className="flex flex-wrap items-center gap-6 text-lg">
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6" />
                <span className="font-semibold">{packageInfo.wordCount}{isEn ? '' : '개'}</span>
                <span className="text-white/80">{isEn ? 'words' : '단어'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-6 h-6" />
                <span className="font-semibold">{durationText}</span>
                <span className="text-white/80">{isEn ? 'access' : '이용'}</span>
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
                  {isEn ? 'Who is this for?' : '이런 분께 추천해요'}
                </h2>
                <ul className="space-y-3">
                  {slug === '2026-csat-analysis' ? (
                    <>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>2026학년도 수능 영어 기출 분석이 필요한 수험생</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>듣기/독해 영역별로 체계적으로 단어를 학습하고 싶은 분</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>실제 수능에서 출제된 어휘를 완벽히 암기하고 싶은 분</span>
                      </li>
                    </>
                  ) : slug === 'ebs-vocab' ? (
                    <>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>수능 EBS 연계 출제 대비가 필요한 수험생</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>수능특강 교재를 학습하면서 어휘를 체계적으로 정리하고 싶은 학생</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>EBS 교재 단어를 AI 이미지와 암기법으로 효율적으로 외우고 싶은 학생</span>
                      </li>
                    </>
                  ) : slug === 'toefl-complete' ? (
                    <>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{isEn ? 'Students aiming for a high TOEFL score' : '2026 Updated TOEFL 고득점을 목표로 하는 유학 준비생'}</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{isEn ? 'Preparing for adaptive test word completion sections' : '적응형 시험의 단어 완성(Complete the Words) 유형에 대비하고 싶은 분'}</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{isEn ? 'Learners covering academic to everyday English' : '학술 어휘부터 일상 영어까지 폭넓게 준비하고 싶은 분'}</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{isEn ? 'Anyone who wants to memorize with AI images' : 'AI 이미지 (Concept·Rhyme)로 효율적으로 암기하고 싶은 분'}</span>
                      </li>
                    </>
                  ) : slug === 'ielts-complete' ? (
                    <>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{isEn ? 'Students preparing for study in UK, Australia, or Canada' : '영국·호주·캐나다 유학을 준비하는 수험생'}</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{isEn ? 'Immigration visa (IELTS General) applicants' : '이민 비자(IELTS General) 준비생'}</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{isEn ? 'Learners targeting high IELTS scores after TOEFL' : 'TOEFL 이후 IELTS 고득점을 목표로 하는 학습자'}</span>
                      </li>
                    </>
                  ) : slug === 'gre-complete' ? (
                    <>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{isEn ? 'Students preparing for the GRE exam' : '미국/해외 대학원 입학시험(GRE)을 준비하는 수험생'}</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{isEn ? 'Learners advancing from TOEFL to GRE' : 'TOEFL 이후 GRE까지 도전하는 유학 준비생'}</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{isEn ? 'Targeting a high Verbal Reasoning score' : 'Verbal Reasoning 고득점을 목표로 하는 학습자'}</span>
                      </li>
                    </>
                  ) : slug === 'sat-complete' ? (
                    <>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{isEn ? 'Students preparing for SAT/PSAT' : '미국 대학 입시(SAT/PSAT)를 준비하는 수험생'}</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{isEn ? 'Learners who want to build vocabulary for top scores' : '고득점을 위해 어휘력을 집중적으로 키우고 싶은 분'}</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{isEn ? 'Anyone who forgets words right after studying' : '단어를 외워도 금방 잊어버리는 분'}</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{isEn ? 'Anyone looking to improve vocabulary efficiently' : '단기간에 효율적으로 어휘력을 향상시키고 싶은 분'}</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{isEn ? 'Students targeting a high ACT score' : '고득점을 목표로 하는 분'}</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{isEn ? 'Learners who want focused high-frequency vocabulary' : '핵심 빈출 단어만 집중적으로 학습하고 싶은 분'}</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{isEn ? 'Anyone looking to improve vocabulary efficiently' : '단기간에 효율적으로 어휘력을 향상시키고 싶은 분'}</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* 포함 내용 */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {isEn ? 'What\'s Included' : '포함된 학습 콘텐츠'}
                </h2>
                <ul className="space-y-3">
                  {slug === '2026-csat-analysis' ? (
                    <>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                        <span><strong>521개</strong> 2026 수능 영어 기출 단어</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                        <span><strong>유형별 분류:</strong> 듣기영역 132개 / 독해영역 2점 265개 / 독해영역 3점 124개</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                        <span>단어별 <strong>AI 이미지 2종</strong> (Concept·Mnemonic) + 어원 분석</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                        <span><strong>스마트 복습</strong> 시스템</span>
                      </li>
                    </>
                  ) : slug === 'ebs-vocab' ? (
                    <>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                        <span><strong>3,837개</strong> 영단어·숙어 (EBSi 공식 단어장 PDF 기반)</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <span className="flex-shrink-0 mt-0.5">📘</span>
                        <span><strong>수능특강 영어</strong> — 독해 기본 어휘</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <span className="flex-shrink-0 mt-0.5">📗</span>
                        <span><strong>수능특강 영어독해연습</strong> — 독해 심화 어휘</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <span className="flex-shrink-0 mt-0.5">📙</span>
                        <span><strong>수능특강 영어듣기</strong> — 듣기 영역 어휘</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                        <span>단어별 <strong>AI 이미지 2종</strong> (Concept·Mnemonic) + 어원 분석</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                        <span><strong>스마트 복습</strong> 시스템</span>
                      </li>
                    </>
                  ) : slug === 'toefl-complete' ? (
                    <>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                        <span>{isEn ? <><strong>2,894</strong> TOEFL vocabulary words</> : <><strong>2,894개</strong> TOEFL 핵심 단어</>}</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <span className="flex-shrink-0 mt-0.5">🔵</span>
                        <span>{isEn ? <><strong>Essential</strong> — core vocabulary</> : <><strong>TOEFL Essential 기본필수</strong> — 필수 기본 어휘</>}</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <span className="flex-shrink-0 mt-0.5">🔴</span>
                        <span>{isEn ? <><strong>Mastery</strong> — advanced academic vocabulary</> : <><strong>TOEFL Mastery 실전고난도</strong> — 고득점 학술 어휘</>}</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                        <span>{isEn ? <>AI images (Concept + Rhyme) + Etymology per word</> : <>단어별 <strong>AI 이미지</strong> (Concept·Rhyme) + 어원 분석 + 라임</>}</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                        <span>{isEn ? <>8-layer AI flashcard learning</> : <><strong>8단계 AI 콘텐츠</strong> 플래시카드 학습 (이미지·어원·라임·예문 포함)</>}</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                        <span>{isEn ? <>Smart spaced repetition review</> : <><strong>스마트 복습</strong> 시스템</>}</span>
                      </li>
                    </>
                  ) : slug === 'ielts-complete' ? (
                    <>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                        <span>{isEn ? <><strong>691</strong> IELTS words</> : <><strong>691개</strong> IELTS Foundation~Academic 어휘</>}</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <span className="flex-shrink-0 mt-0.5">🔵</span>
                        <span>{isEn ? <><strong>Foundation</strong> — Band 5~6.5 core vocabulary</> : <><strong>L1 Foundation</strong> — Band 5~6.5 기초 필수</>}</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <span className="flex-shrink-0 mt-0.5">🔴</span>
                        <span>{isEn ? <><strong>Academic</strong> — Band 7~8 advanced vocabulary</> : <><strong>L2 Academic</strong> — Band 7~8 학술 핵심</>}</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                        <span>단어별 <strong>AI 이미지</strong> (Concept·Rhyme) + 어원 분석 + 라임</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                        <span><strong>스마트 복습</strong> 시스템</span>
                      </li>
                    </>
                  ) : slug === 'gre-complete' ? (
                    <>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                        <span>{isEn ? <><strong>4,317</strong> GRE Verbal words</> : <><strong>4,317개</strong> GRE Verbal 핵심~고급 어휘</>}</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <span className="flex-shrink-0 mt-0.5">🔵</span>
                        <span>{isEn ? <><strong>Verbal</strong> — 1,829 high-frequency words</> : <><strong>L1 Verbal 핵심</strong> — 1,829개 (빈출 핵심 어휘)</>}</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <span className="flex-shrink-0 mt-0.5">🔴</span>
                        <span>{isEn ? <><strong>Elite</strong> — 2,488 advanced words</> : <><strong>L2 Elite 고급</strong> — 2,488개 (고난도 어휘)</>}</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                        <span>단어별 <strong>AI 이미지</strong> (Concept·Rhyme) + 어원 분석 + 라임</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                        <span><strong>스마트 복습</strong> 시스템</span>
                      </li>
                    </>
                  ) : slug === 'sat-complete' ? (
                    <>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                        <span>{isEn ? <><strong>Starter</strong> — thematic core vocabulary</> : <><strong>L1 테마별 핵심어휘</strong></>}</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                        <span>{isEn ? <><strong>Advanced</strong> — confusable word pairs</> : <><strong>L2 혼동하기 쉬운 어휘</strong></>}</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                        <span>{isEn ? <>AI images (Concept + Rhyme) per word</> : <><strong>AI 이미지</strong> (Concept·Rhyme)</>}</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                        <span>{isEn ? <>Etymology + example sentences</> : <><strong>어원 분석</strong> + 한국어 암기법 + 예문 4개</>}</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                        <span>{isEn ? <>Smart spaced repetition review</> : <><strong>스마트 복습</strong> 시스템</>}</span>
                      </li>
                    </>
                  ) : slug === 'act-complete' ? (
                    <>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                        <span><strong>{isEn ? 'Core Words' : 'Core 핵심어휘'}</strong> — {isEn ? 'High-frequency ACT vocabulary' : 'ACT 고빈출 핵심 단어'}</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                        <span><strong>{isEn ? 'Tone & Transition' : '어조·전환어'}</strong> — {isEn ? 'English section word choice & transitions' : 'ACT English 섹션 핵심 어휘'}</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                        <span><strong>{isEn ? 'Science Reasoning' : 'Science Reasoning'}</strong> — {isEn ? 'Science section vocabulary' : '과학 섹션 전문 어휘'}</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                        <span>{isEn ? 'AI images (Concept + Rhyme) per word' : 'AI 이미지 (Concept·Rhyme)'}</span>
                      </li>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                        <span><strong>{isEn ? 'Smart Review' : '스마트 복습'}</strong> {isEn ? 'system' : '시스템'}</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                        <span><strong>{packageInfo.wordCount}개</strong> 핵심 빈출 단어</span>
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
                    </>
                  )}
                </ul>
              </div>

              {/* 이용 안내 */}
              <div className="bg-gray-100 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  {isEn ? 'Usage Info' : '이용 안내'}
                </h2>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• {isEn ? 'Instant access after purchase.' : '결제 완료 즉시 이용 가능합니다.'}</li>
                  <li>• {isEn ? `${durationText} access from purchase date.` : `구매일로부터 ${durationText}간 이용할 수 있습니다.`}</li>
                  <li>• {isEn ? 'One-time payment. No auto-renewal.' : '일회성 결제로 자동 갱신되지 않습니다.'}</li>
                  <li>• {isEn ? 'Full refund available within 14 days of purchase.' : '결제 후 7일 이내 미이용 시 전액 환불 가능합니다.'}</li>
                </ul>
              </div>
            </div>

            {/* 오른쪽: 구매 카드 */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sticky top-24">
                {hasDiscount && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-red-500 font-bold text-sm">
                      {discountPercent}% {isEn ? 'OFF' : '할인'}
                    </span>
                    <span className="text-gray-400 line-through text-sm">
                      {isEn && displayPrice ? '' : `₩${packageInfo.originalPrice!.toLocaleString()}`}
                    </span>
                  </div>
                )}

                <div className="mb-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900">
                      {isEn && displayPrice ? displayPrice : `₩${packageInfo.price.toLocaleString()}`}
                    </span>
                    <span className="text-gray-500">/ {durationText}</span>
                  </div>
                  {!isEn && packageInfo.durationDays >= 30 && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-semibold rounded-full">
                      월 {Math.round(packageInfo.price / (packageInfo.durationDays / 30)).toLocaleString()}원
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-500 mb-6">
                  {isEn ? 'One-time payment · No auto-renewal' : '일회성 결제 · 자동 갱신 없음'}
                </p>

                <Link
                  href={`/checkout?package=${packageInfo.slug}`}
                  className="flex items-center justify-center gap-2 w-full py-4 px-6 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-primary/90 transition-colors"
                >
                  <CreditCard className="w-5 h-5" />
                  {isEn ? `Buy Now${displayPrice ? ` — ${displayPrice}` : ''}` : '구매하기'}
                </Link>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    {isEn ? 'Summary' : '요약'}
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex justify-between">
                      <span>{isEn ? 'Words' : '단어 수'}</span>
                      <span className="font-medium">{packageInfo.wordCount}{isEn ? '' : '개'}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>{isEn ? 'Duration' : '이용 기간'}</span>
                      <span className="font-medium">{durationText}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>{isEn ? 'Payment' : '결제 방식'}</span>
                      <span className="font-medium">{isEn ? 'One-time' : '일회성'}</span>
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
