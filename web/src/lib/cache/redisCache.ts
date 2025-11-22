/**
 * Redis Cache Layer
 *
 * Provides high-performance caching using Redis with support for:
 * - TTL (Time To Live)
 * - Cache invalidation
 * - Cache warming
 * - Cache statistics
 *
 * @module lib/cache/redisCache
 */

/**
 * Cache configuration
 */
export interface CacheConfig {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix
  serialize?: (value: unknown) => string;
  deserialize?: (value: string) => unknown;
}

/**
 * Default cache configuration
 */
const DEFAULT_CONFIG: Required<CacheConfig> = {
  ttl: 3600, // 1 hour
  prefix: 'vocavision:',
  serialize: JSON.stringify,
  deserialize: JSON.parse,
};

/**
 * Cache statistics
 */
interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
}

/**
 * Redis cache client (mock implementation for now)
 * In production, replace with actual Redis client (e.g., ioredis)
 */
class RedisCacheClient {
  private store: Map<string, { value: string; expiresAt: number }> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
  };

  /**
   * Get value from cache
   */
  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.value;
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
    this.stats.sets++;
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    this.store.delete(key);
    this.stats.deletes++;
  }

  /**
   * Delete multiple keys
   */
  async delMany(keys: string[]): Promise<void> {
    keys.forEach((key) => this.store.delete(key));
    this.stats.deletes += keys.length;
  }

  /**
   * Delete keys by pattern
   */
  async delPattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    const keysToDelete = Array.from(this.store.keys()).filter((key) =>
      regex.test(key)
    );

    keysToDelete.forEach((key) => this.store.delete(key));
    this.stats.deletes += keysToDelete.length;

    return keysToDelete.length;
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get TTL for key
   */
  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return -2; // Key doesn't exist

    const ttl = Math.floor((entry.expiresAt - Date.now()) / 1000);
    return ttl > 0 ? ttl : -1; // -1 means expired
  }

  /**
   * Get statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get hit rate
   */
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Clear all cache
   */
  async flushAll(): Promise<void> {
    this.store.clear();
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
    };
  }
}

/**
 * Global Redis client instance
 */
const redisClient = new RedisCacheClient();

/**
 * Cache manager
 */
export class CacheManager {
  private config: Required<CacheConfig>;

