/**
 * API Response Caching
 *
 * Middleware for caching API responses with support for:
 * - Conditional caching based on HTTP method and status
 * - Cache key generation from request parameters
 * - Cache invalidation strategies
 * - ETag support
 *
 * @module lib/cache/apiCache
 */

import { cache, CacheManager } from './redisCache';

/**
 * API cache configuration
 */
export interface ApiCacheConfig {
  ttl?: number;
  methods?: string[];
  statusCodes?: number[];
  keyPrefix?: string;
  varyBy?: ('url' | 'query' | 'body' | 'headers')[];
  excludeHeaders?: string[];
}

/**
 * Default API cache configuration
 */
const DEFAULT_API_CACHE_CONFIG: Required<Omit<ApiCacheConfig, 'excludeHeaders'>> = {
  ttl: 300, // 5 minutes
  methods: ['GET'],
  statusCodes: [200],
  keyPrefix: 'api:',
  varyBy: ['url', 'query'],
};

/**
 * API cache manager
 */
export class ApiCacheManager {
  private cacheManager: CacheManager;
  private config: Required<Omit<ApiCacheConfig, 'excludeHeaders'>>;

  constructor(config: ApiCacheConfig = {}) {
    this.config = { ...DEFAULT_API_CACHE_CONFIG, ...config };
    this.cacheManager = new CacheManager({
      prefix: this.config.keyPrefix,
      ttl: this.config.ttl,
    });
  }

  /**
   * Generate cache key from request
   */
  generateKey(request: {
    url: string;
    method: string;
    query?: Record<string, unknown>;
    body?: unknown;
    headers?: Record<string, string>;
  }): string {
    const parts: string[] = [request.method, request.url];

    if (this.config.varyBy.includes('query') && request.query) {
      const queryString = new URLSearchParams(
        request.query as Record<string, string>
      ).toString();
      if (queryString) {
        parts.push(`query:${queryString}`);
      }
    }

    if (this.config.varyBy.includes('body') && request.body) {
      const bodyHash = this.hashObject(request.body);
      parts.push(`body:${bodyHash}`);
    }

    if (this.config.varyBy.includes('headers') && request.headers) {
      const headersHash = this.hashObject(request.headers);
      parts.push(`headers:${headersHash}`);
    }

    return parts.join(':');
  }

