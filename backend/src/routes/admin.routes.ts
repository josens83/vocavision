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
  // Concept Image Regeneration by word names
  regenerateConceptByWords,
  // Bulk Concept Image Generation by exam/level
  generateConceptBulk,
  // Batch Visual Regeneration (CONCEPT, MNEMONIC, RHYME)
  regenerateVisualsByWords,
  // Cloudinary → Supabase Migration
  getCloudinaryMigrationStatus,
  startCloudinaryMigration,
  getCloudinaryMigrationProgress,
  stopCloudinaryMigration,
} from '../controllers/admin.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * Auth middleware that allows any authenticated user OR secret key
 * (Less restrictive than adminAuth - for image generation management)
 */
const authOrSecretKey = async (req: Request, res: Response, next: NextFunction) => {
  const secretKey = (req.query.key as string) || (req.query.adminKey as string) || req.headers['x-admin-key'];

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
 * @swagger
 * /admin/regenerate-concept:
 *   get:
 *     summary: Regenerate concept images for specific words (by word names)
 *     tags: [Admin - Image Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: words
 *         required: true
 *         schema:
 *           type: string
 *         description: Comma-separated word names (e.g., "principle,preliminary,proportion")
 *     responses:
 *       200:
 *         description: Started regenerating concept images
 */
router.get('/regenerate-concept', authOrSecretKey, regenerateConceptByWords);

/**
 * @swagger
 * /admin/generate-concept-bulk:
 *   get:
 *     summary: Bulk generate concept images for exam/level words
 *     tags: [Admin - Image Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: exam
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam category (e.g., "CSAT", "TEPS")
 *       - in: query
 *         name: level
 *         required: true
 *         schema:
 *           type: string
 *         description: Level (e.g., "L1", "L2", "L3")
 *       - in: query
 *         name: start
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Start offset for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 350
 *         description: Number of words to process
 *       - in: query
 *         name: delayMs
 *         schema:
 *           type: integer
 *           default: 2000
 *         description: Delay between image generations (ms)
 *     responses:
 *       200:
 *         description: Started bulk concept image generation
 */
router.get('/generate-concept-bulk', authOrSecretKey, generateConceptBulk);

/**
 * @swagger
 * /admin/regenerate-visuals:
 *   get:
 *     summary: Regenerate multiple visual types for multiple words
 *     tags: [Admin - Image Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: words
 *         required: true
 *         schema:
 *           type: string
 *         description: Comma-separated word names (e.g., "abandon,abolish,absorb")
 *       - in: query
 *         name: types
 *         schema:
 *           type: string
 *           default: "CONCEPT,MNEMONIC,RHYME"
 *         description: Comma-separated visual types to generate
 *     responses:
 *       200:
 *         description: Started regenerating visuals
 */
router.get('/regenerate-visuals', authOrSecretKey, regenerateVisualsByWords);

/**
 * @swagger
 * /admin/content/words/batch-concept-image-get:
 *   get:
 *     summary: Alias for bulk concept image generation (GET for browser URL bar)
 *     tags: [Admin - Image Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: exam
 *         required: true
 *         schema:
 *           type: string
 *         description: Exam category (e.g., "CSAT", "TEPS")
 *       - in: query
 *         name: level
 *         required: true
 *         schema:
 *           type: string
 *         description: Level (e.g., "L1", "L2", "L3")
 *       - in: query
 *         name: start
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Start offset for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of words to process (max 500)
 *     responses:
 *       200:
 *         description: Started bulk concept image generation
 */
router.get('/content/words/batch-concept-image-get', authOrSecretKey, generateConceptBulk);

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

// ============================================
// IMPORTANT: Specific /words/* routes MUST come BEFORE /words/:wordId
// Otherwise Express matches 'missing-images' as a wordId parameter!
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

// ============================================
// Parameterized /words/:wordId routes come AFTER specific routes
// ============================================

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
// Image Management Routes (regeneration, upload, delete)
// Note: /words/missing-images is defined earlier (before /words/:wordId)
// ============================================

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

// ============================================
// Cloudinary → Supabase Migration Routes
// ============================================

/**
 * @swagger
 * /admin/migration/cloudinary-status:
 *   get:
 *     summary: Get Cloudinary migration status (total images to migrate)
 *     tags: [Admin - Migration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Migration status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalCloudinaryImages:
 *                   type: number
 *                 totalSupabaseImages:
 *                   type: number
 *                 cloudinaryByType:
 *                   type: object
 *                 sampleUrls:
 *                   type: array
 */
router.get('/migration/cloudinary-status', getCloudinaryMigrationStatus);

/**
 * @swagger
 * /admin/migration/cloudinary-to-supabase:
 *   post:
 *     summary: Start Cloudinary to Supabase migration
 *     tags: [Admin - Migration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               batchSize:
 *                 type: number
 *                 default: 50
 *               startOffset:
 *                 type: number
 *                 default: 0
 *               dryRun:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Migration started
 *       409:
 *         description: Migration already running
 */
router.post('/migration/cloudinary-to-supabase', startCloudinaryMigration);

/**
 * @swagger
 * /admin/migration/cloudinary-to-supabase/status:
 *   get:
 *     summary: Get migration progress
 *     tags: [Admin - Migration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Migration progress
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isRunning:
 *                   type: boolean
 *                 sessionId:
 *                   type: string
 *                 progress:
 *                   type: object
 *                   properties:
 *                     processed:
 *                       type: number
 *                     success:
 *                       type: number
 *                     failed:
 *                       type: number
 *                     total:
 *                       type: number
 *                     percentage:
 *                       type: number
 *                 errors:
 *                   type: array
 *                 estimatedTimeRemaining:
 *                   type: string
 */
router.get('/migration/cloudinary-to-supabase/status', getCloudinaryMigrationProgress);

/**
 * @swagger
 * /admin/migration/cloudinary-to-supabase/stop:
 *   post:
 *     summary: Stop running migration
 *     tags: [Admin - Migration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Migration stopped
 */
router.post('/migration/cloudinary-to-supabase/stop', stopCloudinaryMigration);

// ============================================
// 🚀 Cache Monitoring (Phase 3)
// ============================================
import appCache from '../lib/cache';

/**
 * @swagger
 * /admin/cache/stats:
 *   get:
 *     summary: Get cache statistics
 *     tags: [Admin - Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache statistics
 */
router.get('/cache/stats', authOrSecretKey, async (req: Request, res: Response) => {
  const stats = appCache.getStats();
  const keys = appCache.getKeys();
  res.json({
    hits: stats.hits,
    misses: stats.misses,
    hitRate: stats.hits + stats.misses > 0
      ? Math.round((stats.hits / (stats.hits + stats.misses)) * 100)
      : 0,
    keys: stats.keys,
    keyList: keys,
    ksize: stats.ksize,
    vsize: stats.vsize,
  });
});

/**
 * @swagger
 * /admin/cache/clear:
 *   post:
 *     summary: Clear all cache entries
 *     tags: [Admin - Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache cleared
 */
router.post('/cache/clear', authOrSecretKey, async (req: Request, res: Response) => {
  appCache.invalidateAll();
  res.json({ message: 'Cache cleared', timestamp: new Date().toISOString() });
});

// ============================================
// 임시: EBS 교재별 레벨 매핑 시드 실행
// 시드 완료 후 이 엔드포인트는 제거할 것
// ============================================
router.get('/seed-ebs-levels', async (req: Request, res: Response) => {
  try {
    const prisma = (await import('../lib/prisma')).default;
    const fs = await import('fs');
    const path = await import('path');

    const FILE_LEVEL_MAP = [
      { file: 'EBS_2026_수능특강_영어듣기_영단어_숙어.txt', level: 'LISTENING', label: '듣기영역' },
      { file: 'EBS_2026_수능특강_영단어_숙어.txt', level: 'READING_BASIC', label: '독해영역 기본' },
      { file: 'EBS_2026_수능특강_영어독해연습_영단어_숙어.txt', level: 'READING_ADV', label: '독해영역 실력' },
    ];

    const examCategory = 'EBS' as const;
    const log: string[] = [];

    // 1. 기존 EBS 단어 전체 조회 (word text → id 매핑)
    const ebsWords = await prisma.word.findMany({
      where: { examCategory },
      select: { id: true, word: true },
    });
    const wordTextToId = new Map<string, string>();
    for (const w of ebsWords) {
      wordTextToId.set(w.word.toLowerCase(), w.id);
    }
    log.push(`DB EBS 단어 수: ${ebsWords.length}개`);

    // 2. 모든 텍스트 파일 파싱 → wordId → Set<level> 매핑 구축
    const wordIdToLevels = new Map<string, Set<string>>();
    const stats = { totalParsed: 0, matched: 0, notFound: 0, updated: 0, created: 0 };

    for (const { file, level, label } of FILE_LEVEL_MAP) {
      const filePath = path.resolve(__dirname, '..', '..', 'data', file);

      if (!fs.existsSync(filePath)) {
        log.push(`⚠️ 파일 없음: ${file} — 건너뜀`);
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const words = new Set<string>();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('≅')) continue;
        const entry = trimmed.substring(1).trim();
        const match = entry.match(/^([a-zA-Z][a-zA-Z\s\-'.,;:~()\/]+?)(?:\s+[가-힣\(]|\s*$)/);
        if (match) {
          let word = match[1].trim().replace(/[,;:]+$/, '').trim();
          if (word.length > 0) words.add(word.toLowerCase());
        }
      }

      log.push(`📖 ${label}: 파싱 ${words.size}개`);
      stats.totalParsed += words.size;

      let matchCount = 0;
      let notFoundCount = 0;
      for (const word of words) {
        const wordId = wordTextToId.get(word);
        if (wordId) {
          matchCount++;
          if (!wordIdToLevels.has(wordId)) wordIdToLevels.set(wordId, new Set());
          wordIdToLevels.get(wordId)!.add(level);
        } else {
          notFoundCount++;
        }
      }
      log.push(`   매칭: ${matchCount}개, 미매칭: ${notFoundCount}개`);
      stats.matched += matchCount;
      stats.notFound += notFoundCount;
    }

    // 3. 기존 level=null 레코드 조회 → wordId → recordId 매핑
    const nullRecords = await prisma.wordExamLevel.findMany({
      where: { examCategory, level: null },
      select: { id: true, wordId: true },
    });
    const wordIdToNullRecordId = new Map<string, string>();
    for (const r of nullRecords) {
      wordIdToNullRecordId.set(r.wordId, r.id);
    }
    log.push(`기존 level=null 레코드: ${nullRecords.length}개`);

    // 4. UPDATE + CREATE 실행
    const toCreate: { wordId: string; examCategory: typeof examCategory; level: string }[] = [];

    for (const [wordId, levels] of wordIdToLevels) {
      const levelArray = Array.from(levels);
      const nullRecordId = wordIdToNullRecordId.get(wordId);

      if (nullRecordId) {
        // 기존 null 레코드를 첫 번째 레벨로 UPDATE
        await prisma.wordExamLevel.update({
          where: { id: nullRecordId },
          data: { level: levelArray[0] },
        });
        stats.updated++;
        // 나머지 레벨은 CREATE
        for (let i = 1; i < levelArray.length; i++) {
          toCreate.push({ wordId, examCategory, level: levelArray[i] });
        }
      } else {
        // null 레코드 없음 → 모두 CREATE
        for (const level of levelArray) {
          toCreate.push({ wordId, examCategory, level });
        }
      }
    }
    log.push(`UPDATE: ${stats.updated}개 (null → 레벨)`);

    // 배치 CREATE
    if (toCreate.length > 0) {
      const batchSize = 500;
      for (let i = 0; i < toCreate.length; i += batchSize) {
        const batch = toCreate.slice(i, i + batchSize);
        const result = await prisma.wordExamLevel.createMany({ data: batch, skipDuplicates: true });
        stats.created += result.count;
      }
    }
    log.push(`CREATE: ${stats.created}개 (추가 레벨)`);

    // 5. 레벨 미매핑 null 레코드 정리 (텍스트 파일에 없는 단어의 null 레코드)
    const remainingNull = await prisma.wordExamLevel.count({
      where: { examCategory, level: null },
    });
    log.push(`남은 level=null 레코드: ${remainingNull}개`);

    // 최종 레벨별 카운트
    const levelCounts = await prisma.wordExamLevel.groupBy({
      by: ['level'],
      where: { examCategory },
      _count: { id: true },
    });
    log.push(`\n📊 최종 레벨별 분포:`);
    for (const lc of levelCounts) {
      log.push(`   ${lc.level || 'null'}: ${lc._count.id}개`);
    }

    res.json({ success: true, stats, log });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================
// 단품 패키지 시드 엔드포인트
// GET /api/admin/seed-packages
// ============================================
router.get('/seed-packages', async (req: Request, res: Response) => {
  try {
    const prisma = (await import('../lib/prisma')).default;
    const results: any[] = [];

    // 1. 2026 수능기출완전분석 패키지
    const csatPkg = await prisma.productPackage.upsert({
      where: { slug: '2026-csat-analysis' },
      update: {
        name: '2026 수능기출완전분석',
        price: 3900,
        durationDays: 180,
        badge: 'BEST',
        isActive: true,
      },
      create: {
        name: '2026 수능기출완전분석',
        slug: '2026-csat-analysis',
        description: '2026학년도 수능 영어영역 기출 단어 521개 완벽 분석. 듣기영역, 독해영역 2점, 독해영역 3점 유형별 학습.',
        shortDesc: '2026년 수능 기출문제 완전 분석, 출제 경향과 핵심 어휘',
        price: 3900,
        durationDays: 180,
        badge: 'BEST',
        badgeColor: '#14B8A6',
        displayOrder: 1,
        isActive: true,
      },
    });

    // CSAT_2026 단어 연결
    const csatWords = await prisma.word.findMany({
      where: { examCategory: 'CSAT_2026' },
      select: { id: true },
    });
    const existingCsatLinks = await prisma.productPackageWord.count({
      where: { packageId: csatPkg.id },
    });
    if (existingCsatLinks === 0 && csatWords.length > 0) {
      await prisma.productPackageWord.createMany({
        data: csatWords.map((w, i) => ({
          packageId: csatPkg.id,
          wordId: w.id,
          displayOrder: i,
        })),
        skipDuplicates: true,
      });
    }
    results.push({
      slug: '2026-csat-analysis',
      id: csatPkg.id,
      wordCount: csatWords.length,
      linkedBefore: existingCsatLinks,
    });

    // 2. EBS 연계어휘 패키지
    const ebsPkg = await prisma.productPackage.upsert({
      where: { slug: 'ebs-vocab' },
      update: {
        name: 'EBS 연계어휘',
        price: 6900,
        durationDays: 180,
        badge: 'NEW',
        isActive: true,
      },
      create: {
        name: 'EBS 연계어휘',
        slug: 'ebs-vocab',
        description: '2026학년도 EBS 수능특강 3개 교재(영어듣기·영어·영어독해연습) 연계 어휘 3,837개 완벽 대비.',
        shortDesc: '3개 교재(영어듣기·영어·영어독해연습) 연계 어휘 완벽 대비',
        price: 6900,
        durationDays: 180,
        badge: 'NEW',
        badgeColor: '#EF4444',
        displayOrder: 2,
        isActive: true,
      },
    });

    // EBS 단어 연결
    const ebsWords = await prisma.word.findMany({
      where: { examCategory: 'EBS' },
      select: { id: true },
    });
    const existingEbsLinks = await prisma.productPackageWord.count({
      where: { packageId: ebsPkg.id },
    });
    if (existingEbsLinks === 0 && ebsWords.length > 0) {
      await prisma.productPackageWord.createMany({
        data: ebsWords.map((w, i) => ({
          packageId: ebsPkg.id,
          wordId: w.id,
          displayOrder: i,
        })),
        skipDuplicates: true,
      });
    }
    results.push({
      slug: 'ebs-vocab',
      id: ebsPkg.id,
      wordCount: ebsWords.length,
      linkedBefore: existingEbsLinks,
    });

    res.json({ success: true, packages: results });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
