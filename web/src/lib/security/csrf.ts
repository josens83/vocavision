// Phase 5-5: CSRF Protection
// Cross-Site Request Forgery prevention

import { logger } from '@/lib/utils/logger';

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  if (typeof window === 'undefined') {
    // Server-side: use crypto
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  // Client-side: use Web Crypto API
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Store CSRF token in session
 */
export function setCSRFToken(): string {
  if (typeof window === 'undefined') {
    throw new Error('setCSRFToken can only be called on client-side');
  }

  const token = generateCSRFToken();
  sessionStorage.setItem('csrfToken', token);

  logger.debug('[CSRF] Token generated and stored');

  return token;
}

/**
 * Get CSRF token from session
 */
export function getCSRFToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  let token = sessionStorage.getItem('csrfToken');

  if (!token) {
    token = setCSRFToken();
  }

  return token;
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const storedToken = sessionStorage.getItem('csrfToken');

  if (!storedToken) {
    logger.warn('[CSRF] No stored token found');
    return false;
  }

  const valid = token === storedToken;

  if (!valid) {
    logger.error('[CSRF] Token validation failed', new Error(`provided: ${token.substring(0, 8)}..., expected: ${storedToken.substring(0, 8)}...`));
  }

  return valid;
}

/**
 * Add CSRF token to request headers
 */
export function addCSRFHeader(headers: Record<string, string> = {}): Record<string, string> {
  const token = getCSRFToken();

  if (token) {
    headers['X-CSRF-Token'] = token;
  }

  return headers;
}

/**
 * Middleware: Add CSRF token to fetch requests
 */
export function withCSRF(fetchFn: typeof fetch): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const token = getCSRFToken();

    if (token && init) {
      init.headers = {
        ...init.headers,
        'X-CSRF-Token': token,
      };
    }

    return fetchFn(input, init);
  };
}

console.log('[CSRF] Module loaded');
