import { Router } from 'express';
import {
  getLearningMethods,
  generateMnemonic,
  generateImage,
  recordLearning,
  recordLearningBatch,
  getLearningStats,
  getLearningSession,
  startLearningSession,
  updateSessionProgress,
  getSessionSet,
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

// ============================================
// Learning Session Management
// ============================================

/**
 * @swagger
 * /learning/session:
 *   get:
 *     summary: 현재 진행 중인 학습 세션 조회
 *     tags: [Learning]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: exam
 *         required: true
 *         schema:
 *           type: string
 *         description: 시험 카테고리 (CSAT, TEPS 등)
 *       - in: query
 *         name: level
 *         required: true
 *         schema:
 *           type: string
 *         description: 레벨 (L1, L2, L3)
 *     responses:
 *       200:
 *         description: 세션 정보 및 현재 세트 단어들
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/session', authenticateToken, getLearningSession);

/**
 * @swagger
 * /learning/session/start:
 *   post:
 *     summary: 새 학습 세션 시작 또는 재시작
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
 *               - exam
 *               - level
 *             properties:
 *               exam:
 *                 type: string
 *                 description: 시험 카테고리
 *               level:
 *                 type: string
 *                 description: 레벨
 *               restart:
 *                 type: boolean
 *                 default: false
 *                 description: true면 기존 세션 종료하고 새 세션 시작
 *     responses:
 *       201:
 *         description: 새 세션 생성됨
 *       200:
 *         description: 기존 세션 반환
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/session/start', authenticateToken, startLearningSession);

/**
 * @swagger
 * /learning/session/progress:
 *   patch:
 *     summary: 학습 세션 진행률 업데이트
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
 *               - sessionId
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: 세션 ID
 *               currentSet:
 *                 type: integer
 *                 description: 현재 세트 번호
 *               currentIndex:
 *                 type: integer
 *                 description: 현재 단어 인덱스
 *               completedSet:
 *                 type: boolean
 *                 description: 세트 완료 여부 (true면 다음 세트로 이동)
 *     responses:
 *       200:
 *         description: 진행률 업데이트됨
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: 세션을 찾을 수 없음
 */
router.patch('/session/progress', authenticateToken, updateSessionProgress);

/**
 * @swagger
 * /learning/session/{sessionId}/set/{setNumber}:
 *   get:
 *     summary: 특정 세트 단어 조회
 *     tags: [Learning]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: 세션 ID
 *       - in: path
 *         name: setNumber
 *         required: true
 *         schema:
 *           type: integer
 *         description: 세트 번호 (0-based)
 *     responses:
 *       200:
 *         description: 세트 단어 목록
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: 세션을 찾을 수 없음
 */
router.get('/session/:sessionId/set/:setNumber', authenticateToken, getSessionSet);

export default router;