  /**
   * Hash object for cache key
   */
  private hashObject(obj: unknown): string {
    const str = JSON.stringify(obj);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if request should be cached
   */
  shouldCache(method: string, statusCode: number): boolean {
    return (
      this.config.methods.includes(method.toUpperCase()) &&
      this.config.statusCodes.includes(statusCode)
    );
  }

  /**
   * Get cached response
   */
  async get<T>(key: string): Promise<T | null> {
    return this.cacheManager.get<T>(key);
  }

  /**
   * Set cached response
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    return this.cacheManager.set(key, value, ttl);
  }

  /**
   * Delete cached response
   */
  async delete(key: string): Promise<void> {
    return this.cacheManager.delete(key);
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidate(pattern: string): Promise<number> {
    return this.cacheManager.deletePattern(pattern);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return this.cacheManager.getStats();
  }
}

/**
 * Default API cache instance
 */
export const apiCache = new ApiCacheManager();

/**
 * API cache middleware for Next.js API routes
 */
export function withCache(
  handler: (req: Request) => Promise<Response>,
  config?: ApiCacheConfig
): (req: Request) => Promise<Response> {
  const cacheManager = new ApiCacheManager(config);

  return async (req: Request) => {
    const url = new URL(req.url);
    const method = req.method;

    // Generate cache key
    const cacheKey = cacheManager.generateKey({
      url: url.pathname,
      method,
      query: Object.fromEntries(url.searchParams),
    });

    // Try to get from cache (only for GET requests)
    if (method === 'GET') {
      const cached = await cacheManager.get<{
        status: number;
        headers: Record<string, string>;
        body: unknown;
      }>(cacheKey);

      if (cached) {
        // Return cached response
        return new Response(JSON.stringify(cached.body), {
          status: cached.status,
          headers: {
            ...cached.headers,
            'X-Cache': 'HIT',
            'X-Cache-Key': cacheKey,
          },
        });
      }
    }

    // Call handler
    const response = await handler(req);

    // Cache response if appropriate
    if (cacheManager.shouldCache(method, response.status)) {
      const body = await response.json();
      const headers: Record<string, string> = {};

      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      await cacheManager.set(
        cacheKey,
        {
          status: response.status,
          headers,
          body,
        },
        config?.ttl
      );

      // Return new response with cache headers
      return new Response(JSON.stringify(body), {
        status: response.status,
        headers: {
          ...headers,
          'X-Cache': 'MISS',
          'X-Cache-Key': cacheKey,
        },
      });
    }

    return response;
  };
}

/**
 * Cache strategies
 */
export const CacheStrategies = {
  /**
   * Cache-First: Return cached data if available
   */
  cacheFirst: async <T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> => {
    return cache.getOrSet(key, fetchFn, ttl);
  },

  /**
   * Network-First: Always fetch fresh data, fallback to cache on error
   */
  networkFirst: async <T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> => {
    try {
      const data = await fetchFn();
      await cache.set(key, data, ttl);
      return data;
    } catch (error) {
      const cached = await cache.get<T>(key);
      if (cached !== null) {
        console.warn('Using cached data due to fetch error:', error);
        return cached;
      }
      throw error;
    }
  },

  /**
   * Stale-While-Revalidate: Return cached data immediately, update in background
   */
  staleWhileRevalidate: async <T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> => {
    const cached = await cache.get<T>(key);

    // Return cached data if available
    if (cached !== null) {
      // Update cache in background
      fetchFn()
        .then((data) => cache.set(key, data, ttl))
        .catch((error) => console.error('Background fetch error:', error));

      return cached;
    }

    // No cache, fetch and cache
    const data = await fetchFn();
    await cache.set(key, data, ttl);
    return data;
  },

  /**
   * Cache-Only: Only return cached data, never fetch
   */
  cacheOnly: async <T>(key: string): Promise<T | null> => {
    return cache.get<T>(key);
  },

  /**
   * Network-Only: Never use cache, always fetch fresh
   */
  networkOnly: async <T>(fetchFn: () => Promise<T>): Promise<T> => {
    return fetchFn();
  },
};

/**
 * Cache tags for invalidation
 */
export class CacheTags {
  /**
   * Tag a cache entry
   */
  static async tag(key: string, tags: string[]): Promise<void> {
    const tagKey = (tag: string) => `tag:${tag}`;

    for (const tag of tags) {
      const taggedKeys = (await cache.get<string[]>(tagKey(tag))) || [];
      taggedKeys.push(key);
      await cache.set(tagKey(tag), taggedKeys, 86400); // 24 hours
    }
  }

  /**
   * Invalidate by tag
   */
  static async invalidate(tag: string): Promise<number> {
    const tagKey = `tag:${tag}`;
    const keys = (await cache.get<string[]>(tagKey)) || [];

    await cache.deleteMany(keys);
    await cache.delete(tagKey);

    return keys.length;
  }

  /**
   * Invalidate multiple tags
   */
  static async invalidateMany(tags: string[]): Promise<number> {
    let total = 0;
    for (const tag of tags) {
      total += await this.invalidate(tag);
    }
    return total;
  }
}

/**
 * Cache warming scheduler
 */
export class CacheWarmer {
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Schedule cache warming
   */
  schedule(
    name: string,
    fetchFn: () => Promise<unknown>,
    cacheKey: string,
    intervalMs: number,
    ttl?: number
  ): void {
    // Clear existing interval
    this.cancel(name);

    // Warm cache immediately
    this.warm(name, fetchFn, cacheKey, ttl);

    // Schedule periodic warming
    const interval = setInterval(() => {
      this.warm(name, fetchFn, cacheKey, ttl);
    }, intervalMs);

    this.intervals.set(name, interval);
  }

  /**
   * Warm cache once
   */
  private async warm(
    name: string,
    fetchFn: () => Promise<unknown>,
    cacheKey: string,
    ttl?: number
  ): Promise<void> {
    try {
      const data = await fetchFn();
      await cache.set(cacheKey, data, ttl);
      console.log(`Cache warmed: ${name} (key: ${cacheKey})`);
    } catch (error) {
      console.error(`Cache warming failed for ${name}:`, error);
    }
  }

  /**
   * Cancel scheduled warming
   */
  cancel(name: string): void {
    const interval = this.intervals.get(name);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(name);
    }
  }

  /**
   * Cancel all scheduled warming
   */
  cancelAll(): void {
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals.clear();
  }
}

/**
 * Global cache warmer instance
 */
export const cacheWarmer = new CacheWarmer();

/**
 * Cache monitoring
 */
export class CacheMonitor {
  /**
   * Get cache health
   */
  static getHealth(): {
    healthy: boolean;
    hitRate: number;
    stats: ReturnType<typeof cache.getStats>;
  } {
    const stats = cache.getStats();
    const hitRate = stats.hitRate;

    return {
      healthy: hitRate > 0.5 || stats.hits + stats.misses < 100, // Healthy if >50% hit rate or too few samples
      hitRate,
      stats,
    };
  }

  /**
   * Get cache performance recommendations
   */
  static getRecommendations(): string[] {
    const { hitRate, stats } = this.getHealth();
    const recommendations: string[] = [];

    if (hitRate < 0.3) {
      recommendations.push(
        `Low cache hit rate (${Math.round(hitRate * 100)}%). Consider increasing TTL or warming more data.`
      );
    }

    if (hitRate < 0.5) {
      recommendations.push(
        `Cache hit rate is ${Math.round(hitRate * 100)}% (target: >50%). Review caching strategy.`
      );
    }

    if (stats.errors > stats.sets * 0.1) {
      recommendations.push(
        `High error rate (${Math.round((stats.errors / stats.sets) * 100)}%). Check cache connection.`
      );
    }

    return recommendations;
  }
}

/**
 * Export utilities
 */
export { DEFAULT_API_CACHE_CONFIG };
