'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * /my 페이지는 /dashboard로 통합되었습니다.
 * 기존 링크 호환성을 위해 리다이렉트 처리합니다.
 */
export default function MyPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">대시보드로 이동 중...</p>
      </div>
    </div>
  );
}
