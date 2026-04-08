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
import { emailService } from '../services/emailService';

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

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const expiringUsers = await prisma.user.findMany({
      where: {
        autoRenewal: true,
        billingKey: { not: null },
        OR: [
          // 첫 시도: 만료 예정
          {
            subscriptionStatus: 'ACTIVE',
            subscriptionEnd: { gte: today, lt: tomorrow },
            renewalRetryCount: 0,
          },
          // 재시도: 이전 실패 + 3회 미만 + 24시간 경과
          {
            subscriptionStatus: 'ACTIVE',
            renewalRetryCount: { gt: 0, lt: 3 },
            lastRenewalAttempt: { lt: twentyFourHoursAgo },
          },
        ],
      },
      select: {
        id: true,
        email: true,
        subscriptionPlan: true,
        subscriptionEnd: true,
        billingKey: true,
        renewalRetryCount: true,
      },
    });

    logger.info(`[SubscriptionRenewal] Found ${expiringUsers.length} expiring subscriptions`);

    // 안전장치: autoRenewal=true인데 billingKey가 없는 사용자 감지 및 수정
    const inconsistentUsers = await prisma.user.findMany({
      where: {
        subscriptionStatus: 'ACTIVE',
        autoRenewal: true,
        billingKey: null,
        subscriptionEnd: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: { id: true, email: true },
    });

    if (inconsistentUsers.length > 0) {
      logger.warn(
        `[SubscriptionRenewal] Found ${inconsistentUsers.length} users with autoRenewal=true but no billingKey: ${inconsistentUsers.map(u => u.email || u.id).join(', ')}`
      );
      await prisma.user.updateMany({
        where: { id: { in: inconsistentUsers.map(u => u.id) } },
        data: { autoRenewal: false },
      });
      logger.info(`[SubscriptionRenewal] Fixed autoRenewal for ${inconsistentUsers.length} inconsistent users`);
    }

    for (const user of expiringUsers) {
      results.processed++;

      try {
        // 플랜에 따라 billingCycle 결정
        const billingCycle = user.subscriptionPlan === 'YEARLY' ? 'yearly' : 'monthly';
        // 기본 플랜은 basic (추후 확장 가능)
        const plan = (user.subscriptionPlan === 'PREMIUM_MONTHLY' || user.subscriptionPlan === 'PREMIUM_YEARLY' || user.subscriptionPlan === 'YEARLY' || user.subscriptionPlan === 'FAMILY') ? 'premium' : 'basic';

        logger.info(`[SubscriptionRenewal] Renewing user ${user.id} (${user.email})`);

        await chargeBillingKey(user.id, plan, billingCycle);

        results.success++;
        results.details.push({ userId: user.id, status: 'success' });

        // 재시도 카운터 리셋
        if (user.renewalRetryCount > 0) {
          await prisma.user.update({
            where: { id: user.id },
            data: { renewalRetryCount: 0, lastRenewalAttempt: null },
          });
        }

        logger.info(`[SubscriptionRenewal] Successfully renewed user ${user.id}`);

        // 갱신 성공 이메일 발송
        if (user.email) {
          const nextDate = new Date();
          nextDate.setMonth(nextDate.getMonth() + (billingCycle === 'yearly' ? 12 : 1));
          const amount = plan === 'premium'
            ? (billingCycle === 'yearly' ? '₩95,000' : '₩9,900')
            : (billingCycle === 'yearly' ? '₩47,000' : '₩4,900');
          await emailService.sendRenewalSuccessEmail(
            user.email,
            plan === 'premium' ? '프리미엄' : '베이직',
            nextDate.toLocaleDateString('ko-KR'),
            amount
          ).catch(err => logger.error(`[SubscriptionRenewal] Email failed for ${user.id}:`, err));
        }

      } catch (error: any) {
        results.failed++;
        results.details.push({
          userId: user.id,
          status: 'failed',
          error: error.message,
        });

        logger.error(`[SubscriptionRenewal] Failed to renew user ${user.id}:`, error.message);

        // 재시도 로직 (최대 3회, 24시간 간격)
        const newRetryCount = (user.renewalRetryCount || 0) + 1;

        if (newRetryCount >= 3) {
          // 3회 실패 → 포기
          await prisma.user.update({
            where: { id: user.id },
            data: {
              autoRenewal: false,
              renewalRetryCount: newRetryCount,
              lastRenewalAttempt: new Date(),
            },
          });
          logger.warn(`[SubscriptionRenewal] User ${user.id} reached max retries (3). autoRenewal disabled.`);
          // 구독 만료 안내 이메일
          if (user.email) {
            const expireDate = user.subscriptionEnd
              ? new Date(user.subscriptionEnd).toLocaleDateString('ko-KR')
              : '곧';
            await emailService.sendSubscriptionExpiredEmail(
              user.email,
              plan === 'premium' ? '프리미엄' : '베이직',
              expireDate
            ).catch(err => logger.error(`[SubscriptionRenewal] Expired email error for ${user.id}:`, err));
          }
        } else {
          // 재시도 카운트 증가 (다음 크론 실행 시 재시도)
          await prisma.user.update({
            where: { id: user.id },
            data: {
              renewalRetryCount: newRetryCount,
              lastRenewalAttempt: new Date(),
            },
          });
          logger.info(`[SubscriptionRenewal] User ${user.id} retry ${newRetryCount}/3 scheduled.`);
          // 결제 실패 안내 이메일
          if (user.email) {
            await emailService.sendPaymentFailedEmail(
              user.email,
              plan === 'premium' ? '프리미엄' : '베이직',
              newRetryCount.toString(),
              '3'
            ).catch(err => logger.error(`[SubscriptionRenewal] Failed email error for ${user.id}:`, err));
          }
        }
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

  // 매일 오전 10시 KST (UTC 01:00) — 온보딩 트리거
  cron.schedule('0 1 * * *', async () => {
    logger.info('[Cron] Running onboarding trigger job...');
    try {
      const { processOnboardingTriggers } = await import('./onboardingTrigger');
      await processOnboardingTriggers();
    } catch (error) {
      logger.error('[Cron] Onboarding trigger job error:', error);
    }
  });

  logger.info('[Cron] Subscription jobs scheduled');
}
