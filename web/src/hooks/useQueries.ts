import { useQuery, useQueryClient } from '@tanstack/react-query';
import { progressAPI, api } from '@/lib/api';

/**
 * 대시보드 요약 데이터 훅
 * - 30초 캐시로 페이지 이동 시 즉시 표시
 * - examCategory/level 변경 시 이전 데이터 유지 (깜빡임 방지)
 */
export function useDashboardSummary(examCategory: string, level: string, enabled = true) {
  return useQuery({
    queryKey: ['dashboardSummary', examCategory, level],
    queryFn: () => progressAPI.getDashboardSummary(examCategory, level),
    enabled,
    placeholderData: (previousData) => previousData, // 이전 데이터 유지
  });
}

/**
 * 패키지 접근 권한 체크 훅
 * - 5분 캐시 (자주 변경되지 않음)
 */
export function usePackageAccess(slug: string, enabled = true) {
  return useQuery({
    queryKey: ['packageAccess', slug],
    queryFn: async () => {
      try {
        const response = await api.get(`/packages/check-access?slug=${slug}`);
        return response.data;
      } catch {
        return { hasAccess: false };
      }
    },
    enabled,
    staleTime: 5 * 60_000,  // 5분
    gcTime: 30 * 60_000,    // 30분
  });
}

/**
 * 대시보드 프리패치 훅
 * - hover 시 미리 로딩하여 클릭 시 즉시 표시
 */
export function usePrefetchDashboard() {
  const queryClient = useQueryClient();

  return (examCategory: string, level: string) => {
    queryClient.prefetchQuery({
      queryKey: ['dashboardSummary', examCategory, level],
      queryFn: () => progressAPI.getDashboardSummary(examCategory, level),
      staleTime: 30_000,
    });
  };
}

/**
 * 대시보드 캐시 무효화 훅
 * - 학습 완료 후 데이터 새로고침 필요 시 사용
 */
export function useInvalidateDashboard() {
  const queryClient = useQueryClient();

  return (examCategory?: string, level?: string) => {
    if (examCategory && level) {
      // 특정 시험/레벨만 무효화
      queryClient.invalidateQueries({
        queryKey: ['dashboardSummary', examCategory, level],
      });
    } else {
      // 모든 대시보드 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ['dashboardSummary'],
      });
    }
  };
}
