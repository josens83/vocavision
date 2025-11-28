'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

interface UseAuthOptions {
  redirectTo?: string;
  redirectIfAuthenticated?: string;
}

/**
 * Custom hook for handling authentication with Zustand hydration support.
 *
 * This hook properly waits for Zustand to hydrate from localStorage before
 * checking authentication state, preventing premature redirects.
 *
 * @param options.redirectTo - Redirect to this path if not authenticated (default: '/auth/login')
 * @param options.redirectIfAuthenticated - Redirect to this path if already authenticated
 *
 * @returns { user, isLoading, isAuthenticated }
 */
export function useAuth(options: UseAuthOptions = {}) {
  const { redirectTo = '/auth/login', redirectIfAuthenticated } = options;
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  const isLoading = !hasHydrated;
  const isAuthenticated = hasHydrated && !!user;

  useEffect(() => {
    if (!hasHydrated) return;

    // Redirect if not authenticated
    if (!user && redirectTo) {
      router.push(redirectTo);
      return;
    }

    // Redirect if already authenticated (for login/register pages)
    if (user && redirectIfAuthenticated) {
      router.push(redirectIfAuthenticated);
      return;
    }
  }, [user, hasHydrated, redirectTo, redirectIfAuthenticated, router]);

  return {
    user,
    isLoading,
    isAuthenticated,
    hasHydrated,
  };
}

/**
 * Hook for pages that require authentication.
 * Automatically redirects to login if not authenticated.
 */
export function useRequireAuth() {
  return useAuth({ redirectTo: '/auth/login' });
}

/**
 * Hook for auth pages (login/register) that should redirect if already logged in.
 */
export function useRedirectIfAuthenticated(redirectTo = '/dashboard') {
  return useAuth({
    redirectTo: undefined,
    redirectIfAuthenticated: redirectTo
  });
}
