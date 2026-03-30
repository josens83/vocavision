// /web/src/constants/stats.ts
// VocaVision 플랫폼 상수 정의
// 실제 DB 수치 기준 (2026년 3월 업데이트)

/**
 * 플랫폼 전체 통계
 */
export const PLATFORM_STATS = {
  // 전체 고유 단어 수 — 단어 수는 /api/packages/word-counts에서 동적으로 가져옴
  // 아래 값은 fallback 초기값 (useWordCounts DEFAULT_COUNTS 참고)
  totalWords: 19347,

  // 수능 단어 수 (기본 무료 제공)
  csatWords: 1724,

  // 수능 L1 단어 수 (무료 제공)
  csatL1Words: 948,

  // 레벨별 단어 수 (CSAT 기준)
  levels: {
    L1: 948, // 기초
    L2: 571, // 중급
    L3: 215, // 고급
  },

  // 시험 카테고리 (유니크 단어 기준)
  exams: {
    CSAT: { name: '수능', words: 1724, active: true },
    TEPS: { name: 'TEPS', words: 419, active: true, premium: true },
    TOEFL: { name: 'TOEFL', words: 2907, active: true },
    TOEIC: { name: 'TOEIC', words: 2357, active: true },
    EBS: { name: 'EBS', words: 3546, active: true },
    CSAT_2026: { name: '2026 기출', words: 520, active: true },
    SAT: { name: 'SAT', words: 2120, active: true },
    GRE: { name: 'GRE', words: 4241, active: true },
    IELTS: { name: 'IELTS', words: 691, active: true },
    ACT: { name: 'ACT', words: 822, active: true },
  },

  // 프리미엄 통계
  premium: {
    totalWords: 2143, // CSAT 1,724 + TEPS 419
    exams: ['CSAT', 'TEPS'],
  },

  // 대비 가능한 시험 수
  examCount: '10',

  // AI 콘텐츠 단계 수
  learningModes: 8,
} as const;

/**
 * 레벨 정보
 */
export const LEVEL_INFO = {
  L1: {
    name: '기초',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    description: '기본 필수 어휘',
  },
  L2: {
    name: '중급',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    description: '실력 향상 어휘',
  },
  L3: {
    name: '고급',
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    description: '1등급 목표 어휘',
  },
} as const;

/**
 * 학습 모드
 */
export const LEARNING_MODES = {
  FLASHCARD: {
    name: '플래시카드',
    icon: '🎴',
    path: '/learn',
    description: '카드를 넘기며 암기',
  },
  QUIZ: {
    name: '퀴즈',
    icon: '❓',
    path: '/quiz',
    description: '4지선다 문제 풀이',
  },
} as const;

/**
 * 비로그인 사용자용 샘플 데이터
 */
export const GUEST_SAMPLE_WORDS = [
  { word: 'ubiquitous', meaning: '어디에나 있는', level: 'L2' },
  { word: 'perspective', meaning: '관점, 시각', level: 'L2' },
  { word: 'significant', meaning: '중요한, 의미 있는', level: 'L1' },
  { word: 'elaborate', meaning: '정교한, 상세히 설명하다', level: 'L3' },
  { word: 'comprehensive', meaning: '포괄적인, 종합적인', level: 'L2' },
] as const;
