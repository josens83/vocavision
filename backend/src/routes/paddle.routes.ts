import { Router } from 'express';
import { createPaddleCheckout, handlePaddleWebhook } from '../controllers/paddle.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import express from 'express';

const router = Router();

// Checkout URL 생성 (인증 필요)
router.post('/create-checkout', authenticateToken, createPaddleCheckout);

// Webhook (인증 불필요, Paddle에서 직접 호출)
router.post('/webhook',
  express.raw({ type: 'application/json' }),
  handlePaddleWebhook
);

export default router;
