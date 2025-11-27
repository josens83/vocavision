// Phase 2-5: IndexedDB Wrapper for Offline Data Storage
// Benchmarking: Google Workbox, Dexie.js, localForage

const DB_NAME = 'VocaVisionDB';
const DB_VERSION = 1;

// Object stores (tables)
export const STORES = {
  WORDS: 'words',
  PROGRESS: 'progress',
  DECKS: 'decks',
  SESSIONS: 'sessions',
  FAILED_REQUESTS: 'failedRequests',
  CACHE: 'cache',
} as const;

export type StoreName = typeof STORES[keyof typeof STORES];

/**
 * Initialize IndexedDB
 */
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores
      if (!db.objectStoreNames.contains(STORES.WORDS)) {
        const wordsStore = db.createObjectStore(STORES.WORDS, { keyPath: 'id' });
        wordsStore.createIndex('difficulty', 'difficulty', { unique: false });
        wordsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.PROGRESS)) {
        const progressStore = db.createObjectStore(STORES.PROGRESS, { keyPath: 'wordId' });
        progressStore.createIndex('nextReviewDate', 'nextReviewDate', { unique: false });
        progressStore.createIndex('masteryLevel', 'masteryLevel', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.DECKS)) {
        const decksStore = db.createObjectStore(STORES.DECKS, { keyPath: 'id' });
        decksStore.createIndex('userId', 'userId', { unique: false });
        decksStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.SESSIONS)) {
        const sessionsStore = db.createObjectStore(STORES.SESSIONS, { keyPath: 'id' });
        sessionsStore.createIndex('startTime', 'startTime', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.FAILED_REQUESTS)) {
        const failedStore = db.createObjectStore(STORES.FAILED_REQUESTS, {
          keyPath: 'id',
          autoIncrement: true,
        });
        failedStore.createIndex('timestamp', 'timestamp', { unique: false });
        failedStore.createIndex('status', 'status', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.CACHE)) {
        const cacheStore = db.createObjectStore(STORES.CACHE, { keyPath: 'key' });
        cacheStore.createIndex('expiry', 'expiry', { unique: false });
      }

      console.log('[IndexedDB] Database initialized');
    };
  });
}

/**
 * Get database instance
 */
let dbInstance: IDBDatabase | null = null;

async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance;
  }
  dbInstance = await initDB();
  return dbInstance;
}

/**
 * Generic CRUD operations
 */

// CREATE/UPDATE
export async function set<T = any>(
  storeName: StoreName,
  data: T
): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// READ
export async function get<T = any>(
  storeName: StoreName,
  key: IDBValidKey
): Promise<T | undefined> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// READ ALL
export async function getAll<T = any>(
  storeName: StoreName
): Promise<T[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// DELETE
export async function remove(
  storeName: StoreName,
  key: IDBValidKey
): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// CLEAR ALL
export async function clear(storeName: StoreName): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Query by index
 */
export async function getByIndex<T = any>(
  storeName: StoreName,
  indexName: string,
  value: IDBValidKey
): Promise<T[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Batch operations
 */
export async function bulkSet<T = any>(
  storeName: StoreName,
  items: T[]
): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    items.forEach(item => store.put(item));

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

/**
 * Cache with expiry
 */
export interface CacheEntry<T = any> {
  key: string;
  value: T;
  expiry: number; // timestamp
}

export async function cacheSet<T = any>(
  key: string,
  value: T,
  ttlMs: number = 3600000 // 1 hour default
): Promise<void> {
  const entry: CacheEntry<T> = {
    key,
    value,
    expiry: Date.now() + ttlMs,
  };
  await set(STORES.CACHE, entry);
}

export async function cacheGet<T = any>(
  key: string
): Promise<T | undefined> {
  const entry = await get<CacheEntry<T>>(STORES.CACHE, key);

  if (!entry) {
    return undefined;
  }

  // Check if expired
  if (entry.expiry < Date.now()) {
    await remove(STORES.CACHE, key);
    return undefined;
  }

  return entry.value;
}

export async function cacheRemove(key: string): Promise<void> {
  await remove(STORES.CACHE, key);
}

/**
 * Clean expired cache entries
 */
export async function cleanExpiredCache(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.CACHE, 'readwrite');
    const store = transaction.objectStore(STORES.CACHE);
    const index = store.index('expiry');
    const now = Date.now();

    const request = index.openCursor(IDBKeyRange.upperBound(now));

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    transaction.oncomplete = () => {
      console.log('[IndexedDB] Expired cache cleaned');
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

/**
 * Store failed requests for retry
 */
export interface FailedRequest {
  id?: number;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  timestamp: number;
  status: 'pending' | 'retrying' | 'failed';
  retryCount: number;
}

export async function storeFailedRequest(request: Omit<FailedRequest, 'id'>): Promise<void> {
  await set(STORES.FAILED_REQUESTS, request);
}

export async function getFailedRequests(): Promise<FailedRequest[]> {
  return getByIndex(STORES.FAILED_REQUESTS, 'status', 'pending');
}

export async function updateFailedRequest(
  id: number,
  updates: Partial<FailedRequest>
): Promise<void> {
  const request = await get<FailedRequest>(STORES.FAILED_REQUESTS, id);
  if (request) {
    await set(STORES.FAILED_REQUESTS, { ...request, ...updates });
  }
}

/**
 * Database statistics
 */
export async function getStorageStats(): Promise<{
  usage: number;
  quota: number;
  percentage: number;
}> {
  if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.estimate) {
    return { usage: 0, quota: 0, percentage: 0 };
  }

  const estimate = await navigator.storage.estimate();
  const usage = estimate.usage || 0;
  const quota = estimate.quota || 0;
  const percentage = quota > 0 ? (usage / quota) * 100 : 0;

  return {
    usage: Math.round(usage / 1024 / 1024 * 100) / 100, // MB
    quota: Math.round(quota / 1024 / 1024 * 100) / 100, // MB
    percentage: Math.round(percentage * 100) / 100,
  };
}

/**
 * Export data for backup
 */
export async function exportData(): Promise<Record<string, any[]>> {
  const data: Record<string, any[]> = {};

  for (const storeName of Object.values(STORES)) {
    data[storeName] = await getAll(storeName);
  }

  return data;
}

/**
 * Import data from backup
 */
export async function importData(data: Record<string, any[]>): Promise<void> {
  for (const [storeName, items] of Object.entries(data)) {
    if (Object.values(STORES).includes(storeName as StoreName)) {
      await bulkSet(storeName as StoreName, items);
    }
  }
}

console.log('[IndexedDB] Module loaded');
