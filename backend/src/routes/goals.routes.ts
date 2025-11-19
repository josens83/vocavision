import { Router } from 'express';
import {
  getDailyGoal,
  setDailyGoal,
  updateDailyProgress,
} from '../controllers/goals.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /goals/daily:
 *   get:
 *     summary: 일일 목표 조회
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 일일 목표 정보
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 targetWords:
 *                   type: integer
 *                   description: 목표 단어 수
 *                 completedWords:
 *                   type: integer
 *                   description: 완료한 단어 수
 *                 targetMinutes:
 *                   type: integer
 *                   description: 목표 학습 시간 (분)
 *                 completedMinutes:
 *                   type: integer
 *                   description: 완료한 학습 시간 (분)
 *                 date:
 *                   type: string
 *                   format: date
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/daily', authenticateToken, getDailyGoal);

/**
 * @swagger
 * /goals/daily:
 *   post:
 *     summary: 일일 목표 설정
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               targetWords:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 description: 목표 단어 수
 *               targetMinutes:
 *                 type: integer
 *                 minimum: 5
 *                 maximum: 240
 *                 description: 목표 학습 시간 (분)
 *     responses:
 *       200:
 *         description: 업데이트된 목표
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 targetWords:
 *                   type: integer
 *                 targetMinutes:
 *                   type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/daily', authenticateToken, setDailyGoal);

/**
 * @swagger
 * /goals/daily/progress:
 *   post:
 *     summary: 일일 진행도 업데이트
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               wordsCompleted:
 *                 type: integer
 *                 description: 완료한 단어 수 추가
 *               minutesCompleted:
 *                 type: integer
 *                 description: 완료한 시간 추가 (분)
 *     responses:
 *       200:
 *         description: 업데이트된 진행도
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 completedWords:
 *                   type: integer
 *                 completedMinutes:
 *                   type: integer
 *                 goalAchieved:
 *                   type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/daily/progress', authenticateToken, updateDailyProgress);

export default router;
