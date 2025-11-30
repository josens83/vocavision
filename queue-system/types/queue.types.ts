// ============================================
// VocaVision Queue System - Types & Configuration
// Bull/Redis 기반 작업 큐 시스템
// ============================================

// ---------------------------------------------
// Job Types
// ---------------------------------------------

export type JobType =
  | 'content-generation'      // AI 콘텐츠 생성
  | 'image-generation'        // 이미지 생성
  | 'batch-content'           // 배치 콘텐츠 생성
  | 'batch-image'             // 배치 이미지 생성
  | 'content-review'          // 콘텐츠 검토 알림
  | 'export'                  // 데이터 내보내기
  | 'import';                 // 데이터 가져오기

export type JobStatus =
  | 'waiting'
  | 'active'
  | 'completed'
  | 'failed'
  | 'delayed'
  | 'paused';

export type JobPriority = 1 | 2 | 3 | 4 | 5; // 1 = highest

// ---------------------------------------------
// Queue Configuration
// ---------------------------------------------

export interface QueueConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
    maxRetriesPerRequest?: number;
  };
  defaultJobOptions: {
    attempts: number;
    backoff: {
      type: 'exponential' | 'fixed';
      delay: number;
    };
    removeOnComplete: boolean | number;
    removeOnFail: boolean | number;
  };
  limiter?: {
    max: number;
    duration: number;
  };
}

export const DEFAULT_QUEUE_CONFIG: QueueConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    maxRetriesPerRequest: 3,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // 2s -> 4s -> 8s
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50,      // Keep last 50 failed jobs
  },
  limiter: {
    max: 10,        // 10 jobs
    duration: 1000, // per second
  },
};

// ---------------------------------------------
// Job Data Types
// ---------------------------------------------

// Content Generation Job
export interface ContentGenerationJobData {
  wordId: string;
  word: string;
  examCategory: string;
  level: string;
  regenerate?: boolean;
  priority?: JobPriority;
  requestedBy?: string;
}

// Batch Content Generation Job
export interface BatchContentJobData {
  batchId: string;
  words: Array<{
    id: string;
    word: string;
  }>;
  examCategory: string;
  level: string;
  regenerate?: boolean;
  requestedBy?: string;
}

// Image Generation Job
export interface ImageGenerationJobData {
  wordId: string;
  word: string;
  mnemonic: string;
  mnemonicKorean?: string;
  style?: string;
  size?: string;
  regenerate?: boolean;
  priority?: JobPriority;
  requestedBy?: string;
}

// Batch Image Generation Job
export interface BatchImageJobData {
  batchId: string;
  words: Array<{
    id: string;
    word: string;
    mnemonic: string;
    mnemonicKorean?: string;
  }>;
  style?: string;
  size?: string;
  regenerate?: boolean;
  requestedBy?: string;
}

// Export Job
export interface ExportJobData {
  exportId: string;
  format: 'json' | 'csv' | 'xlsx';
  filters?: {
    examCategories?: string[];
    levels?: string[];
    status?: string[];
  };
  requestedBy?: string;
}

// Union type for all job data
export type JobData =
  | ContentGenerationJobData
  | BatchContentJobData
  | ImageGenerationJobData
  | BatchImageJobData
  | ExportJobData;

// ---------------------------------------------
// Job Result Types
// ---------------------------------------------

export interface ContentGenerationResult {
  success: boolean;
  wordId: string;
  contentId?: string;
  error?: string;
  duration?: number;
}

export interface ImageGenerationResult {
  success: boolean;
  wordId: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  duration?: number;
}

export interface BatchJobResult {
  batchId: string;
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    wordId: string;
    success: boolean;
    error?: string;
  }>;
  duration: number;
}

// ---------------------------------------------
// Progress Types
// ---------------------------------------------

export interface JobProgress {
  jobId: string;
  type: JobType;
  status: JobStatus;
  progress: number; // 0-100
  current?: number;
  total?: number;
  message?: string;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface BatchProgress {
  batchId: string;
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  progress: number; // 0-100
  estimatedTimeRemaining?: number; // seconds
  jobs: JobProgress[];
}

// ---------------------------------------------
// Event Types
// ---------------------------------------------

export type QueueEventType =
  | 'job:added'
  | 'job:started'
  | 'job:progress'
  | 'job:completed'
  | 'job:failed'
  | 'job:retrying'
  | 'batch:started'
  | 'batch:progress'
  | 'batch:completed'
  | 'queue:paused'
  | 'queue:resumed'
  | 'queue:error';

export interface QueueEvent {
  type: QueueEventType;
  timestamp: Date;
  data: {
    jobId?: string;
    batchId?: string;
    progress?: number;
    result?: any;
    error?: string;
  };
}

// ---------------------------------------------
// Dashboard Stats Types
// ---------------------------------------------

export interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

export interface QueueDashboardStats {
  queues: QueueStats[];
  totalJobs: number;
  activeJobs: number;
  completedToday: number;
  failedToday: number;
  averageProcessingTime: number; // ms
  throughput: number; // jobs per minute
}

// ---------------------------------------------
// Queue Names
// ---------------------------------------------

export const QUEUE_NAMES = {
  CONTENT: 'vocavision:content',
  IMAGE: 'vocavision:image',
  EXPORT: 'vocavision:export',
  NOTIFICATION: 'vocavision:notification',
} as const;

// ---------------------------------------------
// Rate Limits by Job Type
// ---------------------------------------------

export const JOB_RATE_LIMITS: Record<JobType, { max: number; duration: number }> = {
  'content-generation': { max: 5, duration: 10000 },    // 5 per 10s (Claude API)
  'image-generation': { max: 10, duration: 10000 },     // 10 per 10s (Stability AI)
  'batch-content': { max: 2, duration: 60000 },         // 2 per minute
  'batch-image': { max: 2, duration: 60000 },           // 2 per minute
  'content-review': { max: 100, duration: 60000 },      // 100 per minute
  'export': { max: 5, duration: 60000 },                // 5 per minute
  'import': { max: 2, duration: 60000 },                // 2 per minute
};

// ---------------------------------------------
// Retry Configuration
// ---------------------------------------------

export const RETRY_CONFIG: Record<JobType, { attempts: number; backoff: number }> = {
  'content-generation': { attempts: 3, backoff: 5000 },
  'image-generation': { attempts: 3, backoff: 3000 },
  'batch-content': { attempts: 2, backoff: 10000 },
  'batch-image': { attempts: 2, backoff: 10000 },
  'content-review': { attempts: 5, backoff: 1000 },
  'export': { attempts: 2, backoff: 5000 },
  'import': { attempts: 2, backoff: 5000 },
};
