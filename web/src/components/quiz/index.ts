/**
 * Quiz Components Export
 */

export { default as QuizModeSelector, type QuizMode } from './QuizModeSelector';
export { default as QuizProgress } from './QuizProgress';
export { default as QuizOptions } from './QuizOptions';
export { default as QuizFeedbackCard } from './QuizFeedbackCard';
export { default as QuizResultCard } from './QuizResultCard';
export {
  default as MultipleChoiceQuiz,
  type MultipleChoiceMode,
  type QuizResultData,
} from './MultipleChoiceQuiz';

// Legacy exports for backwards compatibility
export { QuizChoice, QuizQuestion, QuizContainer, QuizFeedback, useQuiz, QuizDemo } from './QuizChoice';
