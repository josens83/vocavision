/**
 * User Statistics Types
 */

export interface UserStats {
  // 전체 통계
  overall: {
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
  };

  // 레벨별 통계
  byLevel: {
    L1: LevelStats;
    L2: LevelStats;
    L3: LevelStats;
  };

  // 모드별 통계
  byMode: {
    flashcard: ModeStats;
    engToKor: ModeStats;
    korToEng: ModeStats;
  };

  // 주간 활동
  weeklyActivity: DailyActivity[];

  // 스트릭
  streak: {
    current: number;
    longest: number;
  };

  // 학습한 단어
  wordsLearned: {
    total: number;
    mastered: number; // 3회 이상 정답
    learning: number; // 1-2회 정답
    new: number; // 아직 안 본 단어
  };
}

export interface LevelStats {
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  wordsCount: number;
}

export interface ModeStats {
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
}

export interface DailyActivity {
  date: string;
  dayOfWeek: string;
  wordsStudied: number;
  questionsAnswered: number;
  accuracy: number;
}
