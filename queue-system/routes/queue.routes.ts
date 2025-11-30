// ============================================
// VocaVision Queue System - REST API Routes
// Express.js Router for /api/admin/queue
// ============================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { QueueManager } from '../services/queue-manager.service';
import {
  JobType,
  JobStatus,
  JobPriority,
  JOB_TYPE_LABELS,
  STATUS_LABELS,
  PRIORITY_LABELS,
} from '../types/queue.types';

const router = Router();

// ---------------------------------------------
// Validation Schemas
// ---------------------------------------------

const CreateJobSchema = z.object({
  type: z.enum(['image-generation', 'content-generation', 'batch-import', 'export', 'cleanup'] as const),
  priority: z.enum(['low', 'normal', 'high', 'critical'] as const).optional().default('normal'),
  delay: z.number().min(0).optional(),
  data: z.record(z.unknown()),
});

const ImageGenerationJobSchema = z.object({
  wordIds: z.array(z.string().uuid()).min(1).max(100),
  style: z.enum([
    'cartoon', 'anime', 'watercolor', 'pixel', 'sketch',
    '3d-render', 'comic', 'minimalist', 'vintage', 'pop-art'
  ] as const).optional(),
  size: z.enum(['512x512', '768x768', '1024x1024'] as const).optional(),
  regenerate: z.boolean().optional().default(false),
  priority: z.enum(['low', 'normal', 'high', 'critical'] as const).optional().default('normal'),
});

const ContentGenerationJobSchema = z.object({
  wordIds: z.array(z.string().uuid()).min(1).max(100),
  options: z.object({
    generateMnemonic: z.boolean().optional().default(true),
    generateExamples: z.boolean().optional().default(true),
    generateEtymology: z.boolean().optional().default(false),
  }).optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical'] as const).optional().default('normal'),
});

const JobListQuerySchema = z.object({
  type: z.enum(['image-generation', 'content-generation', 'batch-import', 'export', 'cleanup'] as const).optional(),
  status: z.enum(['waiting', 'active', 'completed', 'failed', 'delayed', 'paused'] as const).optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  sortBy: z.enum(['createdAt', 'priority'] as const).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc'] as const).optional().default('desc'),
});

const QueueActionSchema = z.object({
  action: z.enum(['pause', 'resume', 'clean', 'empty'] as const),
  options: z.object({
    grace: z.number().optional(),
    status: z.enum(['completed', 'failed', 'delayed'] as const).optional(),
  }).optional(),
});

// ---------------------------------------------
// Helper Functions
// ---------------------------------------------

function sendSuccess(res: Response, data: unknown, message?: string) {
  res.json({
    success: true,
    data,
    message,
  });
}

function sendError(res: Response, statusCode: number, code: string, message: string) {
  res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
}

// ---------------------------------------------
// Routes
// ---------------------------------------------

/**
 * GET /api/admin/queue/stats
 * Get queue statistics
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await QueueManager.getStats();
    const isPaused = await QueueManager.isQueuePaused();

    sendSuccess(res, {
      ...stats,
      isPaused,
      labels: {
        types: JOB_TYPE_LABELS,
        statuses: STATUS_LABELS,
        priorities: PRIORITY_LABELS,
      },
    });
  } catch (error) {
    console.error('[QueueRoute] Stats error:', error);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to get queue stats');
  }
});

/**
 * GET /api/admin/queue/jobs
 * List jobs with filtering and pagination
 */
router.get('/jobs', async (req: Request, res: Response) => {
  try {
    const query = JobListQuerySchema.parse(req.query);
    const result = await QueueManager.getJobs(query);

    sendSuccess(res, result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendError(res, 400, 'VALIDATION_ERROR', error.errors[0].message);
      return;
    }
    console.error('[QueueRoute] List jobs error:', error);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to list jobs');
  }
});

/**
 * GET /api/admin/queue/jobs/:jobId
 * Get single job details
 */
router.get('/jobs/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = await QueueManager.getJob(jobId);

    if (!job) {
      sendError(res, 404, 'NOT_FOUND', 'Job not found');
      return;
    }

    sendSuccess(res, { job });
  } catch (error) {
    console.error('[QueueRoute] Get job error:', error);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to get job');
  }
});

/**
 * POST /api/admin/queue/jobs
 * Create a new job (generic)
 */
router.post('/jobs', async (req: Request, res: Response) => {
  try {
    const input = CreateJobSchema.parse(req.body);
    const userId = (req as any).user?.id || 'system';

    const job = await QueueManager.addJob({
      type: input.type,
      data: {
        ...input.data,
        createdBy: userId,
        priority: input.priority,
      },
      priority: input.priority,
      delay: input.delay,
    });

    sendSuccess(res, {
      jobId: job.id,
      type: input.type,
      status: 'waiting',
    }, 'Job created successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendError(res, 400, 'VALIDATION_ERROR', error.errors[0].message);
      return;
    }
    console.error('[QueueRoute] Create job error:', error);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to create job');
  }
});

/**
 * POST /api/admin/queue/jobs/image-generation
 * Create image generation job
 */
