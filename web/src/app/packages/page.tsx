'use client';

import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';

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
    name: '2026 수능기출완전분석',
    description: '2026학년도 수능 영어 기출 어휘를 AI로 완벽 분석한 핵심 단어장',
    price: 3900,
    duration: '6개월',
    wordCount: 521,
    features: [
      '2026 수능 영어 기출 핵심 어휘 521개',
      'AI 이미지 연상법 + 어원 분석',
      '스마트 복습 시스템',
      '6개월 이용권 (자동갱신 없음)',
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
    name: 'EBS 연계 어휘',
    description: '3개 교재(영어듣기·영어·영어독해연습) 연계 어휘 완벽 대비',
    price: 3900,
    duration: '6개월',
    wordCount: 3837,
    features: [
      '3개 교재별 분류 (듣기·독해기본·독해실력)',
      'EBS 연계 어휘 3,837개 (교재 간 중복 포함)',
      'AI 이미지 연상법 + 어원 분석',
      '6개월 이용권 (자동갱신 없음)',
    ],
    isActive: true,
    badge: 'NEW',
  },
];

export default function PackagesPage() {
  const activePackages = packages.filter(pkg => pkg.isActive);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#FAFAFA]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">단품 구매</h1>
            <p className="text-gray-500 mt-2">
              필요한 단어장만 골라서 구매하세요. 자동 갱신 없이 6개월 이용 가능합니다.
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
                        <h2 className="text-lg font-bold text-gray-900">{pkg.name}</h2>
                        {pkg.badge && (
                          <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                            {pkg.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{pkg.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                          {pkg.wordCount}개 단어
                        </span>
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                          {pkg.duration}
                        </span>
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                          자동갱신 없음
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
                          {pkg.price.toLocaleString()}원
                        </p>
                      </div>
                      <Link
                        href={`/packages/${pkg.slug}`}
                        className="px-6 py-2.5 bg-[#14B8A6] text-white font-semibold rounded-xl hover:bg-[#0D9488] transition-colors"
                      >
                        자세히 보기
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <div className="text-6xl mb-4">📦</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">준비 중입니다</h2>
              <p className="text-gray-500">곧 다양한 단품 상품이 출시될 예정입니다.</p>
              <Link
                href="/pricing"
                className="inline-block mt-6 px-6 py-3 bg-[#14B8A6] text-white font-semibold rounded-xl hover:bg-[#0D9488] transition-colors"
              >
                구독 요금제 보기
              </Link>
            </div>
          )}

          {/* 안내 */}
          <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>알려드립니다:</strong> 단품은 구독과 별개로 구매 가능하며,
              결제 후 바로 학습을 시작할 수 있습니다. 6개월 후 자동으로 만료되며 자동 갱신되지 않습니다.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
