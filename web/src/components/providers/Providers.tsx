/**
 * Client-side Providers Wrapper
 * React Query, Toast, Confirm Modal, Auth Required Modal 등 클라이언트 Provider들을 래핑
 */

'use client';

import { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui/Toast';
import { ConfirmProvider } from '@/components/ui/ConfirmModal';
import { AuthRequiredProvider } from '@/components/ui/AuthRequiredModal';
import { ComingSoonProvider } from '@/components/ui/ComingSoonModal';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,          // 30초 동안 신선 → 페이지 이동 시 즉시 표시
            gcTime: 10 * 60_000,        // 10분 캐시 유지
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ConfirmProvider>
          <AuthRequiredProvider>
            <ComingSoonProvider>
              {children}
            </ComingSoonProvider>
          </AuthRequiredProvider>
        </ConfirmProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
