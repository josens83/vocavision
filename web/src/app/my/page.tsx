'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import TabLayout from '@/components/layout/TabLayout';

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
  const { user, _hasHydrated, logout } = useAuthStore();

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }
  }, [user, _hasHydrated, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!_hasHydrated) {
    return (
      <TabLayout>
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#FF6B9D] border-t-transparent rounded-full" />
        </div>
      </TabLayout>
    );
  }

  if (!user) {
    return null;
  }

  const subscriptionLabel = {
    ACTIVE: { text: '프리미엄', bgColor: 'bg-gradient-to-r from-[#FF6B9D] to-[#A855F7]', textColor: 'text-white' },
    PREMIUM: { text: '프리미엄', bgColor: 'bg-gradient-to-r from-[#FF6B9D] to-[#A855F7]', textColor: 'text-white' },
    TRIAL: { text: '무료 체험', bgColor: 'bg-[#EFF6FF]', textColor: 'text-[#3B82F6]' },
    FREE: { text: '무료', bgColor: 'bg-[#F8F9FA]', textColor: 'text-[#767676]' },
  };

  const currentSub = subscriptionLabel[user.subscriptionStatus as keyof typeof subscriptionLabel] || subscriptionLabel.FREE;

  return (
    <TabLayout>
      <div className="min-h-screen bg-[#FAFAFA]">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

          {/* 프로필 카드 (은행 앱 스타일) */}
          <section className="bg-white rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-[#f5f5f5]">
            <div className="flex items-center gap-4">
              {/* 프로필 이미지 */}
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || '사용자'}
                  className="w-[72px] h-[72px] rounded-full object-cover border-4 border-[#f5f5f5]"
                />
              ) : (
                <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#A855F7] flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">
                    {user.name?.charAt(0) || '👤'}
                  </span>
                </div>
              )}

              {/* 유저 정보 */}
              <div className="flex-1">
                <h2 className="text-[20px] font-bold text-[#1c1c1e]">{user.name || '사용자'}</h2>
                <p className="text-[14px] text-[#767676]">{user.email}</p>

                <div className="flex items-center gap-2 mt-2">
                  {/* 구독 배지 */}
                  <span className={`text-[12px] font-semibold px-3 py-1 rounded-full ${currentSub.bgColor} ${currentSub.textColor}`}>
                    {currentSub.text}
                  </span>

                  {user.provider && (
                    <span className="text-[12px] text-[#999999]">
                      {user.provider === 'kakao' && '카카오 로그인'}
                      {user.provider === 'google' && 'Google 로그인'}
                      {user.provider === 'credentials' && '이메일 로그인'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 계정 설정 메뉴 (은행 앱 스타일) */}
          <section className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-[#f5f5f5] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#f5f5f5]">
              <h3 className="text-[13px] font-semibold text-[#767676]">계정 설정</h3>
            </div>

            <Link href="/settings?tab=profile">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#f5f5f5] cursor-pointer hover:bg-[#F8F9FA] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xl">👤</span>
                  <span className="text-[15px] font-medium text-[#1c1c1e]">프로필 설정</span>
                </div>
                <ChevronRight className="w-5 h-5 text-[#C8C8C8]" />
              </div>
            </Link>

            <Link href="/settings?tab=password">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#f5f5f5] cursor-pointer hover:bg-[#F8F9FA] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔒</span>
                  <span className="text-[15px] font-medium text-[#1c1c1e]">비밀번호 변경</span>
                </div>
                <ChevronRight className="w-5 h-5 text-[#C8C8C8]" />
              </div>
            </Link>

            <Link href="/settings?tab=subscription">
              <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[#F8F9FA] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xl">💳</span>
                  <span className="text-[15px] font-medium text-[#1c1c1e]">구독 관리</span>
                </div>
                <ChevronRight className="w-5 h-5 text-[#C8C8C8]" />
              </div>
            </Link>
          </section>

          {/* 기타 메뉴 (은행 앱 스타일) */}
          <section className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-[#f5f5f5] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#f5f5f5]">
              <h3 className="text-[13px] font-semibold text-[#767676]">기타</h3>
            </div>

            {user.subscriptionStatus !== 'ACTIVE' && user.subscriptionStatus !== 'PREMIUM' && (
              <Link href="/pricing">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#f5f5f5] cursor-pointer hover:bg-[#FFF0F5] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">✨</span>
                    <span className="text-[15px] font-medium text-[#FF6B9D]">플랜 업그레이드</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#FF6B9D]" />
                </div>
              </Link>
            )}

            <Link href="/packages">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#f5f5f5] cursor-pointer hover:bg-[#F8F9FA] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📦</span>
                  <span className="text-[15px] font-medium text-[#1c1c1e]">단품 구매</span>
                </div>
                <ChevronRight className="w-5 h-5 text-[#C8C8C8]" />
              </div>
            </Link>

            <Link href="/statistics">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#f5f5f5] cursor-pointer hover:bg-[#F8F9FA] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📊</span>
                  <span className="text-[15px] font-medium text-[#1c1c1e]">상세 통계</span>
                </div>
                <ChevronRight className="w-5 h-5 text-[#C8C8C8]" />
              </div>
            </Link>

            <Link href="/help">
              <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[#F8F9FA] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xl">❓</span>
                  <span className="text-[15px] font-medium text-[#1c1c1e]">도움말</span>
                </div>
                <ChevronRight className="w-5 h-5 text-[#C8C8C8]" />
              </div>
            </Link>
          </section>

          {/* 로그아웃 버튼 (은행 앱 스타일) */}
          <button
            onClick={handleLogout}
            className="w-full py-4 text-[#EF4444] font-semibold text-[15px] bg-white rounded-[14px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-[#f5f5f5] hover:bg-[#FEF2F2] transition-colors"
          >
            로그아웃
          </button>

          {/* 앱 정보 */}
          <p className="text-center text-[12px] text-[#999999] mt-4">
            VocaVision AI v1.0.0
          </p>

        </div>
      </div>
    </TabLayout>
  );
}
