/**
 * VocaVision Payments Controller
 * 토스페이먼츠 결제 처리
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';
import logger from '../utils/logger';

// 플랜별 가격 정보 (프론트엔드와 동일하게 설정)
const PLAN_PRICES: Record<string, Record<string, number>> = {
  basic: {
    monthly: 4900,
    yearly: 47000,  // 프론트엔드와 일치
  },
  premium: {
    monthly: 9900,
    yearly: 95000,  // 프론트엔드와 일치
  },
};

// 토스페이먼츠 API Base URL
const TOSS_API_BASE = 'https://api.tosspayments.com/v1';

/**
 * 토스페이먼츠 결제 승인 API 직접 호출
 * 필수 파라미터만 전송 (paymentKey, orderId, amount)
 */
async function confirmTossPayment(
  paymentKey: string,
  orderId: string,
  amount: number
): Promise<any> {
  const secretKey = process.env.TOSS_SECRET_KEY;

  if (!secretKey) {
    throw new Error('TOSS_SECRET_KEY is not configured');
  }

  // Basic Auth: secretKey:
  const authHeader = Buffer.from(`${secretKey}:`).toString('base64');

  // 요청 데이터 - 필수 파라미터만!
  const requestBody = {
    paymentKey,
    orderId,
    amount,
  };

  logger.info(`[TossAPI] Confirm request:`, {
    url: `${TOSS_API_BASE}/payments/confirm`,
    body: { ...requestBody, paymentKey: `${paymentKey.substring(0, 10)}...` },
  });

  const response = await fetch(`${TOSS_API_BASE}/payments/confirm`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json() as any;

  if (!response.ok) {
    logger.error('[TossAPI] Error response:', {
      status: response.status,
      data,
    });
    const error = new Error(data.message || 'Toss API error') as any;
    error.response = { status: response.status, data };
    throw error;
  }

  logger.info(`[TossAPI] Success:`, { status: data.status, method: data.method });
  return data;
}

/**
 * 토스페이먼츠 API 호출 헬퍼 (빌링 등 기타 API용)
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

  const authHeader = Buffer.from(`${secretKey}:`).toString('base64');

  const response = await fetch(`${TOSS_API_BASE}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json() as any;

  if (!response.ok) {
    logger.error('[TossAPI] Error:', data);
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
    const { paymentKey, orderId, amount } = req.body;

    logger.info(`[Payments] Confirming payment: orderId=${orderId}, amount=${amount}`);

    // 1. 필수 파라미터 검증
    if (!paymentKey || !orderId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: paymentKey, orderId, amount',
      });
    }

    // 2. 요청에서 직접 전달받은 파라미터 우선 사용
    let userId = req.body.userId || req.userId;
    let plan = req.body.plan || 'basic';
    let billingCycle = req.body.billingCycle || 'monthly';

    // orderId에서 정보 파싱 (fallback)
    // orderId 형식: vv-{safeUserId}-{plan}-{billingCycle}-{timestamp}
    if (!userId) {
      const orderParts = orderId.split('-');
      if (orderParts[0] === 'vv' && orderParts.length >= 5) {
        // vv-safeUserId-plan-billingCycle-timestamp 형식
        plan = req.body.plan || orderParts[2] || plan;
        billingCycle = req.body.billingCycle || orderParts[3] || billingCycle;
      }
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required. Please provide userId in request body.',
      });
    }

    // 3. 기존 Payment 레코드 조회 (프론트엔드에서 먼저 생성했어야 함)
    let payment = await prisma.payment.findUnique({
      where: { orderId },
    });

    // Payment 레코드가 없으면 생성
    if (!payment) {
      payment = await prisma.payment.create({
        data: {
          userId,
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
      // amount를 반드시 숫자로 변환 (문자열로 전송 시 에러 발생)
      const numericAmount = typeof amount === 'string' ? parseInt(amount, 10) : Number(amount);

      // 직접 호출 - 필수 파라미터만 전송
      const tossResponse = await confirmTossPayment(paymentKey, orderId, numericAmount);

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
      logger.error('[Payments] Toss API error:', {
        message: tossError.message,
        response: tossError.response?.data,
      });

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          failReason: tossError.response?.data?.message || tossError.message,
        },
      });

      // 에러 응답 반환
      return res.status(400).json({
        success: false,
        error: tossError.response?.data?.message || tossError.message,
        code: tossError.response?.data?.code,
      });
    }

  } catch (error: any) {
    logger.error('[Payments] Confirm error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
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
 * 빌링키로 자동 결제 실행
 * 내부 함수 - issueBillingKey, 크론잡에서 호출
 */
export async function chargeBillingKey(
  userId: string,
  plan: string,
  billingCycle: string
): Promise<{ success: boolean; subscriptionEnd: Date; paymentId: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user?.billingKey || !user?.customerKey) {
    throw new Error('No billing key found for user');
  }

  const amount = PLAN_PRICES[plan]?.[billingCycle];
  if (!amount) {
    throw new Error(`Invalid plan/billingCycle: ${plan}/${billingCycle}`);
  }

  const orderId = `vv-billing-${userId.substring(0, 8)}-${Date.now()}`;
  const orderName = `VocaVision ${plan === 'premium' ? '프리미엄' : '베이직'} ${billingCycle === 'yearly' ? '연간' : '월간'} 구독`;

  logger.info(`[Billing] Charging user ${userId}: ${orderName}, ${amount}원`);

  // TossPayments 빌링 결제 API 호출
  const tossResponse = await callTossAPI(`/billing/${user.billingKey}`, 'POST', {
    customerKey: user.customerKey,
    amount,
    orderId,
    orderName,
  });

  logger.info(`[Billing] Toss response:`, { status: tossResponse.status, paymentKey: tossResponse.paymentKey });

  // Payment 레코드 생성
  const payment = await prisma.payment.create({
    data: {
      userId,
      orderId,
      orderName,
      amount,
      paymentKey: tossResponse.paymentKey,
      method: tossResponse.method || '카드',
      plan,
      billingCycle,
      status: 'COMPLETED',
      paidAt: new Date(),
    },
  });

  // 구독 기간 연장
  const subscriptionEnd = new Date();
  if (billingCycle === 'yearly') {
    subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
  } else {
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: 'ACTIVE',
      subscriptionPlan: billingCycle === 'yearly' ? 'YEARLY' : 'MONTHLY',
      subscriptionStart: new Date(),
      subscriptionEnd,
      lastPaymentId: payment.id,
    },
  });

  logger.info(`[Billing] User ${userId} subscription renewed until ${subscriptionEnd}`);

  return { success: true, subscriptionEnd, paymentId: payment.id };
}

