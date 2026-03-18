'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { useLocale } from '@/hooks/useLocale';
import { getPlanDisplay, isPremiumPlan } from '@/lib/subscription';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useClearAllCache } from '@/hooks/useQueries';

// 패키지별 단어 수
const PACKAGE_WORD_COUNTS: Record<string, number> = {
  '2026-csat-analysis': 521,
  'ebs-vocab': 3837,
  'toefl-complete': 3651,
  'toeic-complete': 2491,
  'sat-complete': 1935,
  'gre-complete': 4346,
};

// ChevronRight 아이콘
function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
    </svg>
  );
}

export default function MyPage() {
  const router = useRouter();
  const locale = useLocale();
  const isEn = locale === 'en';
  const { user, _hasHydrated, logout } = useAuthStore();
  const clearAllCache = useClearAllCache();

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }
  }, [user, _hasHydrated, router]);

  const handleLogout = () => {
    clearAllCache();
    logout();
    router.push('/');
  };

  if (!_hasHydrated) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#14B8A6] border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return null;
  }

  const currentSub = getPlanDisplay(user);
  const activePurchases = (user as any).purchases || [];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#FAFAFA]">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

          {/* 프로필 카드 (은행 앱 스타일) */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              {/* 프로필 이미지 */}
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || (isEn ? 'User' : '사용자')}
                  className="w-[72px] h-[72px] rounded-full object-cover border-4 border-gray-200"
                />
              ) : (
                <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-[#14B8A6] to-[#06B6D4] flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">
                    {user.name?.charAt(0) || '👤'}
                  </span>
                </div>
              )}

              {/* 유저 정보 */}
              <div className="flex-1">
                <h2 className="text-[20px] font-bold text-[#1c1c1e]">{user.name || (isEn ? 'User' : '사용자')}</h2>
                <p className="text-[14px] text-gray-500">{user.email}</p>

                <div className="flex items-center gap-2 mt-2">
                  {/* 구독 배지 */}
                  <span className={`text-[12px] font-semibold px-3 py-1 rounded-full ${currentSub.bgColor} ${currentSub.textColor}`}>
                    {currentSub.text}
                  </span>

                  {user.provider && (
                    <span className="text-[12px] text-[#999999]">
                      {user.provider === 'kakao' && (isEn ? 'Kakao Login' : '카카오 로그인')}
                      {user.provider === 'google' && 'Google'}
                      {user.provider === 'credentials' && (isEn ? 'Email Login' : '이메일 로그인')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 내 구매 상품 */}
          {activePurchases.length > 0 && (
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200">
                <h3 className="text-[13px] font-semibold text-gray-500">{isEn ? 'My Purchases' : '내 구매 상품'}</h3>
              </div>
              {activePurchases.map((purchase: any) => {
                const startDate = new Date(purchase.createdAt || purchase.expiresAt);
                const expiresDate = new Date(purchase.expiresAt);
                const isExpired = expiresDate < new Date();
                const wordCount = PACKAGE_WORD_COUNTS[purchase.package.slug];
                // 시작일이 없으면 만료일 기준 180일 전으로 추정
                const displayStart = purchase.createdAt
                  ? startDate.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
                  : null;
                const displayEnd = expiresDate.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

                return (
                  <div key={purchase.id} className="px-5 py-4 border-b border-gray-200 last:border-b-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[15px] font-medium text-[#1c1c1e]">{purchase.package.name}</span>
                      {isExpired ? (
                        <span className="text-[12px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{isEn ? 'Expired' : '만료됨'}</span>
                      ) : (
                        <span className="text-[12px] font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-700">{isEn ? 'Active' : '이용중'}</span>
                      )}
                    </div>
                    <div className="text-[13px] text-gray-500 space-y-0.5">
                      <p>{isEn ? 'Valid: ' : '유효기간: '}{displayStart ? `${displayStart} ~ ` : ''}{displayEnd}</p>
                      {wordCount && <p>{isEn ? 'Words: ' : '단어 수: '}{wordCount.toLocaleString()}{isEn ? '' : '개'}</p>}
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {/* 계정 설정 메뉴 (은행 앱 스타일) */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <h3 className="text-[13px] font-semibold text-gray-500">{isEn ? 'Account' : '계정 설정'}</h3>
            </div>

            <Link href="/settings?tab=profile">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xl">👤</span>
                  <span className="text-[15px] font-medium text-[#1c1c1e]">{isEn ? 'Profile' : '프로필 설정'}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-[#C8C8C8]" />
              </div>
            </Link>

            <Link href="/settings?tab=password">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔒</span>
                  <span className="text-[15px] font-medium text-[#1c1c1e]">{isEn ? 'Change Password' : '비밀번호 변경'}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-[#C8C8C8]" />
              </div>
            </Link>

            <Link href="/settings?tab=subscription">
              <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xl">💳</span>
                  <span className="text-[15px] font-medium text-[#1c1c1e]">{isEn ? 'Subscription' : '구독 관리'}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-[#C8C8C8]" />
              </div>
            </Link>
          </section>

          {/* 기타 메뉴 (은행 앱 스타일) */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <h3 className="text-[13px] font-semibold text-gray-500">{isEn ? 'More' : '기타'}</h3>
            </div>

            {!isPremiumPlan(user) && (
              <Link href="/checkout?plan=premium">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 cursor-pointer hover:bg-[#ECFDF5] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">✨</span>
                    <span className="text-[15px] font-medium text-[#14B8A6]">
                      {(user as any).subscriptionPlan === 'MONTHLY'
                        ? (isEn ? 'Upgrade to Premium' : '프리미엄으로 업그레이드')
                        : (isEn ? 'Upgrade Plan' : '플랜 업그레이드')}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#14B8A6]" />
                </div>
              </Link>
            )}

            <Link href="/packages">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📦</span>
                  <span className="text-[15px] font-medium text-[#1c1c1e]">{isEn ? 'Vocab Packs' : '단품 구매'}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-[#C8C8C8]" />
              </div>
            </Link>

            <Link href="/statistics">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📊</span>
                  <span className="text-[15px] font-medium text-[#1c1c1e]">{isEn ? 'Statistics' : '상세 통계'}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-[#C8C8C8]" />
              </div>
            </Link>

            <Link href="/help">
              <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xl">❓</span>
                  <span className="text-[15px] font-medium text-[#1c1c1e]">{isEn ? 'Help' : '도움말'}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-[#C8C8C8]" />
              </div>
            </Link>
          </section>

          {/* 로그아웃 버튼 (은행 앱 스타일) */}
          <button
            onClick={handleLogout}
            className="w-full py-4 text-[#EF4444] font-semibold text-[15px] bg-white rounded-xl shadow-sm border border-gray-200 hover:bg-[#FEF2F2] transition-colors"
          >
            {isEn ? 'Sign Out' : '로그아웃'}
          </button>

          {/* 앱 정보 */}
          <p className="text-center text-[12px] text-[#999999] mt-4">
            VocaVision AI v1.0.0
          </p>

        </div>
      </div>
    </DashboardLayout>
  );
}
