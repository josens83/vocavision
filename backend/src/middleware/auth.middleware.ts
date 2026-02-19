import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

// Helper to add CORS headers to error responses
const addCorsHeaders = (req: Request, res: Response) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'https://vocavision-web.vercel.app',
    'https://vocavision.kr',
    'https://www.vocavision.kr',
  ];

  if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
};

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      console.log('[Auth] No token provided');
      addCorsHeaders(req, res);
      return res.status(401).json({ error: 'Access token required' });
    }

    // Debug: Log token info (first/last few chars only for security)
    console.log('[Auth] Token received:', token.substring(0, 20) + '...' + token.substring(token.length - 10));
    console.log('[Auth] JWT_SECRET exists:', !!process.env.JWT_SECRET);

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      role: string;
    };

    console.log('[Auth] Token decoded successfully, userId:', decoded.userId);

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, subscriptionStatus: true }
    });

    if (!user) {
      console.log('[Auth] User not found in database');
      addCorsHeaders(req, res);
      return res.status(401).json({ error: 'User not found' });
    }

    console.log('[Auth] User authenticated:', user.id, 'role:', user.role);
    req.userId = decoded.userId;
    req.userRole = user.role; // Use DB role, not token role
    next();
  } catch (error) {
    console.error('[Auth] Token verification failed:', error instanceof Error ? error.message : error);
    addCorsHeaders(req, res);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Admin 권한 필수 이메일 목록 (DB role과 별개로 항상 Admin 접근 허용)
const ADMIN_EMAILS = [
  'dohurnk@gmail.com',
  'admin@vocavision.ai',
];

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // 이미 ADMIN role이면 통과
  if (req.userRole === 'ADMIN') {
    return next();
  }

  // ADMIN_EMAILS에 있는 사용자는 자동 Admin 권한 부여
  if (req.userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { email: true }
      });

      if (user && user.email && ADMIN_EMAILS.includes(user.email)) {
        console.log('[Auth] Admin bypass for:', user.email);
        req.userRole = 'ADMIN';
        return next();
      }
    } catch (error) {
      console.error('[Auth] Admin check error:', error);
    }
  }

  addCorsHeaders(req, res);
  return res.status(403).json({ error: 'Admin access required' });
};

export const requireSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { subscriptionStatus: true, subscriptionEnd: true }
    });

    if (!user) {
      addCorsHeaders(req, res);
      return res.status(404).json({ error: 'User not found' });
    }

    const hasActiveSubscription =
      user.subscriptionStatus === 'ACTIVE' ||
      user.subscriptionStatus === 'TRIAL' ||
      (user.subscriptionEnd && new Date(user.subscriptionEnd) > new Date());

    if (!hasActiveSubscription) {
      addCorsHeaders(req, res);
      return res.status(403).json({
        error: 'Active subscription required',
        subscriptionStatus: user.subscriptionStatus
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
          userId: string;
          role: string;
        };

        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, role: true }
        });

        if (user) {
          req.userId = decoded.userId;
          req.userRole = decoded.role;
        }
      } catch (error) {
        // Token invalid, but continue without auth
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