router.post('/jobs/image-generation', async (req: Request, res: Response) => {
  try {
    const input = ImageGenerationJobSchema.parse(req.body);
    const userId = (req as any).user?.id || 'system';

    const job = await QueueManager.addImageGenerationJob(input.wordIds, {
      style: input.style,
      size: input.size,
      regenerate: input.regenerate,
      priority: input.priority,
      createdBy: userId,
    });

    sendSuccess(res, {
      jobId: job.id,
      type: 'image-generation',
      totalWords: input.wordIds.length,
      status: 'waiting',
    }, 'Image generation job created');
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendError(res, 400, 'VALIDATION_ERROR', error.errors[0].message);
      return;
    }
    console.error('[QueueRoute] Create image job error:', error);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to create image generation job');
  }
});

/**
 * POST /api/admin/queue/jobs/content-generation
 * Create content generation job
 */
router.post('/jobs/content-generation', async (req: Request, res: Response) => {
  try {
    const input = ContentGenerationJobSchema.parse(req.body);
    const userId = (req as any).user?.id || 'system';

    const job = await QueueManager.addContentGenerationJob(input.wordIds, {
      generateMnemonic: input.options?.generateMnemonic,
      generateExamples: input.options?.generateExamples,
      generateEtymology: input.options?.generateEtymology,
      priority: input.priority,
      createdBy: userId,
    });

    sendSuccess(res, {
      jobId: job.id,
      type: 'content-generation',
      totalWords: input.wordIds.length,
      status: 'waiting',
    }, 'Content generation job created');
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendError(res, 400, 'VALIDATION_ERROR', error.errors[0].message);
      return;
    }
    console.error('[QueueRoute] Create content job error:', error);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to create content generation job');
  }
});

/**
 * POST /api/admin/queue/jobs/:jobId/retry
 * Retry a failed job
 */
router.post('/jobs/:jobId/retry', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    await QueueManager.retryJob(jobId);

    sendSuccess(res, { jobId }, 'Job retry initiated');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('not found')) {
      sendError(res, 404, 'NOT_FOUND', 'Job not found');
      return;
    }
    console.error('[QueueRoute] Retry job error:', error);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to retry job');
  }
});

/**
 * POST /api/admin/queue/jobs/:jobId/cancel
 * Cancel a job
 */
router.post('/jobs/:jobId/cancel', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    await QueueManager.cancelJob(jobId);

    sendSuccess(res, { jobId }, 'Job cancelled');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('not found')) {
      sendError(res, 404, 'NOT_FOUND', 'Job not found');
      return;
    }
    console.error('[QueueRoute] Cancel job error:', error);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to cancel job');
  }
});

/**
 * DELETE /api/admin/queue/jobs/:jobId
 * Remove a job
 */
router.delete('/jobs/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    await QueueManager.removeJob(jobId);

    sendSuccess(res, { jobId }, 'Job removed');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('not found')) {
      sendError(res, 404, 'NOT_FOUND', 'Job not found');
      return;
    }
    console.error('[QueueRoute] Remove job error:', error);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to remove job');
  }
});

/**
 * POST /api/admin/queue/action
 * Perform queue-level actions (pause, resume, clean, empty)
 */
router.post('/action', async (req: Request, res: Response) => {
  try {
    const input = QueueActionSchema.parse(req.body);

    switch (input.action) {
      case 'pause':
        await QueueManager.pauseQueue();
        sendSuccess(res, { action: 'pause' }, 'Queue paused');
        break;

      case 'resume':
        await QueueManager.resumeQueue();
        sendSuccess(res, { action: 'resume' }, 'Queue resumed');
        break;

      case 'clean':
        const grace = input.options?.grace || 0;
        const status = input.options?.status || 'completed';
        const cleaned = await QueueManager.cleanQueue(grace, status);
        sendSuccess(res, {
          action: 'clean',
          cleanedCount: cleaned.length,
          status,
        }, `Cleaned ${cleaned.length} ${status} jobs`);
        break;

      case 'empty':
        await QueueManager.emptyQueue();
        sendSuccess(res, { action: 'empty' }, 'Queue emptied');
        break;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendError(res, 400, 'VALIDATION_ERROR', error.errors[0].message);
      return;
    }
    console.error('[QueueRoute] Queue action error:', error);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to perform queue action');
  }
});

/**
 * GET /api/admin/queue/types
 * Get available job types with labels
 */
router.get('/types', (_req: Request, res: Response) => {
  const types = Object.entries(JOB_TYPE_LABELS).map(([value, labels]) => ({
    value,
    label: labels.en,
    labelKo: labels.ko,
  }));

  sendSuccess(res, { types });
});

/**
 * GET /api/admin/queue/statuses
 * Get available statuses with labels
 */
router.get('/statuses', (_req: Request, res: Response) => {
  const statuses = Object.entries(STATUS_LABELS).map(([value, labels]) => ({
    value,
    label: labels.en,
    labelKo: labels.ko,
    color: labels.color,
  }));

  sendSuccess(res, { statuses });
});

/**
 * GET /api/admin/queue/priorities
 * Get available priorities with labels
 */
router.get('/priorities', (_req: Request, res: Response) => {
  const priorities = Object.entries(PRIORITY_LABELS).map(([value, labels]) => ({
    value,
    label: labels.en,
    labelKo: labels.ko,
  }));

  sendSuccess(res, { priorities });
});

export default router;
