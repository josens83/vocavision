// Phase 2-6: Graceful Data Loading with Fallback
// Handles API failures with cached data or placeholders

'use client';

import { ReactNode } from 'react';

interface GracefulDataProps<T> {
  data: T | null | undefined;
  loading: boolean;
  error: Error | null;
  fallbackData?: T;
  children: (data: T) => ReactNode;
  loadingFallback?: ReactNode;
  errorFallback?: ReactNode;
  emptyFallback?: ReactNode;
}

export function GracefulData<T>({
  data,
  loading,
  error,
  fallbackData,
  children,
  loadingFallback,
  errorFallback,
  emptyFallback,
}: GracefulDataProps<T>) {
  // Loading state
  if (loading && !data && !fallbackData) {
    return <>{loadingFallback || <DefaultLoadingFallback />}</>;
  }

  // Error state with fallback data
  if (error && (fallbackData || data)) {
    const dataToShow = data || fallbackData;
    return (
      <div>
        <OfflineWarning />
        {dataToShow && children(dataToShow)}
      </div>
    );
  }

  // Error state without fallback
  if (error && !data && !fallbackData) {
    return <>{errorFallback || <DefaultErrorFallback error={error} />}</>;
  }

  // Empty state
  if (!data && !fallbackData) {
    return <>{emptyFallback || <DefaultEmptyFallback />}</>;
  }

  // Success with data
  const dataToShow = data || fallbackData;
  return <>{dataToShow && children(dataToShow)}</>;
}

/**
 * Default loading fallback
 */
function DefaultLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
      <p className="text-gray-600">로딩 중...</p>
    </div>
  );
}

/**
 * Default error fallback
 */
function DefaultErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-6xl mb-4">⚠️</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">데이터 로딩 실패</h3>
      <p className="text-gray-600 text-center mb-4">
        {error.message || '데이터를 불러오는 중 문제가 발생했습니다.'}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        다시 시도
      </button>
    </div>
  );
}

/**
 * Default empty fallback
 */
function DefaultEmptyFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-6xl mb-4">📭</div>
      <p className="text-gray-600">데이터가 없습니다</p>
    </div>
  );
}

/**
 * Offline warning banner
 */
function OfflineWarning() {
  return (
    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
      <span className="text-2xl">⚠️</span>
      <div>
        <p className="text-sm font-semibold text-yellow-900">오프라인 모드</p>
        <p className="text-xs text-yellow-700">저장된 데이터를 표시하고 있습니다.</p>
      </div>
    </div>
  );
}

/**
 * Skeleton loader component
 */
export function SkeletonLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
}

/**
 * List skeleton
 */
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg p-4 shadow-sm">
          <SkeletonLoader className="h-6 w-3/4 mb-2" />
          <SkeletonLoader className="h-4 w-full mb-2" />
          <SkeletonLoader className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

/**
 * Card skeleton
 */
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <SkeletonLoader className="h-8 w-1/2 mb-4" />
      <SkeletonLoader className="h-40 w-full mb-4" />
      <SkeletonLoader className="h-4 w-full mb-2" />
      <SkeletonLoader className="h-4 w-3/4" />
    </div>
  );
}
