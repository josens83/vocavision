// Phase 2-3: React Error Boundary Components
// Benchmarking: Next.js error handling, Sentry error boundaries

'use client';

import React, { Component, ReactNode } from 'react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'root' | 'page' | 'component';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Generic Error Boundary Component
 * Can be used at different levels: root, page, component
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console
    console.error(`[${this.props.level || 'ErrorBoundary'}] Error caught:`, error, errorInfo);

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // TODO Phase 2-7: Send to error tracking service (Sentry)
    // sendToErrorTracking(error, errorInfo, this.props.level);
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Custom fallback
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      // Default fallback based on level
      return this.renderDefaultFallback();
    }

    return this.props.children;
  }

  private renderDefaultFallback(): ReactNode {
    const { level = 'component' } = this.props;
    const { error } = this.state;

    if (level === 'root') {
      return <RootErrorFallback error={error!} reset={this.resetError} />;
    }

    if (level === 'page') {
      return <PageErrorFallback error={error!} reset={this.resetError} />;
    }

    return <ComponentErrorFallback error={error!} reset={this.resetError} />;
  }
}

/**
 * Root-level Error Fallback
 * Full-page error with branding
 */
function RootErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <div className="text-8xl mb-6">💥</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">앗! 문제가 발생했습니다</h1>
        <p className="text-lg text-gray-600 mb-6">
          예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-6 text-left">
            <p className="font-mono text-sm text-red-900 mb-2">
              <strong>Error:</strong> {error.message}
            </p>
            {error.stack && (
              <pre className="text-xs text-red-800 overflow-auto max-h-40">
                {error.stack}
              </pre>
            )}
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            다시 시도
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
          >
            홈으로 돌아가기
          </button>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>문제가 계속되면 고객지원팀에 문의해주세요.</p>
          <p className="mt-2">에러 ID: {Date.now().toString(36)}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Page-level Error Fallback
 * Error within page context
 */
function PageErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
      <div className="max-w-xl mx-auto px-4 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">페이지 로딩 오류</h2>
        <p className="text-gray-600 mb-6">
          이 페이지를 불러오는 중 문제가 발생했습니다.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mb-4 text-left">
            <p className="font-mono text-sm text-yellow-900">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            다시 시도
          </button>
          <button
            onClick={() => window.history.back()}
            className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            뒤로 가기
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Component-level Error Fallback
 * Minimal error display for component errors
 */
function ComponentErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
      <div className="flex items-start gap-3">
        <div className="text-2xl">⚠️</div>
        <div className="flex-1">
          <h3 className="font-semibold text-red-900 mb-1">컴포넌트 오류</h3>
          <p className="text-sm text-red-700 mb-3">
            {process.env.NODE_ENV === 'development'
              ? error.message
              : '이 섹션을 표시하는 중 오류가 발생했습니다.'}
          </p>
          <button
            onClick={reset}
            className="text-sm px-4 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            다시 시도
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Convenience wrappers for different levels
 */
export function RootErrorBoundary({ children, onError }: Omit<ErrorBoundaryProps, 'level'>) {
  return (
    <ErrorBoundary level="root" onError={onError}>
      {children}
    </ErrorBoundary>
  );
}

export function PageErrorBoundary({ children, onError }: Omit<ErrorBoundaryProps, 'level'>) {
  return (
    <ErrorBoundary level="page" onError={onError}>
      {children}
    </ErrorBoundary>
  );
}

export function ComponentErrorBoundary({ children, onError }: Omit<ErrorBoundaryProps, 'level'>) {
  return (
    <ErrorBoundary level="component" onError={onError}>
      {children}
    </ErrorBoundary>
  );
}
