import { Router, Request, Response, NextFunction } from 'express';
import {
  generateContent,
  createBatchJob,
  getJobStatus,
  listJobs,
  reviewContent,
  publishContent,
  getAuditHistory,
  getPendingReview,
} from '../controllers/contentGeneration.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * Admin authentication middleware
 * Allows either JWT Bearer token or x-admin-key header
 */
const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
  const secretKey = (req.query.key as string) || req.headers['x-admin-key'];
  const authHeader = req.headers['authorization'];

  // Check for internal secret key (query param or header)
  if (secretKey) {
    if (!process.env.INTERNAL_SECRET_KEY) {
      console.error('[Content Auth] INTERNAL_SECRET_KEY not configured on server');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'Admin authentication not configured'
      });
    }

    if (secretKey === process.env.INTERNAL_SECRET_KEY) {
      return next();
    }

    // Key provided but doesn't match
    console.log('[Content Auth] Admin key mismatch');
    return res.status(401).json({
      error: 'Invalid admin key',
      message: 'The provided admin key is incorrect'
    });
  }

  // No admin key provided, check for JWT
  if (!authHeader) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Provide x-admin-key header or Bearer token'
    });
  }

  // Fall back to JWT authentication
  authenticateToken(req as any, res, (err?: any) => {
    if (err) return next(err);
    requireAdmin(req as any, res, next);
  });
};

/**
 * @swagger
 * tags:
 *   name: Content Generation
 *   description: AI 콘텐츠 생성 파이프라인 API
 */

/**
 * @swagger
 * /content/generate:
 *   post:
 *     summary: 단일 단어 콘텐츠 생성
 *     tags: [Content Generation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - word
 *             properties:
 *               word:
 *                 type: string
 *                 description: 콘텐츠를 생성할 영어 단어
 *               examCategory:
 *                 type: string
 *                 enum: [CSAT, TOEIC, TOEFL, IELTS, GRE, SAT, GENERAL]
 *                 default: CSAT
 *               cefrLevel:
 *                 type: string
 *                 enum: [A1, A2, B1, B2, C1, C2]
 *                 default: B1
 *               saveToDb:
 *                 type: boolean
 *                 default: false
 *                 description: 생성된 콘텐츠를 DB에 저장할지 여부
 *     responses:
 *       200:
 *         description: 생성된 콘텐츠
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/generate', adminAuth, generateContent);

/**
 * @swagger
 * /content/batch:
 *   post:
 *     summary: 배치 콘텐츠 생성 작업 생성
 *     tags: [Content Generation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - words
 *             properties:
 *               words:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 콘텐츠를 생성할 단어 목록 (최대 100개)
 *               examCategory:
 *                 type: string
 *                 enum: [CSAT, TOEIC, TOEFL, IELTS, GRE, SAT, GENERAL]
 *                 default: CSAT
 *               cefrLevel:
 *                 type: string
 *                 enum: [A1, A2, B1, B2, C1, C2]
 *                 default: B1
 *     responses:
 *       201:
 *         description: 배치 작업 생성됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 jobId:
 *                   type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/batch', adminAuth, createBatchJob);

/**
 * @swagger
 * /content/jobs:
 *   get:
 *     summary: 배치 작업 목록 조회
 *     tags: [Content Generation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled]
 *         description: 작업 상태 필터
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: 작업 목록
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/jobs', adminAuth, listJobs);

/**
 * @swagger
 * /content/jobs/{jobId}:
 *   get:
 *     summary: 특정 배치 작업 상태 조회
 *     tags: [Content Generation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: 작업 ID
 *     responses:
 *       200:
 *         description: 작업 상태
 *       404:
 *         description: 작업을 찾을 수 없음
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/jobs/:jobId', adminAuth, getJobStatus);

/**
 * @swagger
 * /content/pending:
 *   get:
 *     summary: 검토 대기 중인 콘텐츠 조회
 *     tags: [Content Generation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: 검토 대기 콘텐츠 목록
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/pending', adminAuth, getPendingReview);

/**
 * @swagger
 * /content/review/{wordId}:
 *   post:
 *     summary: 콘텐츠 검토 (승인/거절/수정)
 *     tags: [Content Generation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wordId
 *         required: true
 *         schema:
 *           type: string
 *         description: 단어 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject, edit]
 *               fields:
 *                 type: object
 *                 description: action이 edit일 때 수정할 필드들
 *               reason:
 *                 type: string
 *                 description: 검토 사유
 *     responses:
 *       200:
 *         description: 검토 완료
 *       400:
 *         description: 잘못된 요청
 *       404:
 *         description: 단어를 찾을 수 없음
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/review/:wordId', adminAuth, reviewContent);

/**
 * @swagger
 * /content/publish/{wordId}:
 *   post:
 *     summary: 콘텐츠 발행
 *     tags: [Content Generation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wordId
 *         required: true
 *         schema:
 *           type: string
 *         description: 단어 ID
 *     responses:
 *       200:
 *         description: 발행 완료
 *       400:
 *         description: 승인되지 않은 콘텐츠
 *       404:
 *         description: 단어를 찾을 수 없음
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/publish/:wordId', adminAuth, publishContent);

/**
 * @swagger
 * /content/audit/{wordId}:
 *   get:
 *     summary: 콘텐츠 감사 이력 조회
 *     tags: [Content Generation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wordId
 *         required: true
 *         schema:
 *           type: string
 *         description: 단어 ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: 감사 이력
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/audit/:wordId', adminAuth, getAuditHistory);

export default router;
