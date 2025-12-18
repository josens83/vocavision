'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loginWithGoogle } from '@/lib/auth/google';
import { useAuthStore } from '@/lib/store';

// 실제 콜백 처리 컴포넌트
function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setErrorMessage('Google 로그인이 취소되었습니다');
      return;
    }

    if (!code) {
      setStatus('error');
      setErrorMessage('인증 코드가 없습니다');
      return;
    }

    loginWithGoogle(code)
      .then((data) => {
        setAuth(data.user, data.token);
        // 로그인 전 저장된 redirect URL 확인, 없으면 마이페이지로
        const savedRedirect = sessionStorage.getItem('loginRedirect');
        sessionStorage.removeItem('loginRedirect');
        router.replace(savedRedirect || '/my');
      })
      .catch((err) => {
        console.error('Google login error:', err);
        setStatus('error');
        setErrorMessage(err.message || '로그인에 실패했습니다');
      });
  }, [searchParams, router, setAuth]);

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md border border-slate-100">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            로그인 실패
          </h1>
          <p className="text-slate-500 mb-6">{errorMessage}</p>
          <div className="flex flex-col gap-3">
            <Link
              href="/auth/login"
              className="px-6 py-3 bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-primary/90 transition-colors"
            >
              다시 시도하기
            </Link>
            <Link
              href="/"
              className="px-6 py-3 text-slate-600 hover:text-slate-900 transition-colors"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center p-8">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Google 로그인 중...
        </h1>
        <p className="text-slate-500">잠시만 기다려주세요</p>
      </div>
    </div>
  );
}

// 메인 페이지 - Suspense로 감싸기
export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="text-center p-8">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">로딩 중...</h1>
          </div>
        </div>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}
