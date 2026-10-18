export type MissionCategory = 'SCAN' | 'VOCABULARY' | 'FLASHCARD' | 'SRS' | 'QUIZ' | 'RETENTION' | 'SHOP';
export type MissionTriggerEvent = 'QUIZ_COMPLETED' | 'LEARNING_ACTIVITY_RECORDED' | 'TOPIC_ITEM_CREATED' | 'SHOP_ITEM_PURCHASED' | 'BOOSTER_USED';

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
  reward: { coin: number; xp: number; itemCode: string | null; itemFallbackCoin: number | null };
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
  rewardGranted: { coin: number; xp: number; itemCode: string | null; itemQuantity: number; fallbackCoin: number };
};
