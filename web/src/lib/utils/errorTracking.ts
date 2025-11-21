// Phase 2-7: Error Tracking System
// Benchmarking: Sentry, Bugsnag, Rollbar
// Ready for Sentry integration

import { logger } from './logger';

export interface ErrorContext {
  user?: {
    id?: string;
    email?: string;
    username?: string;
  };
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  fingerprint?: string[];
}

export interface Breadcrumb {
  timestamp: number;
  category: string;
  message: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

class ErrorTracker {
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs: number = 50;
  private context: ErrorContext = {};
  private enabled: boolean = true;

  /**
   * Initialize error tracking
   */
  init(options: {
    dsn?: string;
    environment?: string;
    release?: string;
    enabled?: boolean;
  }): void {
    this.enabled = options.enabled !== false;

    if (!this.enabled) {
      console.log('[ErrorTracking] Disabled');
      return;
    }

    // Set up global error handlers
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleGlobalError.bind(this));
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    }

    // TODO: Initialize Sentry if DSN provided
    // if (options.dsn) {
    //   Sentry.init({
    //     dsn: options.dsn,
    //     environment: options.environment,
    //     release: options.release,
    //   });
    // }

    logger.info('[ErrorTracking] Initialized', options);
  }

  /**
   * Capture error
   */
  captureError(
    error: Error,
    context?: ErrorContext
  ): string {
    if (!this.enabled) {
      return '';
    }

    const errorId = this.generateErrorId();

    const fullContext = {
      ...this.context,
      ...context,
      breadcrumbs: this.breadcrumbs,
      errorId,
    };

    // Log error
    logger.error(
      `Error captured: ${error.message}`,
      error,
      fullContext
    );

    // TODO: Send to Sentry
    // if (Sentry) {
    //   Sentry.captureException(error, {
    //     contexts: fullContext,
    //   });
    // }

    // Console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🐛 Error [${errorId}]`);
      console.error(error);
      console.log('Context:', fullContext);
      console.log('Breadcrumbs:', this.breadcrumbs);
      console.groupEnd();
    }

    return errorId;
  }

  /**
   * Capture message
   */
  captureMessage(
    message: string,
    level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
    context?: ErrorContext
  ): string {
    if (!this.enabled) {
      return '';
    }

    const messageId = this.generateErrorId();

    const fullContext = {
      ...this.context,
      ...context,
      messageId,
    };

    logger.info(`Message captured: ${message}`, fullContext);

    // TODO: Send to Sentry
    // if (Sentry) {
    //   Sentry.captureMessage(message, level);
    // }

    return messageId;
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    if (!this.enabled) {
      return;
    }

    this.breadcrumbs.push({
      ...breadcrumb,
      timestamp: Date.now(),
    });

    // Keep only last N breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  /**
   * Set user context
   */
  setUser(user: ErrorContext['user']): void {
    this.context.user = user;

    // TODO: Set in Sentry
    // if (Sentry) {
    //   Sentry.setUser(user);
    // }
  }

  /**
   * Set tags
   */
  setTags(tags: Record<string, string>): void {
    this.context.tags = {
      ...this.context.tags,
      ...tags,
    };

    // TODO: Set in Sentry
    // if (Sentry) {
    //   Sentry.setTags(tags);
    // }
  }

  /**
   * Set extra context
   */
  setExtra(key: string, value: any): void {
    if (!this.context.extra) {
      this.context.extra = {};
    }
    this.context.extra[key] = value;

    // TODO: Set in Sentry
    // if (Sentry) {
    //   Sentry.setExtra(key, value);
    // }
  }

  /**
   * Clear context
   */
  clearContext(): void {
    this.context = {};
    this.breadcrumbs = [];

    // TODO: Clear in Sentry
    // if (Sentry) {
    //   Sentry.configureScope((scope) => scope.clear());
    // }
  }

  /**
   * Handle global errors
   */
  private handleGlobalError(event: ErrorEvent): void {
    this.addBreadcrumb({
      category: 'error',
      message: 'Global error caught',
      level: 'error',
      data: {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });

    if (event.error) {
      this.captureError(event.error, {
        tags: {
          errorType: 'global',
        },
      });
    }
  }

  /**
   * Handle unhandled promise rejections
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    this.addBreadcrumb({
      category: 'promise',
      message: 'Unhandled promise rejection',
      level: 'error',
      data: {
        reason: event.reason,
      },
    });

    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));

    this.captureError(error, {
      tags: {
        errorType: 'unhandledRejection',
      },
    });
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get breadcrumbs
   */
  getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }

  /**
   * Enable/disable tracking
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// Global error tracker instance
export const errorTracker = new ErrorTracker();

/**
 * Convenience functions
 */
export function captureError(error: Error, context?: ErrorContext): string {
  return errorTracker.captureError(error, context);
}

export function captureMessage(
  message: string,
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug',
  context?: ErrorContext
): string {
  return errorTracker.captureMessage(message, level, context);
}

export function addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
  errorTracker.addBreadcrumb(breadcrumb);
}

/**
 * React error boundary helper
 */
export function logErrorBoundary(
  error: Error,
  errorInfo: React.ErrorInfo,
  componentName?: string
): void {
  errorTracker.addBreadcrumb({
    category: 'react',
    message: `Error in ${componentName || 'component'}`,
    level: 'error',
    data: {
      componentStack: errorInfo.componentStack,
    },
  });

  errorTracker.captureError(error, {
    tags: {
      errorType: 'react',
      component: componentName || 'unknown',
    },
    extra: {
      componentStack: errorInfo.componentStack,
    },
  });
}

/**
 * API error helper
 */
export function logAPIError(
  error: Error,
  request: {
    url: string;
    method: string;
    status?: number;
  }
): void {
  errorTracker.addBreadcrumb({
    category: 'api',
    message: `API ${request.method} ${request.url} failed`,
    level: 'error',
    data: {
      status: request.status,
    },
  });

  errorTracker.captureError(error, {
    tags: {
      errorType: 'api',
      method: request.method,
      status: String(request.status || 0),
    },
    extra: {
      url: request.url,
    },
  });
}

console.log('[ErrorTracking] Module loaded');
