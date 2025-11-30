'use client';

// ============================================
// VocaVision Queue System - Admin Dashboard
// Real-time job monitoring and management
// ============================================

import React, { useState, useEffect, useCallback, useRef } from 'react';

// ---------------------------------------------
// Types
// ---------------------------------------------

type JobType = 'image-generation' | 'content-generation' | 'batch-import' | 'export' | 'cleanup';
type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused';
type JobPriority = 'low' | 'normal' | 'high' | 'critical';

interface JobProgress {
  completed: number;
  total: number;
  percent: number;
  currentItem?: string;
  stage?: string;
  message?: string;
}

interface JobResult {
  success: boolean;
  completed: number;
  failed: number;
  total: number;
  duration: number;
  completedAt: string;
}

interface JobInfo {
  id: string;
  type: JobType;
  status: JobStatus;
  priority: JobPriority;
  progress: JobProgress | null;
  data: Record<string, unknown>;
  result: JobResult | null;
  failedReason?: string;
  attemptsMade: number;
  createdAt: string;
  processedAt?: string;
  finishedAt?: string;
}

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
  isPaused: boolean;
  jobCounts: Record<JobType, number>;
}

// IMPORTANT: Never use localhost - use empty string as fallback
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

// ---------------------------------------------
// Helper Components
// ---------------------------------------------

const StatusBadge: React.FC<{ status: JobStatus }> = ({ status }) => {
  const colors: Record<JobStatus, string> = {
    waiting: 'bg-gray-100 text-gray-800',
    active: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    delayed: 'bg-yellow-100 text-yellow-800',
    paused: 'bg-orange-100 text-orange-800',
  };

  const labels: Record<JobStatus, string> = {
    waiting: '대기중',
    active: '진행중',
    completed: '완료',
    failed: '실패',
    delayed: '지연',
    paused: '일시정지',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>
      {labels[status]}
    </span>
  );
};

const PriorityBadge: React.FC<{ priority: JobPriority }> = ({ priority }) => {
  const colors: Record<JobPriority, string> = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    normal: 'bg-blue-100 text-blue-800',
    low: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[priority]}`}>
      {priority}
    </span>
  );
};

const TypeLabel: React.FC<{ type: JobType }> = ({ type }) => {
  const labels: Record<JobType, string> = {
    'image-generation': '이미지 생성',
    'content-generation': '콘텐츠 생성',
    'batch-import': '대량 가져오기',
    'export': '내보내기',
    'cleanup': '정리',
  };

  const icons: Record<JobType, string> = {
    'image-generation': '🖼️',
    'content-generation': '📝',
    'batch-import': '📤',
    'export': '📥',
    'cleanup': '🧹',
  };

  return (
    <span className="inline-flex items-center gap-1">
      <span>{icons[type]}</span>
      <span>{labels[type]}</span>
    </span>
  );
};

const ProgressBar: React.FC<{ progress: JobProgress }> = ({ progress }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{progress.message || `${progress.completed}/${progress.total}`}</span>
        <span>{progress.percent}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
    </div>
  );
};

// ---------------------------------------------
// Stats Card Component
// ---------------------------------------------

const StatsCard: React.FC<{
  title: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}> = ({ title, value, color, icon }) => (
  <div className={`bg-white rounded-lg shadow p-4 border-l-4 ${color}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
      <div className="text-3xl opacity-50">{icon}</div>
    </div>
  </div>
);

// ---------------------------------------------
// Job Row Component
// ---------------------------------------------

