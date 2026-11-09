export type MissionCategory = 'SCAN' | 'VOCABULARY' | 'FLASHCARD' | 'SRS' | 'QUIZ' | 'RETENTION' | 'SHOP';
export type MissionTriggerEvent = 'QUIZ_COMPLETED' | 'LEARNING_ACTIVITY_RECORDED' | 'TOPIC_ITEM_CREATED' | 'SHOP_ITEM_PURCHASED' | 'BOOSTER_USED' | 'SRS_REVIEW_COMPLETED' | 'SCAN_WORD_SAVED';

/**
 * Triggers this build has a CTA for, sent as X-Mission-Triggers on every request: the backend hands out only missions
 * this app can show (daily_mission.md PD-DM-13). Keep in sync with `actions` in missions-screen.tsx (tested).
 */
export const RENDERED_TRIGGERS: MissionTriggerEvent[] = ['QUIZ_COMPLETED', 'LEARNING_ACTIVITY_RECORDED', 'TOPIC_ITEM_CREATED', 'SHOP_ITEM_PURCHASED', 'BOOSTER_USED', 'SRS_REVIEW_COMPLETED', 'SCAN_WORD_SAVED'];

export type DailyMission = {
  id: number;
  code: string;
  name: string;
  description: string;
  category: MissionCategory;
  triggerEvent: MissionTriggerEvent;
  slot: number;
  targetValue: number;
  currentProgress: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CLAIMED';
  /** `itemName` is what the learner reads; `itemCode` is only an identifier (daily_mission.md §8.1). */
  reward: { coin: number; xp: number; itemCode: string | null; itemName: string | null; itemFallbackCoin: number | null };
  completedAt: string | null;
  claimedAt: string | null;
};

export type DailyMissions = {
  /** Local receipt time of the last server response; preserved across claim cache edits. */
  receivedAt?: number;
  missionDate: string;
  timezone: string;
  serverNow: string;
  resetAt: string;
  missions: DailyMission[];
};

export type ClaimResult = {
  missionId: number;
  status: 'CLAIMED';
  coinBalance: number;
  totalXp: number;
  replayed: boolean;
  rewardGranted: { coin: number; xp: number; itemCode: string | null; itemName: string | null; itemQuantity: number; fallbackCoin: number };
};
