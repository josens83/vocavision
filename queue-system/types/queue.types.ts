// ============================================
// VocaVision Queue System - Types & Config
// Bull/Redis Job Queue Type Definitions
// ============================================

import { Job } from 'bull';

// ---------------------------------------------
// Job Types
// ---------------------------------------------

export type JobType =
  | 'image-generation'      // AI 이미지 생성
  | 'content-generation'    // Claude 콘텐츠 생성
  | 'batch-import'          // CSV/Excel 대량 임포트
  | 'export'                // 데이터 내보내기
  | 'cleanup';              // 정리 작업

export type JobStatus =
  | 'waiting'
  | 'active'
  | 'completed'
  | 'failed'
  | 'delayed'
  | 'paused';

export type JobPriority = 'low' | 'normal' | 'high' | 'critical';

// ---------------------------------------------
// Job Data Interfaces
// ---------------------------------------------

export interface BaseJobData {
  jobId: string;
  type: JobType;
  priority: JobPriority;
  createdBy: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface ImageGenerationJobData extends BaseJobData {
  type: 'image-generation';
  wordIds: string[];
  style?: string;
  size?: string;
  regenerate?: boolean;
  totalWords: number;
}

export interface ContentGenerationJobData extends BaseJobData {
  type: 'content-generation';
  wordIds: string[];
  options?: {
    generateMnemonic?: boolean;
    generateExamples?: boolean;
    generateEtymology?: boolean;
  };
  totalWords: number;
}

export interface BatchImportJobData extends BaseJobData {
  type: 'batch-import';
  fileUrl: string;
  fileName: string;
  totalRows: number;
  category?: string;
  level?: string;
}

export interface ExportJobData extends BaseJobData {
  type: 'export';
  format: 'csv' | 'json' | 'xlsx';
  filters?: {
    level?: string;
    category?: string;
    hasImage?: boolean;
    hasContent?: boolean;
  };
  includeFields: string[];
}

export interface CleanupJobData extends BaseJobData {
  type: 'cleanup';
  target: 'orphaned-media' | 'old-logs' | 'temp-files';
  olderThan?: string; // ISO date
}

export type AnyJobData =
  | ImageGenerationJobData
  | ContentGenerationJobData
  | BatchImportJobData
  | ExportJobData
  | CleanupJobData;

// ---------------------------------------------
// Job Progress & Result
// ---------------------------------------------

export interface JobProgress {
  completed: number;
  total: number;
  percent: number;
  currentItem?: string;
  stage?: string;
  message?: string;
  errors?: JobError[];
}

export interface JobError {
  itemId?: string;
  itemName?: string;
  code: string;
  message: string;
  timestamp: string;
}

export interface JobResult {
  success: boolean;
  completed: number;
  failed: number;
  total: number;
  results?: Array<{
    id: string;
    success: boolean;
    data?: unknown;
    error?: string;
  }>;
  outputUrl?: string; // For export jobs
  duration: number; // milliseconds
  completedAt: string;
}

// ---------------------------------------------
// Queue Configuration
// ---------------------------------------------

export interface QueueConfig {
  name: string;
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  defaultJobOptions: {
    attempts: number;
    backoff: {
      type: 'exponential' | 'fixed';
      delay: number;
    };
    removeOnComplete: number; // Keep N completed jobs
    removeOnFail: number;     // Keep N failed jobs
    timeout: number;          // Job timeout in ms
  };
  limiter?: {
    max: number;      // Max jobs
    duration: number; // Per duration in ms
  };
  settings?: {
    stalledInterval: number;
    maxStalledCount: number;
  };
}

export const DEFAULT_QUEUE_CONFIG: QueueConfig = {
  name: 'vocavision-jobs',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
    timeout: 300000, // 5 minutes
  },
  limiter: {
    max: 10,
    duration: 10000, // 10 jobs per 10 seconds
  },
  settings: {
    stalledInterval: 30000,
    maxStalledCount: 3,
  },
};

// ---------------------------------------------
// Job Type Specific Configs
// ---------------------------------------------

