// ============================================
// VocaVision Queue System - Main Entry Point
// Bull/Redis Job Queue Integration
// ============================================

import { Application } from 'express';
import { getQueueManager, initializeQueues, QueueManager } from './services/queue-manager.service';
import { registerProcessors } from './services/job-processors.service';
import { initializeSSEBroadcasting } from './routes/queue-sse.routes';
import queueRoutes from './routes/queue.routes';
import queueSSERoutes from './routes/queue-sse.routes';

// ---------------------------------------------
// Types Export
// ---------------------------------------------

export * from './types/queue.types';

// ---------------------------------------------
// Service Export
// ---------------------------------------------

export { QueueManager, getQueueManager, initializeQueues } from './services/queue-manager.service';
export {
  processContentGeneration,
  processBatchContent,
  processImageGeneration,
  processBatchImage,
  processExport,
  registerProcessors,
} from './services/job-processors.service';

// ---------------------------------------------
// Route Export
// ---------------------------------------------

export { default as queueRoutes } from './routes/queue.routes';
export { default as queueSSERoutes } from './routes/queue-sse.routes';
export { broadcastEvent, broadcastJobEvent, initializeSSEBroadcasting } from './routes/queue-sse.routes';

// ---------------------------------------------
// Component Export
// ---------------------------------------------

export { QueueDashboard } from './components/QueueDashboard';

// ---------------------------------------------
// Initialize Queue System
// ---------------------------------------------

export interface QueueSystemOptions {
  redisHost?: string;
  redisPort?: number;
  redisPassword?: string;
  redisDb?: number;
  registerProcessors?: boolean;
}

export async function initializeQueueSystem(
  options: QueueSystemOptions = {}
): Promise<QueueManager> {
  console.log('[QueueSystem] Initializing...');

  // Initialize Queue Manager with Redis config
  const queueManager = await initializeQueues({
    redis: {
      host: options.redisHost || process.env.REDIS_HOST || 'localhost',
      port: options.redisPort || parseInt(process.env.REDIS_PORT || '6379'),
      password: options.redisPassword || process.env.REDIS_PASSWORD,
      db: options.redisDb || parseInt(process.env.REDIS_DB || '0'),
    },
  });

  // Register job processors
  if (options.registerProcessors !== false) {
    await registerProcessors();
  }

  // Initialize SSE broadcasting
  initializeSSEBroadcasting();

  console.log('[QueueSystem] Initialized successfully');
  return queueManager;
}

// ---------------------------------------------
// Express Integration
// ---------------------------------------------

export function setupQueueRoutes(
  app: Application,
  options: {
    basePath?: string;
    authMiddleware?: any;
    adminMiddleware?: any;
  } = {}
): void {
  const basePath = options.basePath || '/api/admin/queue';

  // Apply middleware if provided
  const middlewares = [
    options.authMiddleware,
    options.adminMiddleware,
  ].filter(Boolean);

  if (middlewares.length > 0) {
    app.use(basePath, ...middlewares, queueRoutes);
    app.use(basePath, ...middlewares, queueSSERoutes);
  } else {
    app.use(basePath, queueRoutes);
    app.use(basePath, queueSSERoutes);
  }

  console.log(`[QueueSystem] Routes mounted at ${basePath}`);
}

// ---------------------------------------------
// Graceful Shutdown
// ---------------------------------------------

export async function shutdownQueueSystem(): Promise<void> {
  console.log('[QueueSystem] Shutting down...');
  const queueManager = getQueueManager();
  await queueManager.shutdown();
  console.log('[QueueSystem] Shut down complete');
}

// Handle process signals
process.on('SIGTERM', async () => {
  await shutdownQueueSystem();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await shutdownQueueSystem();
  process.exit(0);
});
