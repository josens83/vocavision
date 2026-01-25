/**
 * VocaVision Subscription Renewal Job
 * 정기결제 자동 갱신 크론잡
 *
 * 매일 자정에 실행되어 만료 예정인 구독을 자동 갱신
 */

import cron from 'node-cron';
import prisma from '../lib/prisma';
import { chargeBillingKey } from '../controllers/payments.controller';
import logger from '../utils/logger';

/**
 * 구독 갱신 작업 실행
 */
export async function processSubscriptionRenewals(): Promise<{
  processed: number;
  success: number;
  failed: number;
  details: Array<{ userId: string; status: 'success' | 'failed'; error?: string }>;
}> {
  logger.info('[SubscriptionRenewal] Starting subscription renewal job...');

  const results = {
    processed: 0,
    success: 0,
    failed: 0,
    details: [] as Array<{ userId: string; status: 'success' | 'failed'; error?: string }>,
  };

  try {
    // 오늘 ~ 내일 만료 예정인 사용자 조회
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 2); // 이틀 여유를 두고 갱신

    const expiringUsers = await prisma.user.findMany({
      where: {
        subscriptionStatus: 'ACTIVE',
        autoRenewal: true,
        billingKey: { not: null },
        subscriptionEnd: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: {
        id: true,
        email: true,
        subscriptionPlan: true,
        subscriptionEnd: true,
        billingKey: true,
      },
    });

    logger.info(`[SubscriptionRenewal] Found ${expiringUsers.length} expiring subscriptions`);

    for (const user of expiringUsers) {
      results.processed++;

      try {
        // 플랜에 따라 billingCycle 결정
        const billingCycle = user.subscriptionPlan === 'YEARLY' ? 'yearly' : 'monthly';
        // 기본 플랜은 basic (추후 확장 가능)
        const plan = 'basic';

        logger.info(`[SubscriptionRenewal] Renewing user ${user.id} (${user.email})`);

        await chargeBillingKey(user.id, plan, billingCycle);

        results.success++;
        results.details.push({ userId: user.id, status: 'success' });

        logger.info(`[SubscriptionRenewal] Successfully renewed user ${user.id}`);

        // TODO: 갱신 성공 이메일 발송

      } catch (error: any) {
        results.failed++;
        results.details.push({
          userId: user.id,
          status: 'failed',
          error: error.message,
        });

        logger.error(`[SubscriptionRenewal] Failed to renew user ${user.id}:`, error.message);

        // 결제 실패 시 처리
        // 1. 재시도 로직 (최대 3회)
        // 2. 사용자에게 결제 실패 알림 발송
        // 3. 일정 기간 후 구독 만료 처리

        // 구독 상태를 CANCELLED로 변경하지 않음 (만료일까지는 이용 가능)
        // autoRenewal만 false로 변경하여 다시 시도하지 않음
        await prisma.user.update({
          where: { id: user.id },
          data: {
            autoRenewal: false,
          },
        });

        // TODO: 결제 실패 이메일 발송
      }
    }

  } catch (error: any) {
    logger.error('[SubscriptionRenewal] Job failed:', error);
    throw error;
  }

  logger.info(`[SubscriptionRenewal] Completed: ${results.success}/${results.processed} succeeded`);

  return results;
}

/**
 * 만료된 구독 처리 작업
 * 만료일이 지난 구독을 EXPIRED로 변경
 */
export async function processExpiredSubscriptions(): Promise<number> {
  logger.info('[SubscriptionExpiry] Checking for expired subscriptions...');

  const now = new Date();

  const result = await prisma.user.updateMany({
    where: {
      subscriptionStatus: 'ACTIVE',
      subscriptionEnd: {
        lt: now,
      },
    },
    data: {
      subscriptionStatus: 'EXPIRED',
    },
  });

  if (result.count > 0) {
    logger.info(`[SubscriptionExpiry] Marked ${result.count} subscriptions as expired`);
  }

  return result.count;
}

/**
 * 크론잡 스케줄러 시작
 */
export function startSubscriptionJobs(): void {
  // 매일 자정 (한국 시간 00:00) - 구독 갱신
  // 서버가 UTC라면 KST 00:00 = UTC 15:00 (전날)
  cron.schedule('0 15 * * *', async () => {
    logger.info('[Cron] Running subscription renewal job...');
    try {
      await processSubscriptionRenewals();
    } catch (error) {
      logger.error('[Cron] Subscription renewal job error:', error);
    }
  });

  // 매일 자정 (한국 시간 00:30) - 만료 처리
  cron.schedule('30 15 * * *', async () => {
    logger.info('[Cron] Running subscription expiry job...');
    try {
      await processExpiredSubscriptions();
    } catch (error) {
      logger.error('[Cron] Subscription expiry job error:', error);
    }
  });

  logger.info('[Cron] Subscription jobs scheduled');
}
