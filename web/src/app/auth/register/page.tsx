'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { validateEmail, validatePassword, validateName, validateForm } from '@/lib/validation';
import { FormInput, FormError, SubmitButton } from '@/components/ui/FormInput';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
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
      router.push('/dashboard');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          회원가입
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          7일 무료 체험을 시작하세요
        </p>

        {serverError && (
          <div className="mb-6">
            <FormError message={serverError} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
            무료 체험 시작
          </SubmitButton>
        </form>

        <p className="mt-6 text-center text-gray-600">
          이미 계정이 있으신가요?{' '}
          <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
            로그인
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-gray-500">
          가입 시{' '}
          <Link href="/terms" className="text-blue-600 hover:underline">
            이용약관
          </Link>
          {' '}및{' '}
          <Link href="/privacy" className="text-blue-600 hover:underline">
            개인정보처리방침
          </Link>
          에 동의하는 것으로 간주됩니다.
        </p>
      </div>
    </div>
  );
}
