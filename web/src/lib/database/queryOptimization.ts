/**
 * Database Query Optimization Utilities
 *
 * Provides utilities for optimizing database queries, monitoring performance,
 * and preventing common performance pitfalls like N+1 queries.
 *
 * @module lib/database/queryOptimization
 */

import { performance } from 'perf_hooks';

/**
 * Query performance thresholds (in milliseconds)
 */
const QUERY_THRESHOLDS = {
  FAST: 50,
  ACCEPTABLE: 100,
  SLOW: 500,
  CRITICAL: 1000,
} as const;

/**
 * Query performance metrics
 */
interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  stack?: string;
  params?: unknown;
}

/**
 * Query performance tracker
 */
class QueryPerformanceTracker {
  private metrics: QueryMetrics[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 queries

  /**
   * Track a database query
   */
  track(metrics: QueryMetrics): void {
    this.metrics.push(metrics);

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow queries
    if (metrics.duration > QUERY_THRESHOLDS.SLOW) {
      console.warn('Slow query detected:', {
        query: metrics.query,
        duration: `${metrics.duration}ms`,
        threshold: `${QUERY_THRESHOLDS.SLOW}ms`,
      });
    }

    // Alert on critical queries
    if (metrics.duration > QUERY_THRESHOLDS.CRITICAL) {
      console.error('Critical slow query:', {
        query: metrics.query,
        duration: `${metrics.duration}ms`,
        stack: metrics.stack,
      });
    }
  }

  /**
   * Get slow queries
   */
  getSlowQueries(threshold: number = QUERY_THRESHOLDS.SLOW): QueryMetrics[] {
    return this.metrics.filter((m) => m.duration > threshold);
  }

  /**
   * Get average query duration
   */
  getAverageDuration(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / this.metrics.length;
  }

  /**
   * Get p95 query duration
   */
  getP95Duration(): number {
    if (this.metrics.length === 0) return 0;
    const sorted = [...this.metrics].sort((a, b) => a.duration - b.duration);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index]?.duration || 0;
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    const durations = this.metrics.map((m) => m.duration);
    const sorted = [...durations].sort((a, b) => a - b);

    return {
      totalQueries: this.metrics.length,
      avgDuration: this.getAverageDuration(),
      minDuration: sorted[0] || 0,
      maxDuration: sorted[sorted.length - 1] || 0,
      p50Duration: sorted[Math.floor(sorted.length * 0.5)] || 0,
      p95Duration: this.getP95Duration(),
      p99Duration: sorted[Math.floor(sorted.length * 0.99)] || 0,
      slowQueries: this.getSlowQueries().length,
      criticalQueries: this.getSlowQueries(QUERY_THRESHOLDS.CRITICAL).length,
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }
}

/**
 * Global query performance tracker
 */
export const queryTracker = new QueryPerformanceTracker();

/**
 * Measure query execution time
 */
export async function measureQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  params?: unknown
): Promise<T> {
  const start = performance.now();
  const stack = new Error().stack;

  try {
    const result = await queryFn();
    const duration = performance.now() - start;

    queryTracker.track({
      query: queryName,
      duration,
      timestamp: new Date(),
      stack,
      params,
    });

    return result;
  } catch (error) {
    const duration = performance.now() - start;

    queryTracker.track({
      query: `${queryName} (ERROR)`,
      duration,
      timestamp: new Date(),
      stack,
      params,
    });

    throw error;
  }
}

/**
 * Batch loader for preventing N+1 queries
 *
 * @example
 * const wordLoader = new BatchLoader(async (wordIds) => {
 *   return prisma.word.findMany({
 *     where: { id: { in: wordIds } }
 *   });
 * });
 *
 * // These will be batched into a single query
 * const word1 = await wordLoader.load('id1');
 * const word2 = await wordLoader.load('id2');
 */
export class BatchLoader<K, V> {
  private queue: Array<{
    key: K;
    resolve: (value: V | null) => void;
    reject: (error: Error) => void;
  }> = [];

  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly maxBatchSize: number;
  private readonly batchDelayMs: number;

  constructor(
    private readonly batchFn: (keys: K[]) => Promise<V[]>,
    options: {
      maxBatchSize?: number;
      batchDelayMs?: number;
    } = {}
  ) {
    this.maxBatchSize = options.maxBatchSize || 100;
    this.batchDelayMs = options.batchDelayMs || 10;
  }

  /**
   * Load a single item (will be batched)
   */
  load(key: K): Promise<V | null> {
    return new Promise((resolve, reject) => {
      this.queue.push({ key, resolve, reject });

      // Clear existing timeout
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }

      // Execute immediately if batch is full
      if (this.queue.length >= this.maxBatchSize) {
        this.executeBatch();
      } else {
        // Schedule batch execution
        this.batchTimeout = setTimeout(() => {
          this.executeBatch();
        }, this.batchDelayMs);
      }
    });
  }

  /**
   * Load multiple items (will be batched)
   */
  loadMany(keys: K[]): Promise<Array<V | null>> {
    return Promise.all(keys.map((key) => this.load(key)));
  }

  /**
   * Execute batched queries
   */
  private async executeBatch(): Promise<void> {
    const batch = this.queue.splice(0, this.queue.length);

    if (batch.length === 0) return;

    const keys = batch.map((item) => item.key);

    try {
      const results = await this.batchFn(keys);

      // Create map for O(1) lookups
      const resultMap = new Map<K, V>();
      results.forEach((result) => {
        const r = result as V & { id?: K };
        if (r && 'id' in r) {
          resultMap.set(r.id as K, result);
        }
      });

      // Resolve promises
      batch.forEach(({ key, resolve }) => {
        resolve(resultMap.get(key) || null);
      });
    } catch (error) {
      // Reject all promises
      batch.forEach(({ reject }) => {
        reject(error as Error);
      });
    }
  }

  /**
   * Clear the loader cache
   */
  clear(): void {
    this.queue = [];
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }
}

