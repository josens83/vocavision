'use client';

import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useLocale } from '@/hooks/useLocale';

interface Package {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  duration: string;
  wordCount: number;
  features: string[];
  isActive: boolean;
  badge?: string;
}

const packages: Package[] = [
  {
    id: 'csat-analysis-2026',
    slug: '2026-csat-analysis',
    name: '2026 수능기출 완전분석',
    description: '2026학년도 수능 영어 실제 출제 단어 521개 완벽 분석. 듣기·2점 독해·3점 독해 영역별로 분류해 시험에 나온 단어만 집중 학습. 수능 직전 마무리에 최적화된 단어장.',
    price: 3900,
    duration: '6개월',
    wordCount: 521,
    features: [
      '실제 수능 출제 단어 521개 수록',
      '듣기 / 2점 독해 / 3점 독해 영역별 분류',
      'AI 이미지·어원·라임 8단계 학습',
      '수능 직전 마무리 최적 구성',
    ],
    isActive: true,
    badge: '신규',
  },
  {
    id: 'csat-core-200',
    slug: 'csat-core-200',
    name: '수능 핵심 200',
    description: '수능 영어 최빈출 핵심 단어 200개 집중 학습',
    price: 3900,
    duration: '6개월',
    wordCount: 200,
    features: [
      '수능 최빈출 핵심 어휘 200개',
      'AI 이미지 연상법 + 어원 분석',
      '스마트 복습 시스템',
      '6개월 이용권 (자동갱신 없음)',
    ],
    isActive: false,
  },
  {
    id: 'ebs-vocab',
    slug: 'ebs-vocab',
    name: 'EBS 연계어휘',
    description: '수능 연계 교재 3종(영어듣기·영어·영어독해연습) 핵심 어휘 3,837개. EBS에서 나오면 수능에 나온다 — 연계율 70% 완벽 대비.',
    price: 6900,
    duration: '6개월',
    wordCount: 3837,
    features: [
      'EBS 3개 교재 연계 어휘 3,837개 전체 수록',
      '수능 연계율 70% 완벽 대비',
      '교재별·단원별 체계적 분류',
      'AI 이미지·어원·라임 8단계 학습',
    ],
    isActive: true,
    badge: 'NEW',
  },
  {
    id: 'toefl-complete',
    slug: 'toefl-complete',
    name: 'TOEFL 완전정복',
    description: '세계 6,000개 이상 대학이 요구하는 TOEFL. Core 기본필수부터 Advanced 실전 고난도까지 3,651개 완전 정복. Greek·Latin 어원 기반으로 한 번 외우면 절대 잊히지 않는다.',
    price: 9900,
    duration: '6개월',
    wordCount: 3651,
    features: [
      'Core + Advanced 전 레벨 3,651개 수록',
      'Greek·Latin 어원 분석으로 연관 단어 동시 습득',
      '중급 이상 학습자 최적화',
      '유학·대학원 입시 필수 어휘 완벽 대비',
    ],
    isActive: true,
    badge: 'NEW',
  },
  {
    id: 'toeic-complete',
    slug: 'toeic-complete',
    name: 'TOEIC 점수폭발',
    description: '취업·승진을 결정짓는 TOEIC. Starter 기초부터 Booster 고득점까지 2,491개 핵심 어휘만 골라담았다. AI 이미지로 외우면 시험장에서 잊히지 않는다.',
    price: 7900,
    duration: '6개월',
    wordCount: 2491,
    features: [
      'L1 Starter 1,370개 + L2 Booster 1,121개',
      '비즈니스·실무 핵심 어휘 집중',
      'AI 이미지 3종으로 시각적 암기',
      '취업·승진 목표 직장인 최적화',
    ],
    isActive: true,
    badge: 'NEW',
  },
  {
    id: 'sat-complete',
    slug: 'sat-complete',
    name: 'SAT 핵심 어휘',
    description: '미국 대학 입시의 관문, SAT 어휘를 단기간에 완성. Greek·Latin 어근 기반 테마별 핵심어휘(L1)와 혼동하기 쉬운 어휘(L2)로 1,935개를 체계적으로 정복.',
    price: 9900,
    duration: '6개월',
    wordCount: 1935,
    features: [
      'L1 테마별 핵심어휘 1,784개',
      'L2 혼동하기 쉬운 어휘 150개',
      'Greek·Latin 어원으로 연관 단어 동시 습득',
      'SAT·PSAT·ACT 공통 대비 가능',
    ],
    isActive: true,
    badge: 'NEW',
  },
  {
    id: 'gre-complete',
    slug: 'gre-complete',
    name: 'GRE 완전정복',
    description: '대학원 유학의 관문 GRE Verbal 핵심~고급 어휘 4,346개. Greek·Latin 어근 기반으로 핵심(L1) 1,858개 + 고급(L2) 2,488개를 AI 이미지·어원·라임으로 단기 완성.',
    price: 12900,
    duration: '6개월',
    wordCount: 4346,
    features: [
      'GRE Verbal 핵심~고급 어휘 4,346개',
      'L1 Verbal 핵심 1,858개 (빈출 핵심 어휘)',
      'L2 Verbal 고급 2,488개 (고난도 어휘)',
      'AI 이미지·어원·라임 8단계 학습',
      '6개월 이용권 (자동갱신 없음)',
    ],
    isActive: true,
    badge: 'NEW',
  },
  {
    id: 'ielts-complete',
    slug: 'ielts-complete',
    name: 'IELTS 완전정복',
    description: 'IELTS Foundation~Academic 어휘 795개 완성. Band 5~8을 AI 이미지·어원·라임 8단계 학습으로 단기 정복.',
    price: 6900,
    duration: '6개월',
    wordCount: 795,
    features: [
      'IELTS Band 5~8 필수 어휘 795개',
      'L1 Foundation 401개 (Band 5~6.5)',
      'L2 Academic 394개 (Band 7~8)',
      'AI 이미지·어원·라임 8단계 학습',
      '6개월 이용권 (자동갱신 없음)',
    ],
    isActive: true,
    badge: 'NEW',
  },
];

