/**
 * Authentication Middleware for API Routes
 *
 * Provides JWT token verification and user authentication
 * for Next.js App Router API routes.
 *
 * @module lib/auth/middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import prisma from '@/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'vocavision-super-secret-jwt-key-min-32-characters-long-for-security'
);

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  subscriptionStatus: string;
}

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthUser;
}

/**
 * Extract JWT token from request headers
 */
function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) return null;

  // Format: "Bearer <token>"
  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Verify JWT token and extract payload
 */
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string | undefined,
      role: payload.role as string,
      subscriptionStatus: payload.subscriptionStatus as string,
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Generate JWT token for user
 */
export async function generateToken(user: AuthUser): Promise<string> {
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    subscriptionStatus: user.subscriptionStatus,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET);

  return token;
}

/**
 * Authenticate request and attach user to request object
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const authResult = await authenticate(request);
 *
 *   if (authResult.error) {
 *     return authResult.response;
 *   }
 *
 *   const user = authResult.user;
 *   // ... handle authenticated request
 * }
 * ```
 */
export async function authenticate(
  request: NextRequest
): Promise<{ user?: AuthUser; error?: string; response?: NextResponse }> {
  const token = extractToken(request);

  if (!token) {
    return {
      error: 'No authorization token provided',
      response: NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'No authorization token provided',
        },
        { status: 401 }
      ),
    };
  }

  const user = await verifyToken(token);

  if (!user) {
    return {
      error: 'Invalid or expired token',
      response: NextResponse.json(
        {
          success: false,
          error: 'Authentication failed',
          message: 'Invalid or expired token',
        },
        { status: 401 }
      ),
    };
  }

  return { user };
}

/**
 * Require authentication for API route
 * Returns user or error response
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ user: AuthUser } | NextResponse> {
  const authResult = await authenticate(request);

  if (authResult.error) {
    return authResult.response!;
  }

  return { user: authResult.user! };
}

/**
 * Check if user has required subscription status
 */
export function requireSubscription(
  user: AuthUser,
  requiredStatus: 'ACTIVE' | 'TRIAL' | 'FREE' = 'ACTIVE'
): { authorized: boolean; response?: NextResponse } {
  const statusHierarchy = {
    FREE: 0,
    TRIAL: 1,
    ACTIVE: 2,
  };

  const userLevel = statusHierarchy[user.subscriptionStatus as keyof typeof statusHierarchy] || 0;
  const requiredLevel = statusHierarchy[requiredStatus];

  if (userLevel < requiredLevel) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'Subscription required',
          message: `This feature requires ${requiredStatus} subscription`,
          requiredSubscription: requiredStatus,
          currentSubscription: user.subscriptionStatus,
        },
        { status: 403 }
      ),
    };
  }

  return { authorized: true };
}

/**
 * Check if user has required role
 */
export function requireRole(
  user: AuthUser,
  requiredRole: 'ADMIN' | 'MODERATOR' | 'USER'
): { authorized: boolean; response?: NextResponse } {
  const roleHierarchy = {
    USER: 0,
    MODERATOR: 1,
    ADMIN: 2,
  };

  const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole];

  if (userLevel < requiredLevel) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'Insufficient permissions',
          message: `This action requires ${requiredRole} role`,
          requiredRole,
          currentRole: user.role,
        },
        { status: 403 }
      ),
    };
  }

  return { authorized: true };
}

/**
 * Get current user from database
 */
export async function getCurrentUser(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionEnd: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Optional authentication - continues even if not authenticated
 * Useful for public endpoints that have enhanced features for logged-in users
 */
export async function optionalAuth(
  request: NextRequest
): Promise<{ user?: AuthUser | null }> {
  const token = extractToken(request);

  if (!token) {
    return { user: null };
  }

  const user = await verifyToken(token);

  return { user };
}
