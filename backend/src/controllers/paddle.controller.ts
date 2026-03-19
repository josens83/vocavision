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
      customerEmail: user.email || undefined,
      customData: { userId: user.id, plan: planKey, billingCycle: cycleKey },
      successUrl: `${process.env.NEXT_PUBLIC_GLOBAL_URL}/checkout/success?transaction_id={transaction.id}`,
    });

    res.json({ checkoutUrl: transaction.checkout?.url });
  } catch (error) {
    console.error('[Paddle] createCheckout error:', error);
    res.status(500).json({ error: 'Failed to create checkout' });
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
            subscriptionPlan,
            subscriptionEnd,
            subscriptionId: sub.id,
            isSubscribed: true,
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
            subscriptionPlan: null,
            subscriptionEnd,
            isSubscribed: false,
          },
        });
        console.log(`[Paddle] Subscription cancelled for user ${userId}`);
        break;
      }

      case 'transaction.completed': {
        const tx = event.data as any;
        const userId = tx.customData?.userId;
        if (!userId) break;
        console.log(`[Paddle] Transaction completed for user ${userId}`);
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[Paddle Webhook] Error:', error);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
};
