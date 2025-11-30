// ============================================
// VocaVision Queue System - Server-Sent Events Routes
// Real-time job progress streaming
// ============================================

import { Router, Request, Response } from 'express';
import { QueueManager } from '../services/queue-manager.service';
import {
  SSEEvent,
  JobEventData,
  QueueStatsData,
} from '../types/queue.types';

const router = Router();

// Track active SSE connections
const activeConnections = new Set<Response>();

// ---------------------------------------------
// SSE Helper Functions
// ---------------------------------------------

function sendSSE(res: Response, event: SSEEvent): void {
  if (!res.writable) return;

  res.write(`event: ${event.type}\n`);
  res.write(`data: ${JSON.stringify(event.data)}\n\n`);
}

function broadcastEvent(event: SSEEvent): void {
  activeConnections.forEach((res) => {
    try {
      sendSSE(res, event);
    } catch (error) {
      console.error('[SSE] Error broadcasting:', error);
      activeConnections.delete(res);
    }
  });
}

// ---------------------------------------------
// Initialize Queue Event Listeners
// ---------------------------------------------

let listenersInitialized = false;

function initializeEventListeners(): void {
  if (listenersInitialized) return;

  QueueManager.on('job-created', (jobInfo) => {
    broadcastEvent({
      type: 'job-created',
      data: {
        jobId: jobInfo.id,
        type: jobInfo.type,
        status: 'waiting',
      } as JobEventData,
      timestamp: new Date().toISOString(),
    });
  });

  QueueManager.on('job-active', (jobInfo) => {
    broadcastEvent({
      type: 'job-progress',
      data: {
        jobId: jobInfo.id,
        type: jobInfo.type,
        status: 'active',
        progress: jobInfo.progress,
      } as JobEventData,
      timestamp: new Date().toISOString(),
    });
  });

  QueueManager.on('job-progress', ({ jobId, progress }) => {
    broadcastEvent({
      type: 'job-progress',
      data: {
        jobId,
        type: 'image-generation', // Will be updated with actual type
        status: 'active',
        progress,
      } as JobEventData,
      timestamp: new Date().toISOString(),
    });
  });

  QueueManager.on('job-completed', (jobInfo) => {
    broadcastEvent({
      type: 'job-completed',
      data: {
        jobId: jobInfo.id,
        type: jobInfo.type,
        status: 'completed',
        result: jobInfo.result,
      } as JobEventData,
      timestamp: new Date().toISOString(),
    });

    // Also send updated stats
    sendQueueStats();
  });

  QueueManager.on('job-failed', (jobInfo) => {
    broadcastEvent({
      type: 'job-failed',
      data: {
        jobId: jobInfo.id,
        type: jobInfo.type,
        status: 'failed',
        error: jobInfo.error,
      } as JobEventData,
      timestamp: new Date().toISOString(),
    });

    // Also send updated stats
    sendQueueStats();
  });

  listenersInitialized = true;
  console.log('[SSE] Event listeners initialized');
}

async function sendQueueStats(): Promise<void> {
  try {
    const stats = await QueueManager.getStats();
    broadcastEvent({
      type: 'queue-stats',
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[SSE] Error sending queue stats:', error);
  }
}

// ---------------------------------------------
// Routes
// ---------------------------------------------

/**
 * GET /api/admin/queue/events
 * Main SSE endpoint for all queue events
 */
router.get('/events', async (req: Request, res: Response) => {
  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();

  // Initialize event listeners if not already done
  initializeEventListeners();

  // Add to active connections
  activeConnections.add(res);
  console.log(`[SSE] Client connected. Total connections: ${activeConnections.size}`);

  // Send initial stats
  try {
    const stats = await QueueManager.getStats();
    sendSSE(res, {
      type: 'queue-stats',
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[SSE] Error sending initial stats:', error);
  }

  // Send heartbeat every 30 seconds
  const heartbeatInterval = setInterval(() => {
    if (res.writable) {
      res.write(`: heartbeat\n\n`);
    }
  }, 30000);

  // Clean up on connection close
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    activeConnections.delete(res);
    console.log(`[SSE] Client disconnected. Total connections: ${activeConnections.size}`);
  });
});

/**
 * GET /api/admin/queue/events/job/:jobId
 * SSE endpoint for specific job updates
 */
router.get('/events/job/:jobId', async (req: Request, res: Response) => {
  const { jobId } = req.params;

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Get initial job state
  try {
    const job = await QueueManager.getJob(jobId);
    if (job) {
      sendSSE(res, {
        type: 'job-progress',
        data: {
          jobId: job.id,
          type: job.type,
          status: job.status,
          progress: job.progress,
          result: job.result,
        } as JobEventData,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('[SSE] Error getting job:', error);
  }

  // Create job-specific event handler
  const onProgress = ({ jobId: eventJobId, progress }: { jobId: string; progress: any }) => {
    if (eventJobId === jobId && res.writable) {
      sendSSE(res, {
        type: 'job-progress',
        data: {
          jobId,
          type: 'image-generation',
          status: 'active',
          progress,
        } as JobEventData,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const onCompleted = (jobInfo: any) => {
    if (jobInfo.id === jobId && res.writable) {
      sendSSE(res, {
        type: 'job-completed',
        data: {
          jobId: jobInfo.id,
          type: jobInfo.type,
          status: 'completed',
          result: jobInfo.result,
        } as JobEventData,
        timestamp: new Date().toISOString(),
      });
      cleanup();
    }
  };

  const onFailed = (jobInfo: any) => {
    if (jobInfo.id === jobId && res.writable) {
      sendSSE(res, {
        type: 'job-failed',
        data: {
          jobId: jobInfo.id,
          type: jobInfo.type,
          status: 'failed',
          error: jobInfo.error,
        } as JobEventData,
        timestamp: new Date().toISOString(),
      });
      cleanup();
    }
  };

  // Attach listeners
  QueueManager.on('job-progress', onProgress);
  QueueManager.on('job-completed', onCompleted);
  QueueManager.on('job-failed', onFailed);

  // Heartbeat
  const heartbeatInterval = setInterval(() => {
    if (res.writable) {
      res.write(`: heartbeat\n\n`);
    }
  }, 30000);

  // Cleanup function
  const cleanup = () => {
    clearInterval(heartbeatInterval);
    QueueManager.removeListener('job-progress', onProgress);
    QueueManager.removeListener('job-completed', onCompleted);
    QueueManager.removeListener('job-failed', onFailed);
  };

  // Clean up on connection close
  req.on('close', cleanup);
});

/**
 * GET /api/admin/queue/events/stats
 * SSE endpoint for queue stats only
 */
router.get('/events/stats', async (req: Request, res: Response) => {
  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send initial stats
  const sendStats = async () => {
    try {
      const stats = await QueueManager.getStats();
      if (res.writable) {
        sendSSE(res, {
          type: 'queue-stats',
          data: stats,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('[SSE] Error sending stats:', error);
    }
  };

  await sendStats();

  // Poll stats every 5 seconds
  const statsInterval = setInterval(sendStats, 5000);

  // Heartbeat every 30 seconds
  const heartbeatInterval = setInterval(() => {
    if (res.writable) {
      res.write(`: heartbeat\n\n`);
    }
  }, 30000);

  // Clean up on connection close
  req.on('close', () => {
    clearInterval(statsInterval);
    clearInterval(heartbeatInterval);
  });
});

// ---------------------------------------------
// Utility Endpoints
// ---------------------------------------------

/**
 * GET /api/admin/queue/connections
 * Get number of active SSE connections
 */
router.get('/connections', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      activeConnections: activeConnections.size,
    },
  });
});

export default router;
