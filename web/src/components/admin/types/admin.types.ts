// ============================================
// VocaVision Admin Dashboard - Types & Constants
// ============================================

// ---------------------------------------------
// Enums
// ---------------------------------------------
export type ExamCategory = 'CSAT' | 'CSAT_BASIC' | 'EBS' | 'TEPS' | 'TOEIC' | 'TOEFL' | 'SAT';

export type ContentStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';

// Simplified level system: Beginner/Intermediate/Advanced (maps to L1/L2/L3 in DB)
export type DifficultyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

// Combined exam + level for easy batch selection
export type ExamWithLevel = `${ExamCategory}-${DifficultyLevel}`;

// ---------------------------------------------
// Word & Content Types
// ---------------------------------------------
// Exam-level mapping (for multi-exam support)
export interface WordExamLevel {
  examCategory: ExamCategory;
  level: string;  // L1, L2, L3
  displayLevel: DifficultyLevel;  // BEGINNER, INTERMEDIATE, ADVANCED
}

export interface VocaWord {
  id: string;
  word: string;
  partOfSpeech?: string | string[];  // Can be single string from backend or array
  frequency: number;
  examCategories: ExamCategory[];
  level: DifficultyLevel;
  topics: string[];
  status: ContentStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  content?: VocaContentSummary;
  // Additional fields from backend
  examCategory?: ExamCategory;
  wordLevel?: string; // L1, L2, L3
  // Multi-exam mappings
  examLevels?: WordExamLevel[];
}

export interface VocaContentSummary {
  id: string;
  humanReviewed: boolean;
  aiGeneratedAt?: string;
  primaryGifUrl?: string;
}

export interface VocaContentFull {
  id: string;
  wordId: string;

  // Pronunciation
  ipaUs?: string;
  ipaUk?: string;
  pronunciation?: string;
  audioUrlUs?: string;
  audioUrlUk?: string;

  // Etymology
  etymology?: string;
  etymologyLang?: string;

  // Morphology
  prefix?: string;
  root?: string;
  suffix?: string;
  morphologyNote?: string;

  // Collocations
  collocations: VocaCollocation[];

  // Rhyming
  rhymingWords: string[];
  rhymingNote?: string;

  // Mnemonic
  mnemonic?: string;
  mnemonicImage?: string;
  mnemonicKorean?: string;

  // Examples
  funnyExamples: VocaExample[];

  // Definitions
  definitions: VocaDefinition[];

  // Related
  synonyms: string[];
  antonyms: string[];
  relatedWords: string[];

  // Media
  primaryGifUrl?: string;
  thumbnailUrl?: string;
  additionalMedia: VocaMedia[];

