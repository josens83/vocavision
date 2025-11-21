// Phase 2-2: Netflix Hystrix-style Circuit Breaker
// Benchmarking: Netflix Hystrix, AWS Circuit Breaker, Polly (.NET)

export enum CircuitState {
  CLOSED = 'CLOSED',       // Normal operation
  OPEN = 'OPEN',           // Circuit is open, requests are blocked
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number;      // Number of failures before opening
  successThreshold: number;      // Number of successes to close from half-open
  timeout: number;               // Timeout in ms before trying half-open
  monitoringPeriod: number;      // Rolling window in ms
  volumeThreshold: number;       // Minimum requests before evaluating
}

export const DEFAULT_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,           // Open after 5 failures
  successThreshold: 2,           // Close after 2 successes in half-open
  timeout: 60000,                // 60s before trying half-open
  monitoringPeriod: 60000,       // 60s rolling window
  volumeThreshold: 10,           // Need at least 10 requests
};

interface RequestRecord {
  timestamp: number;
  success: boolean;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private nextAttempt: number = Date.now();
  private requestHistory: RequestRecord[] = [];
  private readonly name: string;
  private readonly config: CircuitBreakerConfig;

  constructor(name: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.name = name;
    this.config = { ...DEFAULT_CIRCUIT_CONFIG, ...config };
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>, fallback?: () => T): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      // Check if timeout has passed to try half-open
      if (Date.now() >= this.nextAttempt) {
        console.log(`🔄 Circuit ${this.name}: Transitioning to HALF_OPEN`);
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        const waitTime = Math.ceil((this.nextAttempt - Date.now()) / 1000);
        console.warn(
          `🚫 Circuit ${this.name}: OPEN - Request blocked. Retry in ${waitTime}s`
        );

        if (fallback) {
          return fallback();
        }

        throw new Error(
          `Circuit breaker is OPEN for ${this.name}. Service temporarily unavailable.`
        );
      }
    }

    try {
      // Execute function
      const result = await fn();

      // Record success
      this.onSuccess();

      return result;
    } catch (error) {
      // Record failure
      this.onFailure();

      // If we have fallback, use it
      if (fallback) {
        console.log(`🔄 Circuit ${this.name}: Using fallback due to error`);
        return fallback();
      }

      throw error;
    }
  }

  /**
   * Record successful request
   */
  private onSuccess(): void {
    this.recordRequest(true);

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;

      console.log(
        `✅ Circuit ${this.name}: Success in HALF_OPEN (${this.successCount}/${this.config.successThreshold})`
      );

      // If enough successes, close the circuit
      if (this.successCount >= this.config.successThreshold) {
        this.close();
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success in closed state
      this.failureCount = 0;
    }
  }

  /**
   * Record failed request
   */
  private onFailure(): void {
    this.recordRequest(false);
    this.failureCount++;

    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open immediately opens the circuit
      console.warn(`❌ Circuit ${this.name}: Failure in HALF_OPEN - Opening circuit`);
      this.open();
    } else if (this.state === CircuitState.CLOSED) {
      console.warn(
        `⚠️ Circuit ${this.name}: Failure count ${this.failureCount}/${this.config.failureThreshold}`
      );

      // Check if we should open the circuit
      this.evaluateCircuit();
    }
  }

  /**
   * Record request in history
   */
  private recordRequest(success: boolean): void {
    const now = Date.now();
    this.requestHistory.push({ timestamp: now, success });

    // Clean old requests outside monitoring period
    const cutoff = now - this.config.monitoringPeriod;
    this.requestHistory = this.requestHistory.filter(r => r.timestamp >= cutoff);
  }

  /**
   * Evaluate if circuit should open
   */
  private evaluateCircuit(): void {
    // Check volume threshold
    if (this.requestHistory.length < this.config.volumeThreshold) {
      return;
    }

    // Calculate failure rate
    const failures = this.requestHistory.filter(r => !r.success).length;
    const total = this.requestHistory.length;
    const failureRate = failures / total;

    // Check failure threshold
    if (this.failureCount >= this.config.failureThreshold) {
      console.error(
        `🔴 Circuit ${this.name}: Opening circuit - ${failures}/${total} failures (${(failureRate * 100).toFixed(1)}%)`
      );
      this.open();
    }
  }

  /**
   * Open the circuit
   */
  private open(): void {
    this.state = CircuitState.OPEN;
    this.nextAttempt = Date.now() + this.config.timeout;
    this.failureCount = 0;
    this.successCount = 0;

    const retryTime = new Date(this.nextAttempt).toLocaleTimeString();
    console.error(`🔴 Circuit ${this.name}: OPEN until ${retryTime}`);
  }

  /**
   * Close the circuit
   */
  private close(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;

    console.log(`🟢 Circuit ${this.name}: CLOSED - Service recovered`);
  }

  /**
   * Reset the circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.requestHistory = [];
    this.nextAttempt = Date.now();

    console.log(`🔄 Circuit ${this.name}: Reset`);
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get metrics
   */
  getMetrics() {
    const now = Date.now();
    const recentRequests = this.requestHistory.filter(
      r => r.timestamp >= now - this.config.monitoringPeriod
    );

    const total = recentRequests.length;
    const failures = recentRequests.filter(r => !r.success).length;
    const successes = total - failures;
    const failureRate = total > 0 ? failures / total : 0;

    return {
      name: this.name,
      state: this.state,
      totalRequests: total,
      failures,
      successes,
      failureRate: Math.round(failureRate * 100),
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttempt: this.state === CircuitState.OPEN ? this.nextAttempt : null,
    };
  }
}

/**
 * Circuit Breaker Manager - Manages multiple circuit breakers
 */
export class CircuitBreakerManager {
  private breakers: Map<string, CircuitBreaker> = new Map();
  private config: Partial<CircuitBreakerConfig>;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = config;
  }

  /**
   * Get or create circuit breaker for service
   */
  getBreaker(name: string): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, this.config));
    }
    return this.breakers.get(name)!;
  }

  /**
   * Execute function with circuit breaker
   */
  async execute<T>(
    serviceName: string,
    fn: () => Promise<T>,
    fallback?: () => T
  ): Promise<T> {
    const breaker = this.getBreaker(serviceName);
    return breaker.execute(fn, fallback);
  }

  /**
   * Get all circuit breaker metrics
   */
  getAllMetrics() {
    const metrics: any[] = [];
    this.breakers.forEach(breaker => {
      metrics.push(breaker.getMetrics());
    });
    return metrics;
  }

  /**
   * Reset specific circuit breaker
   */
  reset(name: string): void {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.reset();
    }
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
  }
}

// Global circuit breaker manager
export const circuitBreakerManager = new CircuitBreakerManager({
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000,
  monitoringPeriod: 60000,
  volumeThreshold: 10,
});
