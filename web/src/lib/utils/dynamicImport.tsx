// Phase 3-1: Dynamic Import Helpers for Code Splitting
// Reduces initial bundle size by lazy-loading components

import dynamic from 'next/dynamic';
import { ComponentType, ReactElement } from 'react';
import { SkeletonLoader, ListSkeleton, CardSkeleton } from '@/components/fallbacks/GracefulData';

/**
 * Dynamic import with loading fallback
 */
export function dynamicImport<P extends object = object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  options?: {
    loading?: () => ReactElement | null;
    ssr?: boolean;
  }
) {
  return dynamic(importFunc, {
    loading: options?.loading ?? (() => <SkeletonLoader className="h-40 w-full" />),
    ssr: options?.ssr !== false, // SSR enabled by default
  });
}

/**
 * Dynamic import for heavy components (disable SSR)
 */
export function dynamicImportClient<P extends object = object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  loading?: () => ReactElement | null
) {
  return dynamic(importFunc, {
    loading: loading ?? (() => <SkeletonLoader className="h-40 w-full" />),
    ssr: false, // Disable SSR for client-only components
  });
}

/**
 * Dynamic import for list components
 */
export function dynamicImportList<P = {}>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  count?: number
) {
  return dynamic(importFunc, {
    loading: () => <ListSkeleton count={count || 3} />,
    ssr: true,
  });
}

/**
 * Dynamic import for card components
 */
export function dynamicImportCard<P = {}>(
  importFunc: () => Promise<{ default: ComponentType<P> }>
) {
  return dynamic(importFunc, {
    loading: () => <CardSkeleton />,
    ssr: true,
  });
}

/**
 * Preload component
 */
export function preloadComponent(importFunc: () => Promise<any>): void {
  // Trigger import without rendering
  importFunc().catch((err) => {
    console.error('[Preload] Failed to preload component:', err);
  });
}

/**
 * Route-based code splitting recommendations
 */
export const LAZY_ROUTES = {
  // Heavy pages that should be lazy-loaded
  statistics: () => import('@/app/statistics/page'),
  leagues: () => import('@/app/leagues/page'),
  games: () => import('@/app/games/page'),
  decks: () => import('@/app/decks/page'),

  // Heavy components
  heatmap: () => import('@/components/statistics/LearningHeatmap'),
  wordChart: () => import('@/components/statistics/WordAccuracyChart'),
  flashcard: () => import('@/components/learning/FlashCardGesture'),
};

/**
 * Intersection Observer for lazy loading
 */
export function useLazyLoad(callback: () => void, threshold: number = 0.1) {
  if (typeof window === 'undefined') return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback();
          observer.disconnect();
        }
      });
    },
    { threshold }
  );

  return observer;
}

/**
 * Prefetch on hover
 */
export function prefetchOnHover(importFunc: () => Promise<any>) {
  return {
    onMouseEnter: () => {
      preloadComponent(importFunc);
    },
    onFocus: () => {
      preloadComponent(importFunc);
    },
  };
}

console.log('[DynamicImport] Module loaded');
