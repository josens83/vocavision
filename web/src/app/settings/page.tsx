'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmModal';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type TabType = 'profile' | 'password' | 'subscription';

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const logout = useAuthStore((state) => state.logout);

  const toast = useToast();
  const confirm = useConfirm();

  // Read initial tab from URL query param
  const tabParam = searchParams.get('tab') as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(tabParam && ['profile', 'password', 'subscription'].includes(tabParam) ? tabParam : 'profile');
  const [loading, setLoading] = useState(false);

  // Profile
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Subscription
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setName(user.name || '');
    setEmail(user.email || '');
    loadSubscription();
  }, [user, hasHydrated, router]);

  const loadSubscription = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/subscriptions/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubscription(response.data.subscription);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      await axios.patch(
        `${API_URL}/users/profile`,
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('프로필 업데이트 완료', '프로필이 성공적으로 업데이트되었습니다');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('프로필 업데이트 실패', '다시 시도해주세요');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.warning('비밀번호 불일치', '새 비밀번호가 일치하지 않습니다');
      return;
    }

    if (newPassword.length < 8) {
      toast.warning('비밀번호 길이 부족', '비밀번호는 8자 이상이어야 합니다');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      await axios.post(
        `${API_URL}/users/change-password`,
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('비밀번호 변경 완료', '비밀번호가 성공적으로 변경되었습니다');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error('비밀번호 변경 실패', '현재 비밀번호를 확인해주세요');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    const confirmed = await confirm({
      title: '구독 취소',
      message: '정말 구독을 취소하시겠습니까? 남은 기간 동안은 계속 이용하실 수 있습니다.',
      confirmText: '구독 취소',
      cancelText: '유지하기',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      const token = localStorage.getItem('authToken');
      await axios.post(
        `${API_URL}/subscriptions/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('구독 취소 완료', '구독이 취소되었습니다');
      loadSubscription();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      toast.error('구독 취소 실패', '다시 시도해주세요');
    }
  };

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: '로그아웃',
      message: '정말 로그아웃 하시겠습니까?',
      confirmText: '로그아웃',
      cancelText: '취소',
      type: 'info',
    });

    if (confirmed) {
      logout();
      toast.info('로그아웃 완료', '안녕히 가세요!');
      router.push('/');
    }
  };

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              ← 대시보드
            </Link>
            <h1 className="text-2xl font-bold text-blue-600">설정</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-4 px-6 font-medium transition ${
                activeTab === 'profile'
                  ? 'bg-white border-b-2 border-blue-600 text-blue-600'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              프로필
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex-1 py-4 px-6 font-medium transition ${
                activeTab === 'password'
                  ? 'bg-white border-b-2 border-blue-600 text-blue-600'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              비밀번호
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`flex-1 py-4 px-6 font-medium transition ${
                activeTab === 'subscription'
                  ? 'bg-white border-b-2 border-blue-600 text-blue-600'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              구독 관리
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <h3 className="text-2xl font-bold mb-6">프로필 정보</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이름
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이메일
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    이메일은 변경할 수 없습니다
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? '저장 중...' : '변경사항 저장'}
                </button>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handleChangePassword} className="space-y-6">
                <h3 className="text-2xl font-bold mb-6">비밀번호 변경</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    현재 비밀번호
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    새 비밀번호
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    8자 이상 입력해주세요
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    새 비밀번호 확인
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? '변경 중...' : '비밀번호 변경'}
                </button>
              </form>
            )}

            {activeTab === 'subscription' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold mb-6">구독 관리</h3>

                {subscription ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-6 rounded-xl">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-600 mb-1">구독 상태</div>
                          <div className="text-lg font-semibold">
                            {subscription.subscriptionStatus === 'ACTIVE' && '활성 🟢'}
                            {subscription.subscriptionStatus === 'TRIAL' && '무료 체험 🎁'}
                            {subscription.subscriptionStatus === 'CANCELLED' && '취소됨 ⭕'}
                            {subscription.subscriptionStatus === 'FREE' && '무료 플랜 🆓'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">플랜</div>
                          <div className="text-lg font-semibold">
                            {subscription.subscriptionPlan === 'MONTHLY' && '월간 구독'}
                            {subscription.subscriptionPlan === 'YEARLY' && '연간 구독'}
                            {!subscription.subscriptionPlan && '없음'}
                          </div>
                        </div>
                      </div>

                      {subscription.subscriptionEnd && (
                        <div className="mt-4">
                          <div className="text-sm text-gray-600 mb-1">만료일</div>
                          <div className="text-lg font-semibold">
                            {new Date(subscription.subscriptionEnd).toLocaleDateString('ko-KR')}
                          </div>
                        </div>
                      )}
                    </div>

                    {subscription.subscriptionStatus === 'ACTIVE' && (
                      <button
                        onClick={handleCancelSubscription}
                        className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition"
                      >
                        구독 취소
                      </button>
                    )}

                    {(subscription.subscriptionStatus === 'FREE' || subscription.subscriptionStatus === 'CANCELLED') && (
                      <Link
                        href="/pricing"
                        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                      >
                        프리미엄 구독하기
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    구독 정보를 불러오는 중...
                  </div>
                )}

                <div className="border-t pt-6 mt-6">
                  <h4 className="font-semibold mb-4 text-red-600">위험 영역</h4>
                  <button
                    onClick={handleLogout}
                    className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    로그아웃
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
