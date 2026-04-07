/**
 * Client-side Providers Wrapper
 * React Query, Toast, Confirm Modal, Auth Required Modal 등 클라이언트 Provider들을 래핑
 */

'use client';

import { ReactNode, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui/Toast';
import { ConfirmProvider } from '@/components/ui/ConfirmModal';
import { AuthRequiredProvider } from '@/components/ui/AuthRequiredModal';
import { ComingSoonProvider } from '@/components/ui/ComingSoonModal';
import { useAuthStore } from '@/lib/store';

interface ProvidersProps {
  children: ReactNode;
}

// 앱 로드 시 인증된 사용자의 최신 데이터를 서버에서 가져옴
// (로그인 응답에는 purchases 등 일부 필드가 없으므로 /users/me로 보완)
let _lastMeCall = 0;
const ME_THROTTLE = 5 * 60 * 1000; // 5분

function AuthRefresher() {
  const token = useAuthStore((state) => state.token);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const refreshUser = useAuthStore((state) => state.refreshUser);

  useEffect(() => {
    if (_hasHydrated && token) {
      const now = Date.now();
      if (now - _lastMeCall < ME_THROTTLE) return;
      _lastMeCall = now;
      refreshUser();
    }
  }, [_hasHydrated, token, refreshUser]);

  return null;
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
            retry: 2,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthRefresher />
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
