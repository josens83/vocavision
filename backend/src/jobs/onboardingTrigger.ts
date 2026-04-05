import prisma from '../lib/prisma';
import logger from '../utils/logger';
import { emailService } from '../services/emailService';

/**
 * 온보딩 트리거 처리
 * - 가입 후 24시간 이상 경과 + totalWordsLearned === 0 유저 감지
 * - 이메일 있으면 온보딩 이메일 발송
 * - 없으면 로그만 기록
 */
export async function processOnboardingTriggers(): Promise<void> {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 24시간~72시간 전 가입, 0단어 학습 유저
  const trigger24h = await prisma.user.findMany({
    where: {
      totalWordsLearned: 0,
      createdAt: {
        gte: seventyTwoHoursAgo,
        lte: twentyFourHoursAgo,
      },
      onboardingEmailSent: { not: true },
      email: { not: null },
    },
    select: {
      id: true,
      name: true,
      email: true,
      provider: true,
      createdAt: true,
    },
  });

  // 72시간~7일 전 가입, 0단어 학습 유저 (2차 트리거)
  const trigger72h = await prisma.user.findMany({
    where: {
      totalWordsLearned: 0,
      createdAt: {
        gte: sevenDaysAgo,
        lte: seventyTwoHoursAgo,
      },
      onboardingEmailSent: true,
      onboarding72hSent: { not: true },
      email: { not: null },
    },
    select: {
      id: true,
      name: true,
      email: true,
      provider: true,
      createdAt: true,
    },
  });

  logger.info(`[Onboarding] 24h targets: ${trigger24h.length}, 72h targets: ${trigger72h.length}`);

  // 24시간 트리거
  for (const user of trigger24h) {
    const isGlobal = user.provider === 'google'; // 간단한 글로벌 판단
    logger.info(`[Onboarding] 24h: ${user.email}, global=${isGlobal}`);

    try {
      if (isGlobal) {
        await emailService.sendEmail({
          to: user.email!,
          subject: 'Start your first words — VocaVision AI',
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #0F172A;">Hi ${user.name || 'there'}! 👋</h2>
              <p>You signed up for VocaVision AI but haven't started learning yet.</p>
              <p><strong>1,300+ SAT Starter words are free</strong> — try your first 20 words in 60 seconds!</p>
              <a href="https://vocavision.app/learn?exam=SAT&level=L1&demo=true"
                 style="display:inline-block;background:#06B6D4;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
                Start Now
              </a>
              <p style="color:#6B7280;font-size:12px;margin-top:24px;">
                Don't want these emails? <a href="mailto:support@vocavision.app">Unsubscribe</a>
              </p>
            </div>
          `,
        });
      } else {
        await emailService.sendEmail({
          to: user.email!,
          subject: '첫 단어를 학습해보세요 — VocaVision AI',
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #0F172A;">안녕하세요, ${user.name || '학습자'}님! 👋</h2>
              <p>VocaVision AI에 가입하셨는데 아직 첫 단어를 학습하지 않으셨네요.</p>
              <p>수능 L1 기초 단어 <strong>951개</strong>가 무료로 기다리고 있어요!</p>
              <a href="https://vocavision.kr/learn"
                 style="display:inline-block;background:#06B6D4;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
                지금 시작하기
              </a>
              <p style="color:#6B7280;font-size:12px;margin-top:24px;">
                더 이상 받고 싶지 않으시면 <a href="mailto:support@vocavision.kr">수신 거부</a>해주세요.
              </p>
            </div>
          `,
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { onboardingEmailSent: true },
      });
      logger.info(`[Onboarding] 24h email sent: ${user.email}`);
    } catch (error) {
      logger.error(`[Onboarding] 24h failed: ${user.email}`, error);
    }
  }

  // 72시간 트리거
  for (const user of trigger72h) {
    const isGlobal = user.provider === 'google';
    logger.info(`[Onboarding] 72h: ${user.email}, global=${isGlobal}`);

    try {
      if (isGlobal) {
        await emailService.sendEmail({
          to: user.email!,
          subject: 'VocaVision AI — we\'re still waiting for you!',
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #0F172A;">${user.name || 'Hey'}, it's been 3 days! 🌟</h2>
              <p>Just <strong>5 minutes</strong> to complete your first set of 20 words!</p>
              <p>AI images + etymology + rhymes — see the difference.</p>
              <a href="https://vocavision.app/learn?exam=SAT&level=L1&demo=true"
                 style="display:inline-block;background:#06B6D4;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
                Try 5 Minutes
              </a>
            </div>
          `,
        });
      } else {
        await emailService.sendEmail({
          to: user.email!,
          subject: 'VocaVision AI — 아직 기다리고 있어요',
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #0F172A;">${user.name || '학습자'}님, 3일이 지났어요 🌟</h2>
              <p>딱 <strong>5분</strong>만 투자해서 첫 세트(20단어)를 완료해보세요!</p>
              <p>AI 이미지·어원·라임으로 단어를 눈으로 기억하세요.</p>
              <a href="https://vocavision.kr/learn"
                 style="display:inline-block;background:#06B6D4;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
                5분 투자하기
              </a>
            </div>
          `,
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { onboarding72hSent: true },
      });
      logger.info(`[Onboarding] 72h email sent: ${user.email}`);
    } catch (error) {
      logger.error(`[Onboarding] 72h failed: ${user.email}`, error);
    }
  }

  logger.info(`[Onboarding] Complete. 24h: ${trigger24h.length}, 72h: ${trigger72h.length}`);
}
