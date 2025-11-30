// Hooks Index

export {
  useQuiz,
  calculatePercentage,
  isQuestionCorrect,
  getAnsweredCount,
  areAllAnswered,
  type QuizQuestion,
  type QuizState,
  type QuizActions,
} from './useQuiz';

export {
  useTabs,
  createTabConfig,
  vocabularyTabs,
  grammarTabs,
  type TabId,
  type UseTabsReturn,
  type TabConfig,
} from './useTabs';

export { useAuth } from './useAuth';
export { useOnlineStatus } from './useOnlineStatus';
export { useFeatureDetection } from './useFeatureDetection';
