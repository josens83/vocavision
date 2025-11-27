// Phase 5-3: Rate Limiting & DDoS Protection
// Token Bucket and Sliding Window algorithms

import { logger } from '@/lib/utils/logger';

/**
 * Rate Limit Configuration
 */
export interface RateLimitConfig {
  maxRequests: number; // Maximum requests
  windowMs: number; // Time window in milliseconds
  message?: string; // Error message
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

/**
 * Rate Limit Result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number; // seconds
}

/**
 * Token Bucket Rate Limiter
 * Good for burst handling
 */
export class TokenBucketLimiter {
  private buckets: Map<string, { tokens: number; lastRefill: number }> = new Map();
  private maxTokens: number;
  private refillRate: number; // tokens per second
  private refillInterval: number; // ms

  constructor(maxTokens: number, refillRate: number, refillInterval: number = 1000) {
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.refillInterval = refillInterval;

    // Cleanup old buckets every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if request is allowed
   */
  check(key: string): RateLimitResult {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: this.maxTokens - 1, lastRefill: now };
      this.buckets.set(key, bucket);
      return {
        allowed: true,
        remaining: bucket.tokens,
        resetTime: now + this.refillInterval,
      };
    }

    // Refill tokens
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(timePassed / this.refillInterval) * this.refillRate;

    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(this.maxTokens, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }

    // Check if tokens available
    if (bucket.tokens > 0) {
      bucket.tokens--;
      return {
        allowed: true,
        remaining: bucket.tokens,
        resetTime: now + this.refillInterval,
      };
    }

    // No tokens available
    const retryAfter = Math.ceil((this.refillInterval - (now - bucket.lastRefill)) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetTime: bucket.lastRefill + this.refillInterval,
      retryAfter,
    };
  }

  /**
   * Cleanup old buckets
   */
  private cleanup(): void {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes

    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > maxAge) {
        this.buckets.delete(key);
      }
    }

    logger.debug('[RateLimit] Token bucket cleanup', {
      bucketsRemaining: this.buckets.size,
    });
  }
}

/**
 * Sliding Window Rate Limiter
 * More accurate than fixed window
 */
export class SlidingWindowLimiter {
  private windows: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Cleanup every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if request is allowed
   */
  check(key: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let timestamps = this.windows.get(key) || [];

    // Remove old timestamps
    timestamps = timestamps.filter((ts) => ts > windowStart);

    // Check limit
    if (timestamps.length >= this.maxRequests) {
      const oldestTimestamp = timestamps[0];
      const retryAfter = Math.ceil((oldestTimestamp + this.windowMs - now) / 1000);

      return {
        allowed: false,
        remaining: 0,
        resetTime: oldestTimestamp + this.windowMs,
        retryAfter,
      };
    }

    // Add current request
    timestamps.push(now);
    this.windows.set(key, timestamps);

    return {
      allowed: true,
      remaining: this.maxRequests - timestamps.length,
      resetTime: now + this.windowMs,
    };
  }

  /**
   * Cleanup old windows
   */
  private cleanup(): void {
    const now = Date.now();
    const maxAge = this.windowMs * 2;

    for (const [key, timestamps] of this.windows.entries()) {
      if (timestamps.length === 0 || now - timestamps[timestamps.length - 1] > maxAge) {
        this.windows.delete(key);
      }
    }

    logger.debug('[RateLimit] Sliding window cleanup', {
      windowsRemaining: this.windows.size,
    });
  }
}

/**
 * Rate Limiter Manager
 */
export class RateLimiterManager {
  private limiters: Map<string, TokenBucketLimiter | SlidingWindowLimiter> = new Map();

  /**
   * Create rate limiter
   */
  create(
    name: string,
    config: RateLimitConfig,
    type: 'token-bucket' | 'sliding-window' = 'sliding-window'
  ): void {
    if (type === 'token-bucket') {
      const refillRate = Math.ceil(config.maxRequests / (config.windowMs / 1000));
      this.limiters.set(name, new TokenBucketLimiter(config.maxRequests, refillRate));
    } else {
      this.limiters.set(name, new SlidingWindowLimiter(config.maxRequests, config.windowMs));
    }

    logger.info('[RateLimit] Created limiter', { name, type, config });
  }

