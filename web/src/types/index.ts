/**
 * VocaVision Type Definitions
 * test-english.com 벤치마킹 기반 타입 정의
 */

// ============================================
// 카테고리 및 레벨 타입
// ============================================

export type Category =
  | 'grammar'
  | 'vocabulary'
  | 'listening'
  | 'reading'
  | 'useOfEnglish'
  | 'writing'
  | 'exams';

export type Level = 'A1' | 'A2' | 'B1' | 'B1+' | 'B2' | 'C1';

export type TabType = 'exercises' | 'explanation' | 'downloads';

// ============================================
// 퀴즈 관련 타입
// ============================================

export type QuizType = 'multiple-choice' | 'fill-in-blank' | 'dropdown' | 'matching';

export interface QuizQuestion {
  id: number;
  type: QuizType;
  questionText?: string;     // 문제 텍스트 (question 대신 사용 가능)
  question?: string;         // 레거시 호환
  prefix?: string;           // 드롭다운용: "A", "An", ""
  suffix?: string;           // 드롭다운용: "is a bag..."
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  columns?: 1 | 2;           // 객관식 2열 옵션
}

export interface QuizResult {
  questionId: number;
  userAnswer: string | string[];
  isCorrect: boolean;
  timeSpent?: number;
}

export interface QuizSession {
  id: string;
  lessonId: string;
  questions: QuizQuestion[];
  results: QuizResult[];
  startedAt: Date;
  completedAt?: Date;
  score?: number;
}

// ============================================
// 어휘 관련 타입
// ============================================

export interface VocabItem {
  id: number;
  word: string;
  article?: string;        // "a", "an", "" for articles
  image?: string;
  definition?: string;
  exampleSentence?: string;
  pronunciation?: string;
  category?: Category;
  level?: Level;
}

export interface VocabWord {
  id: number;
  word: string;
  image: string;
}

export interface VocabQuestionData {
  id: number;
  prefix?: string;
  suffix: string;
  options: string[];
  correctAnswer: string;
}

export interface ExampleSentenceData {
  id: number;
  number: number;
  text: string;             // "I live in a big {house} with my family."
  keyword: string;          // "house"
}

// 퀴즈 페이지 (여러 문항 그룹)
export interface QuizPage {
  pageNumber: number;
  title: string;
  instruction: string;
  questions: QuizQuestion[];
}

export interface RelatedTestData {
  image: string;
  title: string;
  href: string;
}

// ============================================
// 레슨 관련 타입
// ============================================

export interface Lesson {
  id: string;
  slug: string;
  title: string;
  category: Category;
  level: Level;
  description: string;
  thumbnail: string;

  // Exercises 탭
  exercises?: QuizQuestion[];        // 레거시 호환
  quizPages?: QuizPage[];            // 페이지별 퀴즈 그룹

  // Explanation 탭
  explanationTitle?: string;
  explanationText?: string;
  vocabItems?: VocabItem[];
  exampleSentences?: ExampleSentenceData[];
  videoId?: string;                  // YouTube video ID
  videoUrl?: string;                 // 레거시 호환
  flashcardLink?: string;

  // 메타
  relatedLessons?: string[];
  estimatedTime?: number;
  difficulty?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LessonProgress {
  lessonId: string;
  userId: string;
  completedExercises: number;
  totalExercises: number;
  score: number;
  lastAccessedAt: Date;
  completedAt?: Date;
}

// ============================================
// 사용자 관련 타입
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  currentLevel: Level;
  xp: number;
  streak: number;
  joinedAt: Date;
}

export interface UserStats {
  totalLessonsCompleted: number;
  totalQuizzesCompleted: number;
  averageScore: number;
  totalTimeSpent: number;
  strongCategories: Category[];
  weakCategories: Category[];
}

// ============================================
// UI 컴포넌트 타입
// ============================================

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export interface PaginationProps {
  current: number;
  total: number;
  onChange: (page: number) => void;
  label?: string;
}

export interface BadgeVariant {
  filled: 'filled';
  outline: 'outline';
}

export interface NumberBadgeProps {
  number: number;
  variant?: 'filled' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

// ============================================
// API 응답 타입
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
