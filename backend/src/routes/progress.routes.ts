import { Router } from 'express';
import {
  getUserProgress,
  getDueReviews,
  submitReview,
  startStudySession,
  endStudySession,
  getReviewHistory,
  getReviewQuiz,
  getMasteryDistribution,
  getActivityHeatmap
} from '../controllers/progress.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /progress:
 *   get:
 *     summary: 사용자 학습 진행도 조회
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 학습 진행도 및 통계
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalWordsLearned:
 *                       type: integer
 *                     currentStreak:
 *                       type: integer
 *                     longestStreak:
 *                       type: integer
 *                     lastActiveDate:
 *                       type: string
 *                       format: date-time
 *                 progress:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserProgress'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', authenticateToken, getUserProgress);

/**
 * @swagger
 * /progress/due:
 *   get:
 *     summary: 복습 예정 단어 조회
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 복습 예정 단어 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   description: 복습 예정 단어 수
 *                 words:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Word'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/due', authenticateToken, getDueReviews);

/**
 * @swagger
 * /progress/quiz:
 *   get:
 *     summary: 복습 퀴즈 문제 생성
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: examCategory
 *         schema:
 *           type: string
 *         description: 시험 카테고리 필터
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *         description: 레벨 필터 (L1, L2, L3)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 문제 수
 *     responses:
 *       200:
 *         description: 4지선다 퀴즈 문제 목록
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/quiz', authenticateToken, getReviewQuiz);

/**
 * @swagger
 * /progress/mastery:
 *   get:
 *     summary: 숙련도 분포 조회 (전체 단어 수 포함)
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: examCategory
 *         schema:
 *           type: string
 *           default: CSAT
 *         description: 시험 카테고리
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           default: all
 *         description: 레벨 (L1, L2, L3, all)
 *     responses:
 *       200:
 *         description: 숙련도 분포
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/mastery', authenticateToken, getMasteryDistribution);

/**
 * @swagger
 * /progress/activity:
 *   get:
 *     summary: 학습 활동 히트맵 데이터 조회
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: weeks
 *         schema:
 *           type: integer
 *           default: 52
 *         description: 조회할 주 수 (기본 52주 = 1년)
 *     responses:
 *       200:
 *         description: 일별 학습 활동 데이터
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 heatmapData:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       count:
 *                         type: integer
 *                       level:
 *                         type: integer
 *                         enum: [0, 1, 2, 3, 4]
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalDays:
 *                       type: integer
 *                     totalWords:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/activity', authenticateToken, getActivityHeatmap);

/**
 * @swagger
 * /progress/history:
 *   get:
 *     summary: 학습 기록 조회
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: 조회할 기록 수
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: 시작 위치
 *     responses:
 *       200:
 *         description: 학습 기록 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviews:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       wordId:
 *                         type: string
 *                       rating:
 *                         type: integer
 *                       learningMethod:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 total:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/history', authenticateToken, getReviewHistory);

/**
 * @swagger
 * /progress/review:
 *   post:
 *     summary: 복습 결과 제출
 *     tags: [Progress]
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
 *               - rating
 *             properties:
 *               wordId:
 *                 type: string
 *                 description: 단어 ID
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: "평가 (1: Again, 2: Hard, 3: Good, 4: Easy, 5: Perfect)"
 *               learningMethod:
 *                 type: string
 *                 enum: [FLASHCARD, IMAGE, VIDEO, RHYME, MNEMONIC, ETYMOLOGY, QUIZ, WRITING]
 *                 description: 학습 방법
 *               responseTime:
 *                 type: integer
 *                 description: 응답 시간 (밀리초)
 *               sessionId:
 *                 type: string
 *                 description: 학습 세션 ID
 *     responses:
 *       200:
 *         description: 업데이트된 진행도
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProgress'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/review', authenticateToken, submitReview);

/**
 * @swagger
 * /progress/session/start:
 *   post:
 *     summary: 학습 세션 시작
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: 생성된 세션
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 startTime:
 *                   type: string
 *                   format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/session/start', authenticateToken, startStudySession);

/**
 * @swagger
 * /progress/session/end:
 *   post:
 *     summary: 학습 세션 종료
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: 세션 ID
 *     responses:
 *       200:
 *         description: 종료된 세션 정보
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 duration:
 *                   type: integer
 *                   description: 학습 시간 (초)
 *                 wordsStudied:
 *                   type: integer
 *                 wordsCorrect:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/session/end', authenticateToken, endStudySession);

export default router;
