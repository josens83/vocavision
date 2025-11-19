import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { mockRequest, mockResponse, mockNext } from './setup';

const { authenticateToken, optionalAuth, requireSubscription } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token', async () => {
      const req = mockRequest({
        headers: {
          authorization: 'Bearer validToken',
        },
      });
      const res = mockResponse();
      const next = mockNext;

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'userId' });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'userId',
        email: 'user@example.com',
      });

      await authenticateToken(req as Request, res as Response, next as NextFunction);

      expect(jwt.verify).toHaveBeenCalledWith('validToken', process.env.JWT_SECRET);
      expect(next).toHaveBeenCalled();
      expect((req as any).user).toBeDefined();
    });

    it('should return 401 if no token provided', async () => {
      const req = mockRequest({
        headers: {},
      });
      const res = mockResponse();
      const next = mockNext;

      await authenticateToken(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
      const req = mockRequest({
        headers: {
          authorization: 'Bearer invalidToken',
        },
      });
      const res = mockResponse();
      const next = mockNext;

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticateToken(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user not found', async () => {
      const req = mockRequest({
        headers: {
          authorization: 'Bearer validToken',
        },
      });
      const res = mockResponse();
      const next = mockNext;

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'nonexistent' });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await authenticateToken(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should attach user if valid token provided', async () => {
      const req = mockRequest({
        headers: {
          authorization: 'Bearer validToken',
        },
      });
      const res = mockResponse();
      const next = mockNext;

      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'userId' });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'userId',
        email: 'user@example.com',
      });

      await optionalAuth(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalled();
      expect((req as any).user).toBeDefined();
    });

    it('should continue without user if no token', async () => {
      const req = mockRequest({
        headers: {},
      });
      const res = mockResponse();
      const next = mockNext;

      await optionalAuth(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalled();
      expect((req as any).user).toBeUndefined();
    });

    it('should continue without user if invalid token', async () => {
      const req = mockRequest({
        headers: {
          authorization: 'Bearer invalidToken',
        },
      });
      const res = mockResponse();
      const next = mockNext;

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await optionalAuth(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireSubscription', () => {
    it('should allow premium users', async () => {
      const req = mockRequest({
        user: {
          id: 'userId',
          subscriptionTier: 'PREMIUM',
        },
      });
      const res = mockResponse();
      const next = mockNext;

      await requireSubscription(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalled();
    });

    it('should allow premium plus users', async () => {
      const req = mockRequest({
        user: {
          id: 'userId',
          subscriptionTier: 'PREMIUM_PLUS',
        },
      });
      const res = mockResponse();
      const next = mockNext;

      await requireSubscription(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalled();
    });

    it('should deny free tier users', async () => {
      const req = mockRequest({
        user: {
          id: 'userId',
          subscriptionTier: 'FREE',
        },
      });
      const res = mockResponse();
      const next = mockNext;

      await requireSubscription(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny if no subscription info', async () => {
      const req = mockRequest({
        user: {
          id: 'userId',
        },
      });
      const res = mockResponse();
      const next = mockNext;

      await requireSubscription(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
