/**
 * Background Job Queue System
 *
 * Provides a simple job queue for background processing:
 * - Email sending
 * - Data processing
 * - Scheduled tasks
 * - Analytics aggregation
 *
 * In production, replace with Bull/BullMQ or similar Redis-based queue
 *
 * @module lib/jobs/jobQueue
 */

/**
 * Job status
 */
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';

/**
 * Job priority
 */
export type JobPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Job definition
 */
export interface Job<T = unknown> {
  id: string;
  type: string;
  data: T;
  priority: JobPriority;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
  result?: unknown;
}

/**
 * Job handler function
 */
export type JobHandler<T = unknown> = (data: T) => Promise<unknown>;

/**
 * Job queue configuration
 */
export interface QueueConfig {
  concurrency?: number; // Number of concurrent jobs
  maxAttempts?: number; // Maximum retry attempts
  retryDelay?: number; // Delay between retries (ms)
  timeout?: number; // Job timeout (ms)
}

/**
 * Default queue configuration
 */
const DEFAULT_QUEUE_CONFIG: Required<QueueConfig> = {
  concurrency: 5,
  maxAttempts: 3,
  retryDelay: 5000, // 5 seconds
  timeout: 60000, // 60 seconds
};

/**
 * Job Queue
 */
export class JobQueue {
  private jobs: Map<string, Job> = new Map();
  private handlers: Map<string, JobHandler> = new Map();
  private processing: Set<string> = new Set();
  private config: Required<QueueConfig>;
  private isRunning = false;

  constructor(config: QueueConfig = {}) {
    this.config = { ...DEFAULT_QUEUE_CONFIG, ...config };
  }

  /**
   * Register job handler
   */
  registerHandler<T = unknown>(type: string, handler: JobHandler<T>): void {
    this.handlers.set(type, handler as JobHandler);
  }

  /**
   * Add job to queue
   */
  async add<T = unknown>(
    type: string,
    data: T,
    options: {
      priority?: JobPriority;
      maxAttempts?: number;
    } = {}
  ): Promise<string> {
    const jobId = this.generateJobId();

    const job: Job<T> = {
      id: jobId,
      type,
      data,
      priority: options.priority || 'normal',
      status: 'pending',
      attempts: 0,
      maxAttempts: options.maxAttempts || this.config.maxAttempts,
      createdAt: new Date(),
    };

    this.jobs.set(jobId, job);

    // Start processing if not already running
    if (!this.isRunning) {
      this.start();
    }

    return jobId;
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start queue processing
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.processJobs();
  }

  /**
   * Stop queue processing
   */
  stop(): void {
    this.isRunning = false;
  }

  /**
   * Process jobs from queue
   */
  private async processJobs(): Promise<void> {
    while (this.isRunning) {
      // Check if we can process more jobs
      if (this.processing.size >= this.config.concurrency) {
        await this.sleep(100);
        continue;
      }

      // Get next pending job
      const job = this.getNextJob();

      if (!job) {
        // No pending jobs, wait a bit
        await this.sleep(1000);
        continue;
      }

      // Process job
      this.processJob(job);
    }
  }

  /**
   * Get next job to process (sorted by priority)
   */
  private getNextJob(): Job | null {
    const priorityOrder: JobPriority[] = ['critical', 'high', 'normal', 'low'];

    for (const priority of priorityOrder) {
      const job = Array.from(this.jobs.values()).find(
        (j) => j.status === 'pending' && j.priority === priority
      );

      if (job) return job;
    }

    return null;
  }

  /**
   * Process a single job
   */
  private async processJob(job: Job): Promise<void> {
    this.processing.add(job.id);
    job.status = 'processing';
    job.startedAt = new Date();
    job.attempts++;

    try {
      const handler = this.handlers.get(job.type);

      if (!handler) {
        throw new Error(`No handler registered for job type: ${job.type}`);
      }

      // Execute job with timeout
      const result = await Promise.race([
        handler(job.data),
        this.timeout(this.config.timeout),
      ]);

      // Job completed successfully
      job.status = 'completed';
      job.completedAt = new Date();
      job.result = result;

      console.log(`Job ${job.id} (${job.type}) completed successfully`);
    } catch (error) {
      // Job failed
      job.error = (error as Error).message;

      // Retry if attempts remaining
      if (job.attempts < job.maxAttempts) {
        job.status = 'retrying';

        console.warn(
          `Job ${job.id} (${job.type}) failed (attempt ${job.attempts}/${job.maxAttempts}): ${job.error}`
        );

        // Schedule retry
        setTimeout(() => {
          if (this.jobs.has(job.id)) {
            job.status = 'pending';
          }
        }, this.config.retryDelay * job.attempts); // Exponential backoff
      } else {
        job.status = 'failed';
        job.failedAt = new Date();

        console.error(
          `Job ${job.id} (${job.type}) failed permanently after ${job.attempts} attempts: ${job.error}`
        );
      }
    } finally {
      this.processing.delete(job.id);
    }
  }

