import { z } from 'zod';
import logger from './logger';

// Define environment variables schema
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Optional: OpenAI (for AI features)
  OPENAI_API_KEY: z.string().optional(),

  // Optional: Stripe (for payments)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Optional: Cloudinary (for images)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Optional: Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validate environment variables on startup
 * Throws an error if required variables are missing or invalid
 */
export function validateEnv(): EnvConfig {
  try {
    const env = envSchema.parse(process.env);

    logger.info('[OK] Environment variables validated successfully');

    // Log warnings for missing optional features
    if (!env.OPENAI_API_KEY) {
      logger.warn('[WARN] OPENAI_API_KEY not set - AI features will be disabled');
    }

    if (!env.STRIPE_SECRET_KEY) {
      logger.warn('[WARN] STRIPE_SECRET_KEY not set - Payment features will be disabled');
    }

    if (!env.CLOUDINARY_CLOUD_NAME) {
      logger.warn('[WARN] Cloudinary credentials not set - Image upload will be disabled');
    }

    if (env.NODE_ENV === 'production') {
      // Additional production checks
      if (env.JWT_SECRET.length < 32) {
        logger.warn('[WARN] JWT_SECRET is too short for production use');
      }

      if (env.CORS_ORIGIN === 'http://localhost:3000') {
        logger.warn('[WARN] CORS_ORIGIN is set to localhost in production');
      }
    }

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('[ERROR] Environment validation failed:');
      error.errors.forEach((err) => {
        logger.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }

    throw new Error('Environment validation failed. Please check your .env file.');
  }
}

/**
 * Get a validated environment variable
 */
export function getEnv<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
  return process.env[key] as EnvConfig[K];
}
