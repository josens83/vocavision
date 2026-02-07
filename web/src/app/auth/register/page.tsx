'use client';

import { useState, useCallback, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { validateEmail, validatePassword, validateName, validateForm } from '@/lib/validation';
import { FormInput, FormError, SubmitButton } from '@/components/ui/FormInput';
import { getKakaoLoginUrl } from '@/lib/auth/kakao';
import { getGoogleLoginUrl } from '@/lib/auth/google';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, _hasHydrated } = useAuthStore();
  const setAuth = useAuthStore((state) => state.setAuth);

  const nextUrl = searchParams.get('next') || '/dashboard';

  // 이미 로그인된 상태면 리다이렉트
  useEffect(() => {
    if (_hasHydrated && user) {
      router.replace(nextUrl);
    }
  }, [_hasHydrated, user, nextUrl, router]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [kakaoLoading, setKakaoLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const validateField = useCallback((field: string, value: string) => {
    let result;
    switch (field) {
      case 'name':
        result = validateName(value, { required: false });
        break;
      case 'email':
        result = validateEmail(value);
        break;
      case 'password':
        result = validatePassword(value, { minLength: 8 });
        break;
      default:
        return;
    }

    setErrors((prev) => ({
      ...prev,
      [field]: result.isValid ? '' : result.error || '',
    }));
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Only validate if the field has been touched
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formData[field as keyof typeof formData]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    // Validate all fields
    const validation = validateForm({
      name: validateName(formData.name, { required: false }),
      email: validateEmail(formData.email),
      password: validatePassword(formData.password, { minLength: 8 }),
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      setTouched({ name: true, email: true, password: true });
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register(formData);
      setAuth(response.user, response.token);
      router.push(nextUrl);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || '회원가입에 실패했습니다. 다시 시도해주세요.';
      if (errorMessage.toLowerCase().includes('email') || errorMessage.includes('이메일')) {
        setErrors((prev) => ({ ...prev, email: '이미 사용 중인 이메일입니다' }));
      } else {
        setServerError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKakaoLogin = () => {
    setKakaoLoading(true);
    sessionStorage.setItem('loginRedirect', nextUrl);
    window.location.href = getKakaoLoginUrl();
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    sessionStorage.setItem('loginRedirect', nextUrl);
    window.location.href = getGoogleLoginUrl();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="flex items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
                <span className="text-white font-display font-bold text-xl">V</span>
              </div>
              <span className="text-2xl font-display font-bold">
                <span className="text-brand-primary">Voca</span>
                <span className="text-slate-700">Vision</span>
                <span className="text-slate-400 ml-1">AI</span>
              </span>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center">
            회원가입
          </h1>
          <p className="text-slate-500 mb-6 text-center">
            무료로 시작하세요
          </p>

          {/* 소셜 로그인 버튼 */}
          <div className="space-y-3 mb-6">
            {/* 카카오 로그인 버튼 */}
            <button
              onClick={handleKakaoLogin}
              disabled={kakaoLoading || googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl font-medium transition-all duration-200 bg-[#FEE500] hover:bg-[#FDD800] text-[#191919] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {kakaoLoading ? (
                <div className="w-5 h-5 border-2 border-[#191919] border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 4C7.58172 4 4 6.69378 4 10C4 12.0503 5.35914 13.8527 7.41234 14.9348L6.5547 18.1236C6.47909 18.4043 6.80135 18.6269 7.04882 18.4691L10.8471 15.8596C11.2251 15.9192 11.6102 15.9496 12 15.9496C16.4183 15.9496 20 13.2559 20 9.94963C20 6.64336 16.4183 4 12 4Z"
                    fill="currentColor"
                  />
                </svg>
              )}
              {kakaoLoading ? '가입 중...' : '카카오로 시작하기'}
            </button>

            {/* 구글 로그인 버튼 */}
            <button
              onClick={handleGoogleLogin}
              disabled={kakaoLoading || googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl font-medium transition-all duration-200 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {googleLoading ? (
                <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              {googleLoading ? '가입 중...' : 'Google로 시작하기'}
            </button>
          </div>

          {/* 구분선 */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-400">또는 이메일로 가입</span>
            </div>
          </div>

          {serverError && (
            <div className="mb-6">
              <FormError message={serverError} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <FormInput
              label="이름"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              error={touched.name ? errors.name : undefined}
              placeholder="홍길동"
              autoComplete="name"
              hint="선택 사항입니다"
            />

            <FormInput
              label="이메일"
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              error={touched.email ? errors.email : undefined}
              placeholder="your@email.com"
              autoComplete="email"
            />

            <FormInput
              label="비밀번호"
              type="password"
              required
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              error={touched.password ? errors.password : undefined}
              placeholder="8자 이상 입력하세요"
              autoComplete="new-password"
              showPasswordStrength
            />

            <SubmitButton loading={loading} loadingText="가입 중...">
              가입하기
            </SubmitButton>
          </form>

          <p className="mt-6 text-center text-slate-600">
            이미 계정이 있으신가요?{' '}
            <Link href="/auth/login" className="text-brand-primary hover:underline font-medium">
              로그인
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-slate-400">
            가입 시{' '}
            <Link href="/terms" className="text-brand-primary hover:underline">
              이용약관
            </Link>
            {' '}및{' '}
            <Link href="/privacy" className="text-brand-primary hover:underline">
              개인정보처리방침
            </Link>
            에 동의하는 것으로 간주됩니다.
          </p>
        </div>

        {/* 홈으로 돌아가기 */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-slate-500 hover:text-slate-700 text-sm inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}

// 로딩 컴포넌트
function RegisterLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/2 mx-auto"></div>
            <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto"></div>
            <div className="h-12 bg-slate-200 rounded"></div>
            <div className="h-12 bg-slate-200 rounded"></div>
            <div className="h-12 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Suspense boundary로 감싸서 export
export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterLoading />}>
      <RegisterContent />
    </Suspense>
  );
}