  constructor(config: CacheConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Build cache key
   */
  private buildKey(key: string): string {
    return `${this.config.prefix}${key}`;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key);
      const value = await redisClient.get(fullKey);

      if (value === null) {
        return null;
      }

      return this.config.deserialize(value) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const fullKey = this.buildKey(key);
      const serialized = this.config.serialize(value);
      const ttlSeconds = ttl || this.config.ttl;

      await redisClient.set(fullKey, serialized, ttlSeconds);
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      const fullKey = this.buildKey(key);
      await redisClient.del(fullKey);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple keys
   */
  async deleteMany(keys: string[]): Promise<void> {
    try {
      const fullKeys = keys.map((key) => this.buildKey(key));
      await redisClient.delMany(fullKeys);
    } catch (error) {
      console.error('Cache deleteMany error:', error);
    }
  }

  /**
   * Delete keys by pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const fullPattern = this.buildKey(pattern);
      return await redisClient.delPattern(fullPattern);
    } catch (error) {
      console.error(`Cache deletePattern error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Get or set (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch from source
    const value = await fetchFn();

    // Set in cache (don't await to avoid blocking)
    this.set(key, value, ttl).catch((error) => {
      console.error(`Cache set error in getOrSet for key ${key}:`, error);
    });

    return value;
  }

  /**
   * Wrap function with caching
   */
  cached<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    options: {
      keyFn: (...args: Parameters<T>) => string;
      ttl?: number;
    }
  ): T {
    return (async (...args: Parameters<T>) => {
      const key = options.keyFn(...args);
      return this.getOrSet(key, () => fn(...args), options.ttl);
    }) as T;
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key);
      return await redisClient.exists(fullKey);
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get TTL for key
   */
  async getTTL(key: string): Promise<number> {
    try {
      const fullKey = this.buildKey(key);
      return await redisClient.ttl(fullKey);
    } catch (error) {
      console.error(`Cache getTTL error for key ${key}:`, error);
      return -2;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: number } {
    const stats = redisClient.getStats();
    return {
      ...stats,
      hitRate: redisClient.getHitRate(),
    };
  }

  /**
   * Clear all cache with this prefix
   */
  async clear(): Promise<number> {
    return this.deletePattern('*');
  }
}

/**
 * Default cache manager instance
 */
export const cache = new CacheManager();

/**
 * Cache key generators
 */
export const CacheKeys = {
  /**
   * User cache keys
   */
  user: (userId: string) => `user:${userId}`,
  userProgress: (userId: string) => `user:${userId}:progress`,
  userStats: (userId: string) => `user:${userId}:stats`,
  userReviews: (userId: string, page: number) => `user:${userId}:reviews:${page}`,

  /**
   * Word cache keys
   */
  word: (wordId: string) => `word:${wordId}`,
  wordList: (page: number, difficulty?: string) =>
    `words:${page}:${difficulty || 'all'}`,
  wordDaily: () => `word:daily:${new Date().toISOString().split('T')[0]}`,

  /**
   * Learning cache keys
   */
  dueReviews: (userId: string) => `reviews:due:${userId}`,
  learningPath: (userId: string) => `learning:path:${userId}`,
  dailyGoal: (userId: string) => `daily:goal:${userId}`,

  /**
   * Statistics cache keys
   */
  stats: (userId: string, period: string) => `stats:${userId}:${period}`,
  heatmap: (userId: string, year: number) => `heatmap:${userId}:${year}`,
  leaderboard: (scope: string, period: string) =>
    `leaderboard:${scope}:${period}`,

  /**
   * Collection cache keys
   */
  collection: (collectionId: string) => `collection:${collectionId}`,
  collections: (category?: string) => `collections:${category || 'all'}`,
};

/**
 * Cache invalidation utilities
 */
export class CacheInvalidator {
  /**
   * Invalidate user cache
   */
  static async invalidateUser(userId: string): Promise<void> {
    await cache.deletePattern(`user:${userId}:*`);
  }

  /**
   * Invalidate word cache
   */
  static async invalidateWord(wordId: string): Promise<void> {
    await cache.delete(CacheKeys.word(wordId));
    await cache.deletePattern('words:*'); // Invalidate word lists
  }

  /**
   * Invalidate learning cache
   */
  static async invalidateLearning(userId: string): Promise<void> {
    await cache.deleteMany([
      CacheKeys.dueReviews(userId),
      CacheKeys.learningPath(userId),
      CacheKeys.dailyGoal(userId),
    ]);
  }

  /**
   * Invalidate statistics cache
   */
  static async invalidateStats(userId: string): Promise<void> {
    await cache.deletePattern(`stats:${userId}:*`);
    await cache.deletePattern(`heatmap:${userId}:*`);
  }

  /**
   * Invalidate leaderboard cache
   */
  static async invalidateLeaderboard(): Promise<void> {
    await cache.deletePattern('leaderboard:*');
  }
}

/**
 * Cache warming utilities
 */
export class CacheWarmer {
  /**
   * Warm user cache
   */
  static async warmUser(userId: string, userData: unknown): Promise<void> {
    await cache.set(CacheKeys.user(userId), userData, 3600); // 1 hour
  }

  /**
   * Warm word cache
   */
  static async warmWord(wordId: string, wordData: unknown): Promise<void> {
    await cache.set(CacheKeys.word(wordId), wordData, 7200); // 2 hours
  }

  /**
   * Warm daily word cache
   */
  static async warmDailyWord(wordData: unknown): Promise<void> {
    await cache.set(CacheKeys.wordDaily(), wordData, 86400); // 24 hours
  }

  /**
   * Warm leaderboard cache
   */
  static async warmLeaderboard(
    scope: string,
    period: string,
    data: unknown
  ): Promise<void> {
    await cache.set(CacheKeys.leaderboard(scope, period), data, 1800); // 30 minutes
  }
}

/**
 * Export utilities
 */
export {
  RedisCacheClient,
  redisClient,
  CacheStats,
};
