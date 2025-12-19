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

// Admin API Hooks
export {
  useDashboardStats,
  useWordList,
  useWordDetail,
  useWordMutations,
  useContentGeneration,
  useReview,
  apiClient,
} from './useAdminApi';

// Level Test Hook
export {
  useLevelTest,
  type QuizQuestion as LevelTestQuestion,
  type LevelTestResult,
} from './useLevelTest';

// User Stats Hook
export { useUserStats } from './useUserStats';

// Search Hook
export { useSearch, useDebounce } from './useSearch';

// Animation & Accessibility Hooks
export { useReducedMotion, useSimpleAnimations } from './useReducedMotion';
export { useScrollReveal, useScrollProgress } from './useScrollReveal';

// Lazy Loading Hook
export { useLazyLoad } from './useLazyLoad';
