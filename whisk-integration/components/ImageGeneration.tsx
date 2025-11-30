// ============================================
// VocaVision - Image Generation UI Components
// Admin Dashboard용 이미지 생성 컴포넌트
// ============================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';

// ---------------------------------------------
// Types
// ---------------------------------------------

interface ImageStyle {
  value: string;
  label: string;
  labelKo: string;
}

interface PendingWord {
  id: string;
  word: string;
  level: string;
  mnemonic: string;
  mnemonicKorean?: string;
}

interface GenerationResult {
  wordId: string;
  success: boolean;
  imageUrl?: string;
  error?: string;
}

interface ImageStats {
  totalWithContent: number;
  withImages: number;
  pendingImages: number;
  coveragePercent: number;
  recentGenerations: number;
  styleDistribution: Array<{ style: string; count: number }>;
}

// ---------------------------------------------
// API Hooks
// ---------------------------------------------

// API Base URL - NEVER use localhost
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'API request failed');
  return data.data;
}

function useImageGeneration() {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  const generateSingle = useCallback(async (
    wordId: string,
    style?: string,
    regenerate = false
  ) => {
    setGenerating(true);
    setError(null);
    try {
      const result = await apiClient<GenerationResult>('/api/admin/images/generate', {
        method: 'POST',
        body: JSON.stringify({ wordId, style, regenerate }),
      });
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed';
      setError(msg);
      throw err;
    } finally {
      setGenerating(false);
    }
  }, []);

  const generateBatch = useCallback(async (
    wordIds: string[],
    style?: string,
    regenerate = false
  ) => {
    setGenerating(true);
    setError(null);
    setProgress({ current: 0, total: wordIds.length });

    try {
      const result = await apiClient<{
        total: number;
        successful: number;
        failed: number;
        results: GenerationResult[];
      }>('/api/admin/images/generate-batch', {
        method: 'POST',
        body: JSON.stringify({ wordIds, style, regenerate }),
      });

      setProgress({ current: result.total, total: result.total });
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Batch generation failed';
      setError(msg);
      throw err;
    } finally {
      setGenerating(false);
    }
  }, []);

  return { generating, progress, error, generateSingle, generateBatch };
}

