import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { hashPassword, comparePassword } from '../utils/password.util';
import { generateToken } from '../utils/jwt.util';
import { AppError } from '../middleware/error.middleware';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('[Register] Request received:', { email: req.body.email, name: req.body.name });

    const { email, password, name } = req.body;

    // Validation
    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400);
    }

    // Check database connection first
    console.log('[Register] Checking database connection...');
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('[Register] Database connection OK');
    } catch (dbError) {
      console.error('[Register] Database connection failed:', dbError);
      throw new AppError('Database connection failed. Please try again later.', 503);
    }

    // Check if user exists
    console.log('[Register] Checking for existing user...');
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new AppError('User already exists', 409);
    }

    // Create user with trial subscription
    console.log('[Register] Creating user...');
    const hashedPassword = await hashPassword(password);
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7); // 7-day trial

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        subscriptionStatus: 'TRIAL',
        trialEnd
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        subscriptionStatus: true,
        trialEnd: true
      }
    });

    console.log('[Register] User created:', user.id);

    // Check JWT_SECRET before generating token
    if (!process.env.JWT_SECRET) {
      console.error('[Register] JWT_SECRET is not set!');
      throw new AppError('Server configuration error', 500);
    }

    const token = generateToken(user.id, user.role);
    console.log('[Register] Token generated successfully');

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
    });
  } catch (error) {
    console.error('[Register] Error:', error);
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Update last active date
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveDate: new Date() }
    });

    const token = generateToken(user.id, user.role);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscriptionStatus: user.subscriptionStatus
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionEnd: true,
        trialEnd: true,
        totalWordsLearned: true,
        currentStreak: true,
        longestStreak: true,
        lastActiveDate: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};
