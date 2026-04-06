'use client';
import { useState, useEffect } from 'react';
import { useLocale } from './useLocale';
import { useWordCounts } from './useWordCounts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vocavisionbackend-production.up.railway.app/api';

export interface PackageData {
  id: string;
  slug: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  shortDesc: string | null;
  shortDescEn: string | null;
  price: number;
  priceGlobal: string | null;
  originalPrice: number | null;
  durationDays: number;
  badge: string | null;
  badgeColor: string | null;
  wordCount: number;
  isComingSoon: boolean;
}

/** locale-aware 필드를 반환하는 유틸 */
export function getLocalizedPackage(pkg: PackageData, isEn: boolean) {
  return {
    ...pkg,
    displayName: isEn ? (pkg.nameEn || pkg.name) : pkg.name,
    displayDesc: isEn ? (pkg.descriptionEn || pkg.description) : pkg.description,
    displayShortDesc: isEn ? (pkg.shortDescEn || pkg.shortDesc) : pkg.shortDesc,
    displayPrice: isEn ? (pkg.priceGlobal || `₩${pkg.price.toLocaleString()}`) : `₩${pkg.price.toLocaleString()}`,
  };
}

let _cache: PackageData[] | null = null;
let _fetchedAt = 0;
const CACHE_TTL = 3600 * 1000;

export function usePackages() {
  const locale = useLocale();
  const isEn = locale === 'en';
  const wordCounts = useWordCounts();
  const [packages, setPackages] = useState<PackageData[]>(_cache || []);
  const [loading, setLoading] = useState(!_cache);

  // packages fetch — wordCounts를 deps에서 제거하여 중복 호출 방지
  useEffect(() => {
    if (_cache && Date.now() - _fetchedAt < CACHE_TTL) {
      setPackages(_cache);
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/packages`)
      .then(res => res.json())
      .then(data => {
        const pkgs: PackageData[] = (data.packages || []).map((pkg: any) => ({
          ...pkg,
          wordCount: pkg.wordCount || 0,
        }));
        _cache = pkgs;
        _fetchedAt = Date.now();
        setPackages(pkgs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [locale]);

  // wordCounts 변경 시 캐시된 packages에 wordCount만 업데이트 (re-fetch 없음)
  useEffect(() => {
    if (_cache && _cache.length > 0) {
      const updated = _cache.map(pkg => ({
        ...pkg,
        wordCount: wordCounts.packages[pkg.slug] || pkg.wordCount || 0,
      }));
      setPackages(updated);
    }
  }, [wordCounts]);

  /** 글로벌 숨김 패키지 필터링 */
  const koreanOnlySlugs = ['2026-csat-analysis', 'ebs-vocab', 'teps-top-100', 'sat-complete', 'act-complete'];
  const visiblePackages = isEn
    ? packages.filter(p => !koreanOnlySlugs.includes(p.slug))
    : packages;

  return {
    packages: visiblePackages,
    allPackages: packages,
    loading,
    isEn,
    getLocalized: (pkg: PackageData) => getLocalizedPackage(pkg, isEn),
    getBySlug: (slug: string) => packages.find(p => p.slug === slug) || null,
  };
}
