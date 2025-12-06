import { Router } from 'express';
import {
  getLearningMethods,
  generateMnemonic,
  generateImage,
  recordLearning,
  recordLearningBatch,
  getLearningStats,
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

/**
 * @swagger
 * /learning/record:
 *   post:
 *     summary: 학습 기록 저장 (단일)
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
 *               - quizType
 *               - isCorrect
 *             properties:
 *               wordId:
 *                 type: string
 *                 description: 단어 ID
 *               quizType:
 *                 type: string
 *                 enum: [LEVEL_TEST, ENG_TO_KOR, KOR_TO_ENG, FLASHCARD, SPELLING]
 *                 description: 퀴즈 타입
 *               isCorrect:
 *                 type: boolean
 *                 description: 정답 여부
 *               selectedAnswer:
 *                 type: string
 *                 description: 선택한 답
 *               correctAnswer:
 *                 type: string
 *                 description: 정답
 *               responseTime:
 *                 type: integer
 *                 description: 응답 시간 (ms)
 *               sessionId:
 *                 type: string
 *                 description: 세션 ID
 *     responses:
 *       201:
 *         description: 학습 기록 저장 성공
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/record', authenticateToken, recordLearning);

/**
 * @swagger
 * /learning/record-batch:
 *   post:
 *     summary: 학습 기록 일괄 저장
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
 *               - records
 *             properties:
 *               records:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - wordId
 *                     - quizType
 *                     - isCorrect
 *                   properties:
 *                     wordId:
 *                       type: string
 *                     quizType:
 *                       type: string
 *                       enum: [LEVEL_TEST, ENG_TO_KOR, KOR_TO_ENG, FLASHCARD, SPELLING]
 *                     isCorrect:
 *                       type: boolean
 *                     selectedAnswer:
 *                       type: string
 *                     correctAnswer:
 *                       type: string
 *                     responseTime:
 *                       type: integer
 *               sessionId:
 *                 type: string
 *                 description: 세션 ID (모든 레코드에 적용)
 *     responses:
 *       201:
 *         description: 학습 기록 일괄 저장 성공
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/record-batch', authenticateToken, recordLearningBatch);

/**
 * @swagger
 * /learning/stats:
 *   get:
 *     summary: 학습 통계 조회
 *     tags: [Learning]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 학습 통계
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overall:
 *                   type: object
 *                   properties:
 *                     totalQuestions:
 *                       type: integer
 *                     correctAnswers:
 *                       type: integer
 *                     accuracy:
 *                       type: integer
 *                 byLevel:
 *                   type: object
 *                 byMode:
 *                   type: object
 *                 weeklyActivity:
 *                   type: array
 *                   items:
 *                     type: object
 *                 streak:
 *                   type: object
 *                   properties:
 *                     current:
 *                       type: integer
 *                     longest:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/stats', authenticateToken, getLearningStats);

export default router;
