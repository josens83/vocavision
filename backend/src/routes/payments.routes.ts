/**
 * VocaVision Payments Routes
 * 토스페이먼츠 결제 API
 */

import { Router } from 'express';
import {
  confirmPayment,
  preparePayment,
  getPaymentHistory,
  recordPaymentFailure,
  issueBillingKey,
} from '../controllers/payments.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /payments/prepare:
 *   post:
 *     summary: 결제 준비 (Payment 레코드 생성)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plan
 *               - billingCycle
 *             properties:
 *               plan:
 *                 type: string
 *                 enum: [basic, premium]
 *               billingCycle:
 *                 type: string
 *                 enum: [monthly, yearly]
 *     responses:
 *       200:
 *         description: 결제 준비 완료
 */
router.post('/prepare', authenticateToken, preparePayment);

/**
 * @swagger
 * /payments/confirm:
 *   post:
 *     summary: 결제 승인 (토스페이먼츠 결제 완료 후)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentKey
 *               - orderId
 *               - amount
 *             properties:
 *               paymentKey:
 *                 type: string
 *                 description: 토스페이먼츠에서 받은 결제키
 *               orderId:
 *                 type: string
 *                 description: 주문 ID
 *               amount:
 *                 type: integer
 *                 description: 결제 금액
 *     responses:
 *       200:
 *         description: 결제 승인 완료
 */
router.post('/confirm', authenticateToken, confirmPayment);

/**
 * @swagger
 * /payments/fail:
 *   post:
 *     summary: 결제 실패 기록
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *               code:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: 실패 기록 완료
 */
router.post('/fail', authenticateToken, recordPaymentFailure);

/**
 * @swagger
 * /payments/history:
 *   get:
 *     summary: 결제 내역 조회
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 결제 내역 목록
 */
router.get('/history', authenticateToken, getPaymentHistory);

/**
 * @swagger
 * /payments/billing/issue:
 *   post:
 *     summary: 빌링키 발급 (정기결제용)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - authKey
 *               - customerKey
 *             properties:
 *               authKey:
 *                 type: string
 *               customerKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: 빌링키 발급 완료
 */
router.post('/billing/issue', authenticateToken, issueBillingKey);

export default router;
