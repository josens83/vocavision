// ============================================
// 구독 기반 접근 제어 유틸리티
// ============================================

interface Purchase {
  id: string;
  packageId: string;
  expiresAt: string;
  package: {
    id: string;
    slug: string;
    name: string;
  };
}

interface User {
  id: string;
  subscriptionPlan?: string | null;
  subscriptionStatus?: string | null;
  purchases?: Purchase[];
}

export type SubscriptionTier = 'FREE' | 'BASIC' | 'PREMIUM';

// ============================================
// 플랜 표시 유틸리티
// ============================================
export interface PlanDisplay {
  text: string;
  bgColor: string;
  textColor: string;
  icon?: string;
}

/**
 * 사용자 플랜 표시 정보 반환
 * - YEARLY/FAMILY = 프리미엄
 * - MONTHLY + ACTIVE = 베이직
 * - TRIAL = 무료 체험
 * - 그 외 = 무료
 */
export function getPlanDisplay(user: { subscriptionPlan?: string | null; subscriptionStatus?: string | null } | null): PlanDisplay {
  if (!user) {
    return { text: '무료', bgColor: 'bg-gray-100', textColor: 'text-gray-500', icon: '✨' };
  }

  const plan = user.subscriptionPlan;
  const status = user.subscriptionStatus;

  // YEARLY 또는 FAMILY = 프리미엄
  if (plan === 'YEARLY' || plan === 'FAMILY') {
    return {
      text: '프리미엄',
      bgColor: 'bg-gradient-to-r from-[#14B8A6] to-[#06B6D4]',
      textColor: 'text-white',
      icon: '👑'
    };
  }

  // MONTHLY + ACTIVE = 베이직
  if (plan === 'MONTHLY' && status === 'ACTIVE') {
    return {
      text: '베이직',
      bgColor: 'bg-[#3B82F6]',
      textColor: 'text-white',
      icon: '💎'
    };
  }

  // TRIAL = 무료 체험
  if (status === 'TRIAL') {
    return {
      text: '무료 체험',
      bgColor: 'bg-[#EFF6FF]',
      textColor: 'text-[#3B82F6]',
      icon: '🎁'
    };
  }

  // 그 외 = 무료
  return { text: '무료', bgColor: 'bg-gray-100', textColor: 'text-gray-500', icon: '✨' };
}

/**
 * 프리미엄 플랜인지 확인 (YEARLY 또는 FAMILY)
 */
export function isPremiumPlan(user: { subscriptionPlan?: string | null } | null): boolean {
  if (!user) return false;
  return user.subscriptionPlan === 'YEARLY' || user.subscriptionPlan === 'FAMILY';
}

export function getSubscriptionTier(user: User | null): SubscriptionTier {
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

export function canAccessExam(user: User | null, exam: string): boolean {
  if (exam === 'CSAT') return true;
  if (exam === 'TEPS') {
    return getSubscriptionTier(user) === 'PREMIUM';
  }
  return false;
}

export function canAccessLevel(user: User | null, level: string): boolean {
  if (level === 'L1') return true;
  const tier = getSubscriptionTier(user);
  return tier === 'BASIC' || tier === 'PREMIUM';
}

export function canAccessContent(user: User | null, exam: string, level: string): boolean {
  return canAccessExam(user, exam) && canAccessLevel(user, level);
}

export function getAccessibleLevels(user: User | null): { CSAT: string[]; TEPS: string[] } {
  const tier = getSubscriptionTier(user);

  switch (tier) {
    case 'PREMIUM':
      return { CSAT: ['L1', 'L2', 'L3'], TEPS: ['L1', 'L2', 'L3'] };
    case 'BASIC':
      return { CSAT: ['L1', 'L2', 'L3'], TEPS: [] };
    case 'FREE':
    default:
      return { CSAT: ['L1'], TEPS: [] };
  }
}

export function isExamLocked(user: User | null, exam: string): boolean {
  const accessible = getAccessibleLevels(user);
  return (accessible[exam as keyof typeof accessible] || []).length === 0;
}

export function isLevelLocked(user: User | null, exam: string, level: string): boolean {
  const accessible = getAccessibleLevels(user);
  const examLevels = accessible[exam as keyof typeof accessible] || [];
  return !examLevels.includes(level);
}

// ============================================
// 단품 구매 기반 접근 권한
// ============================================

// slug → examCategory 매핑
const slugToExamMap: Record<string, string> = {
  '2026-csat-analysis': 'CSAT_2026',
  'ebs-vocab': 'EBS',
  'csat-core-200': 'CSAT_CORE',
};

/**
 * 특정 시험 카테고리에 대한 단품 구매 여부 확인
 */
export function hasPurchasedExam(user: User | null, examCategory: string): boolean {
  if (!user?.purchases) return false;
  return user.purchases.some(p => slugToExamMap[p.package.slug] === examCategory);
}

/**
 * 프리미엄 또는 단품 구매로 시험에 접근 가능한지 확인
 */
export function canAccessExamWithPurchase(user: User | null, exam: string): boolean {
  // 프리미엄 회원은 모든 것에 접근 가능
  if (getSubscriptionTier(user) === 'PREMIUM') return true;

  // CSAT는 모든 사용자 접근 가능
  if (exam === 'CSAT') return true;

  // CSAT_2026, EBS 등은 단품 구매 확인
  if (hasPurchasedExam(user, exam)) return true;

  // TEPS는 프리미엄만 (위에서 이미 체크됨)
  return false;
}

/**
 * 프리미엄 또는 단품 구매로 콘텐츠에 접근 가능한지 확인
 * - 프리미엄: 모든 콘텐츠 접근 가능
 * - 베이직: CSAT 전체 레벨
 * - 무료: CSAT L1만
 * - 단품 구매: 해당 시험 전체 레벨
 */
export function canAccessContentWithPurchase(user: User | null, exam: string, level: string): boolean {
  // 프리미엄 회원은 모든 것에 접근 가능
  if (getSubscriptionTier(user) === 'PREMIUM') return true;

  // 단품 구매한 시험은 전체 레벨 접근 가능
  if (hasPurchasedExam(user, exam)) return true;

  // 기존 구독 기반 접근 권한 체크
  return canAccessExam(user, exam) && canAccessLevel(user, level);
}

/**
 * 대시보드에서 표시할 모든 시험 목록 (자물쇠 포함)
 */
export function getAvailableExams(user: User | null): { exam: string; locked: boolean; reason?: string }[] {
  const tier = getSubscriptionTier(user);

  const exams = [
    { exam: 'CSAT', locked: false },
    { exam: 'CSAT_2026', locked: !canAccessExamWithPurchase(user, 'CSAT_2026'), reason: '단품 구매 필요' },
    { exam: 'TEPS', locked: tier !== 'PREMIUM', reason: '프리미엄 전용' },
  ];

  return exams;
}
