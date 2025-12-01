/**
 * VocaVision Admin API Hooks
 * 관리자 대시보드 API 통신 훅
 */

'use client';

import { useState, useCallback } from 'react';
import {
  DashboardStats,
  VocaWord,
  VocaContentFull,
  WordFilters,
  WordListResponse,
  CreateWordForm,
  BatchCreateForm,
  ReviewForm,
} from '../types/admin.types';

// Generation progress type for AI content generation
interface GenerationProgress {
  wordId: string;
  word: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

// API Base URL - NEVER use localhost
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

// Admin Key for internal authentication (optional, falls back to JWT)
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || '';

// ============================================
// API Client
// ============================================

async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(ADMIN_KEY ? { 'x-admin-key': ADMIN_KEY } : {}),
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
      const data = await apiClient<{ stats: DashboardStats }>('/admin/stats');
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
  const [words, setWords] = useState<VocaWord[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWords = useCallback(async (filters: WordFilters) => {
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
      if (filters.hasContent !== null) {
        params.set('hasContent', String(filters.hasContent));
      }
      if (filters.sortBy) params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
      params.set('page', String(filters.page || 1));
      params.set('limit', String(filters.limit || 20));

      const data = await apiClient<WordListResponse>(
        `/admin/words?${params.toString()}`
      );

      setWords(data.words);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch words');
    } finally {
      setLoading(false);
    }
  }, []);

  return { words, pagination, loading, error, fetchWords };
}

// ============================================
// useWordDetail Hook
// ============================================

export function useWordDetail() {
  const [word, setWord] = useState<(VocaWord & { content?: VocaContentFull }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWord = useCallback(async (wordId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient<{ word: VocaWord & { content?: VocaContentFull } }>(
        `/admin/words/${wordId}`
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

  const createWord = useCallback(async (data: CreateWordForm): Promise<VocaWord | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient<{ word: VocaWord }>('/admin/words', {
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
    async (wordId: string, data: Partial<CreateWordForm>): Promise<VocaWord | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiClient<{ word: VocaWord }>(
          `/admin/words/${wordId}`,
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
      await apiClient(`/admin/words/${wordId}`, {
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
    async (data: BatchCreateForm): Promise<{ created: number; failed: string[] } | null> => {
      setLoading(true);
      setError(null);
      try {
        const words = data.words
          .split('\n')
          .map((w) => w.trim())
          .filter((w) => w.length > 0);

        const result = await apiClient<{ created: number; failed: string[] }>(
          '/admin/words/batch',
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
        const result = await apiClient<{ success: boolean; jobId?: string; error?: string }>(
          '/content/generate',
          {
            method: 'POST',
            body: JSON.stringify({ wordId, regenerate }),
          }
        );

        if (!result.success) {
          throw new Error(result.error || 'Generation failed');
        }

        // Poll for progress if jobId returned
        if (result.jobId) {
          const pollProgress = async (): Promise<boolean> => {
            const status = await apiClient<{
              status: 'pending' | 'generating' | 'completed' | 'failed';
              progress: number;
              error?: string;
            }>(`/content/jobs/${result.jobId}`);

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

            await new Promise((resolve) => setTimeout(resolve, 1000));
            return pollProgress();
          };

          await pollProgress();
        }

        setProgress((prev) => prev ? { ...prev, status: 'completed', progress: 100 } : null);
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
// useBatchGeneration Hook
// ============================================

export function useBatchGeneration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const startBatchGeneration = useCallback(
    async (wordIds: string[]): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        // First, get the words to extract their text
        const wordsData = await Promise.all(
          wordIds.map((id) =>
            apiClient<{ word: { word: string } }>(`/admin/words/${id}`)
          )
        );

        const words = wordsData.map((d) => d.word.word);

        const result = await apiClient<{ success: boolean; jobId: string }>(
          '/content/batch',
          {
            method: 'POST',
            body: JSON.stringify({
              words,
              examCategory: 'CSAT',
              cefrLevel: 'B1',
            }),
          }
        );

        if (result.success && result.jobId) {
          setJobId(result.jobId);
          return true;
        }
        return false;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Batch generation failed');
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { startBatchGeneration, loading, error, jobId };
}

// ============================================
// useReview Hook
// ============================================

export function useReview() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reviewWord = useCallback(
    async (wordId: string, review: ReviewForm): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        await apiClient(`/content/review/${wordId}`, {
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
      await apiClient(`/content/publish/${wordId}`, {
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

  return { reviewWord, publishWord, loading, error };
}

// ============================================
// Export apiClient for custom use
// ============================================

export { apiClient };
