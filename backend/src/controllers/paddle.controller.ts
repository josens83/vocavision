import { Request, Response } from 'express';
import { Paddle, Environment } from '@paddle/paddle-node-sdk';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth.middleware';

const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: Environment.production,
});

// Price ID 매핑
const PADDLE_PRICE_IDS = {
  basic: {
    monthly: process.env.PADDLE_PRICE_ID_BASIC_MONTHLY!,
    yearly: process.env.PADDLE_PRICE_ID_BASIC_YEARLY!,
  },
  premium: {
    monthly: process.env.PADDLE_PRICE_ID_PREMIUM_MONTHLY!,
    yearly: process.env.PADDLE_PRICE_ID_PREMIUM_YEARLY!,
  },
};

// 구독 플랜 매핑
const PLAN_MAP: Record<string, string> = {
  [process.env.PADDLE_PRICE_ID_BASIC_MONTHLY!]: 'MONTHLY',
  [process.env.PADDLE_PRICE_ID_BASIC_YEARLY!]: 'YEARLY',
  [process.env.PADDLE_PRICE_ID_PREMIUM_MONTHLY!]: 'PREMIUM_MONTHLY',
  [process.env.PADDLE_PRICE_ID_PREMIUM_YEARLY!]: 'PREMIUM_YEARLY',
};

const PADDLE_PACKAGE_PRICE_IDS: Record<string, string> = {
  'toefl-complete': process.env.PADDLE_PRICE_ID_TOEFL!,
  'toeic-complete': process.env.PADDLE_PRICE_ID_TOEIC!,
  'gre-complete': process.env.PADDLE_PRICE_ID_GRE!,
};

// Paddle Checkout URL 생성
export const createPaddleCheckout = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { plan, billingCycle } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const planKey = plan as 'basic' | 'premium';
    const cycleKey = billingCycle as 'monthly' | 'yearly';
    const priceId = PADDLE_PRICE_IDS[planKey]?.[cycleKey];

    if (!priceId) return res.status(400).json({ error: 'Invalid plan or billing cycle' });

    const transaction = await paddle.transactions.create({
      items: [{ priceId, quantity: 1 }],
      customData: { userId: user.id, plan: planKey, billingCycle: cycleKey },
    });

    console.log('[Paddle] Transaction created:', transaction.id);
    res.json({ transactionId: transaction.id });
  } catch (error) {
    console.error('[Paddle] createCheckout error:', error);
    res.status(500).json({ error: 'Failed to create checkout' });
  }
};

// Paddle 단품 Checkout URL 생성
export const createPaddlePackageCheckout = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { packageSlug } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const priceId = PADDLE_PACKAGE_PRICE_IDS[packageSlug];
    if (!priceId) return res.status(400).json({ error: 'Invalid package slug' });

    const transaction = await paddle.transactions.create({
      items: [{ priceId, quantity: 1 }],
      customData: { userId: user.id, packageSlug, isPackagePurchase: true },
    });

    console.log('[Paddle] Package transaction created:', transaction.id);
    res.json({ transactionId: transaction.id });
  } catch (error) {
    console.error('[Paddle] createPackageCheckout error:', error);
    res.status(500).json({ error: 'Failed to create package checkout' });
  }
};

// Paddle Webhook 처리
export const handlePaddleWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['paddle-signature'] as string;
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    // Webhook 서명 검증
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET!;
    const event = await paddle.webhooks.unmarshal(rawBody, webhookSecret, signature);
    if (!event) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    console.log('[Paddle Webhook] Event type:', event.eventType);

    switch (event.eventType) {
      case 'subscription.activated':
      case 'subscription.updated': {
        const sub = event.data as any;
        const userId = sub.customData?.userId;
        if (!userId) break;

        const priceId = sub.items?.[0]?.price?.id;
        const subscriptionPlan = PLAN_MAP[priceId] || 'MONTHLY';
        const subscriptionEnd = new Date(sub.currentBillingPeriod?.endsAt || Date.now() + 30 * 24 * 60 * 60 * 1000);

        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionPlan: subscriptionPlan as any,
            subscriptionEnd,
            subscriptionId: sub.id,
          },
        });
        console.log(`[Paddle] Subscription activated for user ${userId}: ${subscriptionPlan}`);
        break;
      }

      case 'subscription.canceled': {
        const sub = event.data as any;
        const userId = sub.customData?.userId;
        if (!userId) break;

        const subscriptionEnd = new Date(sub.currentBillingPeriod?.endsAt || Date.now());

        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionPlan: undefined,
            subscriptionEnd,
          },
        });
        console.log(`[Paddle] Subscription cancelled for user ${userId}`);
        break;
      }

      case 'transaction.completed': {
        const tx = event.data as any;
        const userId = tx.customData?.userId;
        const packageSlug = tx.customData?.packageSlug;
        const isPackagePurchase = tx.customData?.isPackagePurchase;

        if (!userId) break;

        if (isPackagePurchase && packageSlug) {
          // 단품 구매 처리 - UserPackage 테이블에 저장
          const pkg = await prisma.productPackage.findUnique({
            where: { slug: packageSlug }
          });
          if (pkg) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + (pkg.durationDays || 180));

            await prisma.userPurchase.create({
              data: {
                userId,
                packageId: pkg.id,
                amount: 0, // Paddle에서 실제 금액은 별도 처리
                expiresAt,
                status: 'ACTIVE',
              },
            });
            console.log(`[Paddle] Package ${packageSlug} activated for user ${userId}`);
          }
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[Paddle Webhook] Error:', error);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
};
