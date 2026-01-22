/**
 * VocaVision Admin Dashboard Types
 * 관리자 대시보드 타입 정의
 */

// ============================================
// Enums & Constants
// ============================================

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type ExamCategory =
  | 'CSAT'    // 수능 (대학수학능력시험)
  | 'TEPS'
  | 'TOEIC'
  | 'TOEFL'
  | 'SAT';

export type ContentStatus =
  | 'DRAFT'           // 초안 - AI 생성 직후
  | 'PENDING_REVIEW'  // 검토 대기
  | 'APPROVED'        // 승인됨 - 발행 가능
  | 'PUBLISHED'       // 발행됨
  | 'ARCHIVED';       // 보관됨

export type ReviewAction = 'approve' | 'reject' | 'request_changes';

// ============================================
// Constants
// ============================================

export const CEFR_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const EXAM_CATEGORIES: { value: ExamCategory; label: string }[] = [
  { value: 'CSAT', label: '수능' },
  { value: 'TEPS', label: 'TEPS' },
  { value: 'TOEIC', label: 'TOEIC' },
  { value: 'TOEFL', label: 'TOEFL' },
  { value: 'SAT', label: 'SAT' },
];

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  DRAFT: '초안',
  PENDING_REVIEW: '검토 대기',
  APPROVED: '승인됨',
  PUBLISHED: '발행됨',
  ARCHIVED: '보관됨',
};

export const LEVEL_COLORS: Record<CEFRLevel, string> = {
  A1: 'bg-green-100 text-green-700 border-green-200',
  A2: 'bg-blue-100 text-blue-700 border-blue-200',
  B1: 'bg-purple-100 text-purple-700 border-purple-200',
  B2: 'bg-amber-100 text-amber-700 border-amber-200',
  C1: 'bg-red-100 text-red-700 border-red-200',
  C2: 'bg-teal-100 text-teal-700 border-teal-200',
};

export const STATUS_COLORS: Record<ContentStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING_REVIEW: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  PUBLISHED: 'bg-green-100 text-green-700',
  ARCHIVED: 'bg-red-100 text-red-700',
};

// ============================================
// Dashboard Stats Types
// ============================================

export interface DashboardStats {
  totalWords: number;
  publishedWords: number;
  pendingReview: number;
  draftWords: number;
  byExamCategory: Record<ExamCategory, number>;
  byLevel: Record<CEFRLevel, number>;
  contentCompleteness: {
    hasEtymology: number;
    hasMnemonic: number;
    hasExamples: number;
    hasCollocations: number;
    hasAudio: number;
  };
  recentActivity: {
    date: string;
    created: number;
    reviewed: number;
    published: number;
  }[];
}

// ============================================
// Word Types
// ============================================

export interface AdminWord {
  id: string;
  word: string;
  definition: string;
  definitionKo?: string;
  pronunciation?: string;
  ipaUs?: string;
  ipaUk?: string;
  partOfSpeech: string;
  examCategories: ExamCategory[];
  level: CEFRLevel;
  contentStatus: ContentStatus;
  topics: string[];

  // Content completeness flags
  hasEtymology: boolean;
  hasMnemonic: boolean;
  hasExamples: boolean;
  hasCollocations: boolean;
  hasAudio: boolean;

  // AI metadata
  aiGeneratedAt?: string;
  humanReviewed: boolean;
  humanReviewedAt?: string;
  reviewedBy?: string;

  createdAt: string;
  updatedAt: string;
}

export interface WordDetail extends AdminWord {
  etymology?: {
    id: string;
    origin: string;
    language?: string;
    evolution?: string;
    breakdown?: string;
  };
  mnemonics: {
    id: string;
    title: string;
    content: string;
    koreanHint?: string;
    whiskPrompt?: string;
    gifUrl?: string;
    votes: number;
  }[];
  examples: {
    id: string;
    sentence: string;
    translation?: string;
    isFunny: boolean;
    source?: string;
    order: number;
  }[];
  collocations: {
    id: string;
    phrase: string;
    translation?: string;
    type?: string;
    exampleEn?: string;
    exampleKo?: string;
    order: number;
  }[];
  synonyms: string[];
  antonyms: string[];
  rhymingWords: string[];
}

// ============================================
// Word Form Types
// ============================================

export interface WordFormData {
  word: string;
  definition?: string;
  definitionKo?: string;
  pronunciation?: string;
  partOfSpeech?: string;
  examCategories: ExamCategory[];
  level: CEFRLevel;
  topics: string[];
  generateContent?: boolean;
}

export interface BatchUploadData {
  words: string;  // newline-separated words
  examCategory: ExamCategory;
  level: CEFRLevel;
  generateContent: boolean;
}

// ============================================
// Filter Types
// ============================================

export interface WordFilters {
  search?: string;
  examCategories?: ExamCategory[];
  levels?: CEFRLevel[];
  status?: ContentStatus[];
  hasContent?: {
    etymology?: boolean;
    mnemonic?: boolean;
    examples?: boolean;
    collocations?: boolean;
    audio?: boolean;
  };
}

export interface PaginationParams {
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
// Content Generation Types
// ============================================

export interface GenerationProgress {
  wordId: string;
  word: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

export interface BatchGenerationJob {
  id: string;
  words: string[];
  examCategory: ExamCategory;
  level: CEFRLevel;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  results: GenerationProgress[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

// ============================================
// Review Types
// ============================================

export interface ReviewRequest {
  action: ReviewAction;
  notes?: string;
  fieldChanges?: Partial<WordFormData>;
}

export interface AuditLog {
  id: string;
  wordId: string;
  action: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  userId?: string;
  reason?: string;
  createdAt: string;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface WordListResponse {
  words: AdminWord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Navigation Types
// ============================================

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}
