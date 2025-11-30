// ============================================
// VocaVision Queue System - Main Entry Point
// Bull/Redis Job Queue Integration
// ============================================

import { Application } from 'express';
import { QueueManager } from './services/queue-manager.service';
import { registerAllProcessors } from './services/job-processors.service';
import queueRoutes from './routes/queue.routes';
import queueSSERoutes from './routes/queue-sse.routes';

// ---------------------------------------------
// Types Export
// ---------------------------------------------

export * from './types/queue.types';

// ---------------------------------------------
// Service Export
// ---------------------------------------------

export { QueueManager } from './services/queue-manager.service';
export {
  processImageGeneration,
  processContentGeneration,
  processBatchImport,
  processExport,
  processCleanup,
  registerAllProcessors,
} from './services/job-processors.service';

// ---------------------------------------------
// Route Export
// ---------------------------------------------

export { default as queueRoutes } from './routes/queue.routes';
export { default as queueSSERoutes } from './routes/queue-sse.routes';

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
): Promise<void> {
  console.log('[QueueSystem] Initializing...');

  // Initialize Queue Manager
  await QueueManager.initialize({
    redis: {
      host: options.redisHost || process.env.REDIS_HOST || 'localhost',
      port: options.redisPort || parseInt(process.env.REDIS_PORT || '6379'),
      password: options.redisPassword || process.env.REDIS_PASSWORD,
      db: options.redisDb || parseInt(process.env.REDIS_DB || '0'),
    },
  });

  // Register job processors
  if (options.registerProcessors !== false) {
    registerAllProcessors(QueueManager);
  }

  console.log('[QueueSystem] Initialized successfully');
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
  await QueueManager.shutdown();
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
