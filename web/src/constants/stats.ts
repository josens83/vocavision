// /web/src/constants/stats.ts
// VocaVision 플랫폼 상수 정의

/**
 * 플랫폼 전체 통계 (수능 전용 버전)
 */
export const PLATFORM_STATS = {
  // 수능 단어 수
  totalWords: 3335,

  // 레벨별 단어 수
  levels: {
    L1: 1363, // 기초
    L2: 1035, // 중급
    L3: 937, // 고급 (이미지 생성 중)
  },

  // 시험 카테고리 (현재 수능만 활성화)
  exams: {
    CSAT: { name: '수능', words: 3335, active: true },
    TOEFL: { name: 'TOEFL', words: 0, active: false },
    TOEIC: { name: 'TOEIC', words: 0, active: false },
    TEPS: { name: 'TEPS', words: 0, active: false },
    SAT: { name: 'SAT', words: 0, active: false },
  },
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
