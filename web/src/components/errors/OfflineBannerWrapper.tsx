/**
 * Offline Banner Wrapper
 * Client component wrapper for use in server components (layouts)
 */

'use client';

import { OfflineBanner } from './ApiErrorFallback';

export function OfflineBannerWrapper() {
  return <OfflineBanner />;
}
