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

/**
 * 복습 대기 단어 목록 훅
 * - 시험/레벨별 복습 대기 단어 조회
 * - 30초 캐시
 */
export function useDueReviews(examCategory: string, level: string, enabled = true) {
  return useQuery({
    queryKey: ['dueReviews', examCategory, level],
    queryFn: () => progressAPI.getDueReviews({ examCategory, level }),
    enabled,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * 복습 데이터 프리패치 훅
 */
export function usePrefetchReviews() {
  const queryClient = useQueryClient();

  return (examCategory: string, level: string) => {
    queryClient.prefetchQuery({
      queryKey: ['dueReviews', examCategory, level],
      queryFn: () => progressAPI.getDueReviews({ examCategory, level }),
      staleTime: 30_000,
    });
  };
}

/**
 * 복습 캐시 무효화 훅
 * - 퀴즈 완료 후 복습 데이터 새로고침 필요 시 사용
 */
export function useInvalidateReviews() {
  const queryClient = useQueryClient();

  return (examCategory?: string, level?: string) => {
    if (examCategory && level) {
      queryClient.invalidateQueries({
        queryKey: ['dueReviews', examCategory, level],
      });
    } else {
      queryClient.invalidateQueries({
        queryKey: ['dueReviews'],
      });
    }
    // 대시보드도 같이 무효화 (dueReviewCount 갱신)
    queryClient.invalidateQueries({
      queryKey: ['dashboardSummary'],
    });
  };
}

/**
 * 전체 통계 데이터 훅 (stats + progress)
 * - 30초 캐시
 */
export function useStatistics(enabled = true) {
  return useQuery({
    queryKey: ['statistics'],
    queryFn: async () => {
      const response = await api.get('/progress');
      return response.data;
    },
    enabled,
    staleTime: 30_000,
  });
}

/**
 * 통계 페이지 프리패치 훅
 * - 사이드바 hover 시 미리 로딩
 */
export function usePrefetchStatistics() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: ['statistics'],
      queryFn: async () => {
        const response = await api.get('/progress');
        return response.data;
      },
      staleTime: 30_000,
    });
    queryClient.prefetchQuery({
      queryKey: ['activityHeatmap'],
      queryFn: async () => {
        const response = await api.get('/progress/activity');
        return response.data;
      },
      staleTime: 60_000,
    });
  };
}

/**
 * 학습 활동 히트맵 훅
 * - 1분 캐시 (자주 변경되지 않음)
 */
export function useActivityHeatmap(enabled = true) {
  return useQuery({
    queryKey: ['activityHeatmap'],
    queryFn: async () => {
      const response = await api.get('/progress/activity');
      return response.data;
    },
    enabled,
    staleTime: 60_000, // 1분 캐시
  });
}

/**
 * 숙련도 분포 훅 (시험/레벨별)
 * - 시험/레벨 변경 시 이전 데이터 유지
 */
export function useMasteryDistribution(examCategory: string, level: string, enabled = true) {
  return useQuery({
    queryKey: ['masteryDistribution', examCategory, level],
    queryFn: async () => {
      const response = await api.get('/progress/mastery', {
        params: { examCategory, level },
      });
      return response.data;
    },
    enabled,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * 복습 퀴즈 데이터 훅
 * - 1분 캐시
 */
export function useReviewQuiz(
  params: { examCategory?: string; level?: string; limit?: number },
  enabled = true
) {
  return useQuery({
    queryKey: ['reviewQuiz', params.examCategory, params.level, params.limit],
    queryFn: () => progressAPI.getReviewQuiz(params),
    enabled,
    staleTime: 60_000, // 1분 캐시
  });
}

/**
 * 전체 캐시 클리어 훅
 * - 로그아웃 시 모든 캐시 초기화에 사용
 */
export function useClearAllCache() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.clear();
  };
}
