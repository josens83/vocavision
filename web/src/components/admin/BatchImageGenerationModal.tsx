/**
 * BatchImageGenerationModal - 배치 이미지 생성 진행 상황 모달
 *
 * 여러 단어의 이미지를 일괄 생성할 때 진행 상황을 표시합니다.
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, Button, Alert, Badge, Spinner } from './ui';

interface BatchJobStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalWords: number;
  processedWords: number;
  currentWord?: string;
  currentType?: string;
  results: Array<{
    wordId: string;
    word: string;
    success: boolean;
    imagesGenerated: number;
    error?: string;
  }>;
  startedAt: string;
  completedAt?: string;
}

interface BatchImageGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  wordIds: string[];
  onComplete?: () => void;
}

export const BatchImageGenerationModal: React.FC<BatchImageGenerationModalProps> = ({
  isOpen,
  onClose,
  wordIds,
  onComplete,
}) => {
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<BatchJobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const isMountedRef = useRef(true);
  const isPollingRef = useRef(false);

  // Start batch generation
  const startBatchGeneration = useCallback(async () => {
    setStarting(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/batch-generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordIds,
          options: {
            skipExisting: true,
            types: ['CONCEPT', 'MNEMONIC', 'RHYME'],
          },
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to start batch generation');
      }

      setJobId(result.data.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start batch generation');
    } finally {
      setStarting(false);
    }
  }, [wordIds]);

  // Poll job status with setTimeout chaining (not setInterval)
  useEffect(() => {
    if (!jobId) return;

    isMountedRef.current = true;
    isPollingRef.current = true;

    const poll = async () => {
      // Stop if unmounted or polling stopped
      if (!isMountedRef.current || !isPollingRef.current) return;

      try {
        const response = await fetch(`/api/admin/batch-generate-images?jobId=${jobId}`);

        // Handle rate limiting
        if (response.status === 429) {
          console.warn('Rate limited, waiting 10 seconds...');
          if (isMountedRef.current && isPollingRef.current) {
            setTimeout(poll, 10000); // Wait 10 seconds on rate limit
          }
          return;
        }

        const result = await response.json();

        if (!isMountedRef.current) return;

        if (result.success) {
          setJobStatus(result.data);

          // Continue polling if not completed
          if (result.data.status !== 'completed' && result.data.status !== 'failed') {
            if (isMountedRef.current && isPollingRef.current) {
              setTimeout(poll, 3000); // Poll every 3 seconds
            }
          } else {
            isPollingRef.current = false;
          }
        } else {
          // Error response - retry after delay
          if (isMountedRef.current && isPollingRef.current) {
            setTimeout(poll, 5000);
          }
        }
      } catch (err) {
        console.error('Failed to poll job status:', err);
        // Retry on error with longer delay
        if (isMountedRef.current && isPollingRef.current) {
          setTimeout(poll, 5000);
        }
      }
    };

    // Start polling after a small delay
    const initialTimeout = setTimeout(poll, 500);

    return () => {
      isMountedRef.current = false;
      isPollingRef.current = false;
      clearTimeout(initialTimeout);
    };
  }, [jobId]); // Only depend on jobId

  // Auto-start when modal opens
  useEffect(() => {
    if (isOpen && wordIds.length > 0 && !jobId && !starting) {
      startBatchGeneration();
    }
  }, [isOpen, wordIds.length, jobId, starting, startBatchGeneration]);

  // Handle close
  const handleClose = () => {
    if (jobStatus?.status === 'completed') {
      onComplete?.();
    }
    setJobId(null);
    setJobStatus(null);
    setError(null);
    onClose();
  };

  // Calculate progress
  const progress = jobStatus
    ? Math.round((jobStatus.processedWords / jobStatus.totalWords) * 100)
    : 0;

  const successCount = jobStatus?.results.filter((r) => r.success).length || 0;
  const failedCount = jobStatus?.results.filter((r) => !r.success).length || 0;
  const totalImages = jobStatus?.results.reduce((sum, r) => sum + r.imagesGenerated, 0) || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="🎨 배치 이미지 생성"
      size="lg"
    >
      <div className="space-y-6">
        {/* Error State */}
        {error && (
          <Alert type="error" title="오류">
            {error}
            <div className="mt-3">
              <Button variant="primary" size="sm" onClick={startBatchGeneration}>
                다시 시도
              </Button>
            </div>
          </Alert>
        )}

        {/* Starting State */}
        {starting && (
          <div className="text-center py-8">
            <Spinner size="lg" />
            <p className="mt-4 text-slate-600">배치 생성을 시작하는 중...</p>
          </div>
        )}

        {/* Progress State */}
        {jobStatus && !error && (
          <>
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  진행률: <strong>{jobStatus.processedWords}</strong> / {jobStatus.totalWords} 단어
                </span>
                <span className="font-medium text-pink-600">{progress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-pink-500 to-purple-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Current Status */}
            {jobStatus.status === 'processing' && jobStatus.currentWord && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Spinner size="sm" />
                  <div>
                    <p className="font-medium text-blue-900">
                      현재: "{jobStatus.currentWord}"
                    </p>
                    <p className="text-sm text-blue-700">
                      {jobStatus.currentType} 이미지 생성 중...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Results List */}
            <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
              <div className="divide-y divide-slate-100">
                {jobStatus.results.map((result, index) => (
                  <div
                    key={result.wordId}
                    className="flex items-center justify-between px-4 py-2 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      {result.success ? (
                        <span className="text-emerald-500">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      ) : (
                        <span className="text-red-500">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      )}
                      <span className="font-medium text-slate-900">{result.word}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <Badge color="green" size="sm">
                          {result.imagesGenerated}/3 이미지
                        </Badge>
                      ) : (
                        <Badge color="red" size="sm">
                          실패
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}

                {/* Pending Words */}
                {jobStatus.status === 'processing' &&
                  Array.from({ length: jobStatus.totalWords - jobStatus.processedWords - 1 }).map((_, i) => (
                    <div
                      key={`pending-${i}`}
                      className="flex items-center gap-3 px-4 py-2 text-slate-400"
                    >
                      <span className="w-5 h-5 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                      <span>대기 중...</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Completion Summary */}
            {jobStatus.status === 'completed' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <h4 className="font-semibold text-emerald-900 mb-2">
                  🎉 배치 생성 완료!
                </h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">{successCount}</p>
                    <p className="text-sm text-emerald-700">성공</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{failedCount}</p>
                    <p className="text-sm text-red-700">실패</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{totalImages}</p>
                    <p className="text-sm text-blue-700">이미지 생성</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          {jobStatus?.status === 'processing' ? (
            <Button variant="ghost" onClick={handleClose}>
              백그라운드에서 계속
            </Button>
          ) : (
            <Button variant="primary" onClick={handleClose}>
              {jobStatus?.status === 'completed' ? '완료' : '닫기'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default BatchImageGenerationModal;
