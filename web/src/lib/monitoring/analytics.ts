// Phase 4-2: Google Analytics 4 Integration
// User behavior tracking and conversion analytics

import { logger } from '@/lib/utils/logger';

/**
 * Google Analytics 4 Configuration
 *
 * To use GA4:
 * 1. Set environment variable: NEXT_PUBLIC_GA_MEASUREMENT_ID
 * 2. Add gtag script to layout or _document
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/**
 * Initialize Google Analytics
 */
export function initGA(): void {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  if (!measurementId) {
    console.warn('[GA] Measurement ID not configured. Analytics disabled.');
    return;
  }

  // gtag will be loaded via Script component in layout
  logger.info('[GA] Analytics initialized', { measurementId });
}

/**
 * Send pageview event
 */
export function pageview(url: string): void {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
    page_path: url,
  });

  logger.debug('[GA] Pageview', { url });
}

/**
 * Send custom event
 */
export function event(
  action: string,
  params?: {
    category?: string;
    label?: string;
    value?: number;
    [key: string]: any;
  }
): void {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('event', action, {
    event_category: params?.category,
    event_label: params?.label,
    value: params?.value,
    ...params,
  });

  logger.debug('[GA] Event', { action, params });
}

/**
 * Predefined events for common actions
 */
export const AnalyticsEvents = {
  // User actions
  SIGN_UP: (method: string) =>
    event('sign_up', {
      method,
      category: 'engagement',
    }),

  LOGIN: (method: string) =>
    event('login', {
      method,
      category: 'engagement',
    }),

  LOGOUT: () =>
    event('logout', {
      category: 'engagement',
    }),

  // Learning actions
  WORD_LEARNED: (wordId: string, difficulty: string) =>
    event('word_learned', {
      word_id: wordId,
      difficulty,
      category: 'learning',
    }),

  QUIZ_COMPLETED: (quizType: string, score: number, accuracy: number) =>
    event('quiz_completed', {
      quiz_type: quizType,
      score,
      accuracy,
      category: 'learning',
    }),

  GAME_COMPLETED: (gameType: string, score: number) =>
    event('game_completed', {
      game_type: gameType,
      score,
      category: 'engagement',
    }),

  // Deck actions
  DECK_CREATED: (deckId: string) =>
    event('deck_created', {
      deck_id: deckId,
      category: 'content',
    }),

  DECK_CLONED: (deckId: string) =>
    event('deck_cloned', {
      deck_id: deckId,
      category: 'content',
    }),

  DECK_STUDIED: (deckId: string, wordsCount: number) =>
    event('deck_studied', {
      deck_id: deckId,
      words_count: wordsCount,
      category: 'learning',
    }),

  // Community actions
  MNEMONIC_SUBMITTED: (wordId: string) =>
    event('mnemonic_submitted', {
      word_id: wordId,
      category: 'community',
    }),

  MNEMONIC_VOTED: (mnemonicId: string, vote: 'up' | 'down') =>
    event('mnemonic_voted', {
      mnemonic_id: mnemonicId,
      vote,
      category: 'community',
    }),

  // Subscription actions
  SUBSCRIPTION_STARTED: (plan: string) =>
    event('purchase', {
      transaction_id: Date.now().toString(),
      value: plan === 'yearly' ? 99.99 : 9.99,
      currency: 'USD',
      items: [
        {
          item_id: plan,
          item_name: `VocaVision AI ${plan} subscription`,
        },
      ],
      category: 'conversion',
    }),

  // Engagement metrics
  SESSION_START: () =>
    event('session_start', {
      category: 'engagement',
    }),

  SESSION_END: (duration: number) =>
    event('session_end', {
      session_duration: duration,
      category: 'engagement',
    }),

  STREAK_MILESTONE: (days: number) =>
    event('streak_milestone', {
      streak_days: days,
      category: 'achievement',
    }),

  LEVEL_UP: (oldLevel: number, newLevel: number) =>
    event('level_up', {
      old_level: oldLevel,
      new_level: newLevel,
      category: 'achievement',
    }),

  // Error tracking
  ERROR_OCCURRED: (errorType: string, errorMessage: string) =>
    event('exception', {
      description: errorMessage,
      error_type: errorType,
      fatal: false,
      category: 'error',
    }),

  // Performance metrics
  PAGE_LOAD_TIME: (url: string, duration: number) =>
    event('timing_complete', {
      name: 'page_load',
      value: Math.round(duration),
      event_category: 'performance',
      event_label: url,
    }),

  API_CALL_TIME: (endpoint: string, duration: number, status: number) =>
    event('timing_complete', {
      name: 'api_call',
      value: Math.round(duration),
      event_category: 'performance',
      event_label: endpoint,
      status,
    }),
};

/**
 * Set user properties
 */
export function setUserProperties(properties: Record<string, any>): void {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('set', 'user_properties', properties);

  logger.debug('[GA] User properties set', properties);
}

/**
 * Set user ID
 */
export function setUserId(userId: string): void {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
    user_id: userId,
  });

  logger.debug('[GA] User ID set', { userId });
}

/**
 * Track conversion
 */
export function trackConversion(
  conversionId: string,
  value?: number,
  currency: string = 'USD'
): void {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('event', 'conversion', {
    send_to: conversionId,
    value,
    currency,
  });

  logger.info('[GA] Conversion tracked', { conversionId, value, currency });
}

/**
 * Enable/disable analytics
 */
export function setAnalyticsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') {
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any)[`ga-disable-${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`] = !enabled;

  logger.info('[GA] Analytics', { enabled });
}

/**
 * Track page timing
 */
export function trackTiming(
  category: string,
  variable: string,
  value: number,
  label?: string
): void {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('event', 'timing_complete', {
    name: variable,
    value: Math.round(value),
    event_category: category,
    event_label: label,
  });

  logger.debug('[GA] Timing', { category, variable, value, label });
}

/**
 * Track scroll depth
 */
export function trackScrollDepth(percentage: number): void {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('event', 'scroll', {
    percent_scrolled: percentage,
    event_category: 'engagement',
  });
}

/**
 * Enhanced measurement (automatic events)
 */
export function enableEnhancedMeasurement(): void {
  // Enhanced measurement is enabled by default in GA4
  // This includes: page_view, scroll, click, file_download, etc.
  logger.info('[GA] Enhanced measurement enabled');
}

console.log('[Analytics] Module loaded');
