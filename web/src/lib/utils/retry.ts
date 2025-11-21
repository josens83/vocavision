// Phase 2-1: Netflix-style Retry Logic with Exponential Backoff
// Benchmarking: Netflix Hystrix, AWS SDK retry strategies

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  timeout: number; // milliseconds
  retryableStatuses: number[];
  retryableErrors: string[];
  enableJitter: boolean;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 300, // 300ms
  maxDelay: 10000, // 10s
  timeout: 30000, // 30s
  retryableStatuses: [408, 429, 500, 502, 503, 504], // Timeout, Rate limit, Server errors
  retryableErrors: ['ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'ECONNABORTED'],
  enableJitter: true,
};

/**
 * Calculate exponential backoff delay with jitter
 * Formula: min(maxDelay, baseDelay * (2^attempt)) + jitter
 */
export function calculateBackoff(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  enableJitter: boolean
): number {
  // Exponential: 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);

  // Cap at maxDelay
  let delay = Math.min(exponentialDelay, maxDelay);

  // Add jitter to prevent thundering herd problem
  if (enableJitter) {
    // Random jitter between 0 and delay/2
    const jitter = Math.random() * delay * 0.5;
    delay = delay + jitter;
  }

  return Math.floor(delay);
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any, config: RetryConfig): boolean {
  // Network errors
  if (error.code && config.retryableErrors.includes(error.code)) {
    return true;
  }

  // HTTP status codes
  if (error.response?.status && config.retryableStatuses.includes(error.response.status)) {
    return true;
  }

  // Timeout errors
  if (error.message?.includes('timeout')) {
    return true;
  }

  return false;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: any;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      // Execute function with timeout
      const result = await withTimeout(fn(), finalConfig.timeout);

      // Success - return result
      if (attempt > 0) {
        console.log(`✅ Retry succeeded after ${attempt} attempts`);
      }
      return result;

    } catch (error: any) {
      lastError = error;

      // Don't retry if not retryable error
      if (!isRetryableError(error, finalConfig)) {
        console.error('❌ Non-retryable error:', error.message);
        throw error;
      }

      // Don't retry if max retries reached
      if (attempt >= finalConfig.maxRetries) {
        console.error(`❌ Max retries (${finalConfig.maxRetries}) reached`);
        break;
      }

      // Calculate delay
      const delay = calculateBackoff(
        attempt,
        finalConfig.baseDelay,
        finalConfig.maxDelay,
        finalConfig.enableJitter
      );

      console.warn(
        `⚠️ Retry attempt ${attempt + 1}/${finalConfig.maxRetries} after ${delay}ms`,
        `Error: ${error.message || error.code}`
      );

      // Wait before retry
      await sleep(delay);
    }
  }

  // All retries failed
  throw lastError;
}

/**
 * Add timeout to promise
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

/**
 * Retry metrics for monitoring
 */
export interface RetryMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  retriedRequests: number;
  totalRetries: number;
  averageRetries: number;
}

export class RetryMetricsCollector {
  private metrics: RetryMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    retriedRequests: 0,
    totalRetries: 0,
    averageRetries: 0,
  };

  recordRequest(succeeded: boolean, retries: number): void {
    this.metrics.totalRequests++;

    if (succeeded) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    if (retries > 0) {
      this.metrics.retriedRequests++;
      this.metrics.totalRetries += retries;
    }

    this.metrics.averageRetries =
      this.metrics.retriedRequests > 0
        ? this.metrics.totalRetries / this.metrics.retriedRequests
        : 0;
  }

  getMetrics(): RetryMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      retriedRequests: 0,
      totalRetries: 0,
      averageRetries: 0,
    };
  }
}

// Global metrics collector
export const retryMetrics = new RetryMetricsCollector();
