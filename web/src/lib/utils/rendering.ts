// Phase 3-3: SSR/ISR Optimization Utilities
// Netflix-style rendering strategies for optimal performance

/**
 * ISR Revalidation strategies
 * Based on content update frequency
 */
export const ISR_STRATEGIES = {
  // Static content (rarely changes)
  STATIC: {
    revalidate: 86400, // 24 hours
    description: 'Static content like about pages, legal docs',
  },

  // Semi-static content (changes occasionally)
  SEMI_STATIC: {
    revalidate: 3600, // 1 hour
    description: 'Blog posts, documentation, featured content',
  },

  // Dynamic content (changes frequently)
  DYNAMIC: {
    revalidate: 60, // 1 minute
    description: 'User profiles, dashboards, feeds',
  },

  // Real-time content (changes very frequently)
  REALTIME: {
    revalidate: 10, // 10 seconds
    description: 'Leaderboards, live stats, notifications',
  },

  // On-demand only (revalidate via API)
  ON_DEMAND: {
    revalidate: false as const,
    description: 'Content that updates via webhook or admin action',
  },
} as const;

/**
 * Page-specific ISR configuration
 */
export const PAGE_ISR_CONFIG = {
  // Public pages
  '/': ISR_STRATEGIES.SEMI_STATIC,
  '/about': ISR_STRATEGIES.STATIC,
  '/pricing': ISR_STRATEGIES.SEMI_STATIC,

  // Auth pages (CSR only)
  '/auth/login': { revalidate: false as const, description: 'Auth pages - CSR only' },
  '/auth/register': { revalidate: false as const, description: 'Auth pages - CSR only' },

  // Dashboard (dynamic)
  '/dashboard': ISR_STRATEGIES.DYNAMIC,
  '/statistics': ISR_STRATEGIES.DYNAMIC,

  // Words (semi-static)
  '/words': ISR_STRATEGIES.SEMI_STATIC,
  '/words/[id]': ISR_STRATEGIES.SEMI_STATIC,

  // Leagues (real-time)
  '/leagues': ISR_STRATEGIES.REALTIME,

  // Decks (dynamic)
  '/decks': ISR_STRATEGIES.DYNAMIC,
  '/decks/[id]': ISR_STRATEGIES.DYNAMIC,

  // Games (dynamic)
  '/games': ISR_STRATEGIES.DYNAMIC,
};

/**
 * Get ISR config for a page
 */
export function getISRConfig(pathname: string): {
  revalidate: number | false;
  description: string;
} {
  const config = PAGE_ISR_CONFIG[pathname as keyof typeof PAGE_ISR_CONFIG];

  if (config) {
    return config;
  }

  // Default to dynamic for unknown pages
  return ISR_STRATEGIES.DYNAMIC;
}

/**
 * Cache tags for granular revalidation
 */
export const CACHE_TAGS = {
  WORDS: 'words',
  WORD_BY_ID: (id: string) => `word:${id}`,
  DECKS: 'decks',
  DECK_BY_ID: (id: string) => `deck:${id}`,
  LEAGUES: 'leagues',
  USER_PROGRESS: (userId: string) => `progress:${userId}`,
  MNEMONICS: (wordId: string) => `mnemonics:${wordId}`,
};

/**
 * Fetch with Next.js caching
 */
export async function fetchWithCache<T>(
  url: string,
  options?: RequestInit & {
    revalidate?: number | false;
    tags?: string[];
  }
): Promise<T> {
  const { revalidate, tags, ...fetchOptions } = options || {};

  const response = await fetch(url, {
    ...fetchOptions,
    next: {
      revalidate: revalidate !== undefined ? revalidate : 60,
      tags: tags || [],
    },
  });

  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Generate static params for dynamic routes
 */
export async function generateStaticWordsParams(limit: number = 100): Promise<{ id: string }[]> {
  try {
    // Fetch top N words for static generation
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/words?limit=${limit}`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.words?.map((word: any) => ({ id: word.id })) || [];
  } catch (error) {
    console.error('[ISR] Failed to generate static params for words:', error);
    return [];
  }
}

/**
 * Generate static params for decks
 */
export async function generateStaticDecksParams(limit: number = 50): Promise<{ id: string }[]> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/decks?limit=${limit}&isPublic=true`,
      {
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.decks?.map((deck: any) => ({ id: deck.id })) || [];
  } catch (error) {
    console.error('[ISR] Failed to generate static params for decks:', error);
    return [];
  }
}

/**
 * Streaming SSR utilities
 */
export function createSuspenseBoundary(component: React.ReactNode, fallback: React.ReactNode) {
  return {
    component,
    fallback,
  };
}

/**
 * Data fetching patterns
 */
export const FETCH_PATTERNS = {
  // Sequential (waterfall) - Use when data depends on each other
  SEQUENTIAL: 'sequential',

  // Parallel - Use when data is independent
  PARALLEL: 'parallel',

  // Streaming - Use for progressive rendering
  STREAMING: 'streaming',
} as const;

/**
 * Parallel data fetching helper
 */
export async function fetchParallel<T extends Record<string, Promise<any>>>(
  promises: T
): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
  const entries = Object.entries(promises);
  const results = await Promise.all(entries.map(([_, promise]) => promise));

  return Object.fromEntries(
    entries.map(([key], index) => [key, results[index]])
  ) as { [K in keyof T]: Awaited<T[K]> };
}

/**
 * Preload critical data
 */
export function preloadData(url: string): void {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  document.head.appendChild(link);
}

/**
 * Server-side cache headers
 */
export function getCacheHeaders(revalidate: number | false): Record<string, string> {
  if (revalidate === false) {
    return {
      'Cache-Control': 'no-store, must-revalidate',
    };
  }

  return {
    'Cache-Control': `public, s-maxage=${revalidate}, stale-while-revalidate=${revalidate * 2}`,
  };
}

/**
 * On-demand revalidation helper
 */
export async function revalidatePath(path: string, secret?: string): Promise<boolean> {
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/revalidate`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
      },
      body: JSON.stringify({ path }),
    });

    return response.ok;
  } catch (error) {
    console.error('[ISR] Failed to revalidate path:', path, error);
    return false;
  }
}

console.log('[Rendering] Module loaded');
