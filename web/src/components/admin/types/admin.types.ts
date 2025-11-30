/**
 * VocaVision Admin Dashboard Types
 * 관리자 대시보드 타입 정의
 */

// ============================================
// Enums
// ============================================

export type ExamCategory = 'SUNEUNG' | 'TEPS' | 'TOEFL' | 'TOEIC' | 'IELTS' | 'SAT' | 'GRE';

export type DifficultyLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type ContentStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';

export type PartOfSpeech = 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'conjunction' | 'interjection';

// ============================================
// Constants / Labels
// ============================================

export const EXAM_CATEGORY_LABELS: Record<ExamCategory, string> = {
  SUNEUNG: '수능',
  TEPS: 'TEPS',
  TOEFL: 'TOEFL',
  TOEIC: 'TOEIC',
  IELTS: 'IELTS',
  SAT: 'SAT',
  GRE: 'GRE',
};

export const LEVEL_LABELS: Record<DifficultyLevel, string> = {
  A1: '입문 (A1)',
  A2: '초급 (A2)',
  B1: '중급 (B1)',
  B2: '중상급 (B2)',
  C1: '고급 (C1)',
  C2: '최고급 (C2)',
};

export const STATUS_LABELS: Record<ContentStatus, string> = {
  DRAFT: '초안',
  PENDING_REVIEW: '검토 대기',
  APPROVED: '승인됨',
  PUBLISHED: '발행됨',
  ARCHIVED: '보관됨',
};

export const LEVEL_COLORS: Record<DifficultyLevel, string> = {
  A1: '#10B981', // green
  A2: '#3B82F6', // blue
  B1: '#8B5CF6', // purple
  B2: '#F59E0B', // amber
  C1: '#EF4444', // red
  C2: '#EC4899', // pink
};

export const STATUS_COLORS: Record<ContentStatus, { bg: string; text: string }> = {
  DRAFT: { bg: 'bg-slate-100', text: 'text-slate-700' },
  PENDING_REVIEW: { bg: 'bg-amber-100', text: 'text-amber-700' },
  APPROVED: { bg: 'bg-blue-100', text: 'text-blue-700' },
  PUBLISHED: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  ARCHIVED: { bg: 'bg-red-100', text: 'text-red-700' },
};

// ============================================
// VocaWord Types (Core)
// ============================================

export interface VocaWord {
  id: string;
  word: string;
  level: DifficultyLevel;
  examCategories: ExamCategory[];
  partOfSpeech: PartOfSpeech[];
  status: ContentStatus;
  topics: string[];
  createdAt: string;
  updatedAt: string;

  // Optional content reference
  content?: VocaContentSummary;
}

export interface VocaContentSummary {
  id: string;
  primaryGifUrl?: string;
  humanReviewed: boolean;
  aiGeneratedAt?: string;
}

// ============================================
// VocaContent Full Types
// ============================================

export interface VocaContentFull {
  id: string;
  wordId: string;

  // Pronunciation
  ipaUs?: string;
  ipaUk?: string;
  pronunciation?: string; // Korean pronunciation
  audioUrlUs?: string;
  audioUrlUk?: string;

  // Definitions
  definitions: VocaDefinition[];

  // Etymology
  etymology?: string; // Simple string form
  etymologyLang?: string;
  etymologyFull?: VocaEtymology; // Full object form

  // Morphology (flat fields for easy access)
  prefix?: string;
  root?: string;
  suffix?: string;
  morphologyNote?: string;
  morphology?: VocaMorphology; // Full object form

  // Mnemonic (연상법) - supports both string and object forms
  mnemonic?: string; // Simple string description
  mnemonicKorean?: string;
  mnemonicImage?: string;
  mnemonicFull?: VocaMnemonic; // Full object form

  // Collocations
  collocations: VocaCollocation[];

  // Related Words
  synonyms: string[];
  antonyms: string[];
  rhymingWords: string[];
  rhymingNote?: string;

  // Examples
  examples: VocaExample[];
  funnyExamples?: VocaFunnyExample[];

  // Media
  primaryGifUrl?: string;
  additionalMedia: string[];

  // AI Metadata
  aiModel?: string;
  aiGeneratedAt?: string;
  humanReviewed: boolean;
  humanReviewedAt?: string;
  reviewedBy?: string;
}

export interface VocaFunnyExample {
  id?: string;
  sentenceEn: string;
  sentenceKo: string;
  isFunny: boolean;
}

export interface VocaDefinition {
  id?: string;
  partOfSpeech: PartOfSpeech;
  definitionEn: string;
  definitionKo: string;
  exampleEn?: string;
  exampleKo?: string;
}

export interface VocaEtymology {
  origin: string;
  language: string;
  evolution?: string;
  breakdown?: string;
}

export interface VocaMorphology {
  prefix?: { part: string; meaning: string };
  root?: { part: string; meaning: string };
  suffix?: { part: string; meaning: string };
  note?: string;
}

export interface VocaMnemonic {
  description: string;
  koreanAssociation: string;
  imagePrompt: string;
  gifUrl?: string;
}

export interface VocaCollocation {
  id?: string;
  phrase: string;
  translation: string;
  type?: string;
  exampleEn?: string;
  exampleKo?: string;
}

export interface VocaExample {
  sentenceEn: string;
  sentenceKo: string;
  isFunny: boolean;
  source?: string;
  highlightWord?: string;
}

// ============================================
// Dashboard Stats Types
// ============================================

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

// ============================================
// Word Filters & Pagination
// ============================================

export interface WordFilters {
  search: string;
  examCategories: ExamCategory[];
  levels: DifficultyLevel[];
  status: ContentStatus[];
  hasContent: boolean | null;
  sortBy: 'word' | 'createdAt' | 'updatedAt' | 'level';
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Word Form Types
// ============================================

export interface WordFormData {
  word: string;
  level: DifficultyLevel;
  examCategories: ExamCategory[];
  partOfSpeech: PartOfSpeech[];
  topics: string[];
  generateContent?: boolean;
}

// Alias for consistency with new components
export interface CreateWordForm {
  word: string;
  examCategories: ExamCategory[];
  level: DifficultyLevel;
  topics: string[];
  generateContent: boolean;
}

export interface BatchUploadData {
  words: string; // newline-separated
  examCategory: ExamCategory;
  level: DifficultyLevel;
  generateContent: boolean;
}

// Alias for consistency with new components
export interface BatchCreateForm {
  words: string;
  examCategory: ExamCategory;
  level: DifficultyLevel;
  generateContent: boolean;
}

export interface ReviewForm {
  action: ReviewAction;
  notes: string;
}

// ============================================
// Content Generation Types
// ============================================

export interface GenerationProgress {
  wordId: string;
  word: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

// ============================================
// Review Types
// ============================================

export type ReviewAction = 'approve' | 'reject' | 'request_changes';

export interface ReviewRequest {
  action: ReviewAction;
  notes?: string;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface WordListResponse {
  words: VocaWord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
