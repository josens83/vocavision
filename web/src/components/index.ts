// VocaVision Components Index

// Home Components
export { default as Hero } from "./home/Hero";
export { default as HomePage } from "./home/HomePage";
export {
  CategoryCard,
  CategoryGrid,
  StudyTypeCard,
  vocaVisionCategories,
  type CategoryCardProps,
  type StudyTypeCardProps,
  type Level,
  type StudyType,
} from "./home/CategoryCard";

// Quiz Components
export {
  QuizChoice,
  QuizQuestion,
  QuizContainer,
  QuizFeedback,
  QuizDemo,
  useQuiz,
  type QuizChoiceProps,
  type QuizQuestionProps,
  type QuizContainerProps,
  type QuizStatus,
} from "./quiz/QuizChoice";

// Navigation Components
export {
  default as Navigation,
  ScrollProgress,
  navigationItems,
  type NavItem,
  type NavSubItem,
} from "./navigation/Navigation";
