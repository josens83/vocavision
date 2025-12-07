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
  EXAM_LEVEL_OPTIONS,
  LEVEL_TO_DB,
  WordVisual,
  WordVisualInput,
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

// Debug: Log configuration on initialization (development only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('[Admin API Config]', {
    API_BASE: API_BASE || '(not set - using relative URLs)',
    ADMIN_KEY: ADMIN_KEY ? '(set)' : '(not set - will use JWT fallback)',
  });
}

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
    // Debug: Log failed requests
    console.error('[Admin API Error]', {
      endpoint,
      status: response.status,
      statusText: response.statusText,
      error: error.message,
      hasAdminKey: !!ADMIN_KEY,
    });
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
      // Map frontend level to DB level
      const dbLevel = data.level ? LEVEL_TO_DB[data.level] : 'L1';
      const result = await apiClient<{ word: VocaWord }>('/admin/words', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          level: dbLevel, // Send L1, L2, L3 to backend
        }),
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
        // Map frontend level to DB level if provided
        // Also convert examCategories (array) to examCategory (single) for backend
        const payload: Record<string, unknown> = {};

        if (data.word) payload.word = data.word;
        if (data.topics) payload.tags = data.topics; // topics -> tags for backend

        // Convert examCategories array to single examCategory
        if (data.examCategories && data.examCategories.length > 0) {
          payload.examCategory = data.examCategories[0];
        }

        // Convert frontend level to DB level
        if (data.level) {
          payload.level = LEVEL_TO_DB[data.level];
        }

        const result = await apiClient<{ word: VocaWord }>(
          `/admin/words/${wordId}`,
          {
            method: 'PATCH',
            body: JSON.stringify(payload),
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

        // Parse combined examWithLevel to get exam and level
        const selectedOption = EXAM_LEVEL_OPTIONS.find(opt => opt.value === data.examWithLevel);
        const examCategory = selectedOption?.exam || 'CSAT';
        const level = selectedOption?.level || 'BEGINNER';
        // Map to DB level value (L1, L2, L3)
        const dbLevel = LEVEL_TO_DB[level] || 'L1';

        const result = await apiClient<{ created: number; failed: string[] }>(
          '/admin/words/batch',
          {
            method: 'POST',
            body: JSON.stringify({
              words,
              examCategory,
              level: dbLevel,  // Send L1, L2, L3 to backend
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
// Collection Types
// ============================================

export interface Collection {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  icon: string | null;
  category: string;
  difficulty: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
  isPublic: boolean;
  wordIds: string[];
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionWithWords extends Collection {
  words: Array<{
    id: string;
    word: string;
    definition: string;
    definitionKo: string | null;
    examCategory: string;
    level: string | null;
    difficulty: string;
    status: string;
  }>;
}

export interface CreateCollectionForm {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  category: string;
  difficulty: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
  isPublic?: boolean;
  wordIds?: string[];
}

// ============================================
// useCollections Hook
// ============================================

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient<{ collections: Collection[] }>('/admin/collections');
      setCollections(data.collections);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch collections');
    } finally {
      setLoading(false);
    }
  }, []);

  return { collections, loading, error, fetchCollections };
}

// ============================================
// useCollectionDetail Hook
// ============================================

export function useCollectionDetail() {
  const [collection, setCollection] = useState<CollectionWithWords | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCollection = useCallback(async (collectionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient<CollectionWithWords>(
        `/admin/collections/${collectionId}`
      );
      setCollection(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch collection');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCollection = useCallback(() => {
    setCollection(null);
  }, []);

  return { collection, loading, error, fetchCollection, clearCollection };
}

// ============================================
// useCollectionMutations Hook
// ============================================

export function useCollectionMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCollection = useCallback(
    async (data: CreateCollectionForm): Promise<Collection | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiClient<{ collection: Collection }>('/admin/collections', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        return result.collection;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create collection');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateCollection = useCallback(
    async (
      collectionId: string,
      data: Partial<CreateCollectionForm>
    ): Promise<Collection | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiClient<{ collection: Collection }>(
          `/admin/collections/${collectionId}`,
          {
            method: 'PATCH',
            body: JSON.stringify(data),
          }
        );
        return result.collection;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update collection');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteCollection = useCallback(async (collectionId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiClient(`/admin/collections/${collectionId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete collection');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const addWordsToCollection = useCallback(
    async (collectionId: string, wordIds: string[]): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        await apiClient(`/admin/collections/${collectionId}/words`, {
          method: 'POST',
          body: JSON.stringify({ wordIds }),
        });
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add words');
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const removeWordsFromCollection = useCallback(
    async (collectionId: string, wordIds: string[]): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        await apiClient(`/admin/collections/${collectionId}/words`, {
          method: 'DELETE',
          body: JSON.stringify({ wordIds }),
        });
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove words');
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    createCollection,
    updateCollection,
    deleteCollection,
    addWordsToCollection,
    removeWordsFromCollection,
    loading,
    error,
  };
}

// ============================================
// Audit Log Types and Hook
// ============================================

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  previousData: any;
  newData: any;
  changedFields: string[];
  performedById: string | null;
  performedAt: string;
}

export function useAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditLogs = useCallback(async (wordId: string, limit: number = 5) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient<{ logs: AuditLog[] }>(
        `/admin/words/${wordId}/audit-logs?limit=${limit}`
      );
      setLogs(data.logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return { logs, loading, error, fetchAuditLogs, clearLogs };
}

// ============================================
// useVisuals Hook - Word Visual 3-Image System
// ============================================

export function useVisuals() {
  const [visuals, setVisuals] = useState<WordVisual[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVisuals = useCallback(async (wordId: string) => {
    setLoading(true);
    setError(null);
    try {
      // Use admin route for admin key authentication
      const data = await apiClient<{ visuals: WordVisual[] }>(
        `/admin/words/${wordId}/visuals`
      );
      setVisuals(data.visuals || []);
    } catch (err) {
      // If 404 or no visuals, just set empty array
      setVisuals([]);
      // Only set error for non-404 errors
      if (err instanceof Error && !err.message.includes('404')) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const saveVisuals = useCallback(
    async (wordId: string, visualsData: WordVisualInput[]): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        // Use admin route for admin key authentication
        const data = await apiClient<{ visuals: WordVisual[] }>(
          `/admin/words/${wordId}/visuals`,
          {
            method: 'PUT',
            body: JSON.stringify({ visuals: visualsData }),
          }
        );
        setVisuals(data.visuals || []);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save visuals');
        return false;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const clearVisuals = useCallback(() => {
    setVisuals([]);
  }, []);

  return { visuals, loading, saving, error, fetchVisuals, saveVisuals, clearVisuals };
}

// ============================================
// Export apiClient for custom use
// ============================================

export { apiClient };
