// Phase 4-3: Application Performance Monitoring (APM)
// Real-time performance metrics collection and reporting

import { logger } from '@/lib/utils/logger';
import { reportWebVital } from '@/lib/utils/performance';

/**
 * APM Metrics Storage
 */
interface APMMetrics {
  requests: RequestMetric[];
  resources: ResourceMetric[];
  errors: ErrorMetric[];
  customMetrics: CustomMetric[];
}

interface RequestMetric {
  id: string;
  method: string;
  url: string;
  status: number;
  duration: number;
  timestamp: number;
  size?: number;
}

interface ResourceMetric {
  name: string;
  type: string;
  duration: number;
  size: number;
  timestamp: number;
}

interface ErrorMetric {
  message: string;
  stack?: string;
  timestamp: number;
  url: string;
}

interface CustomMetric {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp: number;
}

class APMCollector {
  private metrics: APMMetrics = {
    requests: [],
    resources: [],
    errors: [],
    customMetrics: [],
  };

  private maxMetricsPerType = 100;
  private flushInterval = 60000; // 60s
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.startAutoFlush();
      this.setupObservers();
    }
  }

  /**
   * Track API request
   */
  trackRequest(metric: Omit<RequestMetric, 'id' | 'timestamp'>): void {
    const request: RequestMetric = {
      ...metric,
      id: this.generateId(),
      timestamp: Date.now(),
    };

    this.metrics.requests.push(request);
    this.trimMetrics('requests');

    // Log slow requests
    if (request.duration > 3000) {
      logger.warn('[APM] Slow request detected', {
        url: request.url,
        duration: `${request.duration}ms`,
        status: request.status,
      });
    }

    // Log failed requests
    if (request.status >= 400) {
      logger.error('[APM] Request failed', new Error(`${request.url} - ${request.status} - ${request.duration}ms`));
    }
  }

  /**
   * Track resource loading
   */
  trackResource(metric: Omit<ResourceMetric, 'timestamp'>): void {
    const resource: ResourceMetric = {
      ...metric,
      timestamp: Date.now(),
    };

    this.metrics.resources.push(resource);
    this.trimMetrics('resources');

    // Log slow resources
    if (resource.duration > 2000) {
      logger.warn('[APM] Slow resource detected', {
        name: resource.name,
        type: resource.type,
        duration: `${resource.duration}ms`,
        size: `${(resource.size / 1024).toFixed(2)}KB`,
      });
    }
  }

  /**
   * Track error
   */
  trackError(metric: Omit<ErrorMetric, 'timestamp'>): void {
    const error: ErrorMetric = {
      ...metric,
      timestamp: Date.now(),
    };

    this.metrics.errors.push(error);
    this.trimMetrics('errors');

    logger.error('[APM] Error tracked', new Error(`${error.message} - ${error.url}`));
  }

  /**
   * Track custom metric
   */
  trackCustom(name: string, value: number, tags?: Record<string, string>): void {
    const metric: CustomMetric = {
      name,
      value,
      tags,
      timestamp: Date.now(),
    };

    this.metrics.customMetrics.push(metric);
    this.trimMetrics('customMetrics');

    logger.debug('[APM] Custom metric', { name, value, tags });
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary(): {
    requests: {
      total: number;
      success: number;
      failed: number;
      avgDuration: number;
      slowest: RequestMetric | null;
    };
    resources: {
      total: number;
      totalSize: number;
      avgDuration: number;
      byType: Record<string, number>;
    };
    errors: {
      total: number;
      recent: ErrorMetric[];
    };
    custom: {
      total: number;
      byName: Record<string, { count: number; avg: number; min: number; max: number }>;
    };
  } {
    const { requests, resources, errors, customMetrics } = this.metrics;

    // Requests summary
    const successRequests = requests.filter((r) => r.status < 400);
    const failedRequests = requests.filter((r) => r.status >= 400);
    const avgDuration =
      requests.length > 0
        ? requests.reduce((sum, r) => sum + r.duration, 0) / requests.length
        : 0;
    const slowest =
      requests.length > 0
        ? requests.reduce((slowest, r) => (r.duration > slowest.duration ? r : slowest))
        : null;

    // Resources summary
    const totalSize = resources.reduce((sum, r) => sum + r.size, 0);
    const avgResourceDuration =
      resources.length > 0
        ? resources.reduce((sum, r) => sum + r.duration, 0) / resources.length
        : 0;
    const byType: Record<string, number> = {};
    resources.forEach((r) => {
      byType[r.type] = (byType[r.type] || 0) + 1;
    });

    // Custom metrics summary
    const byName: Record<string, { count: number; avg: number; min: number; max: number }> = {};
    customMetrics.forEach((m) => {
      if (!byName[m.name]) {
        byName[m.name] = { count: 0, avg: 0, min: Infinity, max: -Infinity };
      }
      byName[m.name].count++;
      byName[m.name].avg =
        (byName[m.name].avg * (byName[m.name].count - 1) + m.value) / byName[m.name].count;
      byName[m.name].min = Math.min(byName[m.name].min, m.value);
      byName[m.name].max = Math.max(byName[m.name].max, m.value);
    });

    return {
      requests: {
        total: requests.length,
        success: successRequests.length,
        failed: failedRequests.length,
        avgDuration: Math.round(avgDuration),
        slowest,
      },
      resources: {
        total: resources.length,
        totalSize,
        avgDuration: Math.round(avgResourceDuration),
        byType,
      },
      errors: {
        total: errors.length,
        recent: errors.slice(-10),
      },
      custom: {
        total: customMetrics.length,
        byName,
      },
    };
  }

  /**
   * Flush metrics to remote endpoint
   */
  async flush(): Promise<void> {
    if (this.metrics.requests.length === 0 && this.metrics.errors.length === 0) {
      return;
    }

    const summary = this.getMetricsSummary();

    logger.info('[APM] Metrics summary', summary);

    // TODO Phase 4: Send to APM service (Datadog, New Relic, etc.)
    // const endpoint = process.env.NEXT_PUBLIC_APM_ENDPOINT;
    // if (endpoint) {
    //   try {
    //     await fetch(endpoint, {
    //       method: 'POST',
    //       headers: { 'Content-Type': 'application/json' },
    //       body: JSON.stringify(this.metrics),
    //     });
    //   } catch (error) {
    //     console.error('[APM] Failed to send metrics:', error);
    //   }
    // }

    // Clear old metrics
    this.clearOldMetrics();
  }

  /**
   * Setup performance observers
   */
  private setupObservers(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      // Observe resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource') {
            const resource = entry as PerformanceResourceTiming;
            this.trackResource({
              name: resource.name,
              type: resource.initiatorType,
              duration: resource.duration,
              size: resource.transferSize || 0,
            });
          }
        });
      });

      resourceObserver.observe({ type: 'resource', buffered: true });

      // Observe navigation timing
      const navigationObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const nav = entry as PerformanceNavigationTiming;
            this.trackCustom('page_load', nav.loadEventEnd - nav.fetchStart);
            this.trackCustom('dom_interactive', nav.domInteractive - nav.fetchStart);
            this.trackCustom('dom_complete', nav.domComplete - nav.fetchStart);
          }
        });
      });

      navigationObserver.observe({ type: 'navigation', buffered: true });

      logger.info('[APM] Performance observers setup complete');
    } catch (error) {
      logger.error('[APM] Failed to setup observers:', error as Error);
    }
  }

  /**
   * Trim metrics to max size
   */
  private trimMetrics(type: keyof APMMetrics): void {
    const metrics = this.metrics[type];
    if (metrics.length > this.maxMetricsPerType) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.metrics as any)[type] = metrics.slice(-this.maxMetricsPerType);
    }
  }

  /**
   * Clear old metrics (older than 5 minutes)
   */
  private clearOldMetrics(): void {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    this.metrics.requests = this.metrics.requests.filter((m) => m.timestamp > fiveMinutesAgo);
    this.metrics.resources = this.metrics.resources.filter((m) => m.timestamp > fiveMinutesAgo);
    this.metrics.errors = this.metrics.errors.filter((m) => m.timestamp > fiveMinutesAgo);
    this.metrics.customMetrics = this.metrics.customMetrics.filter(
      (m) => m.timestamp > fiveMinutesAgo
    );
  }

  /**
   * Start auto flush timer
   */
  private startAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Stop auto flush
   */
  stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global APM collector instance
export const apm = new APMCollector();

/**
 * Convenience functions
 */
export function trackRequest(
  method: string,
  url: string,
  status: number,
  duration: number,
  size?: number
): void {
  apm.trackRequest({ method, url, status, duration, size });
}

export function trackResource(
  name: string,
  type: string,
  duration: number,
  size: number
): void {
  apm.trackResource({ name, type, duration, size });
}

export function trackError(message: string, url: string, stack?: string): void {
  apm.trackError({ message, url, stack });
}

export function trackCustomMetric(
  name: string,
  value: number,
  tags?: Record<string, string>
): void {
  apm.trackCustom(name, value, tags);
}

export function getAPMSummary() {
  return apm.getMetricsSummary();
}

console.log('[APM] Module loaded');
