// ============================================
// VocaVision Queue System - Queue Manager Service
// Bull/Redis Queue Management
// ============================================

import Bull, { Queue, Job, JobOptions } from 'bull';
import { EventEmitter } from 'events';
import {
  QueueConfig,
  DEFAULT_QUEUE_CONFIG,
  AnyJobData,
  JobType,
  JobStatus,
  JobProgress,
  JobResult,
  JobInfo,
  JobListQuery,
  JobListResponse,
  QueueStatsData,
  PRIORITY_MAP,
  JOB_TYPE_CONFIGS,
  CreateJobRequest,
} from '../types/queue.types';

// ---------------------------------------------
// Queue Manager Singleton
// ---------------------------------------------

class QueueManagerService extends EventEmitter {
  private static instance: QueueManagerService;
  private queue: Queue<AnyJobData> | null = null;
  private config: QueueConfig;
  private isInitialized = false;

  private constructor() {
    super();
    this.config = DEFAULT_QUEUE_CONFIG;
  }

  public static getInstance(): QueueManagerService {
    if (!QueueManagerService.instance) {
      QueueManagerService.instance = new QueueManagerService();
    }
    return QueueManagerService.instance;
  }

  // ---------------------------------------------
  // Initialization
  // ---------------------------------------------

  public async initialize(config?: Partial<QueueConfig>): Promise<void> {
    if (this.isInitialized) {
      console.log('[QueueManager] Already initialized');
      return;
    }

    this.config = { ...DEFAULT_QUEUE_CONFIG, ...config };

    try {
      this.queue = new Bull<AnyJobData>(this.config.name, {
        redis: this.config.redis,
        defaultJobOptions: this.config.defaultJobOptions,
        limiter: this.config.limiter,
        settings: this.config.settings,
      });

      // Set up event listeners
      this.setupEventListeners();

      // Test connection
      await this.queue.isReady();

      this.isInitialized = true;
      console.log('[QueueManager] Initialized successfully');
      console.log(`[QueueManager] Redis: ${this.config.redis.host}:${this.config.redis.port}`);
    } catch (error) {
      console.error('[QueueManager] Failed to initialize:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.queue) return;

    this.queue.on('error', (error) => {
      console.error('[QueueManager] Queue error:', error);
      this.emit('queue-error', error);
    });

    this.queue.on('waiting', (jobId) => {
      console.log(`[QueueManager] Job ${jobId} is waiting`);
    });

    this.queue.on('active', (job) => {
      console.log(`[QueueManager] Job ${job.id} started processing`);
      this.emit('job-active', this.formatJobInfo(job));
    });

    this.queue.on('completed', (job, result) => {
      console.log(`[QueueManager] Job ${job.id} completed`);
      this.emit('job-completed', { ...this.formatJobInfo(job), result });
    });

    this.queue.on('failed', (job, err) => {
      console.error(`[QueueManager] Job ${job.id} failed:`, err.message);
      this.emit('job-failed', { ...this.formatJobInfo(job), error: err.message });
    });

    this.queue.on('progress', (job, progress) => {
      this.emit('job-progress', { jobId: job.id, progress });
    });

    this.queue.on('stalled', (job) => {
      console.warn(`[QueueManager] Job ${job.id} stalled`);
      this.emit('job-stalled', this.formatJobInfo(job));
    });
  }

  // ---------------------------------------------
  // Job Creation
  // ---------------------------------------------

  public async addJob(request: CreateJobRequest): Promise<Job<AnyJobData>> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    const jobId = this.generateJobId(request.type);
    const typeConfig = JOB_TYPE_CONFIGS[request.type];

    const jobData: AnyJobData = {
      ...request.data,
      jobId,
      type: request.type,
      priority: request.priority || 'normal',
      createdAt: new Date().toISOString(),
    } as AnyJobData;

    const jobOptions: JobOptions = {
      jobId,
      priority: PRIORITY_MAP[request.priority || 'normal'],
      attempts: typeConfig.attempts,
      timeout: typeConfig.timeout,
      delay: request.delay,
      removeOnComplete: this.config.defaultJobOptions.removeOnComplete,
      removeOnFail: this.config.defaultJobOptions.removeOnFail,
    };

    const job = await this.queue.add(request.type, jobData, jobOptions);

    console.log(`[QueueManager] Created job ${jobId} of type ${request.type}`);
    this.emit('job-created', this.formatJobInfo(job));

    return job;
  }

  public async addImageGenerationJob(
    wordIds: string[],
    options: {
      style?: string;
      size?: string;
      regenerate?: boolean;
      priority?: 'low' | 'normal' | 'high' | 'critical';
      createdBy: string;
    }
  ): Promise<Job<AnyJobData>> {
    return this.addJob({
      type: 'image-generation',
      data: {
        wordIds,
        style: options.style,
        size: options.size,
        regenerate: options.regenerate || false,
        totalWords: wordIds.length,
        priority: options.priority || 'normal',
        createdBy: options.createdBy,
      },
      priority: options.priority,
    });
  }

  public async addContentGenerationJob(
    wordIds: string[],
    options: {
      generateMnemonic?: boolean;
      generateExamples?: boolean;
      generateEtymology?: boolean;
      priority?: 'low' | 'normal' | 'high' | 'critical';
      createdBy: string;
    }
  ): Promise<Job<AnyJobData>> {
    return this.addJob({
      type: 'content-generation',
      data: {
        wordIds,
        options: {
          generateMnemonic: options.generateMnemonic ?? true,
          generateExamples: options.generateExamples ?? true,
          generateEtymology: options.generateEtymology ?? false,
        },
        totalWords: wordIds.length,
        priority: options.priority || 'normal',
        createdBy: options.createdBy,
      },
      priority: options.priority,
    });
  }

  // ---------------------------------------------
  // Job Retrieval
  // ---------------------------------------------

  public async getJob(jobId: string): Promise<JobInfo | null> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    const job = await this.queue.getJob(jobId);
    if (!job) return null;

    return this.formatJobInfo(job);
  }

