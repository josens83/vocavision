import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { prisma } from '../index';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia' as Stripe.LatestApiVersion
});

export const createCheckoutSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const { plan } = req.body; // 'monthly' or 'yearly'

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const priceId = plan === 'yearly'
      ? process.env.STRIPE_PRICE_ID_YEARLY
      : process.env.STRIPE_PRICE_ID_MONTHLY;

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email || undefined,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: `${process.env.CORS_ORIGIN}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CORS_ORIGIN}/subscription/cancel`,
      metadata: {
        userId: user.id,
        plan
      }
    });

    res.json({ sessionUrl: session.url });
  } catch (error) {
    next(error);
  }
};

export const handleWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      throw new AppError('No signature', 400);
    }

    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object as Stripe.Subscription);
        break;
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
};

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan;

  if (!userId) return;

  const subscriptionEnd = new Date();
  if (plan === 'yearly') {
    subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
  } else {
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: 'ACTIVE',
      subscriptionId: session.subscription as string,
      subscriptionPlan: plan === 'yearly' ? 'YEARLY' : 'MONTHLY',
      subscriptionStart: new Date(),
      subscriptionEnd
    }
  });
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const user = await prisma.user.findFirst({
    where: { subscriptionId: subscription.id }
  });

  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: subscription.status === 'active' ? 'ACTIVE' : 'CANCELLED'
    }
  });
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  const user = await prisma.user.findFirst({
    where: { subscriptionId: subscription.id }
  });

  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: 'CANCELLED'
    }
  });
}

export const getSubscriptionStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionStart: true,
        subscriptionEnd: true,
        trialEnd: true
      }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({ subscription: user });
  } catch (error) {
    next(error);
  }
};

export const cancelSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // 구독이 활성 상태가 아니면 취소 불가
    if (user.subscriptionStatus !== 'ACTIVE') {
      throw new AppError('No active subscription to cancel', 400);
    }

    // Stripe 구독이 있는 경우 Stripe에서도 취소
    if (user.subscriptionId) {
      try {
        await stripe.subscriptions.cancel(user.subscriptionId);
      } catch (stripeError) {
        console.error('[Subscription] Stripe cancel error:', stripeError);
        // Stripe 오류는 무시하고 DB 상태만 업데이트 (TossPayments 단건결제인 경우)
      }
    }

    // DB에서 구독 상태를 CANCELLED로 변경
    // 만료일(subscriptionEnd)까지는 계속 이용 가능
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'CANCELLED'
      }
    });

    res.json({
      message: 'Subscription cancelled successfully',
      subscriptionEnd: user.subscriptionEnd
    });
  } catch (error) {
    next(error);
  }
};
