import { useQuery, useQueryClient } from '@tanstack/react-query';
import { progressAPI, api, wordsAPI } from '@/lib/api';

/**
 * 대시보드 요약 데이터 훅
 * - staleTime: 0 → 마운트 시 항상 refetch (최신 데이터 보장)
 * - placeholderData: 이전 캐시 데이터 먼저 표시 (0 방지) → 새 데이터로 교체
 */
export function useDashboardSummary(examCategory: string, level: string, enabled = true) {
  return useQuery({
    queryKey: ['dashboardSummary', examCategory, level],
    queryFn: () => progressAPI.getDashboardSummary(examCategory, level),
    enabled,
    staleTime: 30_000, // 30초 캐시 (시험/레벨 전환 시 즉시 표시)
    placeholderData: (previousData: any) => previousData, // 이전 캐시 데이터 표시 (0 방지)
    retry: 2, // cold start 커버 (2번이면 충분)
    retryDelay: (attempt) => Math.min(2000 * 2 ** attempt, 8000),
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
 * 패키지 접근 권한 일괄 체크 훅
 * - 4개 패키지를 1번의 API 호출로 체크
 * - 5분 캐시
 */
export function usePackageAccessBulk(slugs: string[], enabled = true) {
  return useQuery({
    queryKey: ['packageAccessBulk', ...slugs.sort()],
    queryFn: async () => {
      try {
        const response = await api.get(`/packages/check-access-bulk?slugs=${slugs.join(',')}`);
        return response.data.results as Record<string, { hasAccess: boolean; reason: string }>;
      } catch {
        const fallback: Record<string, { hasAccess: boolean; reason: string }> = {};
        for (const slug of slugs) {
          fallback[slug] = { hasAccess: false, reason: 'error' };
        }
        return fallback;
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
 * - removeQueries로 캐시 완전 제거 → 대시보드 진입 시 fresh fetch 보장
 *   (invalidateQueries + refetchType:'active'는 대시보드 미마운트 시 placeholderData로
 *    stale 데이터가 표시되는 문제가 있음)
 */
export function useInvalidateDashboard() {
  const queryClient = useQueryClient();

  return (examCategory?: string, level?: string) => {
    if (examCategory && level) {
      // 특정 시험/레벨 캐시 제거
      queryClient.removeQueries({
        queryKey: ['dashboardSummary', examCategory, level],
      });
    } else {
      // 모든 대시보드 캐시 제거
      queryClient.removeQueries({
        queryKey: ['dashboardSummary'],
      });
    }
  };
}

/**
 * 복습 대기 단어 목록 훅
 * - 시험/레벨별 복습 대기 단어 조회
 * - 30초 캐시로 시험/레벨 전환 시 즉시 표시
 */
export function useDueReviews(examCategory: string, level: string, enabled = true) {
  return useQuery({
    queryKey: ['dueReviews', examCategory, level],
    queryFn: () => progressAPI.getDueReviews({ examCategory, level }),
    enabled,
    staleTime: 30_000,   // 30초간 캐시 유효 (재방문 시 즉시 표시)
    gcTime: 5 * 60_000,  // 5분간 캐시 보관
    placeholderData: (previousData) => previousData,
    retry: 4, // cold start 커버 (2s + 4s + 8s + 10s = ~24초 윈도우)
    retryDelay: (attempt) => Math.min(2000 * 2 ** attempt, 10000),
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
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
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
 * 숙련도 분포 프리패치 훅
 * - 콤보박스 hover 시 미리 로딩
 */
export function usePrefetchMasteryDistribution() {
  const queryClient = useQueryClient();

  return (examCategory: string, level: string) => {
    // 이미 캐시에 있으면 스킵
    const existing = queryClient.getQueryData(['masteryDistribution', examCategory, level]);
    if (existing) return;

    queryClient.prefetchQuery({
      queryKey: ['masteryDistribution', examCategory, level],
      queryFn: async () => {
        const response = await api.get('/progress/mastery', {
          params: { examCategory, level },
        });
        return response.data;
      },
      staleTime: 30_000,
    });
  };
}

/**
 * 복습 퀴즈 데이터 훅
 * - 1분 캐시로 퀴즈 재시작 시 즉시 표시
 */
export function useReviewQuiz(
  params: { examCategory?: string; level?: string; limit?: number },
  enabled = true
) {
  return useQuery({
    queryKey: ['reviewQuiz', params.examCategory, params.level, params.limit],
    queryFn: () => progressAPI.getReviewQuiz(params),
    enabled,
    staleTime: 60_000,   // 1분간 캐시 유효
    gcTime: 5 * 60_000,  // 5분간 캐시 보관
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

/**
 * 단어 검색 훅
 * - 30초 캐시로 필터 변경 시 빠른 응답
 * - 이전 데이터 유지로 깜빡임 방지
 */
export function useWordsSearch(
  params: {
    page: number;
    limit?: number;
    examCategory?: string;
    level?: string;
    search?: string;
  },
  enabled = true
) {
  return useQuery({
    queryKey: ['wordsSearch', params.examCategory, params.level, params.search, params.page],
    queryFn: () => wordsAPI.getWords({
      page: params.page,
      limit: params.limit || 20,
      examCategory: params.examCategory || undefined,
      level: params.level || undefined,
      search: params.search || undefined,
      fields: 'list', // 🚀 목록용 경량 쿼리 (6개 JOIN 제거)
    }),
    enabled,
    staleTime: 30_000, // 30초 캐시
    placeholderData: (previousData) => previousData, // 이전 데이터 유지
  });
}

/**
 * 단어 검색 프리패치 훅
 * - 시험/레벨 버튼 hover 시 미리 로딩
 */
export function usePrefetchWordsSearch() {
  const queryClient = useQueryClient();

  return (params: {
    examCategory?: string;
    level?: string;
    page?: number;
  }) => {
    const page = params.page || 1;

    // 이미 캐시에 있으면 스킵
    const existing = queryClient.getQueryData([
      'wordsSearch', params.examCategory, params.level, '', page
    ]);
    if (existing) return;

    queryClient.prefetchQuery({
      queryKey: ['wordsSearch', params.examCategory, params.level, '', page],
      queryFn: () => wordsAPI.getWords({
        page,
        limit: 20,
        examCategory: params.examCategory || undefined,
        level: params.level || undefined,
        fields: 'list', // 🚀 목록용 경량 쿼리 (6개 JOIN 제거)
      }),
      staleTime: 30_000,
    });
  };
}