function useImageStats() {
  const [stats, setStats] = useState<ImageStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient<ImageStats>('/api/admin/images/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch image stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { stats, loading, fetchStats };
}

function usePendingWords() {
  const [words, setWords] = useState<PendingWord[]>([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);

  const fetchPending = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const data = await apiClient<{
        words: PendingWord[];
        pagination: typeof pagination;
      }>(`/api/admin/images/pending?page=${page}&limit=20`);
      setWords(data.words);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to fetch pending words:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { words, pagination, loading, fetchPending };
}

function useImageStyles() {
  const [styles, setStyles] = useState<ImageStyle[]>([]);

  useEffect(() => {
    apiClient<{ styles: ImageStyle[] }>('/api/admin/images/styles')
      .then((data) => setStyles(data.styles))
      .catch(console.error);
  }, []);

  return styles;
}

// ---------------------------------------------
// Style Selector Component
// ---------------------------------------------

interface StyleSelectorProps {
  value: string;
  onChange: (style: string) => void;
}

const StyleSelector: React.FC<StyleSelectorProps> = ({ value, onChange }) => {
  const styles = useImageStyles();

  const styleIcons: Record<string, string> = {
    cartoon: '🎨',
    anime: '🌸',
    watercolor: '💧',
    pixel: '👾',
    sketch: '✏️',
    '3d-render': '🎲',
    comic: '💥',
    minimalist: '◻️',
    vintage: '📷',
    'pop-art': '🎭',
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        이미지 스타일
      </label>
      <div className="grid grid-cols-5 gap-2">
        {styles.map((style) => (
          <button
            key={style.value}
            type="button"
            onClick={() => onChange(style.value)}
            className={`p-3 rounded-xl border-2 transition-all text-center ${
              value === style.value
                ? 'border-pink-500 bg-pink-50 shadow-md'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="text-2xl mb-1">{styleIcons[style.value] || '🖼️'}</div>
            <div className="text-xs font-medium text-slate-700">{style.labelKo}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------
// Image Stats Card Component
// ---------------------------------------------

const ImageStatsCard: React.FC = () => {
  const { stats, loading, fetchStats } = useImageStats();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading || !stats) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-8 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">이미지 생성 현황</h3>
        <button
          onClick={fetchStats}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <div className="text-2xl font-bold text-slate-900">{stats.withImages}</div>
          <div className="text-xs text-slate-500">이미지 있음</div>
        </div>
        <div className="text-center p-3 bg-amber-50 rounded-lg">
          <div className="text-2xl font-bold text-amber-600">{stats.pendingImages}</div>
          <div className="text-xs text-slate-500">생성 대기</div>
        </div>
        <div className="text-center p-3 bg-emerald-50 rounded-lg">
          <div className="text-2xl font-bold text-emerald-600">{stats.coveragePercent}%</div>
          <div className="text-xs text-slate-500">커버리지</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{stats.recentGenerations}</div>
          <div className="text-xs text-slate-500">최근 7일</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">전체 진행률</span>
          <span className="font-medium text-slate-700">
            {stats.withImages} / {stats.totalWithContent}
          </span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
            style={{ width: `${stats.coveragePercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------
// Pending Words List Component
// ---------------------------------------------

interface PendingWordsListProps {
  onGenerate: (wordIds: string[]) => void;
  generating: boolean;
}

const PendingWordsList: React.FC<PendingWordsListProps> = ({ onGenerate, generating }) => {
  const { words, pagination, loading, fetchPending } = usePendingWords();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchPending(1);
  }, [fetchPending]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === words.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(words.map((w) => w.id));
    }
  };

  const handleGenerate = () => {
    if (selectedIds.length > 0) {
      onGenerate(selectedIds);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">이미지 생성 대기</h3>
          <p className="text-sm text-slate-500">{pagination.total}개 단어 대기 중</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <span className="text-sm text-pink-600 font-medium">
              {selectedIds.length}개 선택됨
            </span>
          )}
          <button
            onClick={handleGenerate}
            disabled={selectedIds.length === 0 || generating}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {generating ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                생성 중...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                이미지 생성
              </>
            )}
          </button>
        </div>
      </div>

      {/* Table */}
      {words.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">모든 이미지 생성 완료!</h3>
          <p className="text-slate-500">대기 중인 단어가 없습니다.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {/* Select All */}
          <div className="px-6 py-3 bg-slate-50 flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedIds.length === words.length && words.length > 0}
              onChange={toggleAll}
              className="w-4 h-4 rounded border-slate-300 text-pink-500 focus:ring-pink-500"
            />
            <span className="text-sm text-slate-600">전체 선택</span>
          </div>

          {/* Word Items */}
          {words.map((word) => (
            <div
              key={word.id}
              className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(word.id)}
                onChange={() => toggleSelect(word.id)}
                className="w-4 h-4 rounded border-slate-300 text-pink-500 focus:ring-pink-500"
              />

              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-pink-500">
                  {word.word[0].toUpperCase()}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{word.word}</span>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                    {word.level}
                  </span>
                </div>
                <p className="text-sm text-slate-500 truncate mt-0.5">
                  {word.mnemonic}
                </p>
                {word.mnemonicKorean && (
                  <p className="text-xs text-amber-600 mt-0.5">
                    🇰🇷 {word.mnemonicKorean}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            페이지 {pagination.page} / {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => fetchPending(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 text-sm border border-slate-300 rounded-lg disabled:opacity-50"
            >
              이전
            </button>
            <button
              onClick={() => fetchPending(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 text-sm border border-slate-300 rounded-lg disabled:opacity-50"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------
// Generation Progress Modal
// ---------------------------------------------

interface GenerationProgressProps {
  isOpen: boolean;
  progress: { current: number; total: number };
  results: GenerationResult[];
  onClose: () => void;
}

const GenerationProgressModal: React.FC<GenerationProgressProps> = ({
  isOpen,
  progress,
  results,
  onClose,
}) => {
  if (!isOpen) return null;

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const isComplete = progress.current >= progress.total && progress.total > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl">
          <div className="p-6">
            {/* Header */}
            <div className="text-center mb-6">
              {isComplete ? (
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
                  <div
                    className="absolute inset-0 rounded-full border-4 border-pink-500 border-t-transparent animate-spin"
                  />
                </div>
              )}
              <h3 className="text-lg font-semibold text-slate-900">
                {isComplete ? '생성 완료!' : '이미지 생성 중...'}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {progress.current} / {progress.total}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            {results.length > 0 && (
              <div className="flex justify-center gap-6 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">{successful}</div>
                  <div className="text-xs text-slate-500">성공</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{failed}</div>
                  <div className="text-xs text-slate-500">실패</div>
                </div>
              </div>
            )}

            {/* Close Button */}
            {isComplete && (
              <button
                onClick={onClose}
                className="w-full py-3 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600"
              >
                확인
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------
// Main Image Generation Page Component
// ---------------------------------------------

export const ImageGenerationPage: React.FC = () => {
  const { generating, progress, error, generateBatch } = useImageGeneration();
  const [selectedStyle, setSelectedStyle] = useState('cartoon');
  const [showProgress, setShowProgress] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);

  const handleGenerate = async (wordIds: string[]) => {
    setShowProgress(true);
    setResults([]);

    try {
      const result = await generateBatch(wordIds, selectedStyle);
      setResults(result.results);
    } catch (err) {
      console.error('Generation failed:', err);
    }
  };

  const handleCloseProgress = () => {
    setShowProgress(false);
    setResults([]);
    // Refresh the pending list
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">이미지 생성</h1>
        <p className="text-slate-500 mt-1">
          연상 기억법을 AI 이미지로 변환합니다
        </p>
      </div>

      {/* Stats */}
      <ImageStatsCard />

      {/* Style Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <StyleSelector value={selectedStyle} onChange={setSelectedStyle} />
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Pending Words */}
      <PendingWordsList onGenerate={handleGenerate} generating={generating} />

      {/* Progress Modal */}
      <GenerationProgressModal
        isOpen={showProgress}
        progress={progress}
        results={results}
        onClose={handleCloseProgress}
      />
    </div>
  );
};

export default ImageGenerationPage;