  /**
   * Create timeout promise
   */
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Job timeout')), ms);
    });
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get job status
   */
  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs
   */
  getAllJobs(): Job[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get jobs by status
   */
  getJobsByStatus(status: JobStatus): Job[] {
    return Array.from(this.jobs.values()).filter((j) => j.status === status);
  }

  /**
   * Clear completed jobs
   */
  clearCompleted(): number {
    const completedJobs = this.getJobsByStatus('completed');
    completedJobs.forEach((job) => this.jobs.delete(job.id));
    return completedJobs.length;
  }

  /**
   * Get queue statistics
   */
  getStats() {
    const jobs = Array.from(this.jobs.values());

    return {
      total: jobs.length,
      pending: jobs.filter((j) => j.status === 'pending').length,
      processing: jobs.filter((j) => j.status === 'processing').length,
      completed: jobs.filter((j) => j.status === 'completed').length,
      failed: jobs.filter((j) => j.status === 'failed').length,
      retrying: jobs.filter((j) => j.status === 'retrying').length,
      processingCount: this.processing.size,
      isRunning: this.isRunning,
    };
  }
}

/**
 * Global job queue instance
 */
export const jobQueue = new JobQueue();

/**
 * Common job types
 */
export const JobTypes = {
  SEND_EMAIL: 'send_email',
  SEND_NOTIFICATION: 'send_notification',
  PROCESS_ANALYTICS: 'process_analytics',
  GENERATE_REPORT: 'generate_report',
  UPDATE_STREAKS: 'update_streaks',
  DAILY_REMINDERS: 'daily_reminders',
  CLEANUP_DATA: 'cleanup_data',
} as const;

/**
 * Email job data
 */
export interface SendEmailJobData {
  to: string;
  subject: string;
  body: string;
  template?: string;
}

/**
 * Notification job data
 */
export interface SendNotificationJobData {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Job scheduler for recurring tasks
 */
export class JobScheduler {
  private schedules: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Schedule recurring job
   */
  schedule(
    name: string,
    jobType: string,
    dataFn: () => unknown | Promise<unknown>,
    intervalMs: number,
    options?: {
      priority?: JobPriority;
      runImmediately?: boolean;
    }
  ): void {
    // Clear existing schedule
    this.unschedule(name);

    // Run immediately if requested
    if (options?.runImmediately) {
      this.runScheduledJob(jobType, dataFn, options.priority);
    }

    // Schedule recurring execution
    const interval = setInterval(() => {
      this.runScheduledJob(jobType, dataFn, options?.priority);
    }, intervalMs);

    this.schedules.set(name, interval);
  }

  /**
   * Run scheduled job
   */
  private async runScheduledJob(
    jobType: string,
    dataFn: () => unknown | Promise<unknown>,
    priority?: JobPriority
  ): Promise<void> {
    try {
      const data = await Promise.resolve(dataFn());
      await jobQueue.add(jobType, data, { priority });
    } catch (error) {
      console.error(`Scheduled job ${jobType} failed to queue:`, error);
    }
  }

  /**
   * Unschedule job
   */
  unschedule(name: string): void {
    const interval = this.schedules.get(name);
    if (interval) {
      clearInterval(interval);
      this.schedules.delete(name);
    }
  }

  /**
   * Unschedule all jobs
   */
  unscheduleAll(): void {
    this.schedules.forEach((interval) => clearInterval(interval));
    this.schedules.clear();
  }

  /**
   * Get scheduled jobs
   */
  getSchedules(): string[] {
    return Array.from(this.schedules.keys());
  }
}

/**
 * Global job scheduler instance
 */
export const jobScheduler = new JobScheduler();

/**
 * Initialize background jobs
 */
export function initializeBackgroundJobs(): void {
  // Register job handlers
  jobQueue.registerHandler<SendEmailJobData>(JobTypes.SEND_EMAIL, async (data) => {
    // TODO: Implement actual email sending
    console.log(`Sending email to ${data.to}: ${data.subject}`);
    return { sent: true };
  });

  jobQueue.registerHandler<SendNotificationJobData>(
    JobTypes.SEND_NOTIFICATION,
    async (data) => {
      // TODO: Implement actual notification sending
      console.log(`Sending notification to user ${data.userId}: ${data.title}`);
      return { sent: true };
    }
  );

  // Schedule daily tasks
  jobScheduler.schedule(
    'daily-reminders',
    JobTypes.DAILY_REMINDERS,
    () => ({ scheduledAt: new Date() }),
    24 * 60 * 60 * 1000, // Every 24 hours
    { priority: 'high', runImmediately: false }
  );

  jobScheduler.schedule(
    'update-streaks',
    JobTypes.UPDATE_STREAKS,
    () => ({ scheduledAt: new Date() }),
    60 * 60 * 1000, // Every hour
    { priority: 'normal', runImmediately: false }
  );

  // Start queue processing
  jobQueue.start();

  console.log('Background jobs initialized');
}

/**
 * Export types and utilities
 */
export type {
  Job,
  JobHandler,
  QueueConfig,
  JobStatus,
  JobPriority,
};
