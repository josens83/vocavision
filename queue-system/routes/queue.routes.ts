// ============================================
// VocaVision Queue System - REST API Routes
// Express.js Router for /api/admin/queue
// ============================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getQueueManager } from '../services/queue-manager.service';
import {
  JobType,
  JobStatus,
  QUEUE_NAMES,
  ContentGenerationJobData,
  ImageGenerationJobData,
  BatchContentJobData,
  BatchImageJobData,
  ExportJobData,
} from '../types/queue.types';

const router = Router();

// ---------------------------------------------
// Validation Schemas
// ---------------------------------------------

const ContentGenerationSchema = z.object({
  wordId: z.string().uuid(),
  word: z.string().min(1),
  examCategory: z.string(),
  level: z.string(),
  regenerate: z.boolean().optional().default(false),
  priority: z.number().min(1).max(5).optional().default(3),
});

const BatchContentSchema = z.object({
  batchId: z.string().optional(),
  words: z.array(z.object({
    id: z.string().uuid(),
    word: z.string().min(1),
  })).min(1).max(100),
  examCategory: z.string(),
  level: z.string(),
  regenerate: z.boolean().optional().default(false),
});

const ImageGenerationSchema = z.object({
  wordId: z.string().uuid(),
  word: z.string().min(1),
  mnemonic: z.string().min(1),
  mnemonicKorean: z.string().optional(),
  style: z.enum([
    'cartoon', 'anime', 'watercolor', 'pixel', 'sketch',
    '3d-render', 'comic', 'minimalist', 'vintage', 'pop-art'
  ] as const).optional(),
  size: z.enum(['512x512', '768x768', '1024x1024'] as const).optional(),
  regenerate: z.boolean().optional().default(false),
  priority: z.number().min(1).max(5).optional().default(3),
});

const BatchImageSchema = z.object({
  batchId: z.string().optional(),
  words: z.array(z.object({
    id: z.string().uuid(),
    word: z.string().min(1),
    mnemonic: z.string().min(1),
    mnemonicKorean: z.string().optional(),
  })).min(1).max(50),
  style: z.enum([
    'cartoon', 'anime', 'watercolor', 'pixel', 'sketch',
    '3d-render', 'comic', 'minimalist', 'vintage', 'pop-art'
  ] as const).optional(),
  size: z.enum(['512x512', '768x768', '1024x1024'] as const).optional(),
  regenerate: z.boolean().optional().default(false),
});

const ExportSchema = z.object({
  format: z.enum(['json', 'csv', 'xlsx'] as const),
  filters: z.object({
    examCategories: z.array(z.string()).optional(),
    levels: z.array(z.string()).optional(),
    status: z.array(z.string()).optional(),
  }).optional(),
});

