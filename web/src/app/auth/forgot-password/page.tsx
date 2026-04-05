'use client';

import { useState } from 'react';
import Link from 'next/link';
import { validateEmail } from '@/lib/validation';
import { FormInput, SubmitButton } from '@/components/ui/FormInput';
import { useLocale } from '@/hooks/useLocale';

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const isEn = locale === 'en';
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateEmail(email, isEn);
    if (!result.isValid) {
      setError(result.error || '');
      setTouched(true);
      return;
    }
    setSubmitted(true);
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
            {isEn ? 'Reset Password' : '비밀번호 찾기'}
          </h1>
          <p className="text-slate-500 mb-6 text-center">
            {isEn ? 'Enter the email you signed up with' : '가입 시 사용한 이메일을 입력해주세요'}
          </p>

          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-slate-700">
                {isEn ? 'To reset your password, please contact us at the email below.' : '비밀번호 재설정은 아래 이메일로 문의해주세요.'}
              </p>
              <a
                href={isEn ? 'mailto:support@vocavision.app' : 'mailto:support@vocavision.kr'}
                className="inline-block text-brand-primary font-medium hover:underline"
              >
                {isEn ? 'support@vocavision.app' : 'support@vocavision.kr'}
              </a>
              <p className="text-sm text-slate-500">
                {isEn ? 'Your email: ' : '입력하신 이메일: '}<span className="font-medium text-slate-700">{email}</span>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <FormInput
                label={isEn ? 'Email' : '이메일'}
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (touched) {
                    const result = validateEmail(e.target.value);
                    setError(result.isValid ? '' : result.error || '');
                  }
                }}
                onBlur={() => {
                  setTouched(true);
                  const result = validateEmail(email, isEn);
                  setError(result.isValid ? '' : result.error || '');
                }}
                error={touched ? error : undefined}
                placeholder="your@email.com"
                autoComplete="email"
              />

              <SubmitButton>
                {isEn ? 'Request Password Reset' : '비밀번호 재설정 문의'}
              </SubmitButton>
            </form>
          )}

          <p className="mt-6 text-center text-slate-600">
            <Link href="/auth/login" className="text-brand-primary hover:underline font-medium">
              {isEn ? 'Back to Sign In' : '로그인으로 돌아가기'}
            </Link>
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
            {isEn ? 'Back to Home' : '홈으로 돌아가기'}
          </Link>
        </div>
      </div>
    </div>
  );
}
