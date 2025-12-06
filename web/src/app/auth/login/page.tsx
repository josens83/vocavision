'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { validateEmail, validatePassword, validateForm } from '@/lib/validation';
import { FormInput, FormError, SubmitButton } from '@/components/ui/FormInput';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const validateField = useCallback((field: string, value: string) => {
    let result;
    switch (field) {
      case 'email':
        result = validateEmail(value);
        break;
      case 'password':
        result = validatePassword(value, { minLength: 1 });
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
      email: validateEmail(formData.email),
      password: validatePassword(formData.password, { minLength: 1 }),
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      setTouched({ email: true, password: true });
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      setAuth(response.user, response.token);
      router.push('/dashboard');
    } catch (err: any) {
      setServerError(err.response?.data?.error || '이메일 또는 비밀번호가 올바르지 않습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          로그인
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          VocaVision에 오신 것을 환영합니다
        </p>

        {serverError && (
          <div className="mb-6">
            <FormError message={serverError} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
            placeholder="비밀번호를 입력하세요"
            autoComplete="current-password"
          />

          <SubmitButton loading={loading} loadingText="로그인 중...">
            로그인
          </SubmitButton>
        </form>

        <p className="mt-6 text-center text-gray-600">
          계정이 없으신가요?{' '}
          <Link href="/auth/register" className="text-blue-600 hover:underline font-medium">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