/**
 * Paginated query helper
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  maxLimit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Create pagination parameters
 */
export function createPagination(options: PaginationOptions = {}) {
  const page = Math.max(1, options.page || 1);
  const maxLimit = options.maxLimit || 100;
  const limit = Math.min(Math.max(1, options.limit || 20), maxLimit);
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
    take: limit,
  };
}

/**
 * Create paginated result
 */
export function createPaginatedResult<T>(
  data: T[],
  total: number,
  options: PaginationOptions
): PaginatedResult<T> {
  const { page, limit } = createPagination(options);
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Query builder for common patterns
 */
export class QueryBuilder {
  /**
   * Build where clause for search
   */
  static searchWhere(
    fields: string[],
    searchTerm: string
  ): Record<string, unknown> {
    if (!searchTerm) return {};

    const OR = fields.map((field) => ({
      [field]: {
        contains: searchTerm,
        mode: 'insensitive' as const,
      },
    }));

    return { OR };
  }

  /**
   * Build where clause for date range
   */
  static dateRangeWhere(
    field: string,
    startDate?: Date,
    endDate?: Date
  ): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    if (startDate || endDate) {
      where[field] = {};

      if (startDate) {
        (where[field] as Record<string, unknown>).gte = startDate;
      }

      if (endDate) {
        (where[field] as Record<string, unknown>).lte = endDate;
      }
    }

    return where;
  }

  /**
   * Build order by clause
   */
  static orderBy(
    field: string,
    direction: 'asc' | 'desc' = 'desc'
  ): Record<string, string> {
    return { [field]: direction };
  }
}

/**
 * Database performance monitoring
 */
export class DatabaseMonitor {
  private static connectionCount = 0;
  private static queryCount = 0;
  private static errorCount = 0;

  /**
   * Track connection
   */
  static trackConnection(): void {
    this.connectionCount++;
  }

  /**
   * Track query
   */
  static trackQuery(): void {
    this.queryCount++;
  }

  /**
   * Track error
   */
  static trackError(): void {
    this.errorCount++;
  }

  /**
   * Get statistics
   */
  static getStats() {
    return {
      connections: this.connectionCount,
      queries: this.queryCount,
      errors: this.errorCount,
      errorRate: this.queryCount > 0 ? this.errorCount / this.queryCount : 0,
      queryPerformance: queryTracker.getSummary(),
    };
  }

  /**
   * Reset statistics
   */
  static reset(): void {
    this.connectionCount = 0;
    this.queryCount = 0;
    this.errorCount = 0;
    queryTracker.clear();
  }
}

/**
 * Query optimization suggestions
 */
export class QueryOptimizer {
  /**
   * Analyze query and provide optimization suggestions
   */
  static analyzeQuery(queryMetrics: QueryMetrics): string[] {
    const suggestions: string[] = [];

    // Check for slow queries
    if (queryMetrics.duration > QUERY_THRESHOLDS.SLOW) {
      suggestions.push('Consider adding indexes for frequently queried fields');
      suggestions.push('Check if SELECT * can be replaced with specific fields');
      suggestions.push('Review JOINs and consider denormalization if needed');
    }

    // Check for N+1 patterns
    if (queryMetrics.query.includes('findMany') && queryMetrics.duration > QUERY_THRESHOLDS.ACCEPTABLE) {
      suggestions.push('Potential N+1 query detected - consider using include or select with relations');
      suggestions.push('Use BatchLoader to batch similar queries');
    }

    // Check for missing pagination
    if (queryMetrics.query.includes('findMany') && !queryMetrics.query.includes('take')) {
      suggestions.push('Consider adding pagination (take/skip) to limit result set');
    }

    return suggestions;
  }

  /**
   * Get optimization recommendations
   */
  static getRecommendations(): string[] {
    const slowQueries = queryTracker.getSlowQueries();
    const summary = queryTracker.getSummary();

    const recommendations: string[] = [];

    if (summary.slowQueries > summary.totalQueries * 0.1) {
      recommendations.push(
        `${summary.slowQueries} slow queries detected (${Math.round((summary.slowQueries / summary.totalQueries) * 100)}% of total)`
      );
    }

    if (summary.p95Duration > QUERY_THRESHOLDS.ACCEPTABLE) {
      recommendations.push(
        `P95 query duration is ${Math.round(summary.p95Duration)}ms (target: <${QUERY_THRESHOLDS.ACCEPTABLE}ms)`
      );
      recommendations.push('Consider reviewing and optimizing the slowest queries');
    }

    if (slowQueries.length > 0) {
      // Get unique slow query patterns
      const queryPatterns = new Set(
        slowQueries.map((q) => q.query.split('(')[0])
      );

      queryPatterns.forEach((pattern) => {
        recommendations.push(`Slow query pattern detected: ${pattern}`);
      });
    }

    return recommendations;
  }
}

/**
 * Export utilities
 */
export { QUERY_THRESHOLDS, QueryPerformanceTracker };
export type { QueryMetrics };
