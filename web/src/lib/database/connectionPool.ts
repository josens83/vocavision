/**
 * Database Connection Pooling Configuration
 *
 * Provides optimized connection pooling for PostgreSQL database,
 * supporting read replicas, connection monitoring, and automatic failover.
 *
 * @module lib/database/connectionPool
 */

/**
 * Connection pool configuration
 */
export interface PoolConfig {
  min?: number;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  maxUses?: number;
}

/**
 * Default pool configuration
 */
const DEFAULT_POOL_CONFIG: Required<PoolConfig> = {
  min: 5, // Minimum connections
  max: 50, // Maximum connections
  idleTimeoutMillis: 30000, // 30 seconds
  connectionTimeoutMillis: 5000, // 5 seconds
  maxUses: 7500, // Maximum uses before recycling connection
};

/**
 * Environment-based pool configuration
 */
export function getPoolConfig(): Required<PoolConfig> {
  const env = process.env.NODE_ENV || 'development';

  // Production configuration
  if (env === 'production') {
    return {
      min: parseInt(process.env.DATABASE_POOL_MIN || '10', 10),
      max: parseInt(process.env.DATABASE_POOL_MAX || '100', 10),
      idleTimeoutMillis: parseInt(process.env.DATABASE_POOL_IDLE_TIMEOUT || '60000', 10),
      connectionTimeoutMillis: parseInt(process.env.DATABASE_POOL_CONNECT_TIMEOUT || '10000', 10),
      maxUses: parseInt(process.env.DATABASE_POOL_MAX_USES || '10000', 10),
    };
  }

  // Development configuration
  if (env === 'development') {
    return {
      min: 2,
      max: 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 3000,
      maxUses: 1000,
    };
  }

  // Test configuration
  if (env === 'test') {
    return {
      min: 1,
      max: 5,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 2000,
      maxUses: 100,
    };
  }

  return DEFAULT_POOL_CONFIG;
}

/**
 * Connection pool statistics
 */
export interface PoolStats {
  total: number;
  idle: number;
  active: number;
  waiting: number;
}

/**
 * Connection pool monitor
 */
export class ConnectionPoolMonitor {
  private stats: PoolStats = {
    total: 0,
    idle: 0,
    active: 0,
    waiting: 0,
  };

  private warnings: string[] = [];

  /**
   * Update pool statistics
   */
  updateStats(stats: PoolStats): void {
    this.stats = stats;
    this.checkThresholds();
  }

  /**
   * Get current statistics
   */
  getStats(): PoolStats {
    return { ...this.stats };
  }

  /**
   * Check for threshold violations
   */
  private checkThresholds(): void {
    const config = getPoolConfig();
    this.warnings = [];

    // Check if pool is near maximum
    if (this.stats.total >= config.max * 0.9) {
      this.warnings.push(
        `Connection pool near maximum: ${this.stats.total}/${config.max}`
      );
    }

    // Check for connection waiting
    if (this.stats.waiting > 0) {
      this.warnings.push(
        `${this.stats.waiting} requests waiting for connection`
      );
    }

    // Check for low idle connections
    if (this.stats.idle < config.min) {
      this.warnings.push(
        `Low idle connections: ${this.stats.idle} (min: ${config.min})`
      );
    }

    // Log warnings
    if (this.warnings.length > 0) {
      console.warn('Connection pool warnings:', this.warnings);
    }
  }

  /**
   * Get warnings
   */
  getWarnings(): string[] {
    return [...this.warnings];
  }

  /**
   * Get health status
   */
  getHealth(): {
    healthy: boolean;
    message: string;
    stats: PoolStats;
    warnings: string[];
  } {
    const config = getPoolConfig();
    const utilization = this.stats.active / config.max;

    let healthy = true;
    let message = 'Connection pool is healthy';

    if (utilization > 0.9) {
      healthy = false;
      message = 'Connection pool is critically high';
    } else if (utilization > 0.7) {
      message = 'Connection pool usage is high';
    } else if (this.stats.waiting > 0) {
      healthy = false;
      message = 'Connections are waiting for availability';
    }

    return {
      healthy,
      message,
      stats: this.getStats(),
      warnings: this.getWarnings(),
    };
  }
}

/**
 * Global connection pool monitor
 */
export const poolMonitor = new ConnectionPoolMonitor();

/**
 * Database URL builder
 */
export class DatabaseUrlBuilder {
  /**
   * Build database URL with connection pooling parameters
   */
  static buildUrl(baseUrl: string, config?: Partial<PoolConfig>): string {
    const poolConfig = { ...getPoolConfig(), ...config };

    const url = new URL(baseUrl);

    // Add connection pool parameters
    url.searchParams.set('connection_limit', poolConfig.max.toString());
    url.searchParams.set('pool_timeout', Math.floor(poolConfig.connectionTimeoutMillis / 1000).toString());

    // Add PostgreSQL-specific parameters
    url.searchParams.set('connect_timeout', '10'); // seconds
    url.searchParams.set('idle_in_transaction_session_timeout', '60000'); // milliseconds
    url.searchParams.set('statement_timeout', '30000'); // milliseconds

    // Enable prepared statements for better performance
    url.searchParams.set('prepared_statements', 'true');

    // Enable connection reuse
    url.searchParams.set('pgbouncer', 'true');

    return url.toString();
  }

