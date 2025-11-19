import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { mockRequest, mockResponse, mockNext } from './setup';

// Import controllers after mocks are set up
const { register, login, getProfile, updateProfile } = require('../controllers/auth.controller');

const prisma = new PrismaClient();

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const req = mockRequest({
        body: {
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User',
        },
      });
      const res = mockResponse();

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'newUserId',
        email: 'newuser@example.com',
        name: 'New User',
        createdAt: new Date(),
      });

      await register(req as Request, res as Response);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'newuser@example.com' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prisma.user.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          token: expect.any(String),
          user: expect.objectContaining({
            email: 'newuser@example.com',
          }),
        })
      );
    });

    it('should return 400 if user already exists', async () => {
      const req = mockRequest({
        body: {
          email: 'existing@example.com',
          password: 'password123',
          name: 'Existing User',
        },
      });
      const res = mockResponse();

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'existingId',
        email: 'existing@example.com',
      });

      await register(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        })
      );
    });

    it('should return 400 if required fields are missing', async () => {
      const req = mockRequest({
        body: {
          email: 'test@example.com',
          // missing password and name
        },
      });
      const res = mockResponse();

      await register(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      const req = mockRequest({
        body: {
          email: 'user@example.com',
          password: 'password123',
        },
      });
      const res = mockResponse();

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'userId',
        email: 'user@example.com',
        password: 'hashedPassword',
        name: 'Test User',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await login(req as Request, res as Response);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          token: expect.any(String),
          user: expect.objectContaining({
            email: 'user@example.com',
          }),
        })
      );
    });

    it('should return 401 if user not found', async () => {
      const req = mockRequest({
        body: {
          email: 'nonexistent@example.com',
          password: 'password123',
        },
      });
      const res = mockResponse();

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await login(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        })
      );
    });

    it('should return 401 if password is incorrect', async () => {
      const req = mockRequest({
        body: {
          email: 'user@example.com',
          password: 'wrongpassword',
        },
      });
      const res = mockResponse();

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'userId',
        email: 'user@example.com',
        password: 'hashedPassword',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await login(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const req = mockRequest({
        user: { id: 'userId' },
      });
      const res = mockResponse();

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'userId',
        email: 'user@example.com',
        name: 'Test User',
        createdAt: new Date(),
        streak: 5,
        totalWordsLearned: 100,
      });

      await getProfile(req as Request, res as Response);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'userId' },
        select: expect.any(Object),
      });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@example.com',
          name: 'Test User',
        })
      );
    });

    it('should return 404 if user not found', async () => {
      const req = mockRequest({
        user: { id: 'nonexistentId' },
      });
      const res = mockResponse();

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await getProfile(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const req = mockRequest({
        user: { id: 'userId' },
        body: {
          name: 'Updated Name',
          dailyGoal: 20,
        },
      });
      const res = mockResponse();

      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'userId',
        email: 'user@example.com',
        name: 'Updated Name',
        dailyGoal: 20,
      });

      await updateProfile(req as Request, res as Response);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'userId' },
        data: expect.objectContaining({
          name: 'Updated Name',
          dailyGoal: 20,
        }),
        select: expect.any(Object),
      });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Name',
        })
      );
    });
  });
});