  public async getJobs(query: JobListQuery = {}): Promise<JobListResponse> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    const {
      type,
      status,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Get jobs by status
    let jobs: Job<AnyJobData>[] = [];
    const statuses: JobStatus[] = status
      ? [status]
      : ['waiting', 'active', 'completed', 'failed', 'delayed'];

    for (const s of statuses) {
      const statusJobs = await this.getJobsByStatus(s);
      jobs = jobs.concat(statusJobs);
    }

    // Filter by type
    if (type) {
      jobs = jobs.filter((job) => job.data.type === type);
    }

    // Sort
    jobs.sort((a, b) => {
      if (sortBy === 'createdAt') {
        const aTime = new Date(a.data.createdAt).getTime();
        const bTime = new Date(b.data.createdAt).getTime();
        return sortOrder === 'desc' ? bTime - aTime : aTime - bTime;
      }
      if (sortBy === 'priority') {
        const aPriority = PRIORITY_MAP[a.data.priority];
        const bPriority = PRIORITY_MAP[b.data.priority];
        return sortOrder === 'desc' ? aPriority - bPriority : bPriority - aPriority;
      }
      return 0;
    });

    // Paginate
    const total = jobs.length;
    const start = (page - 1) * limit;
    const paginatedJobs = jobs.slice(start, start + limit);

    return {
      jobs: paginatedJobs.map((job) => this.formatJobInfo(job)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async getJobsByStatus(status: JobStatus): Promise<Job<AnyJobData>[]> {
    if (!this.queue) return [];

    switch (status) {
      case 'waiting':
        return this.queue.getWaiting();
      case 'active':
        return this.queue.getActive();
      case 'completed':
        return this.queue.getCompleted();
      case 'failed':
        return this.queue.getFailed();
      case 'delayed':
        return this.queue.getDelayed();
      default:
        return [];
    }
  }

  // ---------------------------------------------
  // Job Control
  // ---------------------------------------------

  public async retryJob(jobId: string): Promise<Job<AnyJobData>> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    const job = await this.queue.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    await job.retry();
    console.log(`[QueueManager] Retrying job ${jobId}`);

    return job;
  }

  public async removeJob(jobId: string): Promise<void> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    const job = await this.queue.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    await job.remove();
    console.log(`[QueueManager] Removed job ${jobId}`);
  }

  public async cancelJob(jobId: string): Promise<void> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    const job = await this.queue.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    // Move to failed with cancellation reason
    await job.moveToFailed({ message: 'Job cancelled by user' }, true);
    console.log(`[QueueManager] Cancelled job ${jobId}`);
  }

