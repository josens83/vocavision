'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { progressAPI } from '@/lib/api';
import TabLayout from '@/components/layout/TabLayout';

interface UserStats {
  totalWordsLearned: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: string;
}

export default function MyPage() {
  const router = useRouter();
  const { user, _hasHydrated, logout } = useAuthStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }
    loadStats();
  }, [user, _hasHydrated, router]);

  const loadStats = async () => {
    try {
      const data = await progressAPI.getUserProgress();
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!_hasHydrated || loading) {
    return (
      <TabLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full" />
        </div>
      </TabLayout>
    );
  }

  if (!user) {
    return null;
  }

  const subscriptionLabel = {
    ACTIVE: { text: '프리미엄', color: 'bg-green-100 text-green-700' },
    TRIAL: { text: '무료 체험', color: 'bg-blue-100 text-blue-700' },
    FREE: { text: '무료', color: 'bg-gray-100 text-gray-600' },
  };

  const currentSub = subscriptionLabel[user.subscriptionStatus as keyof typeof subscriptionLabel] || subscriptionLabel.FREE;

  return (
    <TabLayout>
      <div className="container mx-auto px-4 py-6 max-w-lg">
        {/* 프로필 헤더 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <div className="flex items-center gap-4">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || '사용자'}
                className="w-20 h-20 rounded-full object-cover border-4 border-gray-100"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-3xl">
                  {user.name?.charAt(0) || 'U'}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{user.name || '사용자'}</h1>
              <p className="text-sm text-gray-500">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${currentSub.color}`}>
                  {currentSub.text}
                </span>
                {user.provider && (
                  <span className="text-xs text-gray-400">
                    {user.provider === 'kakao' && '카카오 로그인'}
                    {user.provider === 'google' && 'Google 로그인'}
                    {user.provider === 'credentials' && '이메일 로그인'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 학습 통계 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">학습 현황</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats?.totalWordsLearned || 0}</p>
              <p className="text-xs text-gray-500 mt-1">학습한 단어</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-500">{stats?.currentStreak || 0}</p>
              <p className="text-xs text-gray-500 mt-1">연속 학습일</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats?.longestStreak || 0}</p>
              <p className="text-xs text-gray-500 mt-1">최장 스트릭</p>
            </div>
          </div>
        </div>

        {/* 계정 설정 */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-500">계정 설정</span>
          </div>
          <Link
            href="/settings?tab=profile"
            className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">👤</span>
              <span className="text-sm font-medium text-gray-700">프로필 설정</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/settings?tab=password"
            className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🔒</span>
              <span className="text-sm font-medium text-gray-700">비밀번호 변경</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/settings?tab=subscription"
            className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">💳</span>
              <span className="text-sm font-medium text-gray-700">구독 관리</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* 기타 */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-500">기타</span>
          </div>
          {user.subscriptionStatus !== 'ACTIVE' && (
            <Link
              href="/pricing"
              className="flex items-center justify-between px-5 py-4 hover:bg-blue-50 transition-colors border-b border-gray-100"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">✨</span>
                <span className="text-sm font-medium text-blue-600">프리미엄 업그레이드</span>
              </div>
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
          <Link
            href="/help"
            className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">❓</span>
              <span className="text-sm font-medium text-gray-700">도움말</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* 로그아웃 버튼 */}
        <button
          onClick={handleLogout}
          className="w-full bg-white rounded-2xl border border-gray-200 px-5 py-4 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          로그아웃
        </button>

        {/* 앱 정보 */}
        <p className="text-center text-xs text-gray-400 mt-6">
          VocaVision AI v1.0.0
        </p>
      </div>
    </TabLayout>
  );
}
