/**
 * VocaVision Admin Routes
 * 관리자 대시보드 API 라우트
 */

import { Router } from 'express';
import {
  getDashboardStats,
  getAdminWords,
  getAdminWordById,
  createAdminWord,
  updateAdminWord,
  deleteAdminWord,
  batchCreateWords,
  bulkUpdateStatus,
  getBatchJobs,
} from '../controllers/admin.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

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