const QueueActionSchema = z.object({
  action: z.enum(['pause', 'resume', 'clean'] as const),
  queueName: z.string().optional(),
  gracePeriod: z.number().optional().default(1000),
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

function generateBatchId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ---------------------------------------------
// Dashboard Stats Routes
// ---------------------------------------------

/**
 * GET /api/admin/queue/stats
 * 큐 시스템 전체 통계
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const queueManager = getQueueManager();
    const stats = await queueManager.getDashboardStats();
    sendSuccess(res, stats);
  } catch (error) {
    console.error('[QueueRoute] Stats error:', error);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to get queue stats');
  }
});

/**
 * GET /api/admin/queue/stats/:queueName
 * 특정 큐 통계
 */
router.get('/stats/:queueName', async (req: Request, res: Response) => {
  try {
    const { queueName } = req.params;
    const queueManager = getQueueManager();
    const stats = await queueManager.getQueueStats(queueName);
    sendSuccess(res, stats);
  } catch (error) {
    console.error('[QueueRoute] Queue stats error:', error);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to get queue stats');
  }
});

// ---------------------------------------------
// Content Generation Routes
// ---------------------------------------------

/**
 * POST /api/admin/queue/content/generate
 * 단일 단어 콘텐츠 생성 작업 추가
 */
router.post('/content/generate', async (req: Request, res: Response) => {
  try {
    const input = ContentGenerationSchema.parse(req.body);
    const userId = (req as any).user?.id || 'system';
    const queueManager = getQueueManager();

    const jobData: ContentGenerationJobData = {
      ...input,
      requestedBy: userId,
    };

    const job = await queueManager.addJob(
      QUEUE_NAMES.CONTENT,
      'content-generation',
      jobData,
      { priority: input.priority }
    );

    sendSuccess(res, {
      jobId: job.id,
      type: 'content-generation',
      status: 'waiting',
    }, 'Content generation job created');
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendError(res, 400, 'VALIDATION_ERROR', error.errors[0].message);
      return;
    }
    console.error('[QueueRoute] Content generation error:', error);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to create content generation job');
  }
});

/**
 * POST /api/admin/queue/content/batch
 * 배치 콘텐츠 생성 작업 추가
 */
router.post('/content/batch', async (req: Request, res: Response) => {
  try {
    const input = BatchContentSchema.parse(req.body);
    const userId = (req as any).user?.id || 'system';
    const queueManager = getQueueManager();

    const batchId = input.batchId || generateBatchId('content');

    const jobData: BatchContentJobData = {
      batchId,
      words: input.words,
      examCategory: input.examCategory,
      level: input.level,
      regenerate: input.regenerate,
      requestedBy: userId,
    };

    const job = await queueManager.addJob(
      QUEUE_NAMES.CONTENT,
      'batch-content',
      jobData,
      { priority: 2 }
    );

    sendSuccess(res, {
      jobId: job.id,
      batchId,
      type: 'batch-content',
      totalWords: input.words.length,
      status: 'waiting',
    }, 'Batch content generation job created');
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendError(res, 400, 'VALIDATION_ERROR', error.errors[0].message);
      return;
    }
    console.error('[QueueRoute] Batch content error:', error);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to create batch content job');
  }
});

// ---------------------------------------------
// Image Generation Routes
// ---------------------------------------------

/**
 * POST /api/admin/queue/image/generate
 * 단일 단어 이미지 생성 작업 추가
 */
router.post('/image/generate', async (req: Request, res: Response) => {
  try {
    const input = ImageGenerationSchema.parse(req.body);
    const userId = (req as any).user?.id || 'system';
    const queueManager = getQueueManager();

    const jobData: ImageGenerationJobData = {
      ...input,
      requestedBy: userId,
    };

    const job = await queueManager.addJob(
      QUEUE_NAMES.IMAGE,
      'image-generation',
      jobData,
      { priority: input.priority }
    );

    sendSuccess(res, {
      jobId: job.id,
      type: 'image-generation',
      status: 'waiting',
    }, 'Image generation job created');
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendError(res, 400, 'VALIDATION_ERROR', error.errors[0].message);
      return;
    }
    console.error('[QueueRoute] Image generation error:', error);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to create image generation job');
  }
});

/**
 * POST /api/admin/queue/image/batch
 * 배치 이미지 생성 작업 추가
 */
router.post('/image/batch', async (req: Request, res: Response) => {
  try {
    const input = BatchImageSchema.parse(req.body);
    const userId = (req as any).user?.id || 'system';
    const queueManager = getQueueManager();

    const batchId = input.batchId || generateBatchId('image');

    const jobData: BatchImageJobData = {
      batchId,
      words: input.words,
      style: input.style,
      size: input.size,
      regenerate: input.regenerate,
      requestedBy: userId,
    };

    const job = await queueManager.addJob(
      QUEUE_NAMES.IMAGE,
      'batch-image',
      jobData,
      { priority: 2 }
    );

    sendSuccess(res, {
      jobId: job.id,
      batchId,
      type: 'batch-image',
      totalWords: input.words.length,
      status: 'waiting',
    }, 'Batch image generation job created');
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendError(res, 400, 'VALIDATION_ERROR', error.errors[0].message);
      return;
    }
    console.error('[QueueRoute] Batch image error:', error);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to create batch image job');
  }
});

// ---------------------------------------------
// Export Routes
// ---------------------------------------------

/**
 * POST /api/admin/queue/export
 * 데이터 내보내기 작업 추가
 */
