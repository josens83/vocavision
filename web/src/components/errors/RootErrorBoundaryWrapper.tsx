// Phase 2-3: Root Error Boundary Wrapper for Next.js App Router
// Next.js layouts are server components, so we need a client wrapper

'use client';

import { ReactNode } from 'react';
import { RootErrorBoundary } from './ErrorBoundary';

export function RootErrorBoundaryWrapper({ children }: { children: ReactNode }) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log to console
    console.error('Root error boundary caught error:', error, errorInfo);

    // TODO Phase 2-7: Send to error tracking service
    // if (typeof window !== 'undefined') {
    //   sendToSentry(error, errorInfo);
    // }
  };

  return (
    <RootErrorBoundary onError={handleError}>
      {children}
    </RootErrorBoundary>
  );
}
