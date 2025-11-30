// ============================================
// VocaVision Admin Dashboard - Types & Constants
// ============================================

// ---------------------------------------------
// Enums
// ---------------------------------------------
export type ExamCategory = 'SUNEUNG' | 'TEPS' | 'TOEFL' | 'SAT' | 'IELTS' | 'GRE';

export type ContentStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';

export type DifficultyLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// ---------------------------------------------
// Word & Content Types
// ---------------------------------------------
export interface VocaWord {
  id: string;
  word: string;
  partOfSpeech: string[];
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
  examCategory: ExamCategory;
  level: DifficultyLevel;
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
  SUNEUNG: '수능',
  TEPS: 'TEPS',
  TOEFL: 'TOEFL',
  SAT: 'SAT',
  IELTS: 'IELTS',
  GRE: 'GRE',
};

export const LEVEL_LABELS: Record<DifficultyLevel, string> = {
  A1: 'A1 (Elementary)',
  A2: 'A2 (Pre-intermediate)',
  B1: 'B1 (Intermediate)',
  B2: 'B2 (Upper-intermediate)',
  C1: 'C1 (Advanced)',
  C2: 'C2 (Proficiency)',
};

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
  A1: '#10B981', // green
  A2: '#3B82F6', // blue
  B1: '#8B5CF6', // purple
  B2: '#F59E0B', // amber
  C1: '#EF4444', // red
  C2: '#EC4899', // pink
};