  // AI Metadata
  aiModel?: string;
  aiGeneratedAt?: string;
  humanReviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface VocaDefinition {
  id: string;
  partOfSpeech: string;
  definitionEn: string;
  definitionKo: string;
  exampleEn?: string;
  exampleKo?: string;
  order: number;
}

export interface VocaCollocation {
  id: string;
  phrase: string;
  translation?: string;
  exampleEn?: string;
  exampleKo?: string;
  type?: string;
  frequency: number;
}

export interface VocaExample {
  id: string;
  sentenceEn: string;
  sentenceKo: string;
  isFunny: boolean;
  isReal: boolean;
  source?: string;
  highlightWord?: string;
  grammarNote?: string;
  order: number;
}

export interface VocaMedia {
  id: string;
  type: 'gif' | 'image' | 'video';
  url: string;
  caption?: string;
  altText?: string;
  source?: string;
  order: number;
}

// ---------------------------------------------
// API Response Types
// ---------------------------------------------
export interface WordListResponse {
  words: VocaWord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  totalWords: number;
  publishedWords: number;
  pendingReview: number;
  draftWords: number;
  byExamCategory: Record<ExamCategory, number>;
  byLevel: Record<DifficultyLevel, number>;
  contentCoverage: {
    hasEtymology: number;
    hasMnemonic: number;
    hasExamples: number;
    hasMedia: number;
    // Extended media stats
    wordImageCount?: number;
    wordVisualCount?: number;
    wordsWithVisuals?: number; // Words that have at least one image
  };
}

// ---------------------------------------------
// Form Types
// ---------------------------------------------
export interface CreateWordForm {
  word: string;
  examCategories: ExamCategory[];
  level: DifficultyLevel;
  topics: string[];
  generateContent: boolean;
}

export interface BatchCreateForm {
  words: string;  // textarea, 줄바꿈으로 구분
  examWithLevel: ExamWithLevel;  // Combined selection like "CSAT-BEGINNER"
  generateContent: boolean;
}

export interface ReviewForm {
  action: 'approve' | 'reject' | 'request_changes';
  notes: string;
}

// ---------------------------------------------
// Filter Types
// ---------------------------------------------
export interface WordFilters {
  search: string;
  examCategories: ExamCategory[];
  levels: DifficultyLevel[];
  status: ContentStatus[];
  hasContent: boolean | null;
  sortBy: 'word' | 'frequency' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

// ---------------------------------------------
// Constants
// ---------------------------------------------
export const EXAM_CATEGORY_LABELS: Record<ExamCategory, string> = {
  CSAT: '수능',
  CSAT_BASIC: '기초수능',
  EBS: 'EBS',
  TEPS: 'TEPS',
  TOEIC: 'TOEIC',
  TOEFL: 'TOEFL',
  SAT: 'SAT',
};

// Exam category badge colors
export const EXAM_CATEGORY_COLORS: Record<ExamCategory, string> = {
  CSAT: 'bg-pink-500',
  CSAT_BASIC: 'bg-rose-400',
  EBS: 'bg-emerald-500',
  TEPS: 'bg-purple-500',
  TOEIC: 'bg-blue-500',
  TOEFL: 'bg-sky-500',
  SAT: 'bg-slate-500',
};

// Helper function to get exam/level display label
export const getExamLevelLabel = (examCategory: string, level: string | null): string => {
  const labels: Record<string, string> = {
    'CSAT': '수능',
    'CSAT_BASIC': '기초수능',
    'EBS': 'EBS',
    'TEPS': 'TEPS',
    'TOEFL': 'TOEFL',
    'TOEIC': 'TOEIC',
    'SAT': 'SAT',
  };

  const base = labels[examCategory] || examCategory;

  // level이 null이면 레벨 표시 안함
  if (!level) {
    return base;
  }

  return `${base} ${level}`;
};

export const LEVEL_LABELS: Record<DifficultyLevel, string> = {
  BEGINNER: '초급 (Beginner)',
  INTERMEDIATE: '중급 (Intermediate)',
  ADVANCED: '고급 (Advanced)',
};

// Short labels for badges
export const LEVEL_SHORT_LABELS: Record<DifficultyLevel, string> = {
  BEGINNER: '초급',
  INTERMEDIATE: '중급',
  ADVANCED: '고급',
};

// Map to DB level values (L1, L2, L3)
export const LEVEL_TO_DB: Record<DifficultyLevel, string> = {
  BEGINNER: 'L1',
  INTERMEDIATE: 'L2',
  ADVANCED: 'L3',
};

// Reverse map from DB level to DifficultyLevel
export const DB_TO_LEVEL: Record<string, DifficultyLevel> = {
  L1: 'BEGINNER',
  L2: 'INTERMEDIATE',
  L3: 'ADVANCED',
};

// Combined exam + level options for batch upload dropdown
export const EXAM_LEVEL_OPTIONS: { value: ExamWithLevel; label: string; exam: ExamCategory; level: DifficultyLevel }[] = [
  // 수능
  { value: 'CSAT-BEGINNER', label: '수능 - 초급', exam: 'CSAT', level: 'BEGINNER' },
  { value: 'CSAT-INTERMEDIATE', label: '수능 - 중급', exam: 'CSAT', level: 'INTERMEDIATE' },
  { value: 'CSAT-ADVANCED', label: '수능 - 고급', exam: 'CSAT', level: 'ADVANCED' },
  // TEPS
  { value: 'TEPS-BEGINNER', label: 'TEPS - 초급', exam: 'TEPS', level: 'BEGINNER' },
  { value: 'TEPS-INTERMEDIATE', label: 'TEPS - 중급', exam: 'TEPS', level: 'INTERMEDIATE' },
  { value: 'TEPS-ADVANCED', label: 'TEPS - 고급', exam: 'TEPS', level: 'ADVANCED' },
  // TOEIC
  { value: 'TOEIC-BEGINNER', label: 'TOEIC - 초급', exam: 'TOEIC', level: 'BEGINNER' },
  { value: 'TOEIC-INTERMEDIATE', label: 'TOEIC - 중급', exam: 'TOEIC', level: 'INTERMEDIATE' },
  { value: 'TOEIC-ADVANCED', label: 'TOEIC - 고급', exam: 'TOEIC', level: 'ADVANCED' },
  // TOEFL
  { value: 'TOEFL-BEGINNER', label: 'TOEFL - 초급', exam: 'TOEFL', level: 'BEGINNER' },
  { value: 'TOEFL-INTERMEDIATE', label: 'TOEFL - 중급', exam: 'TOEFL', level: 'INTERMEDIATE' },
  { value: 'TOEFL-ADVANCED', label: 'TOEFL - 고급', exam: 'TOEFL', level: 'ADVANCED' },
  // SAT
  { value: 'SAT-BEGINNER', label: 'SAT - 초급', exam: 'SAT', level: 'BEGINNER' },
  { value: 'SAT-INTERMEDIATE', label: 'SAT - 중급', exam: 'SAT', level: 'INTERMEDIATE' },
  { value: 'SAT-ADVANCED', label: 'SAT - 고급', exam: 'SAT', level: 'ADVANCED' },
];

export const STATUS_LABELS: Record<ContentStatus, string> = {
  DRAFT: '초안',
  PENDING_REVIEW: '검토 대기',
  APPROVED: '승인됨',
  PUBLISHED: '발행됨',
  ARCHIVED: '보관됨',
};

export const STATUS_COLORS: Record<ContentStatus, { bg: string; text: string }> = {
  DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700' },
  PENDING_REVIEW: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  APPROVED: { bg: 'bg-blue-100', text: 'text-blue-700' },
  PUBLISHED: { bg: 'bg-green-100', text: 'text-green-700' },
  ARCHIVED: { bg: 'bg-red-100', text: 'text-red-700' },
};

export const LEVEL_COLORS: Record<DifficultyLevel, string> = {
  BEGINNER: '#10B981', // green
  INTERMEDIATE: '#F59E0B', // amber
  ADVANCED: '#EF4444', // red
};

// ---------------------------------------------
// 3-이미지 시각화 시스템 (Word Visuals)
// ---------------------------------------------
export type VisualType = 'CONCEPT' | 'MNEMONIC' | 'RHYME';

export interface WordVisual {
  id: string;
  wordId: string;
  type: VisualType;

