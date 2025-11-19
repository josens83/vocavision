import { Router } from 'express';
import {
  getLearningMethods,
  generateMnemonic,
  generateImage,
} from '../controllers/learning.controller';
import { authenticateToken, requireSubscription } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /learning/methods/{wordId}:
 *   get:
 *     summary: 단어의 학습 방법 조회
 *     tags: [Learning]
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
 *         description: 학습 방법 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 methods:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         enum: [FLASHCARD, IMAGE, VIDEO, RHYME, MNEMONIC, ETYMOLOGY, QUIZ, WRITING]
 *                       content:
 *                         type: object
 *                       available:
 *                         type: boolean
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/methods/:wordId', authenticateToken, getLearningMethods);

/**
 * @swagger
 * /learning/generate-mnemonic:
 *   post:
 *     summary: AI 기억술 생성 (구독 필요)
 *     tags: [Learning]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - wordId
 *             properties:
 *               wordId:
 *                 type: string
 *                 description: 단어 ID
 *               style:
 *                 type: string
 *                 enum: [story, visual, association, rhyme]
 *                 description: 기억술 스타일
 *     responses:
 *       200:
 *         description: 생성된 기억술
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mnemonic:
 *                   type: string
 *                 style:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: 구독 필요
 */
router.post('/generate-mnemonic', authenticateToken, requireSubscription, generateMnemonic);

/**
 * @swagger
 * /learning/generate-image:
 *   post:
 *     summary: AI 이미지 생성 (구독 필요)
 *     tags: [Learning]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - wordId
 *             properties:
 *               wordId:
 *                 type: string
 *                 description: 단어 ID
 *     responses:
 *       200:
 *         description: 생성된 이미지
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imageUrl:
 *                   type: string
 *                   format: uri
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: 구독 필요
 */
router.post('/generate-image', authenticateToken, requireSubscription, generateImage);

export default router;