router.post('/export', async (req: Request, res: Response) => {
  try {
    const input = ExportSchema.parse(req.body);
    const userId = (req as any).user?.id || 'system';
    const queueManager = getQueueManager();

    const exportId = generateBatchId('export');

    const jobData: ExportJobData = {
      exportId,
      format: input.format,
      filters: input.filters,
      requestedBy: userId,
    };

    const job = await queueManager.addJob(
      QUEUE_NAMES.EXPORT,
      'export',
      jobData,
      { priority: 3 }
    );

    sendSuccess(res, {
      jobId: job.id,
      exportId,
      type: 'export',
      format: input.format,
      status: 'waiting',
    }, 'Export job created');
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendError(res, 400, 'VALIDATION_ERROR', error.errors[0].message);
      return;
    }
    console.error('[QueueRoute] Export error:', error);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to create export job');
  }
});

// ---------------------------------------------
// Job Management Routes
// ---------------------------------------------

/**
 * GET /api/admin/queue/jobs/:queueName/:jobId
 * 작업 상태 조회
 */
router.get('/jobs/:queueName/:jobId', async (req: Request, res: Response) => {
  try {
    const { queueName, jobId } = req.params;
    const queueManager = getQueueManager();
    const status = await queueManager.getJobStatus(queueName, jobId);

    if (!status) {
      sendError(res, 404, 'NOT_FOUND', 'Job not found');
      return;
    }

    sendSuccess(res, status);
  } catch (error) {
    console.error('[QueueRoute] Get job error:', error);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to get job status');
  }
});

/**
 * POST /api/admin/queue/jobs/:queueName/:jobId/retry
 * 실패한 작업 재시도
 */
router.post('/jobs/:queueName/:jobId/retry', async (req: Request, res: Response) => {
  try {
    const { queueName, jobId } = req.params;
    const queueManager = getQueueManager();
    await queueManager.retryJob(queueName, jobId);

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
 * DELETE /api/admin/queue/jobs/:queueName/:jobId
 * 작업 삭제
 */
router.delete('/jobs/:queueName/:jobId', async (req: Request, res: Response) => {
  try {
    const { queueName, jobId } = req.params;
    const queueManager = getQueueManager();
    await queueManager.removeJob(queueName, jobId);

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
 * GET /api/admin/queue/batch/:batchId/progress
 * 배치 작업 진행률 조회
 */
router.get('/batch/:batchId/progress', async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const queueName = req.query.queue as string || QUEUE_NAMES.CONTENT;
    const queueManager = getQueueManager();
    const progress = await queueManager.getBatchProgress(queueName, batchId);

    sendSuccess(res, progress);
  } catch (error) {
    console.error('[QueueRoute] Batch progress error:', error);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to get batch progress');
  }
});

// ---------------------------------------------
// Queue Control Routes
// ---------------------------------------------

/**
 * POST /api/admin/queue/action
 * 큐 제어 (일시정지, 재개, 정리)
 */
router.post('/action', async (req: Request, res: Response) => {
  try {
    const input = QueueActionSchema.parse(req.body);
    const queueManager = getQueueManager();

    switch (input.action) {
      case 'pause':
        if (input.queueName) {
          await queueManager.pauseQueue(input.queueName);
          sendSuccess(res, { action: 'pause', queue: input.queueName }, 'Queue paused');
        } else {
          await queueManager.pauseAllQueues();
          sendSuccess(res, { action: 'pause', queue: 'all' }, 'All queues paused');
        }
        break;

      case 'resume':
        if (input.queueName) {
          await queueManager.resumeQueue(input.queueName);
          sendSuccess(res, { action: 'resume', queue: input.queueName }, 'Queue resumed');
        } else {
          await queueManager.resumeAllQueues();
          sendSuccess(res, { action: 'resume', queue: 'all' }, 'All queues resumed');
        }
        break;

      case 'clean':
        if (input.queueName) {
          await queueManager.cleanQueue(input.queueName, input.gracePeriod);
          sendSuccess(res, { action: 'clean', queue: input.queueName }, 'Queue cleaned');
        } else {
          await queueManager.cleanAllQueues(input.gracePeriod);
          sendSuccess(res, { action: 'clean', queue: 'all' }, 'All queues cleaned');
        }
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
 * GET /api/admin/queue/queues
 * 사용 가능한 큐 목록
 */
router.get('/queues', (_req: Request, res: Response) => {
  sendSuccess(res, {
    queues: Object.entries(QUEUE_NAMES).map(([key, value]) => ({
      key,
      name: value,
    })),
  });
});

export default router;
