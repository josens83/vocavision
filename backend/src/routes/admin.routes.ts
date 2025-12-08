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
  // Collection management
  getAdminCollections,
  getAdminCollectionById,
  createAdminCollection,
  updateAdminCollection,
  deleteAdminCollection,
  addWordsToCollection,
  removeWordsFromCollection,
  // Audit Log
  getWordAuditLogs,
  // Exam Word Seeding
  seedExamWordsHandler,
  deleteExamWordsHandler,
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

// ============================================
// Collection (단어장) Routes
// ============================================

/**
 * @swagger
 * /admin/collections:
 *   get:
 *     summary: Get all collections
 *     tags: [Admin - Collections]
 *     security:
 *       - bearerAuth: []
 */
router.get('/collections', getAdminCollections);

/**
 * @swagger
 * /admin/collections/{collectionId}:
 *   get:
 *     summary: Get collection by ID with words
 *     tags: [Admin - Collections]
 *     security:
 *       - bearerAuth: []
 */
router.get('/collections/:collectionId', getAdminCollectionById);

/**
 * @swagger
 * /admin/collections:
 *   post:
 *     summary: Create a new collection
 *     tags: [Admin - Collections]
 *     security:
 *       - bearerAuth: []
 */
router.post('/collections', createAdminCollection);

/**
 * @swagger
 * /admin/collections/{collectionId}:
 *   patch:
 *     summary: Update a collection
 *     tags: [Admin - Collections]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/collections/:collectionId', updateAdminCollection);

/**
 * @swagger
 * /admin/collections/{collectionId}:
 *   delete:
 *     summary: Delete a collection
 *     tags: [Admin - Collections]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/collections/:collectionId', deleteAdminCollection);

/**
 * @swagger
 * /admin/collections/{collectionId}/words:
 *   post:
 *     summary: Add words to a collection
 *     tags: [Admin - Collections]
 *     security:
 *       - bearerAuth: []
 */
router.post('/collections/:collectionId/words', addWordsToCollection);

/**
 * @swagger
 * /admin/collections/{collectionId}/words:
 *   delete:
 *     summary: Remove words from a collection
 *     tags: [Admin - Collections]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/collections/:collectionId/words', removeWordsFromCollection);

// ============================================
// Audit Log Routes
// ============================================

/**
 * @swagger
 * /admin/words/{wordId}/audit-logs:
 *   get:
 *     summary: Get audit logs for a word
 *     tags: [Admin - Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wordId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 */
router.get('/words/:wordId/audit-logs', getWordAuditLogs);

// ============================================
// Exam Word Seeding Routes
// ============================================

/**
 * @swagger
 * /admin/seed-exam-words:
 *   post:
 *     summary: Seed exam words with deduplication (TEPS/TOEFL/TOEIC/SAT)
 *     tags: [Admin - Seeding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               examCategory:
 *                 type: string
 *                 enum: [TEPS, TOEFL, TOEIC, SAT]
 *               level:
 *                 type: string
 *                 description: L1, L2, L3 (loads from JSON file)
 *               words:
 *                 type: array
 *                 description: Optional custom word list
 *               dryRun:
 *                 type: boolean
 *                 default: false
 *               limit:
 *                 type: integer
 *                 default: 50
 *               offset:
 *                 type: integer
 *                 default: 0
 */
router.post('/seed-exam-words', seedExamWordsHandler as any);

/**
 * @swagger
 * /admin/delete-exam-words:
 *   delete:
 *     summary: Delete exam words (for cleanup/re-seeding)
 *     tags: [Admin - Seeding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - examCategory
 *             properties:
 *               examCategory:
 *                 type: string
 *                 enum: [TEPS, TOEFL, TOEIC, SAT]
 *               level:
 *                 type: string
 *                 description: L1, L2, L3 (optional, deletes all if not specified)
 *               dryRun:
 *                 type: boolean
 *                 default: true
 */
router.delete('/delete-exam-words', deleteExamWordsHandler as any);

export default router;
