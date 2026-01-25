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

// ChevronRight 아이콘
function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
    </svg>
  );
}

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

  const handleDeleteAccount = async () => {
    // 구독 활성 상태면 탈퇴 불가
    if (subscription?.subscriptionStatus === 'ACTIVE' || subscription?.subscriptionStatus === 'PREMIUM') {
      toast.warning('탈퇴 불가', '구독 만료 후 회원 탈퇴가 가능합니다. 환불이 필요하시면 고객센터로 문의해주세요.');
      return;
    }

    const confirmed = await confirm({
      title: '회원 탈퇴',
      message: '정말 탈퇴하시겠습니까? 모든 학습 기록이 삭제되며 복구할 수 없습니다.',
      confirmText: '탈퇴하기',
      cancelText: '취소',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`${API_URL}/users/account`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('회원 탈퇴 완료', '이용해 주셔서 감사합니다');
      logout();
      router.push('/');
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error('회원 탈퇴 실패', '다시 시도해주세요');
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
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#14B8A6] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header (은행 앱 스타일) */}
      <header className="bg-white border-b border-[#f0f0f0] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/my" className="text-gray-500 hover:text-[#1c1c1e] transition-colors">
              ← MY
            </Link>
            <h1 className="text-[20px] font-bold text-[#1c1c1e]">설정</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Tabs (은행 앱 스타일) */}
          <div className="flex border-b border-[#f0f0f0]">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-4 px-6 text-[15px] font-medium transition-all relative ${
                activeTab === 'profile'
                  ? 'text-[#14B8A6]'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              프로필
              {activeTab === 'profile' && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#14B8A6]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex-1 py-4 px-6 text-[15px] font-medium transition-all relative ${
                activeTab === 'password'
                  ? 'text-[#14B8A6]'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              비밀번호
              {activeTab === 'password' && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#14B8A6]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`flex-1 py-4 px-6 text-[15px] font-medium transition-all relative ${
                activeTab === 'subscription'
                  ? 'text-[#14B8A6]'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              구독 관리
              {activeTab === 'subscription' && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#14B8A6]" />
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6 lg:p-8">
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <h3 className="text-[20px] font-bold text-[#1c1c1e] mb-6">프로필 정보</h3>

                <div>
                  <label className="block text-[14px] font-medium text-[#1c1c1e] mb-2">
                    이름
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3.5 bg-gray-100 border-none rounded-xl text-[15px] text-[#1c1c1e] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20"
                  />
                </div>

                <div>
                  <label className="block text-[14px] font-medium text-[#1c1c1e] mb-2">
                    이메일
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full px-4 py-3.5 bg-gray-100 border-none rounded-xl text-[15px] text-[#999999]"
                  />
                  <p className="text-[13px] text-[#999999] mt-2">
                    이메일은 변경할 수 없습니다
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#14B8A6] text-white px-6 py-3.5 rounded-xl font-semibold text-[15px] hover:bg-[#0F766E] transition disabled:opacity-50"
                >
                  {loading ? '저장 중...' : '변경사항 저장'}
                </button>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handleChangePassword} className="space-y-6">
                <h3 className="text-[20px] font-bold text-[#1c1c1e] mb-6">비밀번호 변경</h3>

                <div>
                  <label className="block text-[14px] font-medium text-[#1c1c1e] mb-2">
                    현재 비밀번호
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3.5 bg-gray-100 border-none rounded-xl text-[15px] text-[#1c1c1e] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20"
                  />
                </div>

                <div>
                  <label className="block text-[14px] font-medium text-[#1c1c1e] mb-2">
                    새 비밀번호
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-3.5 bg-gray-100 border-none rounded-xl text-[15px] text-[#1c1c1e] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20"
                  />
                  <p className="text-[13px] text-[#999999] mt-2">
                    8자 이상 입력해주세요
                  </p>
                </div>

                <div>
                  <label className="block text-[14px] font-medium text-[#1c1c1e] mb-2">
                    새 비밀번호 확인
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-3.5 bg-gray-100 border-none rounded-xl text-[15px] text-[#1c1c1e] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#14B8A6] text-white px-6 py-3.5 rounded-xl font-semibold text-[15px] hover:bg-[#0F766E] transition disabled:opacity-50"
                >
                  {loading ? '변경 중...' : '비밀번호 변경'}
                </button>
              </form>
            )}

            {activeTab === 'subscription' && (
              <div className="space-y-6">
                <h3 className="text-[20px] font-bold text-[#1c1c1e] mb-6">구독 관리</h3>

                {subscription ? (
                  <div className="space-y-4">
                    <div className="bg-gray-100 p-5 rounded-xl">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-[13px] text-gray-500 mb-1">구독 상태</div>
                          <div className="text-[16px] font-semibold text-[#1c1c1e]">
                            {subscription.subscriptionStatus === 'ACTIVE' && (
                              <span className="text-[#10B981]">활성</span>
                            )}
                            {subscription.subscriptionStatus === 'PREMIUM' && (
                              <span className="text-purple-500">프리미엄</span>
                            )}
                            {subscription.subscriptionStatus === 'TRIAL' && (
                              <span className="text-[#3B82F6]">무료 체험</span>
                            )}
                            {subscription.subscriptionStatus === 'CANCELLED' && (
                              <span className="text-[#F59E0B]">취소됨</span>
                            )}
                            {subscription.subscriptionStatus === 'FREE' && (
                              <span className="text-gray-500">무료 플랜</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-[13px] text-gray-500 mb-1">플랜</div>
                          <div className="text-[16px] font-semibold text-[#1c1c1e]">
                            {subscription.subscriptionPlan === 'MONTHLY' && '월간 구독'}
                            {subscription.subscriptionPlan === 'YEARLY' && '연간 구독'}
                            {!subscription.subscriptionPlan && '없음'}
                          </div>
                        </div>
                      </div>

                      {subscription.subscriptionEnd && (
                        <div className="mt-4 pt-4 border-t border-[#f0f0f0]">
                          <div className="text-[13px] text-gray-500 mb-1">만료일</div>
                          <div className="text-[16px] font-semibold text-[#1c1c1e]">
                            {new Date(subscription.subscriptionEnd).toLocaleDateString('ko-KR')}
                          </div>
                        </div>
                      )}
                    </div>

                    {(subscription.subscriptionStatus === 'FREE' || subscription.subscriptionStatus === 'CANCELLED') && (
                      <Link
                        href="/pricing"
                        className="inline-block bg-[#14B8A6] text-white px-6 py-3.5 rounded-xl font-semibold text-[15px] hover:bg-[#0F766E] transition"
                      >
                        프리미엄 구독하기
                      </Link>
                    )}

                    {/* 구독 상태 안내 */}
                    {(subscription.subscriptionStatus === 'ACTIVE' || subscription.subscriptionStatus === 'PREMIUM') && (
                      <div className="bg-[#F0FDF4] p-4 rounded-xl border border-[#BBF7D0]">
                        <p className="text-[14px] text-[#15803D] font-medium">
                          ✅ 현재 구독이 활성화되어 있습니다.
                        </p>
                        <p className="text-[13px] text-[#767676] mt-1">
                          만료일({subscription.subscriptionEnd ? new Date(subscription.subscriptionEnd).toLocaleDateString('ko-KR') : '-'})에 자동 종료됩니다.
                          자동 갱신되지 않으며, 환불이 필요하시면 고객센터로 문의해주세요.
                        </p>
                      </div>
                    )}

                    {/* 위험 영역: 회원 탈퇴 */}
                    <div className="border-t border-[#f0f0f0] pt-6 mt-6">
                      <h4 className="font-semibold text-[15px] mb-4 text-[#EF4444]">위험 영역</h4>
                      <div className="flex flex-col gap-3">
                        <button
                          onClick={handleDeleteAccount}
                          className="bg-[#FEF2F2] text-[#EF4444] px-6 py-3.5 rounded-xl font-semibold text-[15px] hover:bg-[#FEE2E2] transition w-fit"
                        >
                          회원 탈퇴
                        </button>
                        <button
                          onClick={handleLogout}
                          className="bg-gray-100 text-gray-700 px-6 py-3.5 rounded-xl font-semibold text-[15px] hover:bg-gray-200 transition w-fit"
                        >
                          로그아웃
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin w-6 h-6 border-4 border-[#14B8A6] border-t-transparent rounded-full mx-auto" />
                    <p className="text-gray-500 mt-3 text-[14px]">구독 정보를 불러오는 중...</p>
                  </div>
                )}
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
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#14B8A6] border-t-transparent rounded-full" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
