'use client';

import { useAuthStore, useExamCourseStore } from '@/lib/store';

/**
 * 모든 Zustand store가 hydration 완료됐는지 확인
 * Dashboard/Review/Learn에서 공통 사용
 */
export function useAllHydrated(): boolean {
  const authHydrated = useAuthStore((state) => state._hasHydrated);
  const examHydrated = useExamCourseStore((state) => state._hasHydrated);
  return authHydrated && examHydrated;
}
