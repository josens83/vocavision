import { Router } from 'express';
import { createPaddleCheckout, createPaddlePackageCheckout, handlePaddleWebhook } from '../controllers/paddle.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Checkout URL 생성 (인증 필요)
router.post('/create-checkout', authenticateToken, createPaddleCheckout);

// 단품 Checkout URL 생성 (인증 필요)
router.post('/create-package-checkout', authenticateToken, createPaddlePackageCheckout);

// Webhook (인증 불필요, Paddle에서 직접 호출)
// rawBody는 index.ts의 express.json verify callback에서 캡처됨
router.post('/webhook', handlePaddleWebhook);

export default router;
