import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

// Utilities
import logger from './utils/logger';
import { validateEnv } from './utils/validateEnv';

// Shared Prisma client with pgBouncer compatibility
import prisma from './lib/prisma';
export { prisma };

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import wordRoutes from './routes/word.routes';
import learningRoutes from './routes/learning.routes';
import progressRoutes from './routes/progress.routes';
import subscriptionRoutes from './routes/subscription.routes';
import bookmarkRoutes from './routes/bookmark.routes';
import goalsRoutes from './routes/goals.routes';
import achievementRoutes from './routes/achievement.routes';
import collectionRoutes from './routes/collection.routes';
import notificationRoutes from './routes/notification.routes';
import chatRoutes from './routes/chat.routes';
import deckRoutes from './routes/deck.routes';
import leagueRoutes from './routes/league.routes';
import internalRoutes from './routes/internal.routes';
import contentGenerationRoutes from './routes/contentGeneration.routes';
import adminRoutes from './routes/admin.routes';
import paymentsRoutes from './routes/payments.routes';
import packageRoutes from './routes/package.routes';

// Middleware
import { errorHandler } from './middleware/error.middleware';
import { rateLimiter } from './middleware/rateLimiter.middleware';

// Jobs
import { startSubscriptionJobs } from './jobs/subscriptionRenewal';

// Load environment variables
dotenv.config();

// Validate environment variables
validateEnv();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());

// 🚀 Response Compression (60~80% 응답 크기 감소)
app.use(compression({
  level: 6,              // 압축 레벨 (1~9, 6이 속도/크기 최적 밸런스)
  threshold: 1024,       // 1KB 이상만 압축
  filter: (req, res) => {
    // x-no-compression 헤더가 있으면 압축 건너뜀
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));

// CORS configuration - allow multiple origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://vocavision-web.vercel.app',
  'https://vocavision.kr',
  'https://www.vocavision.kr',
  process.env.CORS_ORIGIN,
].filter(Boolean) as string[];

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, false);
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));  // base64 image uploads (5mb 충분)
app.use(express.text({ type: 'text/plain' }));  // For sendBeacon text/plain requests
app.use(express.urlencoded({ limit: '5mb', extended: true }));
app.use(rateLimiter);

// Health check endpoints
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'VocaVision API Documentation',
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/words', wordRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/decks', deckRoutes);
app.use('/api/leagues', leagueRoutes);
app.use('/api/content', contentGenerationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/packages', packageRoutes);

// Internal routes (for admin operations via browser URL)
app.use('/internal', internalRoutes);

// Error handling
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  logger.info(`💚 Health Check: http://localhost:${PORT}/health`);

  // Start subscription renewal cron jobs
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON === 'true') {
    startSubscriptionJobs();
    logger.info(`⏰ Subscription cron jobs started`);
  }

  // 주기적 GC 실행 (5분마다, --expose-gc 플래그 필요)
  if (typeof global.gc === 'function') {
    setInterval(() => {
      global.gc!();
    }, 5 * 60 * 1000);
    logger.info(`🧹 Periodic GC enabled (every 5 min)`);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
  });
  await prisma.$disconnect();
  logger.info('Database connection closed');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
  });
  await prisma.$disconnect();
  logger.info('Database connection closed');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

export default app;
