// ============================================
// VocaVision Admin - Component Index
// components/admin/index.ts
// ============================================

// UI Components
export {
  Button,
  Badge,
  Input,
  Select,
  Textarea,
  Checkbox,
  Card,
  Modal,
  ProgressBar,
  EmptyState,
  Spinner,
  Alert,
} from './ui';

// Dashboard Components
export { DashboardStatsView } from './DashboardStats';

// Word Management Components
export { WordList } from './WordList';

// Vocabulary Sets (단어장) Management
export { VocabularySets } from './VocabularySets';

// Form & Modal Components
export {
  WordFormModal,
  BatchUploadModal,
  AIGenerationModal,
  ReviewModal,
  WordDetailView,
} from './WordForms';

// Word Image Upload Section (3-이미지 시각화)
export { default as WordImageSection } from './WordImageSection';  // Legacy
export { default as WordVisualsEditor } from './WordVisualsEditor'; // New

// Main Dashboard
export { AdminDashboard } from './AdminDashboard';

// Types (re-export for convenience)
export type {
  VocaWord,
  VocaContentFull,
  VocaDefinition,
  VocaCollocation,
  VocaExample,
  WordListResponse,
  DashboardStats,
  CreateWordForm,
  BatchCreateForm,
  ReviewForm,
  WordFilters,
  ExamCategory,
  ContentStatus,
  DifficultyLevel,
} from './types/admin.types';

export {
  EXAM_CATEGORY_LABELS,
  LEVEL_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  LEVEL_COLORS,
  VISUAL_TYPE_CONFIG,
} from './types/admin.types';

export type {
  VisualType,
  WordVisual,
  WordVisualInput,
  VisualTemplate,
} from './types/admin.types';
