/**
 * VocaVision Payments Controller
 * 토스페이먼츠 결제 처리
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';
import logger from '../utils/logger';

// 플랜별 가격 정보
const PLAN_PRICES: Record<string, Record<string, number>> = {
  basic: {
    monthly: 4900,
    yearly: 49000,
  },
  premium: {
    monthly: 9900,
    yearly: 99000,
  },
};

// 토스페이먼츠 API Base URL
const TOSS_API_BASE = 'https://api.tosspayments.com/v1';

/**
 * 토스페이먼츠 API 호출 헬퍼
 */
async function callTossAPI(
  endpoint: string,
  method: 'GET' | 'POST' = 'POST',
  body?: any
): Promise<any> {
  const secretKey = process.env.TOSS_SECRET_KEY;

  if (!secretKey) {
    throw new Error('TOSS_SECRET_KEY is not configured');
  }

  // Basic Auth: secretKey:
  const authHeader = Buffer.from(`${secretKey}:`).toString('base64');

  const response = await fetch(`${TOSS_API_BASE}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json() as { message?: string };

  if (!response.ok) {
    logger.error('[Toss API] Error:', data);
    throw new Error(data.message || 'Toss API error');
  }

  return data;
}

/**
 * 결제 승인 API
 * POST /api/payments/confirm
 *
 * 프론트엔드에서 토스페이먼츠 결제 완료 후 호출
 * 백엔드에서 결제 승인 API를 호출하여 실제 결제 처리
 */
export const confirmPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const { paymentKey, orderId, amount } = req.body;

    logger.info(`[Payments] Confirming payment: orderId=${orderId}, amount=${amount}`);

    // 1. 필수 파라미터 검증
    if (!paymentKey || !orderId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: paymentKey, orderId, amount',
      });
    }

    // 2. 기존 Payment 레코드 조회 (프론트엔드에서 먼저 생성했어야 함)
    let payment = await prisma.payment.findUnique({
      where: { orderId },
    });

    // Payment 레코드가 없으면 생성 (orderId에서 정보 파싱)
    if (!payment) {
      // orderId 형식: vocavision_{userId}_{plan}_{billingCycle}_{timestamp}
      const orderParts = orderId.split('_');
      const plan = orderParts[2] || 'basic';
      const billingCycle = orderParts[3] || 'monthly';

      payment = await prisma.payment.create({
        data: {
          userId: userId!,
          orderId,
          orderName: `VocaVision ${plan === 'premium' ? '프리미엄' : '베이직'} ${billingCycle === 'yearly' ? '연간' : '월간'} 구독`,
          amount,
          plan,
          billingCycle,
          status: 'PENDING',
        },
      });
    }

    // 3. 금액 검증 (서버에서 저장된 금액과 일치하는지)
    const expectedAmount = PLAN_PRICES[payment.plan]?.[payment.billingCycle];
    if (expectedAmount && amount !== expectedAmount) {
      logger.error(`[Payments] Amount mismatch: expected=${expectedAmount}, received=${amount}`);
      return res.status(400).json({
        success: false,
        error: 'Amount mismatch',
      });
    }

    // 4. 토스페이먼츠 결제 승인 API 호출
    try {
      const tossResponse = await callTossAPI('/payments/confirm', 'POST', {
        paymentKey,
        orderId,
        amount,
      });

      logger.info(`[Payments] Toss confirm success:`, tossResponse.status);

      // 5. Payment 레코드 업데이트
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          paymentKey,
          status: 'COMPLETED',
          method: tossResponse.method,
          paidAt: new Date(),
        },
      });

      // 6. User 구독 상태 업데이트
      const subscriptionEnd = new Date();
      if (payment.billingCycle === 'yearly') {
        subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
      } else {
        subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: 'ACTIVE',
          subscriptionPlan: payment.billingCycle === 'yearly' ? 'YEARLY' : 'MONTHLY',
          subscriptionStart: new Date(),
          subscriptionEnd,
        },
      });

      logger.info(`[Payments] User ${userId} subscription activated until ${subscriptionEnd}`);

      res.json({
        success: true,
        data: {
          orderId,
          amount,
          status: 'COMPLETED',
          subscriptionEnd,
        },
      });

    } catch (tossError: any) {
      // 결제 승인 실패
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          failReason: tossError.message,
        },
      });

      throw tossError;
    }

  } catch (error: any) {
    logger.error('[Payments] Confirm error:', error);
    next(error);
  }
};

/**
 * 결제 준비 API (선택적)
 * POST /api/payments/prepare
 *
 * 결제 전에 Payment 레코드 생성
 */
export const preparePayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const { plan, billingCycle } = req.body;

    // 플랜/사이클 검증
    if (!['basic', 'premium'].includes(plan)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan',
      });
    }

    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid billing cycle',
      });
    }

    const amount = PLAN_PRICES[plan][billingCycle];
    const orderId = `vocavision_${userId}_${plan}_${billingCycle}_${Date.now()}`;
    const orderName = `VocaVision ${plan === 'premium' ? '프리미엄' : '베이직'} ${billingCycle === 'yearly' ? '연간' : '월간'} 구독`;

    // Payment 레코드 생성
    const payment = await prisma.payment.create({
      data: {
        userId,
        orderId,
        orderName,
        amount,
        plan,
        billingCycle,
        status: 'PENDING',
      },
    });

    res.json({
      success: true,
      data: {
        orderId: payment.orderId,
        orderName: payment.orderName,
        amount: payment.amount,
      },
    });

  } catch (error: any) {
    logger.error('[Payments] Prepare error:', error);
    next(error);
  }
};

/**
 * 결제 내역 조회
 * GET /api/payments/history
 */
export const getPaymentHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;

    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({
      success: true,
      data: payments,
    });

  } catch (error: any) {
    logger.error('[Payments] History error:', error);
    next(error);
  }
};

/**
 * 결제 실패 기록
 * POST /api/payments/fail
 */
export const recordPaymentFailure = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const { orderId, code, message } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'orderId is required',
      });
    }

    // 기존 Payment 레코드 조회
    const payment = await prisma.payment.findUnique({
      where: { orderId },
    });

    if (payment) {
      // 상태 업데이트
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          failReason: `${code}: ${message}`,
        },
      });
    }

    logger.info(`[Payments] Payment failed: orderId=${orderId}, code=${code}, message=${message}`);

    res.json({
      success: true,
      message: 'Failure recorded',
    });

  } catch (error: any) {
    logger.error('[Payments] Record failure error:', error);
    next(error);
  }
};

/**
 * 빌링키 발급 (정기결제용) - 추후 구현
 * POST /api/payments/billing/issue
 */
export const issueBillingKey = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const { authKey, customerKey } = req.body;

    if (!authKey || !customerKey) {
      return res.status(400).json({
        success: false,
        error: 'authKey and customerKey are required',
      });
    }

    // 토스페이먼츠 빌링키 발급 API 호출
    const tossResponse = await callTossAPI('/billing/authorizations/issue', 'POST', {
      authKey,
      customerKey,
    });

    logger.info(`[Payments] Billing key issued for user ${userId}`);

    // 빌링키는 암호화하여 저장해야 함 (여기서는 간단히 저장)
    // 실제 운영에서는 암호화 필수!

    res.json({
      success: true,
      data: {
        billingKey: tossResponse.billingKey,
        cardCompany: tossResponse.card?.company,
        cardNumber: tossResponse.card?.number,
      },
    });

  } catch (error: any) {
    logger.error('[Payments] Issue billing key error:', error);
    next(error);
  }
};
