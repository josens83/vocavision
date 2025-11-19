import { Router } from 'express';
import {
  createCheckoutSession,
  handleWebhook,
  getSubscriptionStatus,
  cancelSubscription
} from '../controllers/subscription.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /subscription/create-checkout:
 *   post:
 *     summary: Stripe 결제 세션 생성
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - priceId
 *             properties:
 *               priceId:
 *                 type: string
 *                 description: Stripe 가격 ID
 *     responses:
 *       200:
 *         description: 체크아웃 세션
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                 url:
 *                   type: string
 *                   format: uri
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/create-checkout', authenticateToken, createCheckoutSession);

/**
 * @swagger
 * /subscription/webhook:
 *   post:
 *     summary: Stripe 웹훅 처리
 *     tags: [Subscription]
 *     description: Stripe에서 호출하는 웹훅 엔드포인트 (인증 불필요)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 웹훅 처리 성공
 */
router.post('/webhook', handleWebhook);

/**
 * @swagger
 * /subscription/status:
 *   get:
 *     summary: 구독 상태 조회
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 구독 상태
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [active, inactive, canceled, past_due]
 *                 plan:
 *                   type: string
 *                   enum: [FREE, PREMIUM, PREMIUM_PLUS]
 *                 currentPeriodEnd:
 *                   type: string
 *                   format: date-time
 *                 cancelAtPeriodEnd:
 *                   type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/status', authenticateToken, getSubscriptionStatus);

/**
 * @swagger
 * /subscription/cancel:
 *   post:
 *     summary: 구독 취소
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 구독 취소 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 cancelAtPeriodEnd:
 *                   type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/cancel', authenticateToken, cancelSubscription);

export default router;
