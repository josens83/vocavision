// ============================================
// VocaVision Queue System - Queue Manager
// Bull/Redis 기반 작업 큐 관리자
// ============================================

import Bull, { Queue, Job, JobOptions } from 'bull';
import { EventEmitter } from 'events';
import {
  QueueConfig,
  DEFAULT_QUEUE_CONFIG,
  QUEUE_NAMES,
  JobType,
  JobStatus,
  JobPriority,
  JobData,
  JobProgress,
  QueueStats,
  QueueDashboardStats,
  QueueEvent,
  QueueEventType,
  JOB_RATE_LIMITS,
  RETRY_CONFIG,
} from '../types/queue.types';

// ---------------------------------------------
// Queue Manager Class
// ---------------------------------------------

export class QueueManager extends EventEmitter {
  private queues: Map<string, Queue> = new Map();
  private config: QueueConfig;
  private isInitialized = false;

  constructor(config: Partial<QueueConfig> = {}) {
    super();
    this.config = { ...DEFAULT_QUEUE_CONFIG, ...config };
  }

  // ---------------------------------------------
  // Initialization
  // ---------------------------------------------

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[QueueManager] Already initialized');
      return;
    }

    console.log('[QueueManager] Initializing queues...');

    // Create queues
    for (const [name, queueName] of Object.entries(QUEUE_NAMES)) {
      const queue = new Bull(queueName, {
        redis: this.config.redis,
        defaultJobOptions: this.config.defaultJobOptions,
        limiter: this.config.limiter,
      });

      // Set up event handlers
      this.setupQueueEvents(queue, queueName);

      this.queues.set(queueName, queue);
      console.log(`[QueueManager] Created queue: ${queueName}`);
    }

    this.isInitialized = true;
    console.log('[QueueManager] All queues initialized');
  }

  private setupQueueEvents(queue: Queue, queueName: string): void {
    queue.on('error', (error) => {
      console.error(`[Queue:${queueName}] Error:`, error);
      this.emitEvent('queue:error', { error: error.message });
    });

    queue.on('waiting', (jobId) => {
      console.log(`[Queue:${queueName}] Job ${jobId} waiting`);
    });

    queue.on('active', (job) => {
      console.log(`[Queue:${queueName}] Job ${job.id} started`);
      this.emitEvent('job:started', { jobId: String(job.id) });
    });

    queue.on('completed', (job, result) => {
      console.log(`[Queue:${queueName}] Job ${job.id} completed`);
      this.emitEvent('job:completed', { jobId: String(job.id), result });
    });

    queue.on('failed', (job, error) => {
      console.error(`[Queue:${queueName}] Job ${job.id} failed:`, error.message);
      this.emitEvent('job:failed', { jobId: String(job.id), error: error.message });
    });

    queue.on('progress', (job, progress) => {
      this.emitEvent('job:progress', { jobId: String(job.id), progress });
    });

    queue.on('stalled', (job) => {
      console.warn(`[Queue:${queueName}] Job ${job.id} stalled`);
    });
  }

  private emitEvent(type: QueueEventType, data: QueueEvent['data']): void {
    const event: QueueEvent = {
      type,
      timestamp: new Date(),
      data,
    };
    this.emit(type, event);
    this.emit('event', event);
  }

  // ---------------------------------------------
  // Queue Access
  // ---------------------------------------------

  getQueue(name: string): Queue | undefined {
    return this.queues.get(name);
  }

  getContentQueue(): Queue {
    const queue = this.queues.get(QUEUE_NAMES.CONTENT);
    if (!queue) throw new Error('Content queue not initialized');
    return queue;
  }

  getImageQueue(): Queue {
    const queue = this.queues.get(QUEUE_NAMES.IMAGE);
    if (!queue) throw new Error('Image queue not initialized');
    return queue;
  }

  getExportQueue(): Queue {
    const queue = this.queues.get(QUEUE_NAMES.EXPORT);
    if (!queue) throw new Error('Export queue not initialized');
    return queue;
  }

  // ---------------------------------------------
  // Job Management
  // ---------------------------------------------

  async addJob<T extends JobData>(
    queueName: string,
    jobType: JobType,
    data: T,
    options: Partial<JobOptions> = {}
  ): Promise<Job<T>> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const retryConfig = RETRY_CONFIG[jobType];
    const rateLimit = JOB_RATE_LIMITS[jobType];

    const jobOptions: JobOptions = {
      attempts: retryConfig.attempts,
      backoff: {
        type: 'exponential',
        delay: retryConfig.backoff,
      },
      ...options,
    };

    const job = await queue.add(jobType, data, jobOptions);

    console.log(`[QueueManager] Added job ${job.id} to ${queueName} (type: ${jobType})`);
    this.emitEvent('job:added', { jobId: String(job.id) });

    return job;
  }

  async getJob(queueName: string, jobId: string): Promise<Job | null> {
    const queue = this.queues.get(queueName);
    if (!queue) return null;
    return queue.getJob(jobId);
  }

  async getJobStatus(queueName: string, jobId: string): Promise<JobProgress | null> {
    const job = await this.getJob(queueName, jobId);
    if (!job) return null;

    const state = await job.getState();
    const progress = job.progress();

    return {
      jobId: String(job.id),
      type: job.name as JobType,
      status: state as JobStatus,
      progress: typeof progress === 'number' ? progress : 0,
      startedAt: job.processedOn ? new Date(job.processedOn) : undefined,
      completedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
      error: job.failedReason,
    };
  }

  async retryJob(queueName: string, jobId: string): Promise<void> {
    const job = await this.getJob(queueName, jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    await job.retry();
    console.log(`[QueueManager] Retrying job ${jobId}`);
    this.emitEvent('job:retrying', { jobId });
  }

  async removeJob(queueName: string, jobId: string): Promise<void> {
    const job = await this.getJob(queueName, jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    await job.remove();
    console.log(`[QueueManager] Removed job ${jobId}`);
  }

  // ---------------------------------------------
  // Batch Job Management
  // ---------------------------------------------

  async addBatchJob<T extends JobData>(
    queueName: string,
    jobType: JobType,
    items: T[],
    batchId: string,
    options: Partial<JobOptions> = {}
  ): Promise<Job<T>[]> {
    const jobs: Job<T>[] = [];

    for (let i = 0; i < items.length; i++) {
      const job = await this.addJob(queueName, jobType, items[i], {
        ...options,
        jobId: `${batchId}-${i}`,
      });
      jobs.push(job);
    }

    console.log(`[QueueManager] Added batch ${batchId} with ${items.length} jobs`);
    this.emitEvent('batch:started', { batchId });

    return jobs;
  }

  async getBatchProgress(queueName: string, batchId: string): Promise<{
    total: number;
    completed: number;
    failed: number;
    inProgress: number;
    progress: number;
  }> {
    const queue = this.queues.get(queueName);
    if (!queue) throw new Error(`Queue ${queueName} not found`);

    // Get all jobs with batch prefix
    const allJobs = await queue.getJobs(['waiting', 'active', 'completed', 'failed']);
    const batchJobs = allJobs.filter(job => String(job.id).startsWith(batchId));

    let completed = 0;
    let failed = 0;
    let inProgress = 0;

    for (const job of batchJobs) {
      const state = await job.getState();
      if (state === 'completed') completed++;
      else if (state === 'failed') failed++;
      else if (state === 'active') inProgress++;
    }

    const total = batchJobs.length;
    const progress = total > 0 ? Math.round(((completed + failed) / total) * 100) : 0;

    return { total, completed, failed, inProgress, progress };
  }

  // ---------------------------------------------
  // Queue Statistics
  // ---------------------------------------------

  async getQueueStats(queueName: string): Promise<QueueStats> {
    const queue = this.queues.get(queueName);
    if (!queue) throw new Error(`Queue ${queueName} not found`);

    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.isPaused(),
    ]);

    return {
      name: queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
    };
  }

  async getDashboardStats(): Promise<QueueDashboardStats> {
    const queueStats: QueueStats[] = [];
    let totalJobs = 0;
    let activeJobs = 0;

    for (const [name, queue] of this.queues) {
      const stats = await this.getQueueStats(name);
      queueStats.push(stats);
      totalJobs += stats.waiting + stats.active + stats.completed + stats.failed;
      activeJobs += stats.active;
    }

    // Calculate today's stats (simplified - would need Redis sorted sets for accurate counts)
    const completedToday = queueStats.reduce((sum, s) => sum + s.completed, 0);
    const failedToday = queueStats.reduce((sum, s) => sum + s.failed, 0);

    return {
      queues: queueStats,
      totalJobs,
      activeJobs,
      completedToday,
      failedToday,
      averageProcessingTime: 0, // Would need to track this separately
      throughput: 0, // Would need to calculate from completed jobs over time
    };
  }

  // ---------------------------------------------
  // Queue Control
  // ---------------------------------------------

  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) throw new Error(`Queue ${queueName} not found`);

    await queue.pause();
    console.log(`[QueueManager] Paused queue ${queueName}`);
    this.emitEvent('queue:paused', {});
  }

  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) throw new Error(`Queue ${queueName} not found`);

    await queue.resume();
    console.log(`[QueueManager] Resumed queue ${queueName}`);
    this.emitEvent('queue:resumed', {});
  }

  async pauseAllQueues(): Promise<void> {
    for (const [name] of this.queues) {
      await this.pauseQueue(name);
    }
  }

  async resumeAllQueues(): Promise<void> {
    for (const [name] of this.queues) {
      await this.resumeQueue(name);
    }
  }

  async cleanQueue(queueName: string, gracePeriod: number = 1000): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) throw new Error(`Queue ${queueName} not found`);

    await queue.clean(gracePeriod, 'completed');
    await queue.clean(gracePeriod, 'failed');
    console.log(`[QueueManager] Cleaned queue ${queueName}`);
  }

  async cleanAllQueues(gracePeriod: number = 1000): Promise<void> {
    for (const [name] of this.queues) {
      await this.cleanQueue(name, gracePeriod);
    }
  }

  // ---------------------------------------------
  // Shutdown
  // ---------------------------------------------

  async shutdown(): Promise<void> {
    console.log('[QueueManager] Shutting down...');

    for (const [name, queue] of this.queues) {
      await queue.close();
      console.log(`[QueueManager] Closed queue ${name}`);
    }

    this.queues.clear();
    this.isInitialized = false;
    console.log('[QueueManager] Shutdown complete');
  }
}

// ---------------------------------------------
// Singleton Instance
// ---------------------------------------------

let queueManagerInstance: QueueManager | null = null;

export function getQueueManager(config?: Partial<QueueConfig>): QueueManager {
  if (!queueManagerInstance) {
    queueManagerInstance = new QueueManager(config);
  }
  return queueManagerInstance;
}

export async function initializeQueues(config?: Partial<QueueConfig>): Promise<QueueManager> {
  const manager = getQueueManager(config);
  await manager.initialize();
  return manager;
}

export default QueueManager;
