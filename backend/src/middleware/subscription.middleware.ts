import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { prisma } from '../index';

type SubscriptionTier = 'FREE' | 'BASIC' | 'PREMIUM';

// 단품 구매 상품: examCategory → package slug 매핑
const PACKAGE_EXAM_SLUGS: Record<string, string> = {
  'CSAT_2026': '2026-csat-analysis',
  'EBS': 'ebs-vocab',
  'TOEFL': 'toefl-complete',
  'TOEIC': 'toeic-complete',
  'SAT': 'sat-complete',
  'ACT': 'act-complete',
};

/**
 * 요청의 origin/referer에서 글로벌(vocavision.app) 여부 감지
 */
export function isGlobalLocale(req: Request): boolean {
  const origin = req.headers.origin || '';
  const referer = req.headers.referer || '';
  return origin.includes('vocavision.app') || referer.includes('vocavision.app');
}

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
 * isGlobal: vocavision.app 유저는 SAT 기반 접근 체계 적용
 */
function canAccessContent(tier: SubscriptionTier, exam: string, level: string, isGlobal: boolean): boolean {
  if (isGlobal) {
    // 글로벌: SAT L1 = FREE, SAT L2 = BASIC+
    if (exam === 'SAT') {
      if (level === 'L1') return true;
      if (level === 'L2') return tier === 'BASIC' || tier === 'PREMIUM';
      if (level.startsWith('THEME_')) return true;
      return false;
    }
    // 글로벌: ACT L1 = FREE, ACT L2 = BASIC+
    if (exam === 'ACT') {
      if (level === 'L1') return true;
      if (level === 'L2') return tier === 'BASIC' || tier === 'PREMIUM';
      return false;
    }
    // 글로벌: IELTS L1+L2 = BASIC+ (Basic 플랜에 포함)
    if (exam === 'IELTS') {
      return tier === 'BASIC' || tier === 'PREMIUM';
    }
    // 글로벌: CSAT/TEPS 등은 구독 기반 (한국 로직과 동일)
  }

  // TEPS는 BASIC 이상
  if (exam === 'TEPS' && tier === 'FREE') {
    return false;
  }

  // L2, L3는 BASIC 이상 (CSAT만 해당)
  if ((level === 'L2' || level === 'L3') && tier === 'FREE') {
    return false;
  }

  return true;
}

/**
 * 사용자의 시험+레벨 접근 권한 확인 (미들웨어 외부에서도 사용 가능)
 * @returns null이면 접근 허용, 에러 객체면 접근 거부
 */
export async function verifyContentAccess(
  userId: string,
  examCategory: string,
  level: string,
  isGlobal: boolean = false
): Promise<{ error: string; message: string; requiredPlan: string } | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionPlan: true, subscriptionStatus: true }
  });

  if (!user) {
    return { error: 'USER_NOT_FOUND', message: 'User not found', requiredPlan: 'FREE' };
  }

  const tier = getSubscriptionTier(user.subscriptionPlan, user.subscriptionStatus);

  // 프리미엄은 모든 콘텐츠 접근 가능
  if (tier === 'PREMIUM') {
    return null;
  }

  // 글로벌 유저: SAT/ACT/IELTS는 구독 기반 접근 (단품 구매 불필요)
  if (isGlobal && (examCategory === 'SAT' || examCategory === 'ACT' || examCategory === 'IELTS')) {
    if (canAccessContent(tier, examCategory, level, true)) {
      return null;
    }
    return {
      error: 'SUBSCRIPTION_REQUIRED',
      message: examCategory === 'IELTS'
        ? 'IELTS content requires a Basic plan or higher.'
        : examCategory === 'ACT'
        ? 'ACT Plus requires a Basic plan or higher.'
        : 'SAT Advanced requires a Basic plan or higher.',
      requiredPlan: 'BASIC',
    };
  }

  // 단품 구매 상품 체크 (EBS, CSAT_2026, TOEFL, TOEIC, SAT)
  const packageSlug = PACKAGE_EXAM_SLUGS[examCategory];
  if (packageSlug) {
    const pkg = await prisma.productPackage.findUnique({ where: { slug: packageSlug } });
    if (pkg) {
      const purchase = await prisma.userPurchase.findFirst({
        where: {
          userId,
          packageId: pkg.id,
          status: 'ACTIVE',
          expiresAt: { gt: new Date() },
        },
      });
      if (purchase) {
        return null; // 구매 확인 → 접근 허용
      }
    }
    return {
      error: 'PACKAGE_REQUIRED',
      message: isGlobal
        ? 'This content requires a pack purchase or Premium plan.'
        : '이 콘텐츠는 단품 구매 또는 프리미엄 플랜이 필요합니다.',
      requiredPlan: 'PREMIUM',
    };
  }

  // 기존 구독 기반 접근 체크 (CSAT, TEPS)
  if (!canAccessContent(tier, examCategory, level, isGlobal)) {
    const requiredPlan = 'BASIC';
    return {
      error: 'SUBSCRIPTION_REQUIRED',
      message: isGlobal
        ? 'This content requires a Basic plan or higher.'
        : '이 콘텐츠는 베이직 플랜 이상이 필요합니다.',
      requiredPlan,
    };
  }

  return null; // 접근 허용
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
  const isGlobal = isGlobalLocale(req);

  // 시험/레벨이 지정되지 않은 경우 통과
  if (!examCategory && !level) {
    return next();
  }

  // 비로그인 사용자: 한국=CSAT L1, 글로벌=SAT L1 허용
  if (!req.userId) {
    const freeExam = isGlobal ? 'SAT' : 'CSAT';
    if (examCategory && examCategory !== freeExam) {
      const examNames: Record<string, string> = { 'TEPS': 'TEPS', 'EBS': 'EBS 연계', 'CSAT_2026': '2026 기출', 'TOEIC': 'TOEIC', 'TOEFL': 'TOEFL', 'SAT': 'SAT', 'CSAT': 'CSAT' };
      const examName = examNames[examCategory] || examCategory;
      return res.status(403).json({
        error: 'SUBSCRIPTION_REQUIRED',
        message: isGlobal
          ? `${examName} content requires login.`
          : `${examName} 콘텐츠는 로그인이 필요합니다.`,
        requiredPlan: 'PREMIUM',
      });
    }
    if (level && level !== 'L1') {
      return res.status(403).json({
        error: 'SUBSCRIPTION_REQUIRED',
        message: isGlobal
          ? 'L2/L3 content requires a Basic plan or higher.'
          : 'L2/L3 콘텐츠는 베이직 플랜 이상이 필요합니다.',
        requiredPlan: 'BASIC',
      });
    }
    return next();
  }

  // 로그인 사용자: 공통 함수 호출
  try {
    const accessError = await verifyContentAccess(
      req.userId,
      examCategory || (isGlobal ? 'SAT' : 'CSAT'),
      level || 'L1',
      isGlobal
    );
    if (accessError) {
      return res.status(403).json(accessError);
    }
    next();
  } catch (error) {
    console.error('[SubscriptionMiddleware] Error:', error);
    next(error);
  }
};
