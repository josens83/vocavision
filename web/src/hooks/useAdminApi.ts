/**
 * VocaVision Admin API Hooks
 * 관리자 대시보드 API 통신 훅
 */

import { useState, useCallback } from 'react';
import {
  DashboardStats,
  AdminWord,
  WordDetail,
  WordFilters,
  PaginationParams,
  WordListResponse,
  WordFormData,
  BatchUploadData,
  ReviewRequest,
  GenerationProgress,
  AuditLog,
  ApiResponse,
  CEFRLevel,
  ExamCategory,
} from '@/types/admin.types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ============================================
// API Client
// ============================================

async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============================================
// useDashboardStats Hook
// ============================================

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient<{ stats: DashboardStats }>('/api/admin/stats');
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  }, []);

  return { stats, loading, error, fetchStats };
}

// ============================================
// useWordList Hook
// ============================================

export function useWordList() {
  const [words, setWords] = useState<AdminWord[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWords = useCallback(
    async (filters: WordFilters & PaginationParams) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();

        if (filters.search) params.set('search', filters.search);
        if (filters.examCategories?.length) {
          params.set('examCategories', filters.examCategories.join(','));
        }
        if (filters.levels?.length) {
          params.set('levels', filters.levels.join(','));
        }
        if (filters.status?.length) {
          params.set('status', filters.status.join(','));
        }
        params.set('page', String(filters.page || 1));
        params.set('limit', String(filters.limit || 20));

        const data = await apiClient<WordListResponse>(
          `/api/admin/words?${params.toString()}`
        );

        setWords(data.words);
        setPagination(data.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch words');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { words, pagination, loading, error, fetchWords };
}

// ============================================
// useWordDetail Hook
// ============================================

export function useWordDetail() {
  const [word, setWord] = useState<WordDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWord = useCallback(async (wordId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient<{ word: WordDetail }>(
        `/api/admin/words/${wordId}`
      );
      setWord(data.word);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch word');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearWord = useCallback(() => {
    setWord(null);
  }, []);

  return { word, loading, error, fetchWord, clearWord };
}

// ============================================
// useWordMutations Hook
// ============================================

export function useWordMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createWord = useCallback(async (data: WordFormData): Promise<AdminWord | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient<{ word: AdminWord }>('/api/admin/words', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return result.word;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create word');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateWord = useCallback(
    async (wordId: string, data: Partial<WordFormData>): Promise<AdminWord | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiClient<{ word: AdminWord }>(
          `/api/admin/words/${wordId}`,
          {
            method: 'PATCH',
            body: JSON.stringify(data),
          }
        );
        return result.word;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update word');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteWord = useCallback(async (wordId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiClient(`/api/admin/words/${wordId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete word');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchCreate = useCallback(
    async (data: BatchUploadData): Promise<{ created: number; failed: string[] } | null> => {
      setLoading(true);
      setError(null);
      try {
        const words = data.words
          .split('\n')
          .map((w) => w.trim())
          .filter((w) => w.length > 0);

        const result = await apiClient<{ created: number; failed: string[] }>(
          '/api/admin/words/batch',
          {
            method: 'POST',
            body: JSON.stringify({
              words,
              examCategory: data.examCategory,
              level: data.level,
              generateContent: data.generateContent,
            }),
          }
        );
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to batch create');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { createWord, updateWord, deleteWord, batchCreate, loading, error };
}

// ============================================
// useContentGeneration Hook
// ============================================

export function useContentGeneration() {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateContent = useCallback(
    async (wordId: string, regenerate: boolean = false): Promise<boolean> => {
      setGenerating(true);
      setError(null);
      setProgress({
        wordId,
        word: '',
        status: 'generating',
        progress: 0,
      });

      try {
        // Start generation
        const result = await apiClient<ApiResponse<{ jobId: string }>>(
          '/api/content/generate',
          {
            method: 'POST',
            body: JSON.stringify({ wordId, regenerate }),
          }
        );

        if (!result.success) {
          throw new Error(result.error || 'Generation failed');
        }

        // Poll for progress
        const pollProgress = async (): Promise<boolean> => {
          const status = await apiClient<{
            status: 'pending' | 'generating' | 'completed' | 'failed';
            progress: number;
            error?: string;
          }>(`/api/content/jobs/${result.data?.jobId}`);

          setProgress((prev) =>
            prev
              ? { ...prev, status: status.status, progress: status.progress }
              : null
          );

          if (status.status === 'completed') {
            return true;
          }
          if (status.status === 'failed') {
            throw new Error(status.error || 'Generation failed');
          }

          // Continue polling
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return pollProgress();
        };

        await pollProgress();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Generation failed');
        setProgress((prev) =>
          prev ? { ...prev, status: 'failed', error: String(err) } : null
        );
        return false;
      } finally {
        setGenerating(false);
      }
    },
    []
  );

  return { generating, progress, error, generateContent };
}

// ============================================
// useReview Hook
// ============================================

export function useReview() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reviewWord = useCallback(
    async (wordId: string, review: ReviewRequest): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        await apiClient(`/api/content/review/${wordId}`, {
          method: 'POST',
          body: JSON.stringify(review),
        });
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Review failed');
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const publishWord = useCallback(async (wordId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiClient(`/api/content/publish/${wordId}`, {
        method: 'POST',
      });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAuditLog = useCallback(async (wordId: string): Promise<AuditLog[]> => {
    try {
      const result = await apiClient<{ logs: AuditLog[] }>(
        `/api/content/audit/${wordId}`
      );
      return result.logs;
    } catch {
      return [];
    }
  }, []);

  return { reviewWord, publishWord, getAuditLog, loading, error };
}

// ============================================
// Export all hooks
// ============================================

export {
  apiClient,
};
