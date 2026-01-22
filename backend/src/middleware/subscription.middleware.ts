import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

type SubscriptionTier = 'FREE' | 'BASIC' | 'PREMIUM';

function getSubscriptionTier(user: any): SubscriptionTier {
  if (!user) return 'FREE';

  const plan = user.subscriptionPlan;
  const status = user.subscriptionStatus;

  if (plan === 'YEARLY' || plan === 'FAMILY') {
    return 'PREMIUM';
  }

  if (plan === 'MONTHLY' && status === 'ACTIVE') {
    return 'BASIC';
  }

  return 'FREE';
}

function canAccessContent(user: any, exam: string, level: string): boolean {
  const tier = getSubscriptionTier(user);

  // TEPS는 PREMIUM만 접근 가능
  if (exam === 'TEPS' && tier !== 'PREMIUM') {
    return false;
  }

  // L2, L3는 FREE 플랜에서 접근 불가
  if ((level === 'L2' || level === 'L3') && tier === 'FREE') {
    return false;
  }

  return true;
}

export const checkContentAccess = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  const examCategory = req.query.examCategory as string;
  const level = req.query.level as string;

  // 필터가 없으면 통과 (전체 조회 시)
  if (!examCategory && !level) {
    return next();
  }

  // 비로그인 사용자 접근 제어
  if (!user) {
    if (examCategory && examCategory !== 'CSAT') {
      return res.status(403).json({
        error: 'SUBSCRIPTION_REQUIRED',
        message: 'TEPS 콘텐츠는 프리미엄 플랜이 필요합니다.',
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

  // 로그인 사용자 접근 제어
  if (!canAccessContent(user, examCategory || 'CSAT', level || 'L1')) {
    const tier = getSubscriptionTier(user);
    const requiredPlan = examCategory === 'TEPS' ? 'PREMIUM' : 'BASIC';

    return res.status(403).json({
      error: 'SUBSCRIPTION_REQUIRED',
      message: `이 콘텐츠는 ${requiredPlan === 'PREMIUM' ? '프리미엄' : '베이직'} 플랜이 필요합니다.`,
      currentPlan: tier,
      requiredPlan,
    });
  }

  next();
};
