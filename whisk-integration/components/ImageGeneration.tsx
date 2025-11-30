'use client';

// ============================================
// VocaVision - Image Generation Admin UI
// AI 이미지 생성 관리 컴포넌트
// ============================================

import React, { useState, useEffect, useCallback } from 'react';

// ---------------------------------------------
// Types
// ---------------------------------------------

interface StyleOption {
  value: string;
  label: string;
  labelKo: string;
}

interface PendingWord {
  id: string;
  word: string;
  mnemonic: string | null;
  mnemonicKorean: string | null;
}

interface GenerationResult {
  wordId: string;
  success: boolean;
  imageUrl?: string;
  error?: string;
}

interface ImageStats {
  totalGenerated: number;
  totalPending: number;
  recentGenerations: Array<{
    wordId: string;
    word: string;
    imageUrl: string;
    updatedAt: string;
  }>;
}

// ---------------------------------------------
// API Client
// ---------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ---------------------------------------------
// Hooks
// ---------------------------------------------

function useImageStyles() {
  const [styles, setStyles] = useState<StyleOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStyles = async () => {
      setLoading(true);
      try {
        const data = await apiClient<{ data: { styles: StyleOption[] } }>('/api/admin/images/styles');
        setStyles(data.data.styles);
      } catch (error) {
        console.error('Failed to fetch styles:', error);
        // Fallback styles
        setStyles([
          { value: 'cartoon', label: 'Cartoon', labelKo: '카툰' },
          { value: 'anime', label: 'Anime', labelKo: '애니메이션' },
          { value: 'watercolor', label: 'Watercolor', labelKo: '수채화' },
          { value: 'pixel', label: 'Pixel Art', labelKo: '픽셀아트' },
          { value: 'sketch', label: 'Sketch', labelKo: '스케치' },
          { value: '3d-render', label: '3D Render', labelKo: '3D 렌더링' },
          { value: 'comic', label: 'Comic', labelKo: '만화' },
          { value: 'minimalist', label: 'Minimalist', labelKo: '미니멀' },
          { value: 'vintage', label: 'Vintage', labelKo: '빈티지' },
          { value: 'pop-art', label: 'Pop Art', labelKo: '팝아트' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchStyles();
  }, []);

  return { styles, loading };
}

function useImageStats() {
  const [stats, setStats] = useState<ImageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient<{ data: ImageStats }>('/api/admin/images/stats');
      setStats(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

function usePendingWords() {
  const [words, setWords] = useState<PendingWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ total: 0, hasMore: false });

  const fetchWords = useCallback(async (limit = 20, offset = 0) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient<{
        data: {
          words: PendingWord[];
          pagination: { total: number; hasMore: boolean };
        };
      }>(`/api/admin/images/pending?limit=${limit}&offset=${offset}`);
      setWords(data.data.words);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pending words');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  return { words, loading, error, pagination, refetch: fetchWords };
}

// ---------------------------------------------
// Components
// ---------------------------------------------

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  color?: 'blue' | 'green' | 'yellow' | 'gray';
}

function StatsCard({ title, value, subtitle, color = 'blue' }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="text-sm font-medium opacity-80">{title}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      {subtitle && <div className="mt-1 text-xs opacity-60">{subtitle}</div>}
    </div>
  );
}

interface StyleSelectorProps {
  value: string;
  onChange: (value: string) => void;
  styles: StyleOption[];
}

function StyleSelector({ value, onChange, styles }: StyleSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">아트 스타일</label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
        {styles.map((style) => (
          <button
            key={style.value}
            type="button"
            onClick={() => onChange(style.value)}
            className={`rounded-lg border-2 p-2 text-center transition-all ${
              value === style.value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-sm font-medium">{style.labelKo}</div>
            <div className="text-xs text-gray-500">{style.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

interface WordSelectionListProps {
  words: PendingWord[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

function WordSelectionList({
  words,
  selectedIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: WordSelectionListProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          단어 선택 ({selectedIds.size}/{words.length})
        </label>
        <div className="space-x-2">
          <button
            type="button"
            onClick={onSelectAll}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            전체 선택
          </button>
          <button
            type="button"
            onClick={onDeselectAll}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            선택 해제
          </button>
        </div>
      </div>
      <div className="max-h-60 overflow-y-auto rounded-lg border">
        {words.map((word) => (
          <label
            key={word.id}
            className="flex cursor-pointer items-center gap-3 border-b px-3 py-2 last:border-b-0 hover:bg-gray-50"
          >
            <input
              type="checkbox"
              checked={selectedIds.has(word.id)}
              onChange={() => onToggle(word.id)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="font-medium">{word.word}</div>
              {word.mnemonic && (
                <div className="text-xs text-gray-500 line-clamp-1">{word.mnemonic}</div>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

interface GenerationProgressProps {
  total: number;
  completed: number;
  results: GenerationResult[];
}

function GenerationProgress({ total, completed, results }: GenerationProgressProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">이미지 생성 진행률</span>
        <span className="text-sm text-gray-600">
          {completed}/{total} ({percentage}%)
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {completed > 0 && (
        <div className="mt-2 flex gap-4 text-sm">
          <span className="text-green-600">성공: {successful}</span>
          <span className="text-red-600">실패: {failed}</span>
        </div>
      )}
    </div>
  );
}

interface RecentGenerationsProps {
  generations: ImageStats['recentGenerations'];
}

function RecentGenerations({ generations }: RecentGenerationsProps) {
  if (generations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        최근 생성된 이미지가 없습니다.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {generations.map((gen) => (
        <div
          key={gen.wordId}
          className="group relative overflow-hidden rounded-lg border bg-white"
        >
          <div className="aspect-square bg-gray-100">
            {gen.imageUrl ? (
              <img
                src={gen.imageUrl}
                alt={gen.word}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                No image
              </div>
            )}
          </div>
          <div className="p-2">
            <div className="truncate font-medium">{gen.word}</div>
            <div className="text-xs text-gray-500">
              {new Date(gen.updatedAt).toLocaleDateString('ko-KR')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------
// Main Component
// ---------------------------------------------

export function ImageGenerationPage() {
  const { styles } = useImageStyles();
  const { stats, loading: statsLoading, refetch: refetchStats } = useImageStats();
  const { words, loading: wordsLoading, refetch: refetchWords, pagination } = usePendingWords();

  const [selectedStyle, setSelectedStyle] = useState('cartoon');
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResults, setGenerationResults] = useState<GenerationResult[]>([]);
  const [generationTotal, setGenerationTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleToggleWord = (id: string) => {
    setSelectedWordIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedWordIds(new Set(words.map((w) => w.id)));
  };

  const handleDeselectAll = () => {
    setSelectedWordIds(new Set());
  };

  const handleGenerateBatch = async () => {
    if (selectedWordIds.size === 0) {
      setError('생성할 단어를 선택해주세요.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGenerationResults([]);
    setGenerationTotal(selectedWordIds.size);

    try {
      const data = await apiClient<{
        data: {
          total: number;
          successful: number;
          failed: number;
          results: GenerationResult[];
        };
      }>('/api/admin/images/generate-batch', {
        method: 'POST',
        body: JSON.stringify({
          wordIds: Array.from(selectedWordIds),
          style: selectedStyle,
          regenerate: false,
        }),
      });

      setGenerationResults(data.data.results);

      // Refresh stats and pending words
      await Promise.all([refetchStats(), refetchWords()]);

      // Clear selection
      setSelectedWordIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 생성에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">이미지 생성</h1>
        <button
          onClick={() => {
            refetchStats();
            refetchWords();
          }}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
        >
          새로고침
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatsCard
          title="생성 완료"
          value={stats?.totalGenerated ?? '-'}
          color="green"
        />
        <StatsCard
          title="대기 중"
          value={stats?.totalPending ?? '-'}
          color="yellow"
        />
        <StatsCard
          title="선택됨"
          value={selectedWordIds.size}
          color="blue"
        />
        <StatsCard
          title="총 단어"
          value={pagination.total}
          color="gray"
        />
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            닫기
          </button>
        </div>
      )}

      {/* Generation Progress */}
      {isGenerating && (
        <GenerationProgress
          total={generationTotal}
          completed={generationResults.length}
          results={generationResults}
        />
      )}

      {/* Generation Form */}
      <div className="rounded-lg border bg-white p-4 space-y-4">
        <h2 className="text-lg font-semibold">배치 이미지 생성</h2>

        <StyleSelector
          value={selectedStyle}
          onChange={setSelectedStyle}
          styles={styles}
        />

        {wordsLoading ? (
          <div className="py-8 text-center text-gray-500">로딩 중...</div>
        ) : words.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            이미지가 필요한 단어가 없습니다.
          </div>
        ) : (
          <WordSelectionList
            words={words}
            selectedIds={selectedWordIds}
            onToggle={handleToggleWord}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
          />
        )}

        <div className="flex justify-end">
          <button
            onClick={handleGenerateBatch}
            disabled={isGenerating || selectedWordIds.size === 0}
            className={`rounded-lg px-6 py-2 font-medium text-white transition-colors ${
              isGenerating || selectedWordIds.size === 0
                ? 'cursor-not-allowed bg-gray-400'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isGenerating ? '생성 중...' : `${selectedWordIds.size}개 이미지 생성`}
          </button>
        </div>
      </div>

      {/* Recent Generations */}
      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-4 text-lg font-semibold">최근 생성된 이미지</h2>
        {statsLoading ? (
          <div className="py-8 text-center text-gray-500">로딩 중...</div>
        ) : (
          <RecentGenerations generations={stats?.recentGenerations ?? []} />
        )}
      </div>
    </div>
  );
}

export default ImageGenerationPage;
