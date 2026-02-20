'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { captureException } from '@/lib/monitoring/sentry';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
    captureException(error, { digest: error.digest });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center max-w-md animate-fade-in-up">
        {/* 아이콘 */}
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* 제목 */}
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          앗! 문제가 발생했어요
        </h1>

        {/* 설명 */}
        <p className="text-slate-500 mb-8">
          예상치 못한 오류가 발생했습니다.
          <br />
          잠시 후 다시 시도해주세요.
        </p>

        {/* 버튼 그룹 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="
              flex items-center justify-center gap-2 px-5 py-2.5
              bg-brand-primary text-white rounded-xl font-semibold
              hover:bg-brand-primary/90 transition-colors
              btn-press
            "
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            다시 시도
          </button>
          <Link
            href="/"
            className="
              flex items-center justify-center gap-2 px-5 py-2.5
              bg-slate-100 text-slate-700 rounded-xl font-semibold
              hover:bg-slate-200 transition-colors
              btn-press
            "
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            홈으로
          </Link>
        </div>

        {/* 에러 다이제스트 (디버깅용) */}
        {error.digest && (
          <p className="mt-6 text-xs text-slate-400">
            오류 코드: {error.digest}
          </p>
        )}

        {/* 개발 모드에서 에러 상세 표시 */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="text-sm text-slate-400 cursor-pointer hover:text-slate-600">
              에러 상세 정보 (개발용)
            </summary>
            <pre className="mt-2 p-4 bg-slate-800 rounded-lg text-xs text-red-300 overflow-auto max-h-40">
              {error.toString()}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
