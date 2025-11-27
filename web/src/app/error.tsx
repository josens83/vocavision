'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-red-600 mb-4">오류</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          문제가 발생했습니다
        </h2>
        <p className="text-gray-500 mb-8">
          일시적인 오류가 발생했습니다. 다시 시도해 주세요.
        </p>
        <button
          onClick={() => reset()}
          className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
