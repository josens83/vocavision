// Phase 2-2: API Wrapper with Circuit Breaker Integration
// Wraps API calls with circuit breaker protection

import { circuitBreakerManager } from './circuitBreaker';

/**
 * Wrap API function with circuit breaker
 */
export function withCircuitBreaker<T extends (...args: any[]) => Promise<any>>(
  serviceName: string,
  fn: T,
  fallback?: (...args: Parameters<T>) => ReturnType<T> extends Promise<infer U> ? U : never
): T {
  return (async (...args: Parameters<T>) => {
    return circuitBreakerManager.execute(
      serviceName,
      () => fn(...args),
      fallback ? () => fallback(...args) : undefined
    );
  }) as T;
}

/**
 * Create API module with circuit breaker protection
 */
export function createProtectedAPI<T extends Record<string, (...args: any[]) => Promise<any>>>(
  serviceName: string,
  api: T,
  fallbacks?: Partial<{
    [K in keyof T]: (...args: Parameters<T[K]>) => ReturnType<T[K]> extends Promise<infer U> ? U : never
  }>
): T {
  const protectedAPI = {} as T;

  for (const [key, fn] of Object.entries(api)) {
    const fallback = fallbacks?.[key as keyof T];
    (protectedAPI as any)[key] = withCircuitBreaker(
      `${serviceName}.${key}`,
      fn,
      fallback as any
    );
  }

  return protectedAPI;
}

/**
 * Default fallback data generators
 */
export const fallbackData = {
  emptyList: () => ({ items: [], total: 0, page: 1, limit: 10 }),
  emptyObject: () => ({}),
  cachedOrEmpty: <T>(cacheKey: string, defaultValue: T) => {
    try {
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
};