  // 라벨 (탭 표시용)
  labelEn?: string;   // "Concept", "Mnemonic", "Rhyme"
  labelKo?: string;   // "의미", "연상", "라이밍"

  // 캡션 (이미지 설명)
  captionEn?: string; // 영어 캡션
  captionKo?: string; // 한국어 캡션 (학습자용)

  // 이미지 URL (정적 이미지 또는 GIF)
  imageUrl?: string;  // Supabase Storage URL

  // AI 이미지 생성 프롬프트
  promptEn?: string;  // DALL-E/Midjourney 프롬프트

  // 정렬 순서
  order: number;

  createdAt: string;
  updatedAt: string;
}

// Visual input for creating/updating (without id, timestamps)
export interface WordVisualInput {
  type: VisualType;
  labelEn?: string;
  labelKo?: string;
  captionEn?: string;
  captionKo?: string;
  imageUrl?: string | null;  // null to clear image
  promptEn?: string;
  order?: number;
}

// JSON template format for bulk import
export interface VisualTemplate {
  word: string;
  visuals: {
    concept?: {
      labelKo?: string;
      captionEn?: string;
      captionKo?: string;
      imageUrl?: string;
      promptEn?: string;
    };
    mnemonic?: {
      labelKo?: string;
      captionEn?: string;
      captionKo?: string;
      imageUrl?: string;
      promptEn?: string;
    };
    rhyme?: {
      labelKo?: string;
      captionEn?: string;
      captionKo?: string;
      imageUrl?: string;
      promptEn?: string;
    };
  };
}

// Constants for visual types
export const VISUAL_TYPE_CONFIG: Record<VisualType, {
  labelEn: string;
  labelKo: string;
  description: string;
  example: string;
  color: string;
  lightColor: string;
}> = {
  CONCEPT: {
    labelEn: 'Concept',
    labelKo: '의미',
    description: '단어 의미를 직관적으로 보여주는 이미지',
    example: 'dormant → 휴화산 (dormant volcano)',
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  MNEMONIC: {
    labelEn: 'Mnemonic',
    labelKo: '연상',
    description: '한국어식 연상법에 맞는 이미지',
    example: 'dormant → 문 앞에서 졸고 있는 doorman',
    color: 'bg-green-500',
    lightColor: 'bg-green-50 text-green-700 border-green-200',
  },
  RHYME: {
    labelEn: 'Rhyme',
    labelKo: '라이밍',
    description: '발음/라이밍 기반 상황 이미지',
    example: 'daunting to dormant man',
    color: 'bg-purple-500',
    lightColor: 'bg-purple-50 text-purple-700 border-purple-200',
  },
};
