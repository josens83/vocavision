/**
 * Health Check Endpoint
 *
 * Provides comprehensive health status for load balancers and monitoring systems.
 * Checks database, cache, and application health.
 *
 * GET /api/health - Basic health check
 * GET /api/health/detailed - Detailed health status
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkPoolHealth } from '@/lib/database/connectionPool';
import { cache } from '@/lib/cache/redisCache';

/**
 * Health status types
 */
type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

interface HealthCheck {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  checks: {
    database?: {
      status: HealthStatus;
      message: string;
      latency?: number;
    };
    cache?: {
      status: HealthStatus;
      message: string;
      hitRate?: number;
    };
    application?: {
      status: HealthStatus;
      message: string;
      memory?: {
        used: number;
        total: number;
        percentage: number;
      };
    };
  };
}

/**
 * Basic health check
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const detailed = url.searchParams.get('detailed') === 'true';

  try {
    const health = await performHealthCheck(detailed);

    // Return appropriate status code
    const statusCode =
      health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

    return NextResponse.json(health, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}

/**
 * Perform comprehensive health check
 */
async function performHealthCheck(detailed: boolean): Promise<HealthCheck> {
  const startTime = Date.now();
  const checks: HealthCheck['checks'] = {};

  // Check database
  try {
    const dbStart = Date.now();
    const dbHealth = await checkPoolHealth();
    const dbLatency = Date.now() - dbStart;

    checks.database = {
      status: dbHealth.healthy ? 'healthy' : 'degraded',
      message: dbHealth.message,
      ...(detailed && { latency: dbLatency }),
    };
  } catch (error) {
    checks.database = {
      status: 'unhealthy',
      message: `Database check failed: ${(error as Error).message}`,
    };
  }

  // Check cache
  try {
    const cacheStats = cache.getStats();
    const hitRate = cacheStats.hitRate;

    checks.cache = {
      status: hitRate > 0.3 || cacheStats.hits + cacheStats.misses < 100 ? 'healthy' : 'degraded',
      message: `Cache operational (hit rate: ${Math.round(hitRate * 100)}%)`,
      ...(detailed && { hitRate }),
    };
  } catch (error) {
    checks.cache = {
      status: 'degraded',
      message: `Cache check failed: ${(error as Error).message}`,
    };
  }

  // Check application
  if (detailed) {
    try {
      const memoryUsage = process.memoryUsage();
      const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
      const memoryPercentage = Math.round((memoryUsedMB / memoryTotalMB) * 100);

      checks.application = {
        status: memoryPercentage < 90 ? 'healthy' : 'degraded',
        message: `Application operational`,
        memory: {
          used: memoryUsedMB,
          total: memoryTotalMB,
          percentage: memoryPercentage,
        },
      };
    } catch (error) {
      checks.application = {
        status: 'degraded',
        message: `Application check failed: ${(error as Error).message}`,
      };
    }
  }

  // Determine overall status
  const statuses = Object.values(checks).map((check) => check.status);
  const overallStatus: HealthStatus = statuses.includes('unhealthy')
    ? 'unhealthy'
    : statuses.includes('degraded')
    ? 'degraded'
    : 'healthy';

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
  };
}

/**
 * Readiness check (for Kubernetes)
 */
export async function HEAD(): Promise<NextResponse> {
  try {
    // Simple check - just verify app is running
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
