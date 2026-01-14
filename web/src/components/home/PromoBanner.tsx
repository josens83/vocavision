'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';

export default function PromoBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuthStore();

  // 로그인 사용자(프리미엄)에게는 표시 안함
  const isPremium = user?.subscriptionStatus === 'ACTIVE';

  useEffect(() => {
    // sessionStorage 사용 - 탭/브라우저 닫으면 리셋
    const dismissed = sessionStorage.getItem('promo-banner-dismissed');
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  // 메뉴 열림 상태 감지 (body의 data-menu-open 속성)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsMenuOpen(document.body.hasAttribute('data-menu-open'));
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-menu-open'],
    });

    return () => observer.disconnect();
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('promo-banner-dismissed', 'true');
  };

  // 프리미엄 사용자, 숨김 상태, 또는 메뉴 열림 상태면 렌더링 안함
  if (isPremium || !isVisible || isMenuOpen) return null;

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-brand-primary via-purple-600 to-brand-secondary text-white py-2 px-4 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-sm pr-8">
        <span className="animate-pulse hidden sm:inline flex-shrink-0">🎉</span>
        <p className="text-center whitespace-nowrap overflow-hidden text-ellipsis">
          <strong>프리미엄 7일 무료!</strong>
          <span className="hidden sm:inline"> 수능 전체 + AI 이미지 무제한</span>
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 bg-white text-brand-primary px-3 py-1 rounded-full text-xs font-bold hover:bg-gray-100 transition-colors whitespace-nowrap flex-shrink-0 group"
        >
          <span>시작하기</span>
          <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
        <button
          onClick={handleDismiss}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-colors"
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
