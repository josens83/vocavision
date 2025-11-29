// VocaVision Components Index

// Home Components
export { default as Hero } from "./home/Hero";
export { default as HomePage } from "./home/HomePage";
export {
  CategoryCard,
  CategoryGrid,
  StudyTypeCard,
  vocaVisionCategories,
  type Level,
  type CategoryCardProps,
  type StudyType,
  type StudyTypeCardProps,
} from "./home/CategoryCard";

// Quiz Components
export {
  QuizChoice,
  QuizQuestion,
  QuizContainer,
  QuizFeedback,
  QuizDemo,
  useQuiz,
  type QuizStatus,
  type QuizChoiceProps,
  type QuizQuestionProps,
  type QuizContainerProps,
} from "./quiz/QuizChoice";

// Navigation Components
export {
  default as Navigation,
  ScrollProgress,
  navigationItems,
  type NavItem,
  type NavSubItem,
} from "./navigation/Navigation";

// Pricing Components
export {
  BillingToggle,
  PricingCard,
  PricingCards,
  TestimonialCard,
  TestimonialsGrid,
  AvatarInitials,
  FAQSection,
  PricingPage,
  vocaVisionPlans,
  vocaVisionTestimonials,
  vocaVisionFAQ,
  type BillingPeriod,
  type PlanType,
  type TestimonialProps,
  type FAQItemData,
} from "./pricing";
