/**
 * Health Check Routes
 *
 * Provides comprehensive health and status monitoring endpoints
 * for production deployment and monitoring systems.
 */

import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: ServiceStatus;
    cache?: ServiceStatus;
    storage?: ServiceStatus;
  };
  metrics?: {
    memory: MemoryMetrics;
    cpu: CPUMetrics;
  };
}

interface ServiceStatus {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  message?: string;
}

interface MemoryMetrics {
  used: number;
  total: number;
  percentage: number;
}

interface CPUMetrics {
  usage: number;
}

/**
 * Basic health check
 * GET /health
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const health: HealthCheckResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.APP_VERSION || '1.0.0',
      services: {
        database: await checkDatabase(),
      },
    };

    // Overall health status
    const allServicesHealthy = Object.values(health.services).every(
      service => service.status === 'up'
    );

    health.status = allServicesHealthy ? 'healthy' : 'degraded';

    const statusCode = health.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
    });
  }
});

/**
 * Detailed health check with metrics
 * GET /health/detailed
 */
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const health: HealthCheckResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.APP_VERSION || '1.0.0',
      services: {
        database: await checkDatabase(),
        cache: await checkCache(),
        storage: await checkStorage(),
      },
      metrics: {
        memory: getMemoryMetrics(),
        cpu: getCPUMetrics(),
      },
    };

    // Determine overall status
    const serviceStatuses = Object.values(health.services).map(s => s.status);
    if (serviceStatuses.some(s => s === 'down')) {
      health.status = 'unhealthy';
    } else if (serviceStatuses.some(s => s === 'degraded')) {
      health.status = 'degraded';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
    });
  }
});

/**
 * Liveness probe (Kubernetes)
 * GET /health/live
 */
router.get('/live', (req: Request, res: Response) => {
  // Simple check - is the process running?
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Readiness probe (Kubernetes)
 * GET /health/ready
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check if all critical services are ready
    const dbStatus = await checkDatabase();

    if (dbStatus.status === 'up') {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        reason: 'Database not available',
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
    });
  }
});

/**
 * Database status
 * GET /health/database
 */
router.get('/database', async (req: Request, res: Response) => {
  try {
    const status = await checkDatabase();
    const statusCode = status.status === 'up' ? 200 : 503;
    res.status(statusCode).json(status);
  } catch (error) {
    res.status(503).json({
      status: 'down',
      message: (error as Error).message,
    });
  }
});

/**
 * System metrics
 * GET /health/metrics
 */
router.get('/metrics', (req: Request, res: Response) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: getMemoryMetrics(),
      cpu: getCPUMetrics(),
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    };

    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message,
    });
  }
});

/**
 * Check database connection
 */
async function checkDatabase(): Promise<ServiceStatus> {
  const startTime = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;

    return {
      status: responseTime < 1000 ? 'up' : 'degraded',
      responseTime,
      message: responseTime >= 1000 ? 'Slow response' : undefined,
    };
  } catch (error) {
    return {
      status: 'down',
      message: (error as Error).message,
    };
  }
}

/**
 * Check cache (Redis)
 */
async function checkCache(): Promise<ServiceStatus> {
  try {
    // TODO: Implement Redis health check
    // const redis = getRedisClient();
    // await redis.ping();

    return {
      status: 'up',
      message: 'Redis not configured (optional)',
    };
  } catch (error) {
    return {
      status: 'degraded',
      message: 'Cache unavailable (non-critical)',
    };
  }
}

/**
 * Check storage (Cloudinary/S3)
 */
async function checkStorage(): Promise<ServiceStatus> {
  try {
    // TODO: Implement storage health check
    // Could check if API keys are configured

    const hasCloudinary = !!process.env.CLOUDINARY_CLOUD_NAME;

    return {
      status: hasCloudinary ? 'up' : 'degraded',
      message: hasCloudinary ? undefined : 'Storage not configured (optional)',
    };
  } catch (error) {
    return {
      status: 'degraded',
      message: 'Storage check failed (non-critical)',
    };
  }
}

/**
 * Get memory metrics
 */
function getMemoryMetrics(): MemoryMetrics {
  const usage = process.memoryUsage();
  const total = usage.heapTotal;
  const used = usage.heapUsed;

  return {
    used: Math.round(used / 1024 / 1024), // MB
    total: Math.round(total / 1024 / 1024), // MB
    percentage: Math.round((used / total) * 100),
  };
}

/**
 * Get CPU metrics
 */
function getCPUMetrics(): CPUMetrics {
  const usage = process.cpuUsage();
  const total = usage.user + usage.system;

  return {
    usage: Math.round((total / 1000000) * 100) / 100, // seconds
  };
}

export default router;
