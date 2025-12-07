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
  // Pronunciation conversion
  convertPronunciations,
  // Pronunciation regeneration with AI
  regeneratePronunciationsHandler,
  // Exam words seeding
  seedExamWordsHandler,
} from '../controllers/admin.controller';
import {
  getWordVisuals,
  updateWordVisuals,
  deleteWordVisual,
} from '../controllers/visual.controller';
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

// ============================================
// Word Visuals (3-Image System) Routes
// ============================================

/**
 * @swagger
 * /admin/words/{wordId}/visuals:
 *   get:
 *     summary: Get word visuals (3-image system)
 *     tags: [Admin - Visuals]
 *     security:
 *       - bearerAuth: []
 */
router.get('/words/:wordId/visuals', getWordVisuals);

/**
 * @swagger
 * /admin/words/{wordId}/visuals:
 *   put:
 *     summary: Update word visuals (upsert)
 *     tags: [Admin - Visuals]
 *     security:
 *       - bearerAuth: []
 */
router.put('/words/:wordId/visuals', updateWordVisuals);

/**
 * @swagger
 * /admin/words/{wordId}/visuals/{type}:
 *   delete:
 *     summary: Delete specific visual type
 *     tags: [Admin - Visuals]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/words/:wordId/visuals/:type', deleteWordVisual);

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
// Pronunciation Conversion (한국어 발음 강세 변환)
// ============================================

/**
 * @swagger
 * /admin/convert-pronunciation:
 *   post:
 *     summary: Convert Korean pronunciation format (add stress markers)
 *     tags: [Admin - Utilities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dryRun:
 *                 type: boolean
 *                 default: true
 *                 description: If true, only shows preview without changing DB
 *               limit:
 *                 type: integer
 *                 description: Maximum number of words to process
 */
router.post('/convert-pronunciation', convertPronunciations);

/**
 * @swagger
 * /admin/regenerate-pronunciation:
 *   post:
 *     summary: Regenerate Korean pronunciation with AI (accurate syllables + stress)
 *     tags: [Admin - Utilities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dryRun:
 *                 type: boolean
 *                 default: true
 *                 description: If true, only shows preview without changing DB
 *               limit:
 *                 type: integer
 *                 description: Maximum number of words to process
 *               batchSize:
 *                 type: integer
 *                 default: 20
 *                 description: Number of words per API call
 */
router.post('/regenerate-pronunciation', regeneratePronunciationsHandler);

// ============================================
// Exam Words Seeding (시험별 단어 시드)
// ============================================

/**
 * @swagger
 * /admin/seed-exam-words:
 *   post:
 *     summary: Seed words for an exam category with duplicate checking
 *     description: |
 *       Add words to TOEFL/TOEIC/TEPS/SAT with smart duplicate detection.
 *       Words that exist in CSAT will have their content copied (free!).
 *       New words are created as DRAFT and need AI content generation.
 *     tags: [Admin - Exam Seeding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - examCategory
 *               - words
 *             properties:
 *               examCategory:
 *                 type: string
 *                 enum: [TOEFL, TOEIC, TEPS, SAT]
 *                 description: Target exam category
 *               words:
 *                 type: array
 *                 items:
 *                   oneOf:
 *                     - type: string
 *                     - type: object
 *                       properties:
 *                         word:
 *                           type: string
 *                         level:
 *                           type: string
 *                           enum: [L1, L2, L3]
 *                 description: Array of words (strings or {word, level} objects)
 *               dryRun:
 *                 type: boolean
 *                 default: true
 *                 description: If true, only shows preview without changing DB
 *               reuseContent:
 *                 type: boolean
 *                 default: true
 *                 description: If true, copies content from existing words
 *     responses:
 *       200:
 *         description: Seeding result with statistics
 */
router.post('/seed-exam-words', seedExamWordsHandler);

export default router;
