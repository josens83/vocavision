/**
 * API Error Fallback Components
 * API 실패시 사용자 친화적 에러 UI
 */

'use client';

import { useState, useEffect } from 'react';

interface ApiErrorProps {
  error?: Error | null;
  onRetry?: () => void;
  title?: string;
  message?: string;
}

/**
 * 오프라인 상태 감지 훅
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // 초기 상태 설정
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * 오프라인 배너
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-orange-500 text-white py-2 px-4 text-center z-50 animate-pulse">
      <span className="inline-flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
        </svg>
        오프라인 상태입니다. 인터넷 연결을 확인해주세요.
      </span>
    </div>
  );
}

/**
 * API 로딩 실패 카드
 */
export function ApiErrorCard({ error, onRetry, title, message }: ApiErrorProps) {
  const isOnline = useOnlineStatus();

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
      <div className="text-5xl mb-4">
        {isOnline ? '⚠️' : '📡'}
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">
        {title || (isOnline ? '데이터를 불러올 수 없습니다' : '오프라인 상태')}
      </h3>
      <p className="text-gray-500 text-sm mb-4">
        {message || (isOnline
          ? '일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
          : '인터넷 연결을 확인하고 다시 시도해주세요.'
        )}
      </p>

      {process.env.NODE_ENV === 'development' && error && (
        <div className="bg-gray-50 rounded-xl p-3 mb-4 text-left">
          <p className="text-xs font-mono text-gray-600 break-all">
            {error.message}
          </p>
        </div>
      )}

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-5 py-2.5 rounded-xl font-bold transition shadow-lg shadow-pink-500/25"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          다시 시도
        </button>
      )}
    </div>
  );
}

/**
 * 인라인 API 에러 (작은 영역용)
 */
export function ApiErrorInline({ error, onRetry, message }: ApiErrorProps) {
  return (
    <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">⚠️</span>
        <p className="text-sm text-red-700">
          {message || '데이터를 불러오는데 실패했습니다'}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-red-600 hover:text-red-800 font-medium underline"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}

/**
 * 빈 상태 (데이터 없음)
 */
export function EmptyState({
  icon = '📭',
  title = '데이터가 없습니다',
  message = '표시할 항목이 없습니다.',
  actionLabel,
  onAction,
}: {
  icon?: string;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm mb-4">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-5 py-2.5 rounded-xl font-bold transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/**
 * 로딩 스켈레톤 - 카드
 */
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 bg-gray-200 rounded-2xl" />
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
      <div className="h-2 bg-gray-200 rounded-full mb-4" />
      <div className="h-12 bg-gray-200 rounded-xl" />
    </div>
  );
}

/**
 * 로딩 스켈레톤 - 리스트
 */
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 border-b border-gray-100 last:border-0 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 로딩 스피너
 */
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex justify-center py-8">
      <svg
        className={`${sizeClasses[size]} animate-spin text-pink-500`}
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}

/**
 * 전체 화면 로딩
 */
export function FullPageLoading({ message = '로딩 중...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-500">{message}</p>
    </div>
  );
}
