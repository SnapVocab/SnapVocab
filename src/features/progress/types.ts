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
  /** Streak Freeze units held (streak_freeze.md §6); absent from servers older than 2026-10-21. */
  freezeCount?: number;
  /** Last day a Streak Freeze kept the chain. */
  lastFrozenDate?: string | null;
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

/** GET /api/progress/forecast: the next 7 study days if nothing is reviewed. */
export type ForecastDayDTO = {
  date: string;
  /** Cards falling due that day; day 0 also holds overdue ones. */
  dueCount: number;
  /** Average recall chance (0..1) at the end of the day; null without started cards. */
  retention: number | null;
};
export type BestTimeSlotDTO = { startHour: number; reviews: number; recallRate: number | null };
export type BestTimeDTO = {
  enoughData: boolean;
  pairs: number;
  minPairs: number;
  bestStartHour: number | null;
  slots: BestTimeSlotDTO[];
};
export type ForecastDTO = {
  days: ForecastDayDTO[];
  retentionNow: number | null;
  cardsTracked: number;
  bestTime: BestTimeDTO;
};
