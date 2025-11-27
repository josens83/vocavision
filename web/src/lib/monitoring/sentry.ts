// Phase 4-1: Sentry Integration for Error Tracking
// Production-ready error monitoring and reporting

/**
 * Sentry Configuration
 *
 * To use Sentry in production:
 * 1. Install: npm install @sentry/nextjs
 * 2. Set environment variable: NEXT_PUBLIC_SENTRY_DSN
 * 3. Uncomment the Sentry.init() calls below
 * 4. Create sentry.client.config.js and sentry.server.config.js in project root
 */

import { errorTracker } from '@/lib/utils/errorTracking';
import { logger } from '@/lib/utils/logger';

// Sentry will be dynamically imported when available
let Sentry: any = null;

/**
 * Initialize Sentry (Client-side)
 */
export function initSentryClient(): void {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const environment = process.env.NODE_ENV;
  const release = process.env.NEXT_PUBLIC_APP_VERSION || 'unknown';

  if (!dsn) {
    console.warn('[Sentry] DSN not configured. Error tracking disabled.');
    return;
  }

  try {
    // Dynamically import Sentry to avoid errors if not installed
    // Uncomment when @sentry/nextjs is installed:
    /*
    import('@sentry/nextjs').then((SentryModule) => {
      Sentry = SentryModule;

      Sentry.init({
        dsn,
        environment,
        release,

        // Performance monitoring
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0,

        // Session replay
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,

        // Filtering
        beforeSend(event, hint) {
          // Don't send errors from browser extensions
          if (event.request?.url?.includes('chrome-extension://')) {
            return null;
          }

          // Filter out low-priority errors
          if (event.level === 'info' || event.level === 'debug') {
            return null;
          }

          return event;
        },

        // Integrations
        integrations: [
          new Sentry.BrowserTracing({
            tracePropagationTargets: [
              'localhost',
              process.env.NEXT_PUBLIC_API_URL || '',
            ],
          }),
          new Sentry.Replay({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
      });

      logger.info('[Sentry] Client initialized', { environment, release });
    });
    */

    // Fallback to custom error tracker
    errorTracker.init({
      enabled: true,
      environment,
      release,
    });

    logger.info('[Sentry] Using custom error tracker (Sentry not installed)');
  } catch (error) {
    console.error('[Sentry] Initialization failed:', error);
  }
}

/**
 * Initialize Sentry (Server-side)
 */
export function initSentryServer(): void {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV;
  const release = process.env.APP_VERSION || 'unknown';

  if (!dsn) {
    console.warn('[Sentry] DSN not configured. Error tracking disabled.');
    return;
  }

  try {
    // Uncomment when @sentry/nextjs is installed:
    /*
    import('@sentry/nextjs').then((SentryModule) => {
      Sentry = SentryModule;

      Sentry.init({
        dsn,
        environment,
        release,
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
      });

      console.log('[Sentry] Server initialized', { environment, release });
    });
    */

    console.log('[Sentry] Using custom error tracker (Sentry not installed)');
  } catch (error) {
    console.error('[Sentry] Initialization failed:', error);
  }
}

/**
 * Capture exception with context
 */
export function captureException(
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    user?: { id?: string; email?: string; username?: string };
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  }
): string {
  if (Sentry) {
    // Use Sentry if available
    Sentry.captureException(error, {
      tags: context?.tags,
      extra: context?.extra,
      user: context?.user,
      level: context?.level || 'error',
    });
  }

  // Also use custom error tracker
  return errorTracker.captureError(error, context);
}

/**
 * Capture message with context
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: Record<string, any>
): string {
  if (Sentry) {
    Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  }

  return errorTracker.captureMessage(message, level, { extra: context });
}

/**
 * Set user context
 */
export function setUser(user: {
  id?: string;
  email?: string;
  username?: string;
}): void {
  if (Sentry) {
    Sentry.setUser(user);
  }

  errorTracker.setUser(user);
}

/**
 * Set tags
 */
export function setTags(tags: Record<string, string>): void {
  if (Sentry) {
    Sentry.setTags(tags);
  }

  errorTracker.setTags(tags);
}

/**
 * Set extra context
 */
export function setExtra(key: string, value: any): void {
  if (Sentry) {
    Sentry.setExtra(key, value);
  }

  errorTracker.setExtra(key, value);
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(breadcrumb: {
  message: string;
  category: string;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  data?: Record<string, any>;
}): void {
  if (Sentry) {
    Sentry.addBreadcrumb(breadcrumb);
  }

  errorTracker.addBreadcrumb({
    message: breadcrumb.message,
    category: breadcrumb.category,
    level: (breadcrumb.level === 'fatal' ? 'error' : breadcrumb.level) || 'info',
    data: breadcrumb.data,
  });
}

/**
 * Start transaction for performance monitoring
 */
export function startTransaction(
  name: string,
  op: string
): {
  finish: () => void;
  setTag: (key: string, value: string) => void;
  setData: (key: string, value: any) => void;
} {
  if (Sentry) {
    const transaction = Sentry.startTransaction({ name, op });

    return {
      finish: () => transaction.finish(),
      setTag: (key, value) => transaction.setTag(key, value),
      setData: (key, value) => transaction.setData(key, value),
    };
  }

  // Fallback implementation
  const startTime = performance.now();

  return {
    finish: () => {
      const duration = performance.now() - startTime;
      logger.info(`Transaction: ${name}`, { op, duration: `${duration.toFixed(2)}ms` });
    },
    setTag: (key, value) => {
      logger.debug(`Transaction tag: ${key} = ${value}`);
    },
    setData: (key, value) => {
      logger.debug(`Transaction data: ${key}`, value);
    },
  };
}

/**
 * Measure function performance
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T> | T
): Promise<T> {
  const transaction = startTransaction(name, 'function');

  try {
    const result = await fn();
    transaction.setTag('status', 'success');
    return result;
  } catch (error) {
    transaction.setTag('status', 'error');
    if (error instanceof Error) {
      captureException(error, {
        tags: { function: name },
      });
    }
    throw error;
  } finally {
    transaction.finish();
  }
}

/**
 * Flush pending events (useful for serverless)
 */
export async function flush(timeout: number = 2000): Promise<boolean> {
  if (Sentry) {
    return await Sentry.flush(timeout);
  }

  // Flush custom logger
  await logger.flush();
  return true;
}

console.log('[Sentry] Module loaded');