export const JOB_TYPE_CONFIGS: Record<JobType, {
  timeout: number;
  attempts: number;
  priority: number;
  concurrency: number;
}> = {
  'image-generation': {
    timeout: 600000,  // 10 minutes
    attempts: 3,
    priority: 2,
    concurrency: 3,
  },
  'content-generation': {
    timeout: 300000,  // 5 minutes
    attempts: 3,
    priority: 2,
    concurrency: 5,
  },
  'batch-import': {
    timeout: 1800000, // 30 minutes
    attempts: 2,
    priority: 1,
    concurrency: 1,
  },
  'export': {
    timeout: 600000,  // 10 minutes
    attempts: 2,
    priority: 1,
    concurrency: 2,
  },
  'cleanup': {
    timeout: 300000,  // 5 minutes
    attempts: 1,
    priority: 0,
    concurrency: 1,
  },
};

// ---------------------------------------------
// SSE Event Types
// ---------------------------------------------

export interface SSEEvent {
  type: 'job-created' | 'job-progress' | 'job-completed' | 'job-failed' | 'queue-stats';
  data: JobEventData | QueueStatsData;
  timestamp: string;
}

export interface JobEventData {
  jobId: string;
  type: JobType;
  status: JobStatus;
  progress?: JobProgress;
  result?: JobResult;
  error?: string;
}

export interface QueueStatsData {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
  jobCounts: Record<JobType, number>;
}

// ---------------------------------------------
// API Request/Response Types
// ---------------------------------------------

export interface CreateJobRequest {
  type: JobType;
  data: Omit<AnyJobData, 'jobId' | 'type' | 'createdAt'>;
  priority?: JobPriority;
  delay?: number; // Delay in ms
  scheduledFor?: string; // ISO date for scheduled jobs
}

export interface JobListQuery {
  type?: JobType;
  status?: JobStatus;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export interface JobListResponse {
  jobs: JobInfo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface JobInfo {
  id: string;
  type: JobType;
  status: JobStatus;
  priority: JobPriority;
  progress: JobProgress | null;
  data: AnyJobData;
  result: JobResult | null;
  failedReason?: string;
  attemptsMade: number;
  createdAt: string;
  processedAt?: string;
  finishedAt?: string;
}

export interface QueueActionRequest {
  action: 'pause' | 'resume' | 'clean' | 'obliterate';
  options?: {
    grace?: number;   // For clean: grace period in ms
    force?: boolean;  // For obliterate
    status?: JobStatus[]; // For clean: which statuses to clean
  };
}

// ---------------------------------------------
// Priority Mapping
// ---------------------------------------------

export const PRIORITY_MAP: Record<JobPriority, number> = {
  critical: 1,
  high: 2,
  normal: 3,
  low: 4,
};

export const PRIORITY_LABELS: Record<JobPriority, { en: string; ko: string }> = {
  critical: { en: 'Critical', ko: '긴급' },
  high: { en: 'High', ko: '높음' },
  normal: { en: 'Normal', ko: '보통' },
  low: { en: 'Low', ko: '낮음' },
};

export const JOB_TYPE_LABELS: Record<JobType, { en: string; ko: string }> = {
  'image-generation': { en: 'Image Generation', ko: '이미지 생성' },
  'content-generation': { en: 'Content Generation', ko: '콘텐츠 생성' },
  'batch-import': { en: 'Batch Import', ko: '대량 가져오기' },
  'export': { en: 'Export', ko: '내보내기' },
  'cleanup': { en: 'Cleanup', ko: '정리' },
};

export const STATUS_LABELS: Record<JobStatus, { en: string; ko: string; color: string }> = {
  waiting: { en: 'Waiting', ko: '대기중', color: 'gray' },
  active: { en: 'Active', ko: '진행중', color: 'blue' },
  completed: { en: 'Completed', ko: '완료', color: 'green' },
  failed: { en: 'Failed', ko: '실패', color: 'red' },
  delayed: { en: 'Delayed', ko: '지연', color: 'yellow' },
  paused: { en: 'Paused', ko: '일시정지', color: 'orange' },
};