const JobRow: React.FC<{
  job: JobInfo;
  onRetry: (jobId: string) => void;
  onCancel: (jobId: string) => void;
  onRemove: (jobId: string) => void;
  onViewDetails: (job: JobInfo) => void;
}> = ({ job, onRetry, onCancel, onRemove, onViewDetails }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="text-sm font-mono text-gray-500">{job.id.slice(0, 20)}...</span>
          <TypeLabel type={job.type} />
        </div>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={job.status} />
      </td>
      <td className="px-4 py-3">
        <PriorityBadge priority={job.priority} />
      </td>
      <td className="px-4 py-3 min-w-[200px]">
        {job.progress && job.status === 'active' ? (
          <ProgressBar progress={job.progress} />
        ) : job.result ? (
          <span className="text-sm text-gray-600">
            {job.result.completed}/{job.result.total} 완료
            {job.result.failed > 0 && ` (${job.result.failed} 실패)`}
          </span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {formatDate(job.createdAt)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {job.result?.duration ? formatDuration(job.result.duration) : '-'}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <button
            onClick={() => onViewDetails(job)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            상세
          </button>
          {job.status === 'failed' && (
            <button
              onClick={() => onRetry(job.id)}
              className="text-green-600 hover:text-green-800 text-sm"
            >
              재시도
            </button>
          )}
          {(job.status === 'waiting' || job.status === 'active') && (
            <button
              onClick={() => onCancel(job.id)}
              className="text-orange-600 hover:text-orange-800 text-sm"
            >
              취소
            </button>
          )}
          {(job.status === 'completed' || job.status === 'failed') && (
            <button
              onClick={() => onRemove(job.id)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              삭제
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

// ---------------------------------------------
// Job Details Modal
// ---------------------------------------------

const JobDetailsModal: React.FC<{
  job: JobInfo | null;
  onClose: () => void;
}> = ({ job, onClose }) => {
  if (!job) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">작업 상세 정보</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">작업 ID</label>
              <p className="font-mono text-sm">{job.id}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">유형</label>
              <p><TypeLabel type={job.type} /></p>
            </div>
            <div>
              <label className="text-sm text-gray-500">상태</label>
              <p><StatusBadge status={job.status} /></p>
            </div>
            <div>
              <label className="text-sm text-gray-500">우선순위</label>
              <p><PriorityBadge priority={job.priority} /></p>
            </div>
            <div>
              <label className="text-sm text-gray-500">시도 횟수</label>
              <p>{job.attemptsMade}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">생성일시</label>
              <p>{new Date(job.createdAt).toLocaleString('ko-KR')}</p>
            </div>
          </div>

          {job.progress && (
            <div>
              <label className="text-sm text-gray-500">진행률</label>
              <ProgressBar progress={job.progress} />
            </div>
          )}

          {job.result && (
            <div>
              <label className="text-sm text-gray-500">결과</label>
              <div className="bg-gray-50 p-3 rounded mt-1">
                <p>완료: {job.result.completed} / {job.result.total}</p>
                <p>실패: {job.result.failed}</p>
                <p>소요시간: {(job.result.duration / 1000).toFixed(1)}초</p>
              </div>
            </div>
          )}

          {job.failedReason && (
            <div>
              <label className="text-sm text-gray-500">실패 사유</label>
              <p className="text-red-600 bg-red-50 p-3 rounded mt-1">
                {job.failedReason}
              </p>
            </div>
          )}

          <div>
            <label className="text-sm text-gray-500">작업 데이터</label>
            <pre className="bg-gray-50 p-3 rounded mt-1 text-xs overflow-auto max-h-40">
              {JSON.stringify(job.data, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------
// Create Job Modal
// ---------------------------------------------

const CreateJobModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (type: JobType, data: Record<string, unknown>) => Promise<void>;
}> = ({ isOpen, onClose, onSubmit }) => {
  const [jobType, setJobType] = useState<JobType>('image-generation');
  const [wordIds, setWordIds] = useState('');
  const [style, setStyle] = useState('cartoon');
  const [priority, setPriority] = useState<JobPriority>('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const ids = wordIds.split(/[\n,]/).map((id) => id.trim()).filter(Boolean);
      await onSubmit(jobType, {
        wordIds: ids,
        style,
        priority,
      });
      onClose();
      setWordIds('');
    } catch (error) {
      console.error('Failed to create job:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">새 작업 생성</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              작업 유형
            </label>
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value as JobType)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="image-generation">이미지 생성</option>
              <option value="content-generation">콘텐츠 생성</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              단어 ID 목록 (줄바꿈 또는 쉼표로 구분)
            </label>
            <textarea
              value={wordIds}
              onChange={(e) => setWordIds(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="uuid-1&#10;uuid-2&#10;uuid-3"
            />
          </div>

          {jobType === 'image-generation' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                스타일
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="cartoon">카툰</option>
                <option value="anime">애니메이션</option>
                <option value="watercolor">수채화</option>
                <option value="pixel">픽셀아트</option>
                <option value="sketch">스케치</option>
                <option value="3d-render">3D 렌더링</option>
                <option value="comic">만화</option>
                <option value="minimalist">미니멀</option>
                <option value="vintage">빈티지</option>
                <option value="pop-art">팝아트</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              우선순위
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as JobPriority)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">낮음</option>
              <option value="normal">보통</option>
              <option value="high">높음</option>
              <option value="critical">긴급</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !wordIds.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? '생성 중...' : '작업 생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ---------------------------------------------
// Main Dashboard Component
// ---------------------------------------------

export const QueueDashboard: React.FC = () => {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [jobs, setJobs] = useState<JobInfo[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobInfo | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<JobType | 'all'>('all');

  const eventSourceRef = useRef<EventSource | null>(null);

  // Get auth token from sessionStorage
  const getToken = () => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('token');
  };

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      const token = getToken();
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const [statsRes, jobsRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/queue/stats`, { headers }),
        fetch(`${API_BASE}/api/admin/queue/jobs?limit=50`, { headers }),
      ]);

      if (!statsRes.ok || !jobsRes.ok) {
        throw new Error('Failed to fetch queue data');
      }

      const statsData = await statsRes.json();
      const jobsData = await jobsRes.json();

      setStats(statsData.data);
      setJobs(jobsData.data.jobs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set up SSE connection
  useEffect(() => {
    fetchData();

    // Connect to SSE for real-time updates
    const token = getToken();
    const sseUrl = `${API_BASE}/api/admin/queue/events${token ? `?token=${token}` : ''}`;

    eventSourceRef.current = new EventSource(sseUrl);

    eventSourceRef.current.addEventListener('queue-stats', (event) => {
      const data = JSON.parse(event.data);
      setStats((prev) => ({ ...prev, ...data }));
    });

    eventSourceRef.current.addEventListener('job-created', (event) => {
      const data = JSON.parse(event.data);
      setJobs((prev) => [{ ...data, status: 'waiting' } as JobInfo, ...prev]);
    });

    eventSourceRef.current.addEventListener('job-progress', (event) => {
      const data = JSON.parse(event.data);
      setJobs((prev) =>
        prev.map((job) =>
          job.id === data.jobId
            ? { ...job, status: data.status, progress: data.progress }
            : job
        )
      );
    });

    eventSourceRef.current.addEventListener('job-completed', (event) => {
      const data = JSON.parse(event.data);
      setJobs((prev) =>
        prev.map((job) =>
          job.id === data.jobId
            ? { ...job, status: 'completed', result: data.result }
            : job
        )
      );
    });

    eventSourceRef.current.addEventListener('job-failed', (event) => {
      const data = JSON.parse(event.data);
      setJobs((prev) =>
        prev.map((job) =>
          job.id === data.jobId
            ? { ...job, status: 'failed', failedReason: data.error }
            : job
        )
      );
    });

    eventSourceRef.current.onerror = () => {
      console.error('SSE connection error');
      eventSourceRef.current?.close();
    };

    return () => {
      eventSourceRef.current?.close();
    };
  }, [fetchData]);

  // API Actions
  const retryJob = async (jobId: string) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/admin/queue/jobs/${jobId}/retry`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to retry job');
      fetchData();
    } catch (err) {
      console.error('Retry error:', err);
    }
  };

  const cancelJob = async (jobId: string) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/admin/queue/jobs/${jobId}/cancel`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to cancel job');
      fetchData();
    } catch (err) {
      console.error('Cancel error:', err);
    }
  };

  const removeJob = async (jobId: string) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/admin/queue/jobs/${jobId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to remove job');
      setJobs((prev) => prev.filter((job) => job.id !== jobId));
    } catch (err) {
      console.error('Remove error:', err);
    }
  };

  const toggleQueuePause = async () => {
    try {
      const token = getToken();
      const action = stats?.isPaused ? 'resume' : 'pause';
      const res = await fetch(`${API_BASE}/api/admin/queue/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error(`Failed to ${action} queue`);
      fetchData();
    } catch (err) {
      console.error('Queue action error:', err);
    }
  };

  const cleanQueue = async (status: 'completed' | 'failed') => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/admin/queue/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'clean', options: { status } }),
      });
      if (!res.ok) throw new Error('Failed to clean queue');
      fetchData();
    } catch (err) {
      console.error('Clean error:', err);
    }
  };

  const createJob = async (type: JobType, data: Record<string, unknown>) => {
    const token = getToken();
    const endpoint = type === 'image-generation'
      ? `${API_BASE}/api/admin/queue/jobs/image-generation`
      : `${API_BASE}/api/admin/queue/jobs/content-generation`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error?.message || 'Failed to create job');
    }

    fetchData();
  };

  // Filter jobs
  const filteredJobs = jobs.filter((job) => {
    if (statusFilter !== 'all' && job.status !== statusFilter) return false;
    if (typeFilter !== 'all' && job.type !== typeFilter) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        <p className="font-medium">오류가 발생했습니다</p>
        <p className="text-sm">{error}</p>
        <button
          onClick={fetchData}
          className="mt-2 text-sm underline hover:no-underline"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">작업 큐 관리</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + 새 작업
          </button>
          <button
            onClick={toggleQueuePause}
            className={`px-4 py-2 rounded-lg ${
              stats?.isPaused
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            {stats?.isPaused ? '▶ 재개' : '⏸ 일시정지'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatsCard title="대기중" value={stats?.waiting || 0} color="border-gray-500" icon="⏳" />
        <StatsCard title="진행중" value={stats?.active || 0} color="border-blue-500" icon="🔄" />
        <StatsCard title="완료" value={stats?.completed || 0} color="border-green-500" icon="✅" />
        <StatsCard title="실패" value={stats?.failed || 0} color="border-red-500" icon="❌" />
        <StatsCard title="지연" value={stats?.delayed || 0} color="border-yellow-500" icon="⏰" />
        <StatsCard title="일시정지" value={stats?.paused || 0} color="border-orange-500" icon="⏸" />
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">상태:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as JobStatus | 'all')}
            className="px-3 py-1.5 border rounded-lg text-sm"
          >
            <option value="all">전체</option>
            <option value="waiting">대기중</option>
            <option value="active">진행중</option>
            <option value="completed">완료</option>
            <option value="failed">실패</option>
            <option value="delayed">지연</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">유형:</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as JobType | 'all')}
            className="px-3 py-1.5 border rounded-lg text-sm"
          >
            <option value="all">전체</option>
            <option value="image-generation">이미지 생성</option>
            <option value="content-generation">콘텐츠 생성</option>
            <option value="batch-import">대량 가져오기</option>
            <option value="export">내보내기</option>
            <option value="cleanup">정리</option>
          </select>
        </div>

        <div className="flex-grow" />

        <div className="flex gap-2">
          <button
            onClick={() => cleanQueue('completed')}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
          >
            완료 작업 정리
          </button>
          <button
            onClick={() => cleanQueue('failed')}
            className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
          >
            실패 작업 정리
          </button>
          <button
            onClick={fetchData}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
          >
            🔄 새로고침
          </button>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                우선순위
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                진행률
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                생성일시
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                소요시간
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                액션
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredJobs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  작업이 없습니다
                </td>
              </tr>
            ) : (
              filteredJobs.map((job) => (
                <JobRow
                  key={job.id}
                  job={job}
                  onRetry={retryJob}
                  onCancel={cancelJob}
                  onRemove={removeJob}
                  onViewDetails={setSelectedJob}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <JobDetailsModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
      />

      <CreateJobModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={createJob}
      />
    </div>
  );
};

export default QueueDashboard;
