import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { prisma } from '../index';

type SubscriptionTier = 'FREE' | 'BASIC' | 'PREMIUM';

// 단품 구매 상품: examCategory → package slug 매핑
const PACKAGE_EXAM_SLUGS: Record<string, string> = {
  'CSAT_2026': '2026-csat-analysis',
  'EBS': 'ebs-vocab',
};

/**
 * 사용자의 실제 구독 티어를 계산
 */
function getSubscriptionTier(subscriptionPlan: string | null, subscriptionStatus: string | null): SubscriptionTier {
  if (subscriptionPlan === 'YEARLY' || subscriptionPlan === 'FAMILY') {
    return 'PREMIUM';
  }

  if (subscriptionPlan === 'MONTHLY' && subscriptionStatus === 'ACTIVE') {
    return 'BASIC';
  }

  return 'FREE';
}

/**
 * 시험+레벨 접근 가능 여부 체크 (구독 기반, 단품 제외)
 */
function canAccessContent(tier: SubscriptionTier, exam: string, level: string): boolean {
  // TEPS는 PREMIUM만
  if (exam === 'TEPS' && tier !== 'PREMIUM') {
    return false;
  }

  // L2, L3는 BASIC 이상 (CSAT만 해당)
  if ((level === 'L2' || level === 'L3') && tier === 'FREE') {
    return false;
  }

  return true;
}

/**
 * 구독 기반 콘텐츠 접근 제어 미들웨어
 * query params에서 examCategory와 level을 확인
 */
export const checkContentAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const examCategory = req.query.examCategory as string;
  const level = req.query.level as string;

  // 시험/레벨이 지정되지 않은 경우 통과
  if (!examCategory && !level) {
    return next();
  }

  // 비로그인 사용자는 CSAT L1만 허용
  if (!req.userId) {
    if (examCategory && examCategory !== 'CSAT') {
      const examNames: Record<string, string> = { 'TEPS': 'TEPS', 'EBS': 'EBS 연계', 'CSAT_2026': '2026 기출' };
      const examName = examNames[examCategory] || examCategory;
      return res.status(403).json({
        error: 'SUBSCRIPTION_REQUIRED',
        message: `${examName} 콘텐츠는 로그인이 필요합니다.`,
        requiredPlan: 'PREMIUM',
      });
    }
    if (level && level !== 'L1') {
      return res.status(403).json({
        error: 'SUBSCRIPTION_REQUIRED',
        message: 'L2/L3 콘텐츠는 베이직 플랜 이상이 필요합니다.',
        requiredPlan: 'BASIC',
      });
    }
    return next();
  }

  // 로그인 사용자: DB에서 구독 정보 조회
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { subscriptionPlan: true, subscriptionStatus: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const tier = getSubscriptionTier(user.subscriptionPlan, user.subscriptionStatus);

    // 프리미엄은 모든 콘텐츠 접근 가능
    if (tier === 'PREMIUM') {
      return next();
    }

    // 단품 구매 상품 체크 (EBS, CSAT_2026)
    const packageSlug = PACKAGE_EXAM_SLUGS[examCategory];
    if (packageSlug) {
      const pkg = await prisma.productPackage.findUnique({ where: { slug: packageSlug } });
      if (pkg) {
        const purchase = await prisma.userPurchase.findFirst({
          where: {
            userId: req.userId!,
            packageId: pkg.id,
            status: 'ACTIVE',
            expiresAt: { gt: new Date() },
          },
        });
        if (purchase) {
          return next();
        }
      }
      return res.status(403).json({
        error: 'PACKAGE_REQUIRED',
        message: `이 콘텐츠는 단품 구매 또는 프리미엄 플랜이 필요합니다.`,
        requiredPlan: 'PREMIUM',
      });
    }

    // 기존 구독 기반 접근 체크 (CSAT, TEPS)
    if (!canAccessContent(tier, examCategory || 'CSAT', level || 'L1')) {
      const requiredPlan = examCategory === 'TEPS' ? 'PREMIUM' : 'BASIC';

      return res.status(403).json({
        error: 'SUBSCRIPTION_REQUIRED',
        message: `이 콘텐츠는 ${requiredPlan === 'PREMIUM' ? '프리미엄' : '베이직'} 플랜이 필요합니다.`,
        currentPlan: tier,
        requiredPlan,
      });
    }

    next();
  } catch (error) {
    console.error('[SubscriptionMiddleware] Error:', error);
    next(error);
  }
};
