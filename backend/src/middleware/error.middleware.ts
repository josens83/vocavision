import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Add CORS headers to error responses
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

  // Log all errors for debugging
  console.error('=== Error Details ===');
  console.error('Path:', req.path);
  console.error('Method:', req.method);
  console.error('Error Name:', err.name);
  console.error('Error Message:', err.message);
  console.error('Stack:', err.stack);

  // Handle AppError (custom errors)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      status: err.statusCode
    });
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    console.error('Prisma Error Code:', err.code);

    if (err.code === 'P2002') {
      return res.status(409).json({
        error: 'A record with this value already exists',
        code: err.code
      });
    }

    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'Record not found',
        code: err.code
      });
    }

    return res.status(400).json({
      error: 'Database operation failed',
      code: err.code,
      message: err.message
    });
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    console.error('Prisma Initialization Error:', err.message);
    return res.status(503).json({
      error: 'Database connection failed',
      message: 'Unable to connect to database. Please try again later.',
      details: err.message
    });
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    console.error('Prisma Validation Error:', err.message);
    return res.status(400).json({
      error: 'Invalid data provided',
      message: err.message
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: err.message
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      message: err.message
    });
  }

  // Default error response - include more details for debugging
  return res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    name: err.name,
    // Include stack trace in non-production for debugging
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });
};
