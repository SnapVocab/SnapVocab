/** GET /api/leaderboards?week=CURRENT|PREVIOUS&limit=1..50 (leaderboard_backend.md §6.2, Phụ lục B). */
export type LeaderboardWeek = 'CURRENT' | 'PREVIOUS';

export type Leaderboard = {
  /** 'yyyy-MM-dd', Monday. */
  weekStart: string;
  /** 'yyyy-MM-dd', Sunday, inclusive. */
  weekEnd: string;
  timezone: string;
  /** 00:00 next Monday (Vietnam), exclusive. */
  endsAt: string;
  isFinal: boolean;
  /** When the snapshot was computed; every number in the response comes from it. */
  asOf: string;
  participants: number;
  entries: LeaderboardRow[];
  me: LeaderboardMe;
};

export type LeaderboardRow = {
  rank: number;
  displayName: string;
  avatarUrl: string | null;
  avatarFrameUrl: string | null;
  score: number;
  /** Rank at 00:00 today − rank now (> 0 = up); null on Monday, for PREVIOUS and for newcomers today. */
  rankChange: number | null;
  isMe: boolean;
};

export type LeaderboardMe = {
  /** False only for ROLE_ADMIN accounts (leaderboard_ui.md §2.5). */
  eligible: boolean;
  rank: number | null;
  score: number;
  rankChange: number | null;
  xpToNextRank: number | null;
  nextRank: number | null;
};
