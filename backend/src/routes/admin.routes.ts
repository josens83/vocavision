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
  // Image Generation Jobs
  createImageGenJob,
  getImageGenJob,
  updateImageGenJob,
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
  // Word Visuals
  getWordVisuals,
  updateWordVisuals,
  // Image Generation Management
  getImageGenerationStatus,
  startImageBatchGeneration,
  getImageGenerationJobStatus,
  stopImageGeneration,
  // Image Management (missing images, regeneration, upload)
  getWordsMissingImages,
  regenerateWordImage,
  uploadWordImage,
  deleteWordImage,
  batchRegenerateImages,
} from '../controllers/admin.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * Auth middleware that allows any authenticated user OR secret key
 * (Less restrictive than adminAuth - for image generation management)
 */
const authOrSecretKey = async (req: Request, res: Response, next: NextFunction) => {
  const secretKey = (req.query.key as string) || req.headers['x-admin-key'];

  // Check for internal secret key (query param or header)
  if (secretKey && secretKey === process.env.INTERNAL_SECRET_KEY) {
    return next();
  }

  // Fall back to JWT authentication (any authenticated user)
  authenticateToken(req as any, res, next);
};

// ============================================
// Image Generation Management Routes (auth only, no admin required)
// These routes are registered BEFORE adminAuth middleware
// ============================================

router.get('/image-generation/status', authOrSecretKey, getImageGenerationStatus);
router.post('/image-generation/batch', authOrSecretKey, startImageBatchGeneration);
router.get('/image-generation/job/:jobId', authOrSecretKey, getImageGenerationJobStatus);
router.post('/image-generation/stop/:jobId', authOrSecretKey, stopImageGeneration);

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

// All remaining admin routes require either secret key or JWT admin auth
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
// Image Generation Jobs Routes
// ============================================

/**
 * @swagger
 * /admin/image-jobs:
 *   post:
 *     summary: Create a new image generation job
 *     tags: [Admin - Image Generation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - wordIds
 *             properties:
 *               wordIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               types:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [CONCEPT, MNEMONIC, RHYME]
 */
router.post('/image-jobs', createImageGenJob);

/**
 * @swagger
 * /admin/image-jobs/{jobId}:
 *   get:
 *     summary: Get image generation job status
 *     tags: [Admin - Image Generation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/image-jobs/:jobId', getImageGenJob);

/**
 * @swagger
 * /admin/image-jobs/{jobId}:
 *   patch:
 *     summary: Update image generation job
 *     tags: [Admin - Image Generation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 */
router.patch('/image-jobs/:jobId', updateImageGenJob);

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

/**
 * @swagger
 * /admin/words/{wordId}/visuals:
 *   get:
 *     summary: Get visuals for a word
 *     tags: [Admin - Visuals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wordId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/words/:wordId/visuals', getWordVisuals);

/**
 * @swagger
 * /admin/words/{wordId}/visuals:
 *   put:
 *     summary: Update visuals for a word
 *     tags: [Admin - Visuals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wordId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               concept:
 *                 type: object
 *                 properties:
 *                   imageUrl: { type: string }
 *                   captionKo: { type: string }
 *                   captionEn: { type: string }
 *               mnemonic:
 *                 type: object
 *               rhyme:
 *                 type: object
 */
router.put('/words/:wordId/visuals', updateWordVisuals);

// ============================================
// Image Management Routes (missing images, regeneration, upload)
// ============================================

/**
 * @swagger
 * /admin/words/missing-images:
 *   get:
 *     summary: Get words with missing images
 *     tags: [Admin - Image Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: examCategory
 *         schema:
 *           type: string
 *           enum: [CSAT, TEPS, TOEFL, EBS, CSAT_BASIC]
 *       - in: query
 *         name: imageType
 *         schema:
 *           type: string
 *           enum: [CONCEPT, MNEMONIC, RHYME]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 */
router.get('/words/missing-images', getWordsMissingImages);

/**
 * @swagger
 * /admin/words/{wordId}/regenerate-image:
 *   post:
 *     summary: Regenerate a single image for a word
 *     tags: [Admin - Image Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wordId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageType
 *             properties:
 *               imageType:
 *                 type: string
 *                 enum: [CONCEPT, MNEMONIC, RHYME]
 *               customPrompt:
 *                 type: string
 */
router.post('/words/:wordId/regenerate-image', regenerateWordImage);

/**
 * @swagger
 * /admin/words/{wordId}/upload-image:
 *   post:
 *     summary: Upload an image directly for a word
 *     tags: [Admin - Image Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wordId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageType
 *               - imageBase64
 *             properties:
 *               imageType:
 *                 type: string
 *                 enum: [CONCEPT, MNEMONIC, RHYME]
 *               imageBase64:
 *                 type: string
 *               captionKo:
 *                 type: string
 *               captionEn:
 *                 type: string
 */
router.post('/words/:wordId/upload-image', uploadWordImage);

/**
 * @swagger
 * /admin/words/{wordId}/images/{imageType}:
 *   delete:
 *     summary: Delete an image for a word
 *     tags: [Admin - Image Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wordId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: imageType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [CONCEPT, MNEMONIC, RHYME]
 */
router.delete('/words/:wordId/images/:imageType', deleteWordImage);

/**
 * @swagger
 * /admin/words/batch-regenerate-images:
 *   post:
 *     summary: Batch regenerate images for multiple words
 *     tags: [Admin - Image Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - wordIds
 *             properties:
 *               wordIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               imageTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [CONCEPT, MNEMONIC, RHYME]
 */
router.post('/words/batch-regenerate-images', batchRegenerateImages);

export default router;
