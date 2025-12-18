'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';

export default function PromoBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useAuthStore();

  // 로그인 사용자(프리미엄)에게는 표시 안함
  const isPremium = user?.subscriptionStatus === 'ACTIVE';

  useEffect(() => {
    // 이미 닫은 경우 표시 안함
    const dismissed = localStorage.getItem('promo-banner-dismissed');
    const dismissedAt = dismissed ? parseInt(dismissed, 10) : 0;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    // 24시간 후 다시 표시
    if (!dismissed || dismissedAt < oneDayAgo) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('promo-banner-dismissed', Date.now().toString());
  };

  // 프리미엄 사용자이거나 숨김 상태면 렌더링 안함
  if (isPremium || !isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-brand-primary via-purple-600 to-brand-secondary text-white py-2.5 px-4 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 sm:gap-4 text-sm">
        <span className="animate-pulse hidden sm:inline">🎉</span>
        <p className="text-center">
          <strong className="hidden sm:inline">베이직 플랜 가입 시 프리미엄 7일 무료 체험!</strong>
          <strong className="sm:hidden">7일 무료 체험!</strong>
          <span className="hidden md:inline"> 수능 L1/L2/L3 전체 + AI 이미지 무제한</span>
        </p>
        <Link
          href="/pricing"
          className="bg-white text-brand-primary px-3 py-1 rounded-full text-xs font-bold hover:bg-gray-100 transition-colors whitespace-nowrap"
        >
          지금 시작 →
        </Link>
        <button
          onClick={handleDismiss}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-colors"
          aria-label="배너 닫기"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
