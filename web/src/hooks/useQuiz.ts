import { useState, useCallback, useMemo } from 'react';

// ============================================
// Quiz State Management Hook
// ============================================

export interface QuizQuestion {
  id: number;
  correctAnswer: string;
  [key: string]: unknown;
}

export interface QuizState {
  answers: Record<number, string>;
  showResults: boolean;
  score: number;
  totalQuestions: number;
  currentPage: number;
}

export interface QuizActions {
  setAnswer: (questionId: number, answer: string) => void;
  checkAnswers: () => void;
  resetQuiz: () => void;
  goToPage: (page: number) => void;
}

interface UseQuizOptions {
  questionsPerPage?: number;
  initialPage?: number;
}

export function useQuiz(
  questions: QuizQuestion[],
  options: UseQuizOptions = {}
): [QuizState, QuizActions] {
  const { questionsPerPage = 10, initialPage = 1 } = options;

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Calculate score based on correct answers
  const score = useMemo(() => {
    if (!showResults) return 0;
    return questions.reduce((acc, question) => {
      if (answers[question.id] === question.correctAnswer) {
        return acc + 1;
      }
      return acc;
    }, 0);
  }, [answers, questions, showResults]);

  // Set answer for a question
  const setAnswer = useCallback((questionId: number, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  }, []);

  // Check all answers and show results
  const checkAnswers = useCallback(() => {
    setShowResults(true);
  }, []);

  // Reset quiz to initial state
  const resetQuiz = useCallback(() => {
    setAnswers({});
    setShowResults(false);
  }, []);

  // Navigate to a specific page
  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    setAnswers({});
    setShowResults(false);
  }, []);

  const state: QuizState = {
    answers,
    showResults,
    score,
    totalQuestions: questions.length,
    currentPage,
  };

  const actions: QuizActions = {
    setAnswer,
    checkAnswers,
    resetQuiz,
    goToPage,
  };

  return [state, actions];
}

// ============================================
// Utility Functions
// ============================================

export function calculatePercentage(score: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((score / total) * 100);
}

export function isQuestionCorrect(
  answers: Record<number, string>,
  questionId: number,
  correctAnswer: string
): boolean {
  return answers[questionId] === correctAnswer;
}

export function getAnsweredCount(answers: Record<number, string>): number {
  return Object.values(answers).filter((answer) => answer !== '').length;
}

export function areAllAnswered(
  answers: Record<number, string>,
  questions: QuizQuestion[]
): boolean {
  return questions.every(
    (q) => answers[q.id] !== undefined && answers[q.id] !== ''
  );
}

export default useQuiz;
