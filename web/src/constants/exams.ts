/**
 * 공통 시험 목록 상수
 * → dashboard, review, statistics, learn 등에서 공유
 * → 새 시험 추가 시 이 파일만 수정하면 전체 반영
 */

// ---------------------------------------------
// 타입 정의
// ---------------------------------------------

export interface LevelConfig {
  key: string;
  label: string;       // 풀 라벨 (예: 'L1(기초)')
  shortLabel: string;  // 짧은 라벨 (예: '기초')
}

export interface ExamConfig {
  key: string;
  label: string;         // 표시명 (예: '수능')
  icon: string;          // 이모지 아이콘
  color: string;         // 색상 키 (blue, purple 등)
  levels: LevelConfig[];
  packageSlug?: string;  // 단품 패키지 slug (있는 경우)
}

// ---------------------------------------------
// 시험 목록 정의
// ---------------------------------------------

export const EXAM_LIST: ExamConfig[] = [
  {
    key: 'CSAT',
    label: '수능',
    icon: '📝',
    color: 'blue',
    levels: [
      { key: 'L1', label: 'L1(기초)', shortLabel: '기초' },
      { key: 'L2', label: 'L2(중급)', shortLabel: '중급' },
      { key: 'L3', label: 'L3(고급)', shortLabel: '고급' },
    ],
  },
  {
    key: 'TEPS',
    label: 'TEPS',
    icon: '🎓',
    color: 'purple',
    levels: [
      { key: 'L1', label: 'L1(기본)', shortLabel: '기본' },
      { key: 'L2', label: 'L2(필수)', shortLabel: '필수' },
    ],
  },
  {
    key: 'CSAT_2026',
    label: '2026 수능 기출',
    icon: '📋',
    color: 'emerald',
    packageSlug: '2026-csat-analysis',
    levels: [
      { key: 'LISTENING', label: '듣기영역', shortLabel: '듣기' },
      { key: 'READING_2', label: '독해 2점', shortLabel: '독해2점' },
      { key: 'READING_3', label: '독해 3점', shortLabel: '독해3점' },
    ],
  },
  {
    key: 'EBS',
    label: 'EBS 연계',
    icon: '📗',
    color: 'green',
    packageSlug: 'ebs-vocab',
    levels: [
      { key: 'LISTENING', label: '듣기영역', shortLabel: '듣기' },
      { key: 'READING_BASIC', label: '독해 기본', shortLabel: '독해기본' },
      { key: 'READING_ADV', label: '독해 실력', shortLabel: '독해실력' },
    ],
  },
  {
    key: 'TOEFL',
    label: 'TOEFL',
    icon: '🌍',
    color: 'blue',
    packageSlug: 'toefl-complete',
    levels: [
      { key: 'L1', label: 'Core 핵심필수', shortLabel: 'Core' },
      { key: 'L2', label: 'Advanced 실전고난도', shortLabel: 'Adv' },
    ],
  },
  {
    key: 'TOEIC',
    label: 'TOEIC',
    icon: '💼',
    color: 'green',
    packageSlug: 'toeic-complete',
    levels: [
      { key: 'L1', label: '토익 Start', shortLabel: 'Start' },
      { key: 'L2', label: '토익 Boost', shortLabel: 'Boost' },
    ],
  },
  {
    key: 'SAT',
    label: 'SAT',
    icon: '🇺🇸',
    color: 'indigo',
    packageSlug: 'sat-complete',
    levels: [
      { key: 'L1', label: 'Thematic 주제별', shortLabel: 'Thematic' },
      { key: 'L2', label: 'Confusable 혼동어', shortLabel: 'Confusable' },
    ],
  },
];

// ---------------------------------------------
// 파생 유틸리티
// ---------------------------------------------

/** key → ExamConfig 맵 */
export const EXAM_MAP: Record<string, ExamConfig> = Object.fromEntries(
  EXAM_LIST.map((e) => [e.key, e])
);

/** 유효한 시험 키 목록 */
export const VALID_EXAM_KEYS = EXAM_LIST.map((e) => e.key);

/** 시험의 유효 레벨 키 배열 반환 */
export function getValidLevelsForExam(examKey: string): string[] {
  return EXAM_MAP[examKey]?.levels.map((l) => l.key) || ['L1', 'L2', 'L3'];
}

/** 현재 레벨이 유효하면 그대로, 아니면 첫 번째 레벨 반환 */
export function getValidLevelForExam(examKey: string, currentLevel: string): string {
  const validLevels = getValidLevelsForExam(examKey);
  return validLevels.includes(currentLevel) ? currentLevel : validLevels[0];
}

/** 레벨 키 → 라벨 변환 (시험별) */
export function getLevelLabel(examKey: string, levelKey: string): string {
  const exam = EXAM_MAP[examKey];
  if (!exam) return levelKey;
  const level = exam.levels.find((l) => l.key === levelKey);
  return level?.label || levelKey;
}

/** 레벨 키 → 짧은 라벨 변환 */
export function getLevelShortLabel(examKey: string, levelKey: string): string {
  const exam = EXAM_MAP[examKey];
  if (!exam) return levelKey;
  const level = exam.levels.find((l) => l.key === levelKey);
  return level?.shortLabel || levelKey;
}

/** 레벨별 색상 (통계 등 시각화용) */
export const LEVEL_COLORS: Record<string, string> = {
  L1: 'bg-[#10B981]',
  L2: 'bg-[#3B82F6]',
  L3: 'bg-[#A855F7]',
  LISTENING: 'bg-[#F59E0B]',
  READING_2: 'bg-[#3B82F6]',
  READING_3: 'bg-[#A855F7]',
  READING_BASIC: 'bg-[#3B82F6]',
  READING_ADV: 'bg-[#A855F7]',
};
