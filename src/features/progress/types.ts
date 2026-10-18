export type HistoryPeriod = 'DAY' | 'WEEK' | 'MONTH';

export type ProgressSummaryDTO = {
  totalWords: number;
  learnedCount: number;
  reviewingCount: number;
  masteredCount: number;
  dueCount: number;
  accuracy: number | null;
  reviewCount: number;
  completedQuizCount: number;
};

export type StreakDTO = {
  currentStreak: number;
  longestStreak: number;
  lastStudiedDate: string | null;
};

export type HistoryBucket = {
  periodStart: string;
  eventCount: number;
  activeDays: number;
};

export type ProgressHistoryDTO = {
  period: HistoryPeriod;
  from: string;
  to: string;
  buckets: HistoryBucket[];
};

export type HomeWidgetDTO = {
  totalWords: number;
  learnedCount: number;
  masteredCount: number;
  dueCount: number;
  currentStreak: number;
};

export type LevelInfo = {
  levelNumber: number;
  /** `levels.title` is nullable in the DB. */
  title: string | null;
  minXp: number;
  nextLevelXp: number | null;
  progress: number;
};

/** Mirrors backend `xp.domain.XpSourceType`. */
export type XpSourceType =
  | 'FLASHCARD_REVIEW'
  | 'QUIZ'
  | 'SAVE_WORD'
  | 'MISSION_REWARD'
  | 'ADMIN_ADJUSTMENT';

export type XpEvent = {
  sourceType: XpSourceType;
  amount: number;
  createdAt: string;
};

export type XpOverviewDTO = {
  totalXp: number;
  level: LevelInfo | null;
  recentEvents: XpEvent[];
};
