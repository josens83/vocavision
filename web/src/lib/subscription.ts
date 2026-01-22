// ============================================
// 구독 기반 접근 제어 유틸리티
// ============================================

interface User {
  id: string;
  subscriptionPlan?: string | null;
  subscriptionStatus?: string | null;
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
    return { text: '무료', bgColor: 'bg-[#F8F9FA]', textColor: 'text-[#767676]', icon: '✨' };
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
  return { text: '무료', bgColor: 'bg-[#F8F9FA]', textColor: 'text-[#767676]', icon: '✨' };
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
