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
 * - TRIAL = 무료
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

  // TRIAL = 무료
  if (status === 'TRIAL') {
    return {
      text: '무료',
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

/**
 * 무료 사용자인지 확인
 */
export function isFreeUser(user: User | null): boolean {
  if (!user) return true;
  const plan = user.subscriptionPlan;
  const status = user.subscriptionStatus;

  // YEARLY 또는 FAMILY = 프리미엄
  if (plan === 'YEARLY' || plan === 'FAMILY') return false;

  // MONTHLY + ACTIVE = 베이직
  if (plan === 'MONTHLY' && status === 'ACTIVE') return false;

  return true;
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
    const tier = getSubscriptionTier(user);
    return tier === 'PREMIUM' || tier === 'BASIC';
  }
  // EBS, CSAT_2026: 프리미엄 또는 단품 구매
  if (exam === 'EBS' || exam === 'CSAT_2026') {
    return getSubscriptionTier(user) === 'PREMIUM' || hasPurchasedExam(user, exam);
  }
  // TOEFL, TOEIC: 단품 구매 전용 (구독 미포함)
  if (exam === 'TOEFL') {
    return hasPurchasedExam(user, 'TOEFL');
  }
  if (exam === 'TOEIC') {
    return hasPurchasedExam(user, 'TOEIC');
  }
  if (exam === 'SAT') {
    return hasPurchasedExam(user, 'SAT');
  }
  return false;
}

export function canAccessLevel(user: User | null, level: string): boolean {
  if (level === 'L1') return true;
  const tier = getSubscriptionTier(user);
  return tier === 'BASIC' || tier === 'PREMIUM';
}

export function canAccessContent(user: User | null, exam: string, level: string): boolean {
  // EBS, CSAT_2026, TOEFL, TOEIC, SAT: 시험 접근 가능하면 전체 레벨 접근 가능 (레벨 체크 불필요)
  if (exam === 'EBS' || exam === 'CSAT_2026' || exam === 'TOEFL' || exam === 'TOEIC' || exam === 'SAT') {
    return canAccessExam(user, exam);
  }
  return canAccessExam(user, exam) && canAccessLevel(user, level);
}

export function getAccessibleLevels(user: User | null): { CSAT: string[]; TEPS: string[]; EBS: string[] } {
  const tier = getSubscriptionTier(user);

  // EBS는 단품 구매로 접근 (3개 교재별 레벨)
  const ebsLevels = hasPurchasedExam(user, 'EBS') || tier === 'PREMIUM'
    ? ['LISTENING', 'READING_BASIC', 'READING_ADV'] : [];

  switch (tier) {
    case 'PREMIUM':
      return { CSAT: ['L1', 'L2', 'L3'], TEPS: ['L1', 'L2', 'L3'], EBS: ['LISTENING', 'READING_BASIC', 'READING_ADV'] };
    case 'BASIC':
      return { CSAT: ['L1', 'L2', 'L3'], TEPS: ['L1', 'L2'], EBS: ebsLevels };
    case 'FREE':
    default:
      return { CSAT: ['L1'], TEPS: [], EBS: ebsLevels };
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
  'toefl-complete': 'TOEFL',
  'toeic-complete': 'TOEIC',
  'sat-complete': 'SAT',
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
 * - CSAT: 모든 사용자
 * - TEPS: 베이직 이상
 * - CSAT_2026: 프리미엄 또는 단품 구매자
 */
export function canAccessExamWithPurchase(user: User | null, exam: string): boolean {
  // CSAT는 모든 사용자 접근 가능
  if (exam === 'CSAT') return true;

  // 프리미엄 회원은 모든 것에 접근 가능
  if (getSubscriptionTier(user) === 'PREMIUM') return true;

  // TEPS: 베이직 이상 접근 가능
  if (exam === 'TEPS' && getSubscriptionTier(user) === 'BASIC') return true;

  // 단품 구매 확인
  if (hasPurchasedExam(user, exam)) return true;

  return false;
}

/**
 * 프리미엄 또는 단품 구매로 콘텐츠에 접근 가능한지 확인
 * - 프리미엄: 모든 콘텐츠 접근 가능 (CSAT, TEPS, 단품 포함)
 * - 베이직: CSAT 전체 레벨 + TEPS L1/L2
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

  // 프리미엄: 전체 7개 노출, 잠금 없음
  if (tier === 'PREMIUM') {
    return [
      { exam: 'CSAT',      locked: false },
      { exam: 'TEPS',      locked: false },
      { exam: 'CSAT_2026', locked: false },
      { exam: 'EBS',       locked: false },
      { exam: 'TOEFL',     locked: false },
      { exam: 'TOEIC',     locked: false },
      { exam: 'SAT',       locked: false },
    ];
  }

  // 베이직: 수능 + TEPS 잠금 없음 + 구매한 단품 추가
  if (tier === 'BASIC') {
    const exams: { exam: string; locked: boolean; reason?: string }[] = [
      { exam: 'CSAT', locked: false },
      { exam: 'TEPS', locked: false },
    ];
    if (hasPurchasedExam(user, 'CSAT_2026')) exams.push({ exam: 'CSAT_2026', locked: false });
    if (hasPurchasedExam(user, 'EBS'))       exams.push({ exam: 'EBS',       locked: false });
    if (hasPurchasedExam(user, 'TOEFL'))     exams.push({ exam: 'TOEFL',     locked: false });
    if (hasPurchasedExam(user, 'TOEIC'))     exams.push({ exam: 'TOEIC',     locked: false });
    if (hasPurchasedExam(user, 'SAT'))       exams.push({ exam: 'SAT',       locked: false });
    return exams;
  }

  // 무료: 수능(열림) + TEPS(잠김)만 노출 + 단품 구매한 게 있으면 추가
  const exams: { exam: string; locked: boolean; reason?: string }[] = [
    { exam: 'CSAT', locked: false },
    { exam: 'TEPS', locked: true, reason: '베이직 이상 전용' },
  ];
  if (hasPurchasedExam(user, 'CSAT_2026')) exams.push({ exam: 'CSAT_2026', locked: false });
  if (hasPurchasedExam(user, 'EBS'))       exams.push({ exam: 'EBS',       locked: false });
  if (hasPurchasedExam(user, 'TOEFL'))     exams.push({ exam: 'TOEFL',     locked: false });
  if (hasPurchasedExam(user, 'TOEIC'))     exams.push({ exam: 'TOEIC',     locked: false });
  if (hasPurchasedExam(user, 'SAT'))       exams.push({ exam: 'SAT',       locked: false });
  return exams;
}