  /**
   * Build read replica URL
   */
  static buildReadReplicaUrl(baseUrl: string, replicaHost: string): string {
    const url = new URL(baseUrl);
    url.hostname = replicaHost;

    // Read replicas should have lower timeout
    url.searchParams.set('connect_timeout', '5');
    url.searchParams.set('pool_timeout', '3');

    return url.toString();
  }
}

/**
 * Connection retry configuration
 */
export interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  maxRetryDelay?: number;
  backoffMultiplier?: number;
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  maxRetryDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

/**
 * Connection retry handler
 */
export class ConnectionRetryHandler {
  private config: Required<RetryConfig>;

  constructor(config?: Partial<RetryConfig>) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  /**
   * Execute with retry logic
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    operationName: string = 'database operation'
  ): Promise<T> {
    let lastError: Error | null = null;
    let delay = this.config.retryDelay;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on last attempt
        if (attempt === this.config.maxRetries) {
          break;
        }

        // Check if error is retryable
        if (!this.isRetryableError(error as Error)) {
          throw error;
        }

        console.warn(
          `${operationName} failed (attempt ${attempt + 1}/${this.config.maxRetries + 1}):`,
          (error as Error).message
        );

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Increase delay with backoff
        delay = Math.min(
          delay * this.config.backoffMultiplier,
          this.config.maxRetryDelay
        );
      }
    }

    throw new Error(
      `${operationName} failed after ${this.config.maxRetries + 1} attempts: ${lastError?.message}`
    );
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();

    // Connection errors (retryable)
    const retryablePatterns = [
      'connection',
      'timeout',
      'econnrefused',
      'etimedout',
      'pool',
      'too many',
      'unavailable',
    ];

    // Data errors (not retryable)
    const nonRetryablePatterns = [
      'unique constraint',
      'foreign key',
      'not null',
      'invalid input',
      'syntax error',
    ];

    // Check if error is non-retryable
    if (nonRetryablePatterns.some((pattern) => message.includes(pattern))) {
      return false;
    }

    // Check if error is retryable
    return retryablePatterns.some((pattern) => message.includes(pattern));
  }
}

/**
 * Global connection retry handler
 */
export const connectionRetry = new ConnectionRetryHandler();

/**
 * Read replica manager
 */
export class ReadReplicaManager {
  private replicaUrls: string[] = [];
  private currentReplicaIndex = 0;
  private replicaHealth: Map<string, boolean> = new Map();

  /**
   * Initialize read replicas
   */
  initialize(replicaUrls: string[]): void {
    this.replicaUrls = replicaUrls;
    replicaUrls.forEach((url) => this.replicaHealth.set(url, true));
  }

  /**
   * Get read replica URL (round-robin)
   */
  getReplicaUrl(): string | null {
    if (this.replicaUrls.length === 0) {
      return null;
    }

    // Find next healthy replica
    for (let i = 0; i < this.replicaUrls.length; i++) {
      const index = (this.currentReplicaIndex + i) % this.replicaUrls.length;
      const url = this.replicaUrls[index];

      if (this.replicaHealth.get(url)) {
        this.currentReplicaIndex = (index + 1) % this.replicaUrls.length;
        return url;
      }
    }

    // All replicas unhealthy, return first one
    console.warn('All read replicas are unhealthy, using primary');
    return null;
  }

  /**
   * Mark replica as unhealthy
   */
  markUnhealthy(replicaUrl: string): void {
    this.replicaHealth.set(replicaUrl, false);

    // Schedule health check
    setTimeout(() => {
      this.replicaHealth.set(replicaUrl, true);
    }, 60000); // Retry after 1 minute
  }

  /**
   * Get replica health status
   */
  getHealth(): Record<string, boolean> {
    const health: Record<string, boolean> = {};
    this.replicaHealth.forEach((healthy, url) => {
      health[url] = healthy;
    });
    return health;
  }
}

/**
 * Global read replica manager
 */
export const replicaManager = new ReadReplicaManager();

/**
 * Initialize read replicas from environment
 */
export function initializeReadReplicas(): void {
  const replicaUrls = process.env.DATABASE_REPLICA_URLS?.split(',').filter(Boolean) || [];

  if (replicaUrls.length > 0) {
    replicaManager.initialize(replicaUrls);
    console.log(`Initialized ${replicaUrls.length} read replicas`);
  }
}

/**
 * Connection pool health check
 */
export async function checkPoolHealth(): Promise<{
  healthy: boolean;
  message: string;
  details: Record<string, unknown>;
}> {
  try {
    const health = poolMonitor.getHealth();

    return {
      healthy: health.healthy,
      message: health.message,
      details: {
        stats: health.stats,
        warnings: health.warnings,
        config: getPoolConfig(),
        replicas: replicaManager.getHealth(),
      },
    };
  } catch (error) {
    return {
      healthy: false,
      message: `Health check failed: ${(error as Error).message}`,
      details: {
        error: (error as Error).message,
      },
    };
  }
}

/**
 * Export utilities
 */
export {
  DEFAULT_POOL_CONFIG,
  DEFAULT_RETRY_CONFIG,
};