const usdPrices: Record<string, string> = {
  '2026-csat-analysis': '$3.99',
  'ebs-vocab': '$6.99',
  'toefl-complete': '$9.99',
  'toeic-complete': '$7.99',
  'sat-complete': '$9.99',
  'gre-complete': '$12.99',
  'ielts-complete': '$6.99',
};

const nameEn: Record<string, string> = {
  'toefl-complete': 'TOEFL Mastery',
  'toeic-complete': 'TOEIC Score Booster',
  'sat-complete': 'SAT Vocabulary',
  'gre-complete': 'GRE Verbal Mastery',
  'ielts-complete': 'IELTS Complete',
};

const descriptionEn: Record<string, string> = {
  'toefl-complete': '3,651 TOEFL words from Core to Advanced. Greek·Latin etymology makes them unforgettable.',
  'toeic-complete': '2,491 essential TOEIC words from Starter to Booster. AI visual mnemonics for exam-day recall.',
  'sat-complete': '1,935 SAT words by Greek·Latin roots. Theme-based (L1) + confusing words (L2).',
  'gre-complete': '4,346 GRE Verbal words. Core (L1) 1,858 + Advanced (L2) 2,488. Etymology-based mastery.',
  'ielts-complete': '795 IELTS words. Foundation (L1) 401 + Academic (L2) 394. Band 5~8 complete coverage.',
};

export default function PackagesPage() {
  const locale = useLocale();
  const isEn = locale === 'en';
  const koreanOnlySlugs = ['2026-csat-analysis', 'ebs-vocab'];
  const activePackages = packages.filter(pkg =>
    pkg.isActive && (isEn ? !koreanOnlySlugs.includes(pkg.slug) : true)
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#FAFAFA]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">{isEn ? 'AI Vocabulary Packs' : '단품 구매'}</h1>
            <p className="text-gray-500 mt-2">
              {isEn ? 'Pick the vocab packs you need. 6 months access, no auto-renewal.' : '필요한 단어장만 골라서 구매하세요. 자동 갱신 없이 6개월 이용 가능합니다.'}
            </p>
          </div>

          {/* 단품 목록 */}
          {activePackages.length > 0 ? (
            <div className="grid gap-6">
              {activePackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* 정보 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-lg font-bold text-gray-900">{isEn ? (nameEn[pkg.slug] || pkg.name) : pkg.name}</h2>
                        {pkg.badge && (
                          <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                            {pkg.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{isEn ? (descriptionEn[pkg.slug] || pkg.description) : pkg.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                          {pkg.wordCount}{isEn ? ' words' : '개 단어'}
                        </span>
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                          {isEn ? '6 months' : pkg.duration}
                        </span>
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                          {isEn ? 'No auto-renewal' : '자동갱신 없음'}
                        </span>
                      </div>
                    </div>

                    {/* 가격 & 버튼 */}
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        {pkg.originalPrice && (
                          <p className="text-sm text-gray-400 line-through">
                            {pkg.originalPrice.toLocaleString()}원
                          </p>
                        )}
                        <p className="text-2xl font-bold text-[#14B8A6]">
                          {isEn ? (usdPrices[pkg.slug] || '$9.99') : `${pkg.price.toLocaleString()}원`}
                        </p>
                      </div>
                      <Link
                        href={`/packages/${pkg.slug}`}
                        className="px-6 py-2.5 bg-[#14B8A6] text-white font-semibold rounded-xl hover:bg-[#0D9488] transition-colors"
                      >
                        {isEn ? 'Learn More →' : '자세히 보기'}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <div className="text-6xl mb-4">📦</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{isEn ? 'Coming Soon' : '준비 중입니다'}</h2>
              <p className="text-gray-500">{isEn ? 'New vocabulary packs are on the way.' : '곧 다양한 단품 상품이 출시될 예정입니다.'}</p>
              <Link
                href="/pricing"
                className="inline-block mt-6 px-6 py-3 bg-[#14B8A6] text-white font-semibold rounded-xl hover:bg-[#0D9488] transition-colors"
              >
                {isEn ? 'View Plans' : '구독 요금제 보기'}
              </Link>
            </div>
          )}

          {/* 안내 */}
          <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-sm text-blue-800">
              {isEn ? (
                <><strong>Note:</strong> Packs can be purchased separately from subscriptions. Start learning immediately after purchase. Access expires after 6 months with no auto-renewal.</>
              ) : (
                <><strong>알려드립니다:</strong> 단품은 구독과 별개로 구매 가능하며, 결제 후 바로 학습을 시작할 수 있습니다. 6개월 후 자동으로 만료되며 자동 갱신되지 않습니다.</>
              )}
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