  // ---------------------------------------------
  // Queue Control
  // ---------------------------------------------

  public async pauseQueue(): Promise<void> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    await this.queue.pause();
    console.log('[QueueManager] Queue paused');
  }

  public async resumeQueue(): Promise<void> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    await this.queue.resume();
    console.log('[QueueManager] Queue resumed');
  }

  public async cleanQueue(
    grace: number = 0,
    status: 'completed' | 'failed' | 'delayed' | 'wait' | 'active' = 'completed'
  ): Promise<number[]> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    const cleaned = await this.queue.clean(grace, status);
    console.log(`[QueueManager] Cleaned ${cleaned.length} ${status} jobs`);
    return cleaned;
  }

  public async emptyQueue(): Promise<void> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    await this.queue.empty();
    console.log('[QueueManager] Queue emptied');
  }

  // ---------------------------------------------
  // Statistics
  // ---------------------------------------------

  public async getStats(): Promise<QueueStatsData> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    // Get job counts by type
    const allJobs = await this.getJobs({ limit: 1000 });
    const jobCounts: Record<JobType, number> = {
      'image-generation': 0,
      'content-generation': 0,
      'batch-import': 0,
      'export': 0,
      'cleanup': 0,
    };

    allJobs.jobs.forEach((job) => {
      jobCounts[job.type]++;
    });

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused: 0, // Bull doesn't track paused count directly
      jobCounts,
    };
  }

  public async isQueuePaused(): Promise<boolean> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    return this.queue.isPaused();
  }

  // ---------------------------------------------
  // Processor Registration
  // ---------------------------------------------

  public registerProcessor(
    type: JobType,
    processor: (job: Job<AnyJobData>) => Promise<JobResult>,
    concurrency?: number
  ): void {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    const typeConfig = JOB_TYPE_CONFIGS[type];
    const processorConcurrency = concurrency || typeConfig.concurrency;

    this.queue.process(type, processorConcurrency, processor);
    console.log(`[QueueManager] Registered processor for ${type} (concurrency: ${processorConcurrency})`);
  }

  // ---------------------------------------------
  // Utilities
  // ---------------------------------------------

  private generateJobId(type: JobType): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${type}-${timestamp}-${random}`;
  }

  private formatJobInfo(job: Job<AnyJobData>): JobInfo {
    const state = job.finishedOn
      ? job.failedReason
        ? 'failed'
        : 'completed'
      : job.processedOn
      ? 'active'
      : 'waiting';

    return {
      id: job.id as string,
      type: job.data.type,
      status: state as JobStatus,
      priority: job.data.priority,
      progress: job.progress() as JobProgress | null,
      data: job.data,
      result: job.returnvalue as JobResult | null,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      createdAt: job.data.createdAt,
      processedAt: job.processedOn ? new Date(job.processedOn).toISOString() : undefined,
      finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : undefined,
    };
  }

  public getQueue(): Queue<AnyJobData> | null {
    return this.queue;
  }

  public async shutdown(): Promise<void> {
    if (this.queue) {
      await this.queue.close();
      this.isInitialized = false;
      console.log('[QueueManager] Shut down');
    }
  }
}

// Export singleton instance
export const QueueManager = QueueManagerService.getInstance();
export default QueueManager;
