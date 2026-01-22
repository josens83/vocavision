/**
 * VocaVision Admin Layout
 * 관리자 대시보드 레이아웃 (인증 체크 포함)
 */

'use client';

import { useAuth } from '@/hooks/useAuth';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // useAuth 훅 사용 - Zustand hydration 대기 후 인증 체크
  const { isLoading, isAuthenticated } = useAuth({
    redirectTo: '/auth/login?redirect=/admin',
  });

  // Zustand 스토어 hydration 대기 중
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 미인증 시 리다이렉트 중
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">로그인 페이지로 이동 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans">
      {children}
    </div>
  );
}
