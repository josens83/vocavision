'use client';

import Link from 'next/link';
import { usePackages, getLocalizedPackage } from '@/hooks/usePackages';

interface ProductPackage {
  slug: string;
  wordCount: number;
  shortDesc: string | null;
  badge: string | null;
  badgeColor: string | null;
  price: number;
  priceGlobal: string | null;
  displayName?: string;
  displayShortDesc?: string;
  displayPrice?: string;
}

const KR_SLUGS = ['2026-csat-analysis', 'ebs-vocab', 'toefl-complete', 'toeic-complete', 'sat-complete', 'gre-complete', 'ielts-complete', 'act-complete'];
const GLOBAL_SLUGS = ['gre-complete', 'toefl-complete', 'toeic-complete', 'ielts-complete'];

function PackageCardSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-5 w-24 bg-gray-100 rounded" />
        <div className="h-5 w-12 bg-gray-100 rounded-full" />
      </div>
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

export default function ProductPackageSection() {
  const { packages, loading, isEn, getLocalized } = usePackages();

  const slugs = isEn ? GLOBAL_SLUGS : KR_SLUGS;
  const displayPackages = packages
    .filter(pkg => slugs.includes(pkg.slug))
    .map(pkg => getLocalized(pkg));

  if (!loading && displayPackages.length === 0) return null;

  return (
    <section className="py-12 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-2">
          {isEn ? 'Standalone Packages' : '단품 패키지'}
        </h2>
        <p className="text-gray-500 text-center mb-8 text-sm">
          {isEn
            ? 'One-time purchase, no subscription needed'
            : '구독 없이 원하는 시험만 단품 구매'}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <PackageCardSkeleton key={i} />)
            : displayPackages.map((pkg) => (
                <Link
                  key={pkg.slug}
                  href={`/packages/${pkg.slug}`}
                  className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-cyan-200 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-base text-gray-900 group-hover:text-cyan-700 transition-colors">
                      {pkg.displayName}
                    </h3>
                    {pkg.badge && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                        style={{ backgroundColor: pkg.badgeColor || '#6366F1' }}
                      >
                        {pkg.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                    {pkg.displayShortDesc}
                  </p>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-cyan-50 text-cyan-700 text-xs px-2 py-1 rounded-full font-medium">
                      {pkg.wordCount.toLocaleString()}{isEn ? ' words' : '개'}
                    </span>
                    <span className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">
                      {isEn ? 'AI Images' : 'AI 이미지'}
                    </span>
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    <span className="text-lg font-bold text-gray-900">
                      {pkg.displayPrice}
                    </span>
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}
