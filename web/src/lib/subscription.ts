// ============================================
// 구독 기반 접근 제어 유틸리티
// ============================================

interface User {
  id: string;
  subscriptionPlan?: string | null;
  subscriptionStatus?: string | null;
}

export type SubscriptionTier = 'FREE' | 'BASIC' | 'PREMIUM';

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
