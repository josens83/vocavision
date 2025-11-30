// ============================================
// VocaVision Queue System - Real-time Progress (SSE)
// Server-Sent Events를 통한 실시간 진행률 모니터링
// ============================================

import { Router, Request, Response } from 'express';
import { getQueueManager } from '../services/queue-manager.service';
import { QueueEvent, QUEUE_NAMES } from '../types/queue.types';

const router = Router();

// Store active SSE connections
const clients: Map<string, Response> = new Map();

// ---------------------------------------------
// SSE Connection Handler
// ---------------------------------------------

/**
 * GET /api/admin/queue/events
 * SSE 연결 - 실시간 큐 이벤트 스트림
 */
router.get('/events', (req: Request, res: Response) => {
  const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no', // Disable nginx buffering
  });

  // Send initial connection event
  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify({ clientId, timestamp: new Date().toISOString() })}\n\n`);

  // Store client connection
  clients.set(clientId, res);
  console.log(`[SSE] Client connected: ${clientId} (total: ${clients.size})`);

  // Keep-alive ping every 30 seconds
  const keepAlive = setInterval(() => {
    res.write(`: keepalive\n\n`);
  }, 30000);

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(keepAlive);
    clients.delete(clientId);
    console.log(`[SSE] Client disconnected: ${clientId} (remaining: ${clients.size})`);
  });
});

/**
 * GET /api/admin/queue/events/job/:jobId
 * 특정 작업의 진행률 스트림
 */
router.get('/events/job/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params;
  const clientId = `job-${jobId}-${Date.now()}`;

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no',
  });

  // Send initial event
  res.write(`event: subscribed\n`);
  res.write(`data: ${JSON.stringify({ jobId, timestamp: new Date().toISOString() })}\n\n`);

  // Store with job-specific key
  clients.set(clientId, res);

  // Keep-alive
  const keepAlive = setInterval(() => {
    res.write(`: keepalive\n\n`);
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
    clients.delete(clientId);
  });
});

/**
 * GET /api/admin/queue/events/batch/:batchId
 * 배치 작업의 진행률 스트림
 */
router.get('/events/batch/:batchId', async (req: Request, res: Response) => {
  const { batchId } = req.params;
  const queueName = req.query.queue as string || QUEUE_NAMES.CONTENT;
  const clientId = `batch-${batchId}-${Date.now()}`;

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no',
  });

  // Send initial event
  res.write(`event: subscribed\n`);
  res.write(`data: ${JSON.stringify({ batchId, timestamp: new Date().toISOString() })}\n\n`);

  clients.set(clientId, res);

  // Poll batch progress
  const queueManager = getQueueManager();
  const pollInterval = setInterval(async () => {
    try {
      const progress = await queueManager.getBatchProgress(queueName, batchId);

      res.write(`event: progress\n`);
      res.write(`data: ${JSON.stringify(progress)}\n\n`);

      // Stop polling when complete
      if (progress.completed + progress.failed >= progress.total) {
        res.write(`event: completed\n`);
        res.write(`data: ${JSON.stringify(progress)}\n\n`);
        clearInterval(pollInterval);
      }
    } catch (error) {
      console.error(`[SSE] Batch progress error:`, error);
    }
  }, 2000); // Poll every 2 seconds

  // Keep-alive
  const keepAlive = setInterval(() => {
    res.write(`: keepalive\n\n`);
  }, 30000);

  req.on('close', () => {
    clearInterval(pollInterval);
    clearInterval(keepAlive);
    clients.delete(clientId);
  });
});

// ---------------------------------------------
// Broadcast Functions
// ---------------------------------------------

/**
 * Broadcast event to all connected clients
 */
export function broadcastEvent(event: QueueEvent): void {
  const eventData = JSON.stringify(event);

  clients.forEach((client, clientId) => {
    try {
      client.write(`event: ${event.type}\n`);
      client.write(`data: ${eventData}\n\n`);
    } catch (error) {
      console.error(`[SSE] Failed to send to ${clientId}:`, error);
      clients.delete(clientId);
    }
  });
}

/**
 * Broadcast to specific job subscribers
 */
export function broadcastJobEvent(jobId: string, event: QueueEvent): void {
  const eventData = JSON.stringify(event);

  clients.forEach((client, clientId) => {
    if (clientId.includes(jobId) || !clientId.startsWith('job-')) {
      try {
        client.write(`event: ${event.type}\n`);
        client.write(`data: ${eventData}\n\n`);
      } catch (error) {
        console.error(`[SSE] Failed to send to ${clientId}:`, error);
        clients.delete(clientId);
      }
    }
  });
}

// ---------------------------------------------
// Initialize Queue Event Listeners
// ---------------------------------------------

export function initializeSSEBroadcasting(): void {
  const queueManager = getQueueManager();

  // Listen for all queue events
  queueManager.on('event', (event: QueueEvent) => {
    broadcastEvent(event);
  });

  console.log('[SSE] Event broadcasting initialized');
}

// ---------------------------------------------
// Stats Endpoint for Client
// ---------------------------------------------

/**
 * GET /api/admin/queue/events/stats
 * 현재 연결된 클라이언트 수
 */
router.get('/events/stats', (req: Request, res: Response) => {
  res.json({
    connectedClients: clients.size,
    clientIds: Array.from(clients.keys()),
  });
});

export default router;
