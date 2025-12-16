/**
 * Batch Request Utility
 *
 * Efficiently batches multiple individual requests into fewer batch API calls.
 * Reduces API load and improves frontend performance.
 *
 * @module lib/utils/batchRequest
 */

import { wordsAPI } from '../api';

type Word = {
  id: string;
  word: string;
  definition: string;
  definitionKo?: string;
  pronunciation?: string;
  phonetic?: string;
  partOfSpeech?: string;
  difficulty?: string;
  examCategory?: string;
  level?: string;
  frequency?: number;
  tips?: string;
};

type WordWithVisuals = Word & {
  examples?: Array<{ sentence: string; translation?: string }>;
  mnemonics?: Array<{ content: string; koreanHint?: string }>;
  etymology?: { origin?: string; roots?: string[] };
  collocations?: Array<{ phrase: string; frequency?: number }>;
  visuals?: Array<{
    type: 'CONCEPT' | 'MNEMONIC' | 'RHYME';
    labelKo?: string;
    captionKo?: string;
    imageUrl?: string;
  }>;
};

interface BatchOptions {
  /** Maximum number of IDs per batch request (default: 50) */
  batchSize?: number;
  /** Delay between batch requests in ms (default: 0) */
  delayBetweenBatches?: number;
  /** Whether to use cache (requires caching setup) */
  useCache?: boolean;
}

/**
 * In-memory cache for word data
 * Key: word ID, Value: word data
 */
const wordCache = new Map<string, { data: Word; timestamp: number }>();
const wordWithVisualsCache = new Map<string, { data: WordWithVisuals; timestamp: number }>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Clear expired cache entries
 */
function clearExpiredCache(): void {
  const now = Date.now();

  for (const [key, value] of wordCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      wordCache.delete(key);
    }
  }

  for (const [key, value] of wordWithVisualsCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      wordWithVisualsCache.delete(key);
    }
  }
}

// Periodically clean cache (every 5 minutes)
if (typeof window !== 'undefined') {
  setInterval(clearExpiredCache, CACHE_TTL);
}

/**
 * Batch fetch words by IDs
 * Efficiently fetches multiple words in optimized batch requests
 */
export async function batchFetchWords(
  ids: string[],
  options: BatchOptions = {}
): Promise<Map<string, Word>> {
  const { batchSize = 50, delayBetweenBatches = 0, useCache = true } = options;
  const results = new Map<string, Word>();
  const idsToFetch: string[] = [];
  const now = Date.now();

  // Check cache first
  if (useCache) {
    for (const id of ids) {
      const cached = wordCache.get(id);
      if (cached && now - cached.timestamp < CACHE_TTL) {
        results.set(id, cached.data);
      } else {
        idsToFetch.push(id);
      }
    }
  } else {
    idsToFetch.push(...ids);
  }

  // If all found in cache, return early
  if (idsToFetch.length === 0) {
    return results;
  }

  // Split into batches
  const batches: string[][] = [];
  for (let i = 0; i < idsToFetch.length; i += batchSize) {
    batches.push(idsToFetch.slice(i, i + batchSize));
  }

  // Fetch each batch
  for (let i = 0; i < batches.length; i++) {
    if (i > 0 && delayBetweenBatches > 0) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }

    try {
      const response = await wordsAPI.getWordsBatch(batches[i]);
      const words = response.data as Word[];

      for (const word of words) {
        results.set(word.id, word);
        if (useCache) {
          wordCache.set(word.id, { data: word, timestamp: now });
        }
      }
    } catch (error) {
      console.error(`Batch fetch failed for batch ${i + 1}/${batches.length}:`, error);
      // Continue with other batches even if one fails
    }
  }

  return results;
}

/**
 * Batch fetch words with visuals by IDs
 * Efficiently fetches multiple words with full details including visuals
 */
