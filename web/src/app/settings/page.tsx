'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmModal';
import { useClearAllCache } from '@/hooks/useQueries';
import DashboardLayout from '@/components/layout/DashboardLayout';
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
  const locale = useLocale();
  const isEn = locale === 'en';
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const logout = useAuthStore((state) => state.logout);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const clearAllCache = useClearAllCache();

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
      // 스토어의 user 정보 갱신
      await refreshUser();
      toast.success(
        isEn ? 'Profile Updated' : '프로필 업데이트 완료',
        isEn ? 'Your profile has been updated.' : '프로필이 성공적으로 업데이트되었습니다'
      );
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(
        isEn ? 'Update Failed' : '프로필 업데이트 실패',
        isEn ? 'Please try again.' : '다시 시도해주세요'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.warning(
        isEn ? 'Password Mismatch' : '비밀번호 불일치',
        isEn ? 'Passwords do not match.' : '새 비밀번호가 일치하지 않습니다'
      );
      return;
    }

    if (newPassword.length < 8) {
      toast.warning(
        isEn ? 'Password Too Short' : '비밀번호 길이 부족',
        isEn ? 'Password must be at least 8 characters.' : '비밀번호는 8자 이상이어야 합니다'
      );
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
      toast.success(
        isEn ? 'Password Changed' : '비밀번호 변경 완료',
        isEn ? 'Your password has been updated.' : '비밀번호가 성공적으로 변경되었습니다'
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error(
        isEn ? 'Change Failed' : '비밀번호 변경 실패',
        isEn ? 'Please check your current password.' : '현재 비밀번호를 확인해주세요'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    // 구독 활성 상태면 탈퇴 불가
    if (subscription?.subscriptionStatus === 'ACTIVE') {
      toast.warning(
        isEn ? 'Cannot Delete' : '탈퇴 불가',
        isEn ? 'You can delete your account after your subscription expires. For refunds, contact support.' : '구독 만료 후 회원 탈퇴가 가능합니다. 환불이 필요하시면 고객센터로 문의해주세요.'
      );
      return;
    }

    const confirmed = await confirm({
      title: isEn ? 'Delete Account' : '회원 탈퇴',
      message: isEn ? 'Are you sure? All learning data will be permanently deleted.' : '정말 탈퇴하시겠습니까? 모든 학습 기록이 삭제되며 복구할 수 없습니다.',
      confirmText: isEn ? 'Delete Account' : '탈퇴하기',
      cancelText: isEn ? 'Cancel' : '취소',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`${API_URL}/users/account`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(
        isEn ? 'Account Deleted' : '회원 탈퇴 완료',
        isEn ? 'Thank you for using VocaVision AI.' : '이용해 주셔서 감사합니다'
      );
      clearAllCache();
      logout();
      router.push('/');
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error(
        isEn ? 'Delete Failed' : '회원 탈퇴 실패',
        isEn ? 'Please try again.' : '다시 시도해주세요'
      );
    }
  };

  const handleCancelSubscription = async () => {
    const expiryDate = subscription?.subscriptionEnd
      ? new Date(subscription.subscriptionEnd).toLocaleDateString('ko-KR')
      : '-';

    const confirmed = await confirm({
      title: isEn ? 'Cancel Subscription' : '구독 취소',
      message: isEn
        ? `Are you sure you want to cancel?\n\n• Access until ${expiryDate}\n• Auto-renewal will stop\n• For refunds, contact support@vocavision.app`
        : `정말 구독을 취소하시겠습니까?\n\n• 만료일(${expiryDate})까지 이용 가능\n• 다음 자동 갱신이 중지됩니다\n• 즉시 환불은 support@vocavision.kr 문의`,
      confirmText: isEn ? 'Cancel Subscription' : '구독 취소',
      cancelText: isEn ? 'Keep' : '유지하기',
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
      toast.success(
        isEn ? 'Subscription Cancelled' : '구독 취소 완료',
        isEn ? 'You can continue using the service until the expiry date.' : '만료일까지 계속 이용하실 수 있습니다'
      );
      loadSubscription();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      toast.error(
        isEn ? 'Cancellation Failed' : '구독 취소 실패',
        isEn ? 'Please try again.' : '다시 시도해주세요'
      );
    }
  };

  const getPlanName = (plan: string | null) => {
    switch (plan) {
      case 'MONTHLY': return isEn ? 'Basic Plan (Monthly)' : '베이직 플랜 (월간)';
      case 'YEARLY': return isEn ? 'Basic Plan (Yearly)' : '베이직 플랜 (연간)';
      case 'PREMIUM_MONTHLY': return isEn ? 'Premium Plan (Monthly)' : '프리미엄 플랜 (월간)';
      case 'PREMIUM_YEARLY': return isEn ? 'Premium Plan (Yearly)' : '프리미엄 플랜 (연간)';
      default: return isEn ? 'Subscription' : '구독';
    }
  };

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: isEn ? 'Sign Out' : '로그아웃',
      message: isEn ? 'Are you sure you want to sign out?' : '정말 로그아웃 하시겠습니까?',
      confirmText: isEn ? 'Sign Out' : '로그아웃',
      cancelText: isEn ? 'Cancel' : '취소',
      type: 'info',
    });

    if (confirmed) {
      clearAllCache();
      logout();
      toast.info(isEn ? 'Signed Out' : '로그아웃 완료', isEn ? 'See you next time!' : '안녕히 가세요!');
      router.push('/');
    }
  };

  if (!hasHydrated) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#14B8A6] border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header (은행 앱 스타일) */}
      <header className="bg-white border-b border-[#f0f0f0] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/my" className="text-gray-500 hover:text-[#1c1c1e] transition-colors">
              ← MY
            </Link>
            <h1 className="text-[20px] font-bold text-[#1c1c1e]">{isEn ? 'Settings' : '설정'}</h1>
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
              {isEn ? 'Profile' : '프로필'}
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
              {isEn ? 'Password' : '비밀번호'}
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
              {isEn ? 'Subscription' : '구독 관리'}
              {activeTab === 'subscription' && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#14B8A6]" />
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6 lg:p-8">
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <h3 className="text-[20px] font-bold text-[#1c1c1e] mb-6">{isEn ? 'Profile' : '프로필 정보'}</h3>

                <div>
                  <label className="block text-[14px] font-medium text-[#1c1c1e] mb-2">
                    {isEn ? 'Name' : '이름'}
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
                    {isEn ? 'Email' : '이메일'}
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full px-4 py-3.5 bg-gray-100 border-none rounded-xl text-[15px] text-[#999999]"
                  />
                  <p className="text-[13px] text-[#999999] mt-2">
                    {isEn ? 'Email cannot be changed' : '이메일은 변경할 수 없습니다'}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#14B8A6] text-white px-6 py-3.5 rounded-xl font-semibold text-[15px] hover:bg-[#0F766E] transition disabled:opacity-50"
                >
                  {loading ? (isEn ? 'Saving...' : '저장 중...') : (isEn ? 'Save Changes' : '변경사항 저장')}
                </button>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handleChangePassword} className="space-y-6">
                <h3 className="text-[20px] font-bold text-[#1c1c1e] mb-6">{isEn ? 'Change Password' : '비밀번호 변경'}</h3>

                <div>
                  <label className="block text-[14px] font-medium text-[#1c1c1e] mb-2">
                    {isEn ? 'Current Password' : '현재 비밀번호'}
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
                    {isEn ? 'New Password' : '새 비밀번호'}
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
                    {isEn ? 'At least 8 characters' : '8자 이상 입력해주세요'}
                  </p>
                </div>

                <div>
                  <label className="block text-[14px] font-medium text-[#1c1c1e] mb-2">
                    {isEn ? 'Confirm New Password' : '새 비밀번호 확인'}
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
                  {loading ? (isEn ? 'Changing...' : '변경 중...') : (isEn ? 'Change Password' : '비밀번호 변경')}
                </button>
              </form>
            )}

            {activeTab === 'subscription' && (
              <div className="space-y-6">
                <h3 className="text-[20px] font-bold text-[#1c1c1e] mb-6">{isEn ? 'Manage Subscription' : '구독 관리'}</h3>

                {subscription ? (
                  <div className="space-y-4">
                    <div className="bg-gray-100 p-5 rounded-xl">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-[13px] text-gray-500 mb-1">{isEn ? 'Status' : '구독 상태'}</div>
                          <div className="text-[16px] font-semibold text-[#1c1c1e]">
                            {subscription.subscriptionStatus === 'ACTIVE' && (
                              <span className="text-[#10B981]">{isEn ? 'Active' : '활성'}</span>
                            )}
                            {subscription.subscriptionStatus === 'TRIAL' && (
                              <span className="text-[#3B82F6]">{isEn ? 'Free' : '무료'}</span>
                            )}
                            {subscription.subscriptionStatus === 'CANCELLED' && (
                              <span className="text-[#F59E0B]">{isEn ? 'Cancelled' : '취소됨'}</span>
                            )}
                            {subscription.subscriptionStatus === 'EXPIRED' && (
                              <span className="text-[#EF4444]">{isEn ? 'Expired' : '만료됨'}</span>
                            )}
                            {subscription.subscriptionStatus === 'FREE' && (
                              <span className="text-gray-500">{isEn ? 'Free Plan' : '무료 플랜'}</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-[13px] text-gray-500 mb-1">{isEn ? 'Plan' : '플랜'}</div>
                          <div className="text-[16px] font-semibold text-[#1c1c1e]">
                            {subscription.subscriptionPlan
                              ? getPlanName(subscription.subscriptionPlan)
                              : (isEn ? 'No subscription' : '구독 없음')}
                          </div>
                        </div>
                      </div>

                      {subscription.subscriptionEnd && (
                        <div className="mt-4 pt-4 border-t border-[#f0f0f0]">
                          <div className="text-[13px] text-gray-500 mb-1">{isEn ? 'Expires' : '만료일'}</div>
                          <div className="text-[16px] font-semibold text-[#1c1c1e]">
                            {new Date(subscription.subscriptionEnd).toLocaleDateString('ko-KR')}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 구독 상태별 안내 */}
                    {subscription.subscriptionStatus === 'ACTIVE' && (
                      <>
                        <div className="bg-[#F0FDF4] p-4 rounded-xl border border-[#BBF7D0]">
                          <p className="text-[14px] text-[#15803D] font-medium">
                            ✅ 현재 구독이 활성화되어 있습니다.
                          </p>
                          <p className="text-[13px] text-[#767676] mt-1">
                            만료일({subscription.subscriptionEnd ? new Date(subscription.subscriptionEnd).toLocaleDateString('ko-KR') : '-'})까지 이용 가능합니다.
                            즉시 환불이 필요하시면 support@vocavision.kr로 문의해주세요.
                          </p>
                        </div>
                        {subscription.autoRenewal ? (
                          <div className="flex items-center gap-2 px-4 py-3 bg-[#F0FDF4] rounded-xl border border-[#BBF7D0]">
                            <span className="text-[14px] text-[#15803D] font-medium">{isEn ? 'Auto-renewal ON' : '자동갱신 ON'}</span>
                            <span className="text-[13px] text-[#767676]">{isEn ? '— will be charged on expiry date.' : '— 만료일에 자동으로 결제됩니다.'}</span>
                          </div>
                        ) : (
                          <div className="px-4 py-3 bg-[#FFFBEB] rounded-xl border border-[#FDE68A]">
                            <p className="text-[14px] text-[#B45309] font-medium">{isEn ? 'Auto-renewal OFF' : '자동갱신 OFF'}</p>
                            <p className="text-[13px] text-[#767676] mt-1">
                              {isEn ? 'Will not auto-renew after expiry date.' : '만료일 이후 자동갱신되지 않습니다.'} {!subscription.hasBillingKey && (isEn ? 'Add a card to enable auto-renewal.' : '카드를 등록하면 자동갱신을 켤 수 있습니다.')}
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {subscription.subscriptionStatus === 'CANCELLED' && subscription.subscriptionEnd && new Date(subscription.subscriptionEnd) >= new Date() && (
                      <div className="bg-[#FFFBEB] p-4 rounded-xl border border-[#FDE68A]">
                        <p className="text-[14px] text-[#B45309] font-medium">
                          ⚠️ 구독이 취소되었습니다.
                        </p>
                        <p className="text-[13px] text-[#767676] mt-1">
                          만료일({new Date(subscription.subscriptionEnd).toLocaleDateString('ko-KR')})까지 계속 이용하실 수 있습니다.
                        </p>
                      </div>
                    )}

                    {(subscription.subscriptionStatus === 'EXPIRED' ||
                      (subscription.subscriptionStatus === 'CANCELLED' && subscription.subscriptionEnd && new Date(subscription.subscriptionEnd) < new Date())) && (
                      <div className="bg-[#FEF2F2] p-4 rounded-xl border border-[#FECACA]">
                        <p className="text-[14px] text-[#DC2626] font-medium">
                          구독이 만료되었습니다.
                        </p>
                        <p className="text-[13px] text-[#767676] mt-1">
                          {subscription.subscriptionEnd && `만료일: ${new Date(subscription.subscriptionEnd).toLocaleDateString('ko-KR')}`}
                          {' '}— 다시 구독하시면 모든 기능을 이용하실 수 있습니다.
                        </p>
                      </div>
                    )}

                    {(subscription.subscriptionStatus === 'FREE' || subscription.subscriptionStatus === 'TRIAL' ||
                      subscription.subscriptionStatus === 'EXPIRED' ||
                      (subscription.subscriptionStatus === 'CANCELLED' && (!subscription.subscriptionEnd || new Date(subscription.subscriptionEnd) < new Date()))) && (
                      <div className="flex flex-col gap-3">
                        <Link
                          href="/pricing?plan=basic"
                          className="inline-block bg-[#10B981] text-white px-6 py-3.5 rounded-[14px] font-semibold text-[15px] hover:bg-[#059669] transition text-center"
                        >
                          {isEn ? 'Subscribe Basic' : '베이직 구독하기'}
                        </Link>
                        <Link
                          href="/pricing?plan=premium"
                          className="inline-block bg-gradient-to-r from-[#FF6B9D] to-[#A855F7] text-white px-6 py-3.5 rounded-[14px] font-semibold text-[15px] hover:shadow-md transition text-center"
                        >
                          {isEn ? 'Subscribe Premium' : '프리미엄 구독하기'}
                        </Link>
                      </div>
                    )}

                    {/* 로그아웃 (일반 영역) */}
                    <div className="border-t border-[#f0f0f0] pt-6 mt-6">
                      <button
                        onClick={handleLogout}
                        className="bg-gray-100 text-gray-700 px-6 py-3.5 rounded-xl font-semibold text-[15px] hover:bg-gray-200 transition"
                      >
                        {isEn ? 'Sign Out' : '로그아웃'}
                      </button>
                    </div>

                    {/* 위험 영역 */}
                    <div className="border-t border-[#f0f0f0] pt-6 mt-2">
                      <h4 className="font-semibold text-[15px] mb-4 text-[#EF4444]">{isEn ? 'Danger Zone' : '위험 영역'}</h4>
                      <div className="flex flex-wrap gap-3">
                        {subscription.subscriptionStatus === 'ACTIVE' && (
                          <button
                            onClick={handleCancelSubscription}
                            className="bg-[#FEF2F2] text-[#EF4444] px-6 py-3.5 rounded-[14px] font-semibold text-[15px] hover:bg-[#FEE2E2] transition"
                          >
                            {isEn ? `Cancel ${getPlanName(subscription.subscriptionPlan)}` : `${getPlanName(subscription.subscriptionPlan)} 구독 취소`}
                          </button>
                        )}
                        <button
                          onClick={handleDeleteAccount}
                          className="bg-[#FEF2F2] text-[#EF4444] px-6 py-3.5 rounded-[14px] font-semibold text-[15px] hover:bg-[#FEE2E2] transition"
                        >
                          {isEn ? 'Delete Account' : '회원 탈퇴'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin w-6 h-6 border-4 border-[#14B8A6] border-t-transparent rounded-full mx-auto" />
                    <p className="text-gray-500 mt-3 text-[14px]">{isEn ? 'Loading subscription info...' : '구독 정보를 불러오는 중...'}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      </div>
    </DashboardLayout>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#14B8A6] border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    }>
      <SettingsContent />
    </Suspense>
  );
}
