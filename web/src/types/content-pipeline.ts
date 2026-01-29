/**
 * VocaVision Content Pipeline Types
 * AI 콘텐츠 생성 파이프라인 관련 타입 정의
 */

// ============================================
// Enum Types
// ============================================

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type ExamCategory =
  | 'CSAT'       // 수능
  | 'CSAT_2026'  // 2026 수능기출
  | 'TOEIC'
  | 'TOEFL'
  | 'IELTS'
  | 'GRE'
  | 'SAT'
  | 'GENERAL';

export type ContentStatus =
  | 'DRAFT'           // 초안 - AI 생성 직후
  | 'PENDING_REVIEW'  // 검토 대기
  | 'APPROVED'        // 승인됨 - 발행 가능
  | 'PUBLISHED'       // 발행됨
  | 'ARCHIVED';       // 보관됨

export type WhiskStyle = 'animation' | 'illustration' | 'realistic' | 'cartoon';

// ============================================
// Content Generation Types
// ============================================

export interface GenerationOptions {
  word: string;
  examCategory: ExamCategory;
  cefrLevel: CEFRLevel;
}

export interface GeneratedPronunciation {
  ipaUs: string;
  ipaUk: string;
  korean: string;
}

export interface GeneratedDefinition {
  partOfSpeech: string;
  definitionEn: string;
  definitionKo: string;
  exampleEn?: string;
  exampleKo?: string;
}

export interface GeneratedEtymology {
  description: string;
  language: string;
  breakdown?: string;
}

export interface GeneratedMorphology {
  prefix?: { part: string; meaning: string };
  root?: { part: string; meaning: string };
  suffix?: { part: string; meaning: string };
  note?: string;
}

export interface GeneratedCollocation {
  phrase: string;
  translation: string;
  type?: string;
  exampleEn?: string;
  exampleKo?: string;
}

export interface GeneratedRhyming {
  words: string[];
  note?: string;
}

export interface GeneratedMnemonic {
  description: string;
  koreanAssociation: string;
  imagePrompt: string;
}

export interface GeneratedExample {
  sentenceEn: string;
  sentenceKo: string;
  isFunny: boolean;
  source?: string;
}

export interface GeneratedRelatedWords {
  synonyms: string[];
  antonyms: string[];
  related: string[];
}

export interface GeneratedContent {
  pronunciation: GeneratedPronunciation;
  definitions: GeneratedDefinition[];
  etymology: GeneratedEtymology;
  morphology: GeneratedMorphology;
  collocations: GeneratedCollocation[];
  rhyming: GeneratedRhyming;
  mnemonic: GeneratedMnemonic;
  examples: GeneratedExample[];
  relatedWords: GeneratedRelatedWords;
}

// ============================================
// Word Content Types (Extended)
// ============================================

export interface WordContent {
  id: string;
  word: string;

  // Pronunciation
  ipaUs?: string;
  ipaUk?: string;
  pronunciation?: string;
  audioUrlUs?: string;
  audioUrlUk?: string;

  // Morphology
  prefix?: string;
  root?: string;
  suffix?: string;
  morphologyNote?: string;

  // Related words
  synonymList: string[];
  antonymList: string[];
  rhymingWords: string[];
  relatedWords: string[];

  // Content status
  contentStatus: ContentStatus;

  // AI metadata
  aiModel?: string;
  aiGeneratedAt?: Date;
  humanReviewed: boolean;
  humanReviewedAt?: Date;
  reviewedBy?: string;

  // Relations
  etymology?: EtymologyContent;
  mnemonics: MnemonicContent[];
  examples: ExampleContent[];
  collocations: CollocationContent[];
}

export interface EtymologyContent {
  id: string;
  wordId: string;
  origin: string;
  language?: string;
  evolution?: string;
  breakdown?: string;
}

export interface MnemonicContent {
  id: string;
  wordId: string;
  title: string;
  content: string;
  koreanHint?: string;
  whiskPrompt?: string;
  whiskStyle?: WhiskStyle;
  gifUrl?: string;
  source?: string;
  votes: number;
}

export interface ExampleContent {
  id: string;
  wordId: string;
  sentence: string;
  translation?: string;
  isFunny: boolean;
  isReal: boolean;
  source?: string;
  highlightWord?: string;
  grammarNote?: string;
  order: number;
}

export interface CollocationContent {
  id: string;
  wordId: string;
  phrase: string;
  translation?: string;
  type?: string;
  exampleEn?: string;
  exampleKo?: string;
  frequency?: number;
  order: number;
}

// ============================================
// Content Generation Job Types
// ============================================

export type JobStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ContentGenerationJob {
  id: string;
  inputWords: string[];
  examCategory?: ExamCategory;
  cefrLevel?: CEFRLevel;
  status: JobStatus;
  progress: number;
  result?: BatchGenerationResult[];
  errorMessage?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdBy?: string;
}

export interface BatchGenerationResult {
  word: string;
  wordId?: string;
  success: boolean;
  content?: GeneratedContent;
  error?: string;
}

// ============================================
// Content Audit Types
// ============================================

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'APPROVE'
  | 'REJECT'
  | 'PUBLISH';

export interface ContentAuditLog {
  id: string;
  wordId: string;
  action: AuditAction;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  userId?: string;
  reason?: string;
  createdAt: Date;
}

// ============================================
// API Request/Response Types
// ============================================

export interface GenerateContentRequest {
  word: string;
  examCategory?: ExamCategory;
  cefrLevel?: CEFRLevel;
  saveToDb?: boolean;
}

export interface GenerateContentResponse {
  success: boolean;
  word: string;
  content?: GeneratedContent;
  wordId?: string;
  error?: string;
}

export interface BatchGenerateRequest {
  words: string[];
  examCategory?: ExamCategory;
  cefrLevel?: CEFRLevel;
}

export interface BatchGenerateResponse {
  success: boolean;
  jobId: string;
  message: string;
}

export interface JobStatusResponse {
  success: boolean;
  job?: ContentGenerationJob;
  error?: string;
}

export interface ContentReviewRequest {
  wordId: string;
  action: 'approve' | 'reject' | 'edit';
  fields?: Partial<WordContent>;
  reason?: string;
}

export interface ContentReviewResponse {
  success: boolean;
  wordId: string;
  newStatus: ContentStatus;
  error?: string;
}