/**
 * 빌링키 발급 (정기결제용)
 * POST /api/payments/billing/issue
 *
 * 프론트엔드에서 TossPayments 카드 등록 완료 후 authKey 전달
 * 백엔드에서 빌링키 발급 → User에 저장 → 첫 결제 진행
 */
export const issueBillingKey = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const { authKey, customerKey, plan = 'basic', billingCycle = 'monthly' } = req.body;

    if (!authKey || !customerKey) {
      return res.status(400).json({
        success: false,
        error: 'authKey and customerKey are required',
      });
    }

    // 플랜/사이클 검증
    if (!['basic', 'premium'].includes(plan)) {
      return res.status(400).json({ success: false, error: 'Invalid plan' });
    }
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return res.status(400).json({ success: false, error: 'Invalid billing cycle' });
    }

    // 1. 토스페이먼츠 빌링키 발급 API 호출
    const tossResponse = await callTossAPI('/billing/authorizations/issue', 'POST', {
      authKey,
      customerKey,
    });

    logger.info(`[Billing] Billing key issued for user ${userId}`, {
      billingKey: tossResponse.billingKey?.substring(0, 10) + '...',
      card: tossResponse.card?.company,
    });

    // 2. User에 빌링키 저장
    await prisma.user.update({
      where: { id: userId },
      data: {
        billingKey: tossResponse.billingKey,
        customerKey: customerKey,
        autoRenewal: true,
      },
    });

    // 3. 첫 결제 진행 (즉시)
    try {
      const chargeResult = await chargeBillingKey(userId, plan, billingCycle);

      res.json({
        success: true,
        data: {
          billingKey: tossResponse.billingKey,
          cardCompany: tossResponse.card?.company,
          cardNumber: tossResponse.card?.number,
          subscriptionEnd: chargeResult.subscriptionEnd,
          message: '정기결제가 성공적으로 등록되었습니다.',
        },
      });
    } catch (chargeError: any) {
      // 빌링키는 저장되었지만 첫 결제 실패
      logger.error('[Billing] First charge failed:', chargeError.message);

      res.status(400).json({
        success: false,
        error: `첫 결제 실패: ${chargeError.message}`,
        billingKeyIssued: true, // 빌링키는 발급됨
      });
    }

  } catch (error: any) {
    logger.error('[Billing] Issue billing key error:', error);
    res.status(400).json({
      success: false,
      error: error.message || '빌링키 발급 실패',
    });
  }
};

/**
 * 빌링키 삭제 (카드 등록 해제)
 * DELETE /api/payments/billing
 */
export const deleteBillingKey = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user?.billingKey) {
      return res.status(400).json({
        success: false,
        error: '등록된 결제 수단이 없습니다.',
      });
    }

    // User에서 빌링키 삭제
    await prisma.user.update({
      where: { id: userId },
      data: {
        billingKey: null,
        customerKey: null,
        autoRenewal: false,
      },
    });

    logger.info(`[Billing] Billing key deleted for user ${userId}`);

    res.json({
      success: true,
      message: '결제 수단이 삭제되었습니다.',
    });

  } catch (error: any) {
    logger.error('[Billing] Delete billing key error:', error);
    next(error);
  }
};

/**
 * 자동 갱신 설정 변경
 * PATCH /api/payments/billing/auto-renewal
 */
export const updateAutoRenewal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const { autoRenewal } = req.body;

    if (typeof autoRenewal !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'autoRenewal must be a boolean',
      });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { autoRenewal },
      select: {
        autoRenewal: true,
        subscriptionEnd: true,
        billingKey: true,
      },
    });

    logger.info(`[Billing] Auto-renewal updated for user ${userId}: ${autoRenewal}`);

    res.json({
      success: true,
      data: {
        autoRenewal: user.autoRenewal,
        subscriptionEnd: user.subscriptionEnd,
        hasBillingKey: !!user.billingKey,
      },
    });

  } catch (error: any) {
    logger.error('[Billing] Update auto-renewal error:', error);
    next(error);
  }
};

/**
 * 결제 수단 정보 조회
 * GET /api/payments/billing/info
 */
export const getBillingInfo = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        billingKey: true,
        autoRenewal: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionEnd: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        hasBillingKey: !!user.billingKey,
        autoRenewal: user.autoRenewal,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionEnd: user.subscriptionEnd,
      },
    });

  } catch (error: any) {
    logger.error('[Billing] Get billing info error:', error);
    next(error);
  }
};
