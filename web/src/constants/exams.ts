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
  labelEn?: string;    // EN 라벨 (예: 'L1 (Basic)')
  shortLabel: string;  // 짧은 라벨 (예: '기초')
  shortLabelEn?: string; // EN 짧은 라벨 (예: 'Basic')
}

export interface ExamConfig {
  key: string;
  label: string;         // 표시명 (예: '수능')
  labelEn?: string;      // EN 표시명 (예: 'CSAT')
  icon: string;          // 이모지 아이콘
  color: string;         // 색상 키 (blue, purple 등)
  levels: LevelConfig[];
  packageSlug?: string;  // 단품 패키지 slug (있는 경우)
  globalHidden?: boolean;  // true = vocavision.app에서 숨김
}

// ---------------------------------------------
// 시험 목록 정의
// ---------------------------------------------

export const EXAM_LIST: ExamConfig[] = [
  {
    key: 'CSAT',
    label: '수능',
    labelEn: 'CSAT',
    icon: '📝',
    color: 'blue',
    globalHidden: true,
    levels: [
      { key: 'L1', label: 'L1(기초)', labelEn: 'L1 (Basic)', shortLabel: '기초', shortLabelEn: 'Basic' },
      { key: 'L2', label: 'L2(중급)', labelEn: 'L2 (Intermediate)', shortLabel: '중급', shortLabelEn: 'Intermediate' },
      { key: 'L3', label: 'L3(고급)', labelEn: 'L3 (Advanced)', shortLabel: '고급', shortLabelEn: 'Advanced' },
    ],
  },
  {
    key: 'TEPS',
    label: 'TEPS',
    labelEn: 'TEPS',
    icon: '🎓',
    color: 'purple',
    globalHidden: true,
    levels: [
      { key: 'L1', label: 'L1(기본)', labelEn: 'L1 (Core)', shortLabel: '기본', shortLabelEn: 'Core' },
      { key: 'L2', label: 'L2(필수)', labelEn: 'L2 (Essential)', shortLabel: '필수', shortLabelEn: 'Essential' },
    ],
  },
  {
    key: 'CSAT_2026',
    label: '2026 수능 기출',
    labelEn: '2026 CSAT',
    icon: '📋',
    color: 'emerald',
    globalHidden: true,
    packageSlug: '2026-csat-analysis',
    levels: [
      { key: 'LISTENING', label: '듣기영역', labelEn: 'Listening', shortLabel: '듣기', shortLabelEn: 'Listening' },
      { key: 'READING_2', label: '독해 2점', labelEn: 'Reading 2pt', shortLabel: '독해2점', shortLabelEn: 'Reading 2pt' },
      { key: 'READING_3', label: '독해 3점', labelEn: 'Reading 3pt', shortLabel: '독해3점', shortLabelEn: 'Reading 3pt' },
    ],
  },
  {
    key: 'EBS',
    label: 'EBS 연계',
    labelEn: 'EBS',
    icon: '📗',
    color: 'green',
    globalHidden: true,
    packageSlug: 'ebs-vocab',
    levels: [
      { key: 'LISTENING', label: '듣기영역', labelEn: 'Listening', shortLabel: '듣기', shortLabelEn: 'Listening' },
      { key: 'READING_BASIC', label: '독해 기본', labelEn: 'Reading Basic', shortLabel: '독해기본', shortLabelEn: 'Reading Basic' },
      { key: 'READING_ADV', label: '독해 실력', labelEn: 'Reading Advanced', shortLabel: '독해실력', shortLabelEn: 'Reading Adv' },
    ],
  },
  {
    key: 'TOEFL',
    label: 'TOEFL',
    labelEn: 'TOEFL',
    icon: '🌍',
    color: 'blue',
    packageSlug: 'toefl-complete',
    levels: [
      { key: 'L1', label: 'Essential 핵심필수', labelEn: 'Essential', shortLabel: 'Essential', shortLabelEn: 'Essential' },
      { key: 'L2', label: 'Mastery 실전고난도', labelEn: 'Mastery', shortLabel: 'Mastery', shortLabelEn: 'Mastery' },
    ],
  },
  {
    key: 'TOEIC',
    label: 'TOEIC',
    labelEn: 'TOEIC',
    icon: '💼',
    color: 'green',
    packageSlug: 'toeic-complete',
    levels: [
      { key: 'L1', label: 'Primer 기초필수', labelEn: 'Primer', shortLabel: 'Primer', shortLabelEn: 'Primer' },
      { key: 'L2', label: 'Booster 고득점', labelEn: 'Booster', shortLabel: 'Booster', shortLabelEn: 'Booster' },
    ],
  },
  {
    key: 'SAT',
    label: 'SAT',
    labelEn: 'SAT',
    icon: '🎯',
    color: 'orange',
    packageSlug: 'sat-complete',
    levels: [
      { key: 'L1', label: 'SAT Starter', labelEn: 'Starter', shortLabel: 'Starter', shortLabelEn: 'Starter' },
      { key: 'L2', label: 'SAT Advanced', labelEn: 'Advanced', shortLabel: 'Advanced', shortLabelEn: 'Advanced' },
    ],
  },
  {
    key: 'GRE',
    label: 'GRE',
    labelEn: 'GRE',
    icon: '🎓',
    color: 'indigo',
    packageSlug: 'gre-complete',
    levels: [
      { key: 'L1', label: 'Verbal 핵심', labelEn: 'Verbal', shortLabel: 'Verbal', shortLabelEn: 'Verbal' },
      { key: 'L2', label: 'Elite 고급', labelEn: 'Elite', shortLabel: 'Elite', shortLabelEn: 'Elite' },
    ],
  },
  {
    key: 'IELTS',
    label: 'IELTS',
    labelEn: 'IELTS',
    icon: '🌐',
    color: 'sky',
    packageSlug: 'ielts-complete',
    levels: [
      { key: 'L1', label: 'Foundation Band 5~6.5', labelEn: 'Foundation', shortLabel: 'Foundation', shortLabelEn: 'Foundation' },
      { key: 'L2', label: 'Academic Band 7~8', labelEn: 'Academic', shortLabel: 'Academic', shortLabelEn: 'Academic' },
    ],
  },
  {
    key: 'ACT',
    label: 'ACT',
    labelEn: 'ACT',
    icon: '📐',
    color: 'violet',
    packageSlug: 'act-complete',
    levels: [
      { key: 'L1', label: 'ACT Core', labelEn: 'Core', shortLabel: 'Core', shortLabelEn: 'Core' },
      { key: 'L2', label: 'ACT Plus', labelEn: 'Plus', shortLabel: 'Plus', shortLabelEn: 'Plus' },
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
  // SAT 테마별 학습: THEME_* 레벨은 항상 유효
  if (examKey === 'SAT' && currentLevel.startsWith('THEME_')) return currentLevel;
  const validLevels = getValidLevelsForExam(examKey);
  return validLevels.includes(currentLevel) ? currentLevel : validLevels[0];
}

/** 시험 키 → 표시명 (isEn 분기) */
export function getExamLabel(examKey: string, isEn: boolean = false): string {
  const exam = EXAM_MAP[examKey];
  if (!exam) return examKey;
  return isEn ? (exam.labelEn || exam.label) : exam.label;
}

/** 레벨 키 → 라벨 변환 (시험별, isEn 분기) */
export function getLevelLabel(examKey: string, levelKey: string, isEn: boolean = false): string {
  const exam = EXAM_MAP[examKey];
  if (!exam) return levelKey;
  const level = exam.levels.find((l) => l.key === levelKey);
  if (!level) return levelKey;
  return isEn ? (level.labelEn || level.label) : level.label;
}

/** 레벨 키 → 짧은 라벨 변환 (isEn 분기) */
export function getLevelShortLabel(examKey: string, levelKey: string, isEn: boolean = false): string {
  const exam = EXAM_MAP[examKey];
  if (!exam) return levelKey;
  const level = exam.levels.find((l) => l.key === levelKey);
  if (!level) return levelKey;
  return isEn ? (level.shortLabelEn || level.shortLabel) : level.shortLabel;
}

// ---------------------------------------------
// SAT 테마별 학습
// ---------------------------------------------

export interface SatTheme {
  key: string;
  label: string;
  labelEn?: string;
  emoji: string;
}

export const SAT_THEMES: SatTheme[] = [
  { key: 'THEME_MIND',       label: '정신 / 사고',   labelEn: 'Mind',        emoji: '🧠' },
  { key: 'THEME_EMOTION',    label: '감정 / 기분',   labelEn: 'Emotion',     emoji: '💭' },
  { key: 'THEME_CHARACTER',  label: '성격 / 기질',   labelEn: 'Character',   emoji: '🌟' },
  { key: 'THEME_BODY',       label: '신체 / 의학',   labelEn: 'Body',        emoji: '🫀' },
  { key: 'THEME_CONFLICT',   label: '갈등 / 전쟁',   labelEn: 'Conflict',    emoji: '⚔️' },
  { key: 'THEME_SOCIETY',    label: '사회 / 문화',   labelEn: 'Society',     emoji: '🏛️' },
  { key: 'THEME_POWER',      label: '권력 / 정치',   labelEn: 'Power',       emoji: '👑' },
  { key: 'THEME_MORALITY',   label: '도덕 / 윤리',   labelEn: 'Morality',    emoji: '⚖️' },
  { key: 'THEME_SPEECH',     label: '언어 / 표현',   labelEn: 'Speech',      emoji: '💬' },
  { key: 'THEME_KNOWLEDGE',  label: '지식 / 논리',   labelEn: 'Knowledge',   emoji: '📚' },
  { key: 'THEME_CHANGE',     label: '변화 / 전환',   labelEn: 'Change',      emoji: '🔄' },
  { key: 'THEME_WEALTH',     label: '부 / 경제',     labelEn: 'Wealth',      emoji: '💰' },
  { key: 'THEME_CRIME',      label: '범죄 / 속임',   labelEn: 'Crime',       emoji: '🔍' },
  { key: 'THEME_NATURE',     label: '자연 / 생물',   labelEn: 'Nature',      emoji: '🌿' },
  { key: 'THEME_ART',        label: '예술 / 창작',   labelEn: 'Art',         emoji: '🎨' },
  { key: 'THEME_SCIENCE',    label: '과학 / 기술',   labelEn: 'Science',     emoji: '🔬' },
  { key: 'THEME_MOVEMENT',   label: '이동 / 방향',   labelEn: 'Movement',    emoji: '🧭' },
  { key: 'THEME_CONFLICT2',  label: '재앙 / 파괴',   labelEn: 'Disaster',    emoji: '💥' },
  { key: 'THEME_APPEARANCE', label: '외모 / 형태',   labelEn: 'Appearance',  emoji: '👁️' },
  { key: 'THEME_RELATIONS',  label: '관계 / 연결',   labelEn: 'Relations',   emoji: '🤝' },
];

/** SAT 테마 키로 테마 정보 조회 */
export function getSatTheme(themeKey: string): SatTheme | undefined {
  return SAT_THEMES.find(t => t.key === themeKey);
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

/** 글로벌/한국 도메인에 따라 보여줄 시험 목록 반환 */
export function getVisibleExams(isGlobal: boolean): ExamConfig[] {
  if (!isGlobal) return EXAM_LIST;
  return EXAM_LIST.filter((e) => !e.globalHidden);
}
