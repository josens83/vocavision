'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import {
  Button,
  Card,
  Badge,
  Alert,
  Spinner,
  ProgressBar,
  Select,
} from '@/components/admin/ui';

// Types
interface LevelStats {
  level: string;
  totalWords: number;
  withImages: number;
  withoutImages: number;
  coverage: number;
}

interface StatusResponse {
  success: boolean;
  data: {
    examType: string;
    levels: LevelStats[];
    totalWords: number;
    totalWithImages: number;
    totalWithoutImages: number;
    overallCoverage: number;
  };
}

interface BatchJobStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  totalWords: number;
  processedWords: number;
  currentWord?: string;
  successCount: number;
  errorCount: number;
  startedAt: string;
  errors?: Array<{ word: string; error: string }>;
}

interface BatchStartResponse {
  success: boolean;
  data: {
    jobId: string;
    message: string;
  };
  error?: string;
}

export default function AdminImageGenerationPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  // State
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState<StatusResponse['data'] | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Batch generation state
  const [examType, setExamType] = useState('CSAT');
  const [selectedLevel, setSelectedLevel] = useState('L3');
  const [batchSize, setBatchSize] = useState(100);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Job tracking
  const [currentJob, setCurrentJob] = useState<BatchJobStatus | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const shouldPollRef = useRef(false);

  // Auth check
  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, hasHydrated, router]);

  // Load status on mount
  useEffect(() => {
    if (user) {
      loadStatus();
    }
  }, [user]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      shouldPollRef.current = false;
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }
    };
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    setStatusError(null);
    try {
      const response = await api.get<StatusResponse>('/admin/image-generation/status');
      setStatusData(response.data.data);
    } catch (err) {
      console.error('Failed to load status:', err);
      setStatusError(err instanceof Error ? err.message : 'Failed to load status');
    } finally {
      setLoading(false);
    }
  };

  const startBatchGeneration = async () => {
    setIsGenerating(true);
    setGenerateError(null);
    setCurrentJob(null);

    try {
      const response = await api.post<BatchStartResponse>('/admin/image-generation/batch', {
        examType,
        level: selectedLevel,
        limit: batchSize,
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to start batch generation');
      }

      const jobId = response.data.data.jobId;

      // Start polling
      shouldPollRef.current = true;
      pollJobStatus(jobId);
    } catch (err) {
      console.error('Failed to start batch:', err);
      setGenerateError(err instanceof Error ? err.message : 'Failed to start batch generation');
      setIsGenerating(false);
    }
  };

  const pollJobStatus = useCallback(async (jobId: string) => {
    if (!shouldPollRef.current) return;

    try {
      const response = await api.get<{ success: boolean; data: BatchJobStatus }>(
        `/admin/image-generation/job/${jobId}`
      );

      if (response.data.success && response.data.data) {
        setCurrentJob(response.data.data);

        // Continue polling if not finished (5초 간격)
        if (response.data.data.status === 'pending' || response.data.data.status === 'processing') {
          pollingRef.current = setTimeout(() => pollJobStatus(jobId), 5000);
        } else {
          // Job finished
          setIsGenerating(false);
          shouldPollRef.current = false;
          // Refresh status
          loadStatus();
        }
      }
    } catch (err: any) {
      // 429 Too Many Requests - wait longer before retry
      const is429 = err?.response?.status === 429;
      const retryDelay = is429 ? 10000 : 5000; // 429면 10초, 그 외 5초

      if (!is429) {
        console.error('Polling error:', err);
      }

      // Retry on error
      if (shouldPollRef.current) {
        pollingRef.current = setTimeout(() => pollJobStatus(jobId), retryDelay);
      }
    }
  }, []);

  const stopPolling = async () => {
    shouldPollRef.current = false;
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
    }

    // Call backend to stop the job
    if (currentJob?.id) {
      try {
        const response = await api.post<{ success: boolean; data: { newStatus: string } }>(
          `/admin/image-generation/stop/${currentJob.id}`
        );
        // Update local job status based on backend response
        if (response.data.success) {
          setCurrentJob((prev) => prev ? {
            ...prev,
            status: response.data.data.newStatus as BatchJobStatus['status']
          } : null);
        }
      } catch (err) {
        console.error('Failed to stop job:', err);
        // Still update local status even if backend call fails
        setCurrentJob((prev) => prev ? { ...prev, status: 'failed' } : null);
      }
    }

    setIsGenerating(false);
  };

  // Loading state
  if (!hasHydrated || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Progress calculation
  const progress = currentJob
    ? Math.round((currentJob.processedWords / currentJob.totalWords) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-slate-900">
                이미지 생성 관리
              </h1>
            </div>
            <Button variant="outline" size="sm" onClick={loadStatus}>
              새로고침
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Status Error */}
        {statusError && (
          <Alert type="error" title="현황 조회 실패">
            {statusError}
          </Alert>
        )}

        {/* Status Section */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">📊</span>
            <h2 className="text-lg font-semibold text-slate-900">이미지 생성 현황</h2>
          </div>

          {statusData ? (
            <>
              {/* Overall Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-slate-900">
                    {statusData.totalWords.toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-500">총 단어</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-600">
                    {statusData.totalWithImages.toLocaleString()}
                  </p>
                  <p className="text-sm text-emerald-600">이미지 완료</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {statusData.totalWithoutImages.toLocaleString()}
                  </p>
                  <p className="text-sm text-red-600">미생성</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {statusData.overallCoverage.toFixed(1)}%
                  </p>
                  <p className="text-sm text-blue-600">커버리지</p>
                </div>
              </div>

              {/* Level Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {statusData.levels.map((level) => (
                  <div
                    key={level.level}
                    className={`border rounded-lg p-4 ${
                      level.coverage >= 100
                        ? 'border-emerald-200 bg-emerald-50'
                        : level.coverage > 0
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-900">{level.level}</span>
                      <Badge
                        color={
                          level.coverage >= 100
                            ? 'green'
                            : level.coverage > 0
                            ? 'yellow'
                            : 'red'
                        }
                      >
                        {level.coverage.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">단어</span>
                        <span className="font-medium">{level.totalWords.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-600">완료</span>
                        <span className="font-medium text-emerald-600">
                          {level.withImages.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-600">미생성</span>
                        <span className="font-medium text-red-600">
                          {level.withoutImages.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <ProgressBar
                      progress={Math.round(level.coverage)}
                      showLabel={false}
                      color={level.coverage >= 100 ? 'green' : 'pink'}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-500">
              현황 데이터를 불러올 수 없습니다.
            </div>
          )}
        </Card>

        {/* Batch Generation Section */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🚀</span>
            <h2 className="text-lg font-semibold text-slate-900">배치 생성</h2>
          </div>

          {generateError && (
            <Alert type="error" title="생성 실패" className="mb-4">
              {generateError}
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Exam Type Select */}
            <Select
              label="시험 유형"
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              options={[
                { value: 'CSAT', label: '수능 (CSAT)' },
                { value: 'TEPS', label: 'TEPS' },
                { value: 'TOEIC', label: 'TOEIC' },
                { value: 'TOEFL', label: 'TOEFL' },
              ]}
              disabled={isGenerating}
            />

            {/* Level Select */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">레벨</label>
              <div className="flex gap-2">
                {['L1', 'L2', 'L3'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    disabled={isGenerating}
                    className={`
                      flex-1 py-2.5 px-3 rounded-lg font-medium text-sm transition-all
                      ${
                        selectedLevel === level
                          ? 'bg-pink-500 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }
                      ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Batch Size */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                배치 사이즈
              </label>
              <input
                type="number"
                value={batchSize}
                onChange={(e) => setBatchSize(Math.min(1100, Math.max(1, parseInt(e.target.value) || 1)))}
                min={1}
                max={1100}
                disabled={isGenerating}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-pink-500 focus:ring-pink-500 focus:outline-none focus:ring-2 focus:ring-opacity-20 disabled:opacity-50"
              />
              <p className="text-xs text-slate-500">최대 1,100</p>
            </div>

            {/* Action Button */}
            <div className="flex items-end">
              {isGenerating ? (
                <Button
                  variant="danger"
                  onClick={stopPolling}
                  className="w-full"
                >
                  중지
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={startBatchGeneration}
                  className="w-full"
                  disabled={!statusData}
                >
                  생성 시작
                </Button>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200">
            <span className="text-sm text-slate-500 mr-2">빠른 설정:</span>
            {[
              { label: 'L1 전체', level: 'L1', size: 1100 },
              { label: 'L2 전체', level: 'L2', size: 1100 },
              { label: 'L3 전체', level: 'L3', size: 1100 },
              { label: '테스트 (10개)', level: 'L3', size: 10 },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  setSelectedLevel(preset.level);
                  setBatchSize(preset.size);
                }}
                disabled={isGenerating}
                className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 transition-colors disabled:opacity-50"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Progress Section */}
        {(isGenerating || currentJob) && (
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">📈</span>
              <h2 className="text-lg font-semibold text-slate-900">진행 상황</h2>
              {currentJob?.status === 'processing' && (
                <Badge color="blue">진행 중</Badge>
              )}
              {currentJob?.status === 'completed' && (
                <Badge color="green">완료</Badge>
              )}
              {currentJob?.status === 'failed' && (
                <Badge color="red">실패</Badge>
              )}
              {currentJob?.status === 'cancelled' && (
                <Badge color="yellow">중지됨</Badge>
              )}
            </div>

            {currentJob ? (
              <div className="space-y-4">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">
                      {currentJob.processedWords.toLocaleString()} / {currentJob.totalWords.toLocaleString()} 단어
                    </span>
                    <span className="font-medium text-pink-600">{progress}%</span>
                  </div>
                  <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Current Word */}
                {currentJob.status === 'processing' && currentJob.currentWord && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
                    <Spinner size="sm" />
                    <div>
                      <p className="font-medium text-blue-900">
                        처리 중: &quot;{currentJob.currentWord}&quot;
                      </p>
                      <p className="text-sm text-blue-700">
                        ({currentJob.processedWords + 1}/{currentJob.totalWords})
                      </p>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-600">
                      {currentJob.successCount}
                    </p>
                    <p className="text-sm text-emerald-700">성공</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {currentJob.errorCount}
                    </p>
                    <p className="text-sm text-red-700">에러</p>
                  </div>
                </div>

                {/* Errors List */}
                {currentJob.errors && currentJob.errors.length > 0 && (
                  <div className="border border-red-200 rounded-lg overflow-hidden">
                    <div className="bg-red-50 px-4 py-2 border-b border-red-200">
                      <span className="font-medium text-red-800">에러 목록</span>
                    </div>
                    <div className="max-h-40 overflow-y-auto divide-y divide-red-100">
                      {currentJob.errors.map((err, idx) => (
                        <div key={idx} className="px-4 py-2 text-sm">
                          <span className="font-medium text-slate-900">{err.word}</span>
                          <span className="text-slate-500 ml-2">- {err.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completion Message */}
                {currentJob.status === 'completed' && (
                  <Alert type="success" title="배치 생성 완료!">
                    {currentJob.successCount}개 단어의 이미지 생성이 완료되었습니다.
                    {currentJob.errorCount > 0 && ` (${currentJob.errorCount}개 실패)`}
                  </Alert>
                )}

                {/* Cancelled Message */}
                {currentJob.status === 'cancelled' && (
                  <Alert type="info" title="배치 생성 중지됨">
                    {currentJob.processedWords}/{currentJob.totalWords}개 처리됨.
                    성공: {currentJob.successCount}개, 실패: {currentJob.errorCount}개
                  </Alert>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Spinner size="md" />
                <p className="mt-2 text-slate-500">작업을 시작하는 중...</p>
              </div>
            )}
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-slate-50 border-slate-300">
          <div className="flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div className="text-sm text-slate-600">
              <p className="font-medium text-slate-900 mb-2">사용 안내</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>배치 생성은 백엔드 서버에서 처리됩니다.</li>
                <li>이미지 생성에는 단어당 약 10-30초가 소요됩니다.</li>
                <li>대량 배치(1000+)는 수 시간이 걸릴 수 있습니다.</li>
                <li>생성 중에도 페이지를 나가도 백그라운드에서 계속 진행됩니다.</li>
                <li>에러가 발생한 단어는 나중에 다시 시도할 수 있습니다.</li>
              </ul>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
