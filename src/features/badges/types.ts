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
  /** Presigned MinIO URL of the badge art; null when the badge has none. */
  imageUrl: string | null;
  sortOrder: number;
  earned: boolean;
  earnedAt: string | null;
  seen: boolean | null;
  /**
   * PD-BDG-14: the catalog reward while not earned, what was paid once earned. Null when there is none, including
   * badges earned before rewards existed; absent from servers older than PD-BDG-14.
   */
  reward?: BadgeReward | null;
};

export type BadgeReward = {
  coin: number;
  xp: number;
  item: BadgeRewardItem | null;
};

/** A reward-only frame. `granted`: null until earned, false when the learner already held it. */
export type BadgeRewardItem = {
  code: string;
  name: string;
  type: 'AVATAR_FRAME' | 'CARD_FRAME' | (string & {});
  previewUrl: string | null;
  granted: boolean | null;
};

/** `GET /api/me/badges` and `POST /api/me/badges/sync`. */
export type BadgesView = {
  earnedCount: number;
  totalCount: number;
  unseenCount: number;
  badges: BadgeItem[];
  /** Coin and XP of the earned badges ("Thưởng đã tích lũy"). Optional fields: absent before PD-BDG-14. */
  rewardTotals?: { coin: number; xp: number };
  /** Balances after the call; a sync that paid rewards moves them. */
  coin?: number;
  exp?: number;
};

export type SeenResult = { unseenCount: number };

export type BadgeSeries = {
  metric: BadgeMetric;
  currentValue: number;
  items: BadgeItem[];
};
