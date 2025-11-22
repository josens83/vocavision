// Phase 6-2: Unit Tests for Rate Limiter
// Testing rate limiting algorithms

import {
  TokenBucketLimiter,
  SlidingWindowLimiter,
  DDoSDetector,
} from '../rateLimiter';

describe('TokenBucketLimiter', () => {
  it('should allow requests within limit', () => {
    const limiter = new TokenBucketLimiter(10, 10); // 10 tokens, 10/sec refill

    const result1 = limiter.check('user1');
    expect(result1.allowed).toBe(true);
    expect(result1.remaining).toBe(9);

    const result2 = limiter.check('user1');
    expect(result2.allowed).toBe(true);
    expect(result2.remaining).toBe(8);
  });

  it('should block requests exceeding limit', () => {
    const limiter = new TokenBucketLimiter(3, 1); // 3 tokens max

    // Use up all tokens
    limiter.check('user1'); // 2 remaining
    limiter.check('user1'); // 1 remaining
    limiter.check('user1'); // 0 remaining

    // Next request should be blocked
    const result = limiter.check('user1');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('should refill tokens over time', async () => {
    const limiter = new TokenBucketLimiter(5, 5, 100); // Refill every 100ms

    // Use up tokens
    for (let i = 0; i < 5; i++) {
      limiter.check('user1');
    }

    // Should be blocked now
    expect(limiter.check('user1').allowed).toBe(false);

    // Wait for refill
    await new Promise(resolve => setTimeout(resolve, 150));

    // Should have tokens again
    const result = limiter.check('user1');
    expect(result.allowed).toBe(true);
  });

  it('should handle multiple users independently', () => {
    const limiter = new TokenBucketLimiter(2, 1);

    limiter.check('user1');
    limiter.check('user1');

    // user1 exhausted
    expect(limiter.check('user1').allowed).toBe(false);

    // user2 should still have tokens
    expect(limiter.check('user2').allowed).toBe(true);
  });
});

describe('SlidingWindowLimiter', () => {
  it('should allow requests within window', () => {
    const limiter = new SlidingWindowLimiter(5, 1000); // 5 requests per 1s

    for (let i = 0; i < 5; i++) {
      const result = limiter.check('user1');
      expect(result.allowed).toBe(true);
    }
  });

  it('should block requests exceeding window limit', () => {
    const limiter = new SlidingWindowLimiter(3, 1000); // 3 requests per 1s

    // Make 3 requests
    limiter.check('user1');
    limiter.check('user1');
    limiter.check('user1');

    // 4th request should be blocked
    const result = limiter.check('user1');
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('should reset after window expires', async () => {
    const limiter = new SlidingWindowLimiter(2, 100); // 2 requests per 100ms

    // Use up limit
    limiter.check('user1');
    limiter.check('user1');

    // Should be blocked
    expect(limiter.check('user1').allowed).toBe(false);

    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 150));

    // Should allow requests again
    expect(limiter.check('user1').allowed).toBe(true);
  });

  it('should track sliding window accurately', async () => {
    const limiter = new SlidingWindowLimiter(3, 200); // 3 requests per 200ms

    // t=0: 3 requests
    limiter.check('user1');
    limiter.check('user1');
    limiter.check('user1');

    // Should be blocked
    expect(limiter.check('user1').allowed).toBe(false);

    // t=100: Wait half window
    await new Promise(resolve => setTimeout(resolve, 100));

    // Still blocked (old requests still in window)
    expect(limiter.check('user1').allowed).toBe(false);

    // t=220: Wait for full window
    await new Promise(resolve => setTimeout(resolve, 120));

    // Should allow new requests
    expect(limiter.check('user1').allowed).toBe(true);
  });
});

describe('DDoSDetector', () => {
  it('should detect normal traffic', () => {
    const detector = new DDoSDetector(100, 60000); // 100 req/min threshold

    for (let i = 0; i < 50; i++) {
      const result = detector.check('client1');
      expect(result.suspicious).toBe(false);
    }
  });

  it('should detect suspicious traffic', () => {
    const detector = new DDoSDetector(10, 60000); // 10 req/min threshold

    for (let i = 0; i < 10; i++) {
      detector.check('client1');
    }

    // Next request should be flagged
    const result = detector.check('client1');
    expect(result.suspicious).toBe(true);
    expect(result.requestCount).toBeGreaterThan(10);
  });

  it('should reset after window', async () => {
    const detector = new DDoSDetector(5, 100); // 5 req per 100ms

    // Generate suspicious traffic
    for (let i = 0; i < 6; i++) {
      detector.check('client1');
    }

    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 150));

    // Should be normal again
    const result = detector.check('client1');
    expect(result.suspicious).toBe(false);
    expect(result.requestCount).toBe(1);
  });

  it('should track clients independently', () => {
    const detector = new DDoSDetector(5, 60000);

    // client1: suspicious traffic
    for (let i = 0; i < 6; i++) {
      detector.check('client1');
    }
    expect(detector.check('client1').suspicious).toBe(true);

    // client2: normal traffic
    expect(detector.check('client2').suspicious).toBe(false);
  });
});
