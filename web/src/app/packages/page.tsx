'use client';

import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { usePackages } from '@/hooks/usePackages';

export default function PackagesPage() {
  const { packages, loading, isEn, getLocalized } = usePackages();

  const displayPackages = packages
    .filter(pkg => pkg.isComingSoon !== true)
    .map(pkg => getLocalized(pkg));

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

          {/* 로딩 */}
          {loading ? (
            <div className="grid gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="h-6 w-48 bg-gray-100 rounded mb-3" />
                  <div className="h-4 w-full bg-gray-100 rounded mb-2" />
                  <div className="flex gap-2 mt-4">
                    <div className="h-6 w-20 bg-gray-100 rounded-full" />
                    <div className="h-6 w-16 bg-gray-100 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayPackages.length > 0 ? (
            <div className="grid gap-6">
              {displayPackages.map((pkg) => (
                <div
                  key={pkg.slug}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-lg font-bold text-gray-900">{pkg.displayName}</h2>
                        {pkg.badge && (
                          <span
                            className="px-2 py-0.5 text-xs font-bold text-white rounded-full"
                            style={{ backgroundColor: pkg.badgeColor || '#EF4444' }}
                          >
                            {pkg.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{pkg.displayDesc}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                          {pkg.wordCount.toLocaleString()}{isEn ? ' words' : '개 단어'}
                        </span>
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                          {isEn ? '6 months' : '6개월'}
                        </span>
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                          {isEn ? 'No auto-renewal' : '자동갱신 없음'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        {pkg.originalPrice && (
                          <p className="text-sm text-gray-400 line-through">
                            {isEn ? '' : `${pkg.originalPrice.toLocaleString()}원`}
                          </p>
                        )}
                        <p className="text-2xl font-bold text-[#14B8A6]">
                          {pkg.displayPrice}
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