  /**
   * Check rate limit
   */
  check(name: string, key: string): RateLimitResult {
    const limiter = this.limiters.get(name);

    if (!limiter) {
      logger.warn('[RateLimit] Limiter not found', { name });
      return { allowed: true, remaining: Infinity, resetTime: Date.now() };
    }

    const result = limiter.check(key);

    if (!result.allowed) {
      logger.warn('[RateLimit] Request blocked', {
        name,
        key,
        retryAfter: result.retryAfter,
      });
    }

    return result;
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiterManager();

/**
 * Predefined rate limiters
 */
export function initializeRateLimiters(): void {
  // API rate limits
  rateLimiter.create(
    'api-general',
    {
      maxRequests: 100,
      windowMs: 60 * 1000, // 100 requests per minute
    },
    'sliding-window'
  );

  rateLimiter.create(
    'api-auth',
    {
      maxRequests: 5,
      windowMs: 15 * 60 * 1000, // 5 requests per 15 minutes
      message: 'Too many authentication attempts',
    },
    'sliding-window'
  );

  rateLimiter.create(
    'api-expensive',
    {
      maxRequests: 10,
      windowMs: 60 * 1000, // 10 requests per minute
      message: 'Rate limit exceeded for this endpoint',
    },
    'token-bucket'
  );

  // Client-side rate limits
  rateLimiter.create(
    'client-search',
    {
      maxRequests: 20,
      windowMs: 60 * 1000, // 20 searches per minute
    },
    'sliding-window'
  );

  rateLimiter.create(
    'client-submit',
    {
      maxRequests: 10,
      windowMs: 60 * 1000, // 10 submissions per minute
    },
    'sliding-window'
  );

  logger.info('[RateLimit] Initialized all rate limiters');
}

/**
 * Get client identifier (IP + User Agent fingerprint)
 */
export function getClientId(request?: Request): string {
  if (typeof window !== 'undefined') {
    // Client-side: use session storage
    let clientId = sessionStorage.getItem('clientId');
    if (!clientId) {
      clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('clientId', clientId);
    }
    return clientId;
  }

  // Server-side: use IP + User Agent
  if (request) {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Simple hash
    return `${ip}-${userAgent.substring(0, 50)}`;
  }

  return 'unknown';
}

/**
 * DDoS Protection: Detect suspicious patterns
 */
export class DDoSDetector {
  private requestCounts: Map<string, { count: number; timestamp: number }> = new Map();
  private threshold: number;
  private windowMs: number;

  constructor(threshold: number = 1000, windowMs: number = 60000) {
    this.threshold = threshold;
    this.windowMs = windowMs;

    // Cleanup every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  /**
   * Check if client is suspicious
   */
  check(clientId: string): { suspicious: boolean; requestCount: number } {
    const now = Date.now();
    const record = this.requestCounts.get(clientId);

    if (!record || now - record.timestamp > this.windowMs) {
      this.requestCounts.set(clientId, { count: 1, timestamp: now });
      return { suspicious: false, requestCount: 1 };
    }

    record.count++;

    if (record.count > this.threshold) {
      logger.error('[DDoS] Suspicious activity detected', new Error(`clientId: ${clientId}, requestCount: ${record.count}, windowMs: ${this.windowMs}`));

      return { suspicious: true, requestCount: record.count };
    }

    return { suspicious: false, requestCount: record.count };
  }

  /**
   * Cleanup old records
   */
  private cleanup(): void {
    const now = Date.now();

    for (const [key, record] of this.requestCounts.entries()) {
      if (now - record.timestamp > this.windowMs * 2) {
        this.requestCounts.delete(key);
      }
    }
  }
}

// Global DDoS detector
export const ddosDetector = new DDoSDetector();

console.log('[RateLimit] Module loaded');
