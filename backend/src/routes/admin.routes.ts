/**
 * VocaVision Admin Routes
 * 관리자 대시보드 API 라우트
 */

import { Router, Request, Response, NextFunction } from 'express';
import {
  getDashboardStats,
  getAdminWords,
  getAdminWordById,
  createAdminWord,
  updateAdminWord,
  updateWordContent,
  deleteAdminWord,
  batchCreateWords,
  bulkUpdateStatus,
  getBatchJobs,
} from '../controllers/admin.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * Admin authentication middleware
 * Allows either:
 * 1. JWT Bearer token with admin role
 * 2. Query parameter 'key' matching INTERNAL_SECRET_KEY
 * 3. Header 'x-admin-key' matching INTERNAL_SECRET_KEY
 */
const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
  const secretKey = (req.query.key as string) || req.headers['x-admin-key'];

  // Check for internal secret key (query param or header)
  if (secretKey && secretKey === process.env.INTERNAL_SECRET_KEY) {
    return next();
  }

  // Fall back to JWT authentication
  authenticateToken(req as any, res, (err?: any) => {
    if (err) return next(err);
    requireAdmin(req as any, res, next);
  });
};

// All admin routes require either secret key or JWT admin auth
router.use(adminAuth);

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', getDashboardStats);

/**
 * @swagger
 * /admin/words:
 *   get:
 *     summary: Get words with filters and pagination
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/words', getAdminWords);

/**
 * @swagger
 * /admin/words/{wordId}:
 *   get:
 *     summary: Get single word with full content
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/words/:wordId', getAdminWordById);

/**
 * @swagger
 * /admin/words:
 *   post:
 *     summary: Create a new word
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post('/words', createAdminWord);

/**
 * @swagger
 * /admin/words/{wordId}:
 *   patch:
 *     summary: Update a word
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/words/:wordId', updateAdminWord);

/**
 * @swagger
 * /admin/words/{wordId}/content:
 *   put:
 *     summary: Update word content (for Claude Max import)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.put('/words/:wordId/content', updateWordContent);

/**
 * @swagger
 * /admin/words/{wordId}:
 *   delete:
 *     summary: Delete a word
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/words/:wordId', deleteAdminWord);

/**
 * @swagger
 * /admin/words/batch:
 *   post:
 *     summary: Batch create words
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post('/words/batch', batchCreateWords);

/**
 * @swagger
 * /admin/words/bulk-status:
 *   post:
 *     summary: Bulk update word status (approve/publish)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post('/words/bulk-status', bulkUpdateStatus);

/**
 * @swagger
 * /admin/jobs:
 *   get:
 *     summary: Get batch generation jobs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/jobs', getBatchJobs);

export default router;