export async function batchFetchWordsWithVisuals(
  ids: string[],
  options: BatchOptions = {}
): Promise<Map<string, WordWithVisuals>> {
  const { batchSize = 20, delayBetweenBatches = 0, useCache = true } = options;
  const results = new Map<string, WordWithVisuals>();
  const idsToFetch: string[] = [];
  const now = Date.now();

  // Check cache first
  if (useCache) {
    for (const id of ids) {
      const cached = wordWithVisualsCache.get(id);
      if (cached && now - cached.timestamp < CACHE_TTL) {
        results.set(id, cached.data);
      } else {
        idsToFetch.push(id);
      }
    }
  } else {
    idsToFetch.push(...ids);
  }

  // If all found in cache, return early
  if (idsToFetch.length === 0) {
    return results;
  }

  // Split into batches (smaller batch size for detailed data)
  const batches: string[][] = [];
  for (let i = 0; i < idsToFetch.length; i += batchSize) {
    batches.push(idsToFetch.slice(i, i + batchSize));
  }

  // Fetch each batch
  for (let i = 0; i < batches.length; i++) {
    if (i > 0 && delayBetweenBatches > 0) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }

    try {
      const response = await wordsAPI.getWordsBatchWithVisuals(batches[i]);
      const words = response.data as WordWithVisuals[];

      for (const word of words) {
        results.set(word.id, word);
        if (useCache) {
          wordWithVisualsCache.set(word.id, { data: word, timestamp: now });
        }
      }
    } catch (error) {
      console.error(`Batch fetch with visuals failed for batch ${i + 1}/${batches.length}:`, error);
      // Continue with other batches even if one fails
    }
  }

  return results;
}

/**
 * Request batcher for debouncing multiple word requests
 * Collects requests over a short window and executes them as a single batch
 */
export class WordRequestBatcher {
  private pendingIds: Set<string> = new Set();
  private pendingPromises: Map<string, {
    resolve: (value: Word | null) => void;
    reject: (error: Error) => void;
  }[]> = new Map();
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private debounceMs: number;
  private withVisuals: boolean;

  constructor(options: { debounceMs?: number; withVisuals?: boolean } = {}) {
    this.debounceMs = options.debounceMs ?? 50;
    this.withVisuals = options.withVisuals ?? false;
  }

  /**
   * Request a word by ID
   * Returns a promise that resolves when the batch is executed
   */
  request(id: string): Promise<Word | WordWithVisuals | null> {
    return new Promise((resolve, reject) => {
      this.pendingIds.add(id);

      const callbacks = this.pendingPromises.get(id) || [];
      callbacks.push({ resolve: resolve as (value: Word | null) => void, reject });
      this.pendingPromises.set(id, callbacks);

      // Reset debounce timer
      if (this.timeout) {
        clearTimeout(this.timeout);
      }

      this.timeout = setTimeout(() => this.executeBatch(), this.debounceMs);
    });
  }

  private async executeBatch(): Promise<void> {
    const ids = Array.from(this.pendingIds);
    const promises = new Map(this.pendingPromises);

    // Clear pending state
    this.pendingIds.clear();
    this.pendingPromises.clear();
    this.timeout = null;

    if (ids.length === 0) return;

    try {
      const results = this.withVisuals
        ? await batchFetchWordsWithVisuals(ids)
        : await batchFetchWords(ids);

      // Resolve all pending promises
      for (const id of ids) {
        const callbacks = promises.get(id) || [];
        const word = results.get(id) || null;
        for (const { resolve } of callbacks) {
          resolve(word);
        }
      }
    } catch (error) {
      // Reject all pending promises
      for (const id of ids) {
        const callbacks = promises.get(id) || [];
        for (const { reject } of callbacks) {
          reject(error as Error);
        }
      }
    }
  }
}

/**
 * Global batcher instances
 */
export const wordBatcher = new WordRequestBatcher({ debounceMs: 50 });
export const wordWithVisualsBatcher = new WordRequestBatcher({ debounceMs: 50, withVisuals: true });

/**
 * Convenience function to get a word using the global batcher
 */
export async function getWordBatched(id: string): Promise<Word | null> {
  return wordBatcher.request(id) as Promise<Word | null>;
}

/**
 * Convenience function to get a word with visuals using the global batcher
 */
export async function getWordWithVisualsBatched(id: string): Promise<WordWithVisuals | null> {
  return wordWithVisualsBatcher.request(id) as Promise<WordWithVisuals | null>;
}

/**
 * Clear all caches
 */
export function clearWordCaches(): void {
  wordCache.clear();
  wordWithVisualsCache.clear();
}

/**
 * Prefetch words into cache
 * Useful for preloading expected word lists
 */
export async function prefetchWords(ids: string[], withVisuals = false): Promise<void> {
  if (withVisuals) {
    await batchFetchWordsWithVisuals(ids);
  } else {
    await batchFetchWords(ids);
  }
}
