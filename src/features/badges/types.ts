/** Backend `BadgeMetric`; a string fallback keeps unknown future metrics renderable (achievements_ui.md §3). */
export type BadgeMetric = 'LONGEST_STREAK_DAYS' | 'QUIZ_COMPLETED' | 'PERFECT_QUIZ' | 'DISTINCT_WORDS_ADDED' | (string & {});

/** `BadgesDTO.Item` (badges.md §8.1). `earnedAt` and `seen` are null while the badge is not earned. */
export type BadgeItem = {
  id: number;
  code: string;
  name: string;
  description: string;
  metric: BadgeMetric;
  threshold: number;
  currentValue: number;
  iconKey: string;
  sortOrder: number;
  earned: boolean;
  earnedAt: string | null;
  seen: boolean | null;
};

/** `GET /api/me/badges` and `POST /api/me/badges/sync`. */
export type BadgesView = {
  earnedCount: number;
  totalCount: number;
  unseenCount: number;
  badges: BadgeItem[];
};

export type SeenResult = { unseenCount: number };

/** Artifact material on a shelf (achievements_ui.md §3). */
export type BadgeVisualState = 'earned' | 'locked' | 'next' | 'recording';

export type BadgeSeries = {
  metric: BadgeMetric;
  currentValue: number;
  items: BadgeItem[];
};
