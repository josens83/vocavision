/**
 * VocaVision Utility Functions
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { categoryColors, levelColors, type Category, type Level } from './colors';

// ============================================
// 클래스명 병합 유틸리티
// ============================================

/**
 * Tailwind CSS 클래스를 병합하는 유틸리티 함수
 * clsx로 조건부 클래스를 처리하고, tailwind-merge로 충돌을 해결
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// 카테고리 관련 유틸리티
// ============================================

/**
 * 카테고리 컬러 세트 가져오기
 */
export function getCategoryColor(category: Category) {
  return categoryColors[category];
}

/**
 * 레벨 정보 가져오기
 */
export function getLevelInfo(level: Level) {
  return levelColors[level];
}

/**
 * 레벨 라벨만 가져오기
 */
export function getLevelLabel(level: Level): string {
  return levelColors[level].label;
}

// ============================================
// 문자열 유틸리티
// ============================================

/**
 * 텍스트를 URL-safe 슬러그로 변환
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * 첫 글자를 대문자로 변환
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * 텍스트 자르기 (말줄임표 추가)
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

// ============================================
// 퀴즈 관련 유틸리티
// ============================================

export interface QuizQuestionBase {
  id: number;
  correctAnswer: string;
}

/**
 * 퀴즈 점수 계산
 */
export function calculateScore<T extends QuizQuestionBase>(
  answers: Record<number, string>,
  questions: T[]
): { score: number; total: number; percentage: number } {
  let correct = 0;
  questions.forEach((q) => {
    if (answers[q.id] === q.correctAnswer) {
      correct++;
    }
  });
  return {
    score: correct,
    total: questions.length,
    percentage: questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0,
  };
}

/**
 * 모든 문항이 답변되었는지 확인
 */
export function areAllAnswered<T extends { id: number }>(
  answers: Record<number, string>,
  questions: T[]
): boolean {
  return questions.every(
    (q) => answers[q.id] !== undefined && answers[q.id] !== ''
  );
}

// ============================================
// 날짜 유틸리티
// ============================================

/**
 * 상대적 시간 표시 (예: "2시간 전")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;

  return target.toLocaleDateString('ko-KR');
}

// ============================================
// 배열 유틸리티
// ============================================

/**
 * 배열 셔플 (Fisher-Yates)
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 배열을 청크로 분할
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}
