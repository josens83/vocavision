import NodeCache from 'node-cache';

/**
 * 🚀 In-Memory Cache (Phase 3)
 * - 정적 데이터 DB 쿼리 제거
 * - Redis 대비 0원 비용으로 90% 효과
 * - 사용자 100명+ 시 Redis 전환 고려
 */
const cache = new NodeCache({
  stdTTL: 300,        // 기본 5분
  checkperiod: 60,    // 1분마다 만료 체크
  useClones: false,   // 성능 최적화 (직접 참조 반환)
  maxKeys: 3000,      // 19,544개 단어 기준 상향 (단어 조회 캐시)
});

export const appCache = {
  // ========================================
  // 단어 수 캐시 (시험/레벨별) - TTL 1시간
  // ========================================
  getWordCount(examCategory: string, level: string): number | undefined {
    return cache.get(`wordCount:${examCategory}:${level}`);
  },
  setWordCount(examCategory: string, level: string, count: number): void {
    cache.set(`wordCount:${examCategory}:${level}`, count, 3600); // 1시간 TTL
  },

  // ========================================
  // 단어 상세 캐시 - TTL 10분
  // ========================================
  getWord(wordId: string): any | undefined {
    return cache.get(`word:${wordId}`);
  },
  setWord(wordId: string, data: any): void {
    cache.set(`word:${wordId}`, data, 600); // 10분 TTL
  },

  // ========================================
  // 범용 캐시
  // ========================================
  get<T>(key: string): T | undefined {
    return cache.get<T>(key);
  },
  set<T>(key: string, value: T, ttl?: number): void {
    if (ttl) {
      cache.set(key, value, ttl);
    } else {
      cache.set(key, value);
    }
  },
  has(key: string): boolean {
    return cache.has(key);
  },

  // ========================================
  // 캐시 무효화
  // ========================================
  invalidateWordCounts(): void {
    const keys = cache.keys().filter(k => k.startsWith('wordCount:'));
    if (keys.length > 0) {
      cache.del(keys);
    }
  },
  invalidateWord(wordId: string): void {
    cache.del(`word:${wordId}`);
  },
  invalidateAll(): void {
    cache.flushAll();
  },
  del(key: string): void {
    cache.del(key);
  },

  // ========================================
  // 통계 (모니터링용)
  // ========================================
  getStats() {
    return cache.getStats();
  },
  getKeys(): string[] {
    return cache.keys();
  },
};

export default appCache;
