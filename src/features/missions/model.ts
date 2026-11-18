import type { DailyMission, DailyMissions, MissionCategory } from './types';
import type { MissionType } from '@/components/snapvocab';
import type { TxKeyPath } from '@/lib/i18n';
import { translate } from '@/lib/i18n';

export type SegmentKind = 'claimed' | 'ready' | 'progress' | 'empty' | 'expired';

export type StatusSegment = {
  id: number;
  name: string;
  kind: SegmentKind;
  fillPercent: number;
};

export type MissionSummary = {
  totalCount: number;
  completedCount: number;
  claimedCount: number;
  readyCount: number;
  expiredUnclaimed: number;
  inProgressStarted: number;
  notStarted: number;
  totalCoin: number;
  totalXp: number;
  earnedCoin: number;
  earnedXp: number;
  allClaimed: boolean;
  urgent: boolean;
};

export type GrantedNotice = {
  missionId: number;
  coin: number;
  xp: number;
  item: string | null;
  fallback: boolean;
};

export type CategoryVisual = {
  icon3d: MissionType;
  accent: string;
  labelKey: TxKeyPath;
};

const CATEGORY_VISUALS: Partial<Record<MissionCategory, CategoryVisual>> = {
  SCAN: { icon3d: 'scan', accent: '#16A34A', labelKey: 'missions.category.SCAN' },
  VOCABULARY: { icon3d: 'vocab', accent: '#0B8FCE', labelKey: 'missions.category.VOCABULARY' },
  FLASHCARD: { icon3d: 'review', accent: '#0B8FCE', labelKey: 'missions.category.FLASHCARD' },
  SRS: { icon3d: 'review', accent: '#0B8FCE', labelKey: 'missions.category.SRS' },
  QUIZ: { icon3d: 'accuracy', accent: '#8253EC', labelKey: 'missions.category.QUIZ' },
  RETENTION: { icon3d: 'streak', accent: '#E57C00', labelKey: 'missions.category.RETENTION' },
  SHOP: { icon3d: 'challenge', accent: '#B37F00', labelKey: 'missions.category.SHOP' },
};

const FALLBACK_VISUAL: CategoryVisual = {
  icon3d: 'accuracy',
  accent: '#565879',
  labelKey: 'missions.category.QUIZ',
};

export function categoryVisual(category: MissionCategory): CategoryVisual {
  return CATEGORY_VISUALS[category] ?? FALLBACK_VISUAL;
}

/** Anchor the deadline strictly to the server clock from this response, never the device calendar. */
export function msUntilReset(data: DailyMissions, dataUpdatedAt: number): number {
  const receivedAt = data.receivedAt ?? dataUpdatedAt;
  return Date.parse(data.resetAt) - Date.parse(data.serverNow) - Math.max(0, Date.now() - receivedAt);
}

export function formatResetCountdown(minutesLeft: number): string {
  const safe = Math.max(0, minutesLeft);
  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;
  if (hours === 0)
    return translate('missions.resets_in_minutes', { minutes });
  return translate('missions.resets_in', { hours, minutes });
}

export function formatShortDuration(minutesLeft: number): string {
  const safe = Math.max(0, minutesLeft);
  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;
  if (hours === 0)
    return translate('missions.resets_short_m', { minutes });
  return translate('missions.resets_short_hm', { hours, minutes });
}

/**
 * Action-first stable card order:
 * COMPLETED (ready to claim) → IN_PROGRESS (highest progress ratio first) → CLAIMED.
 * Tie-breaker is slot. Callers freeze this ID list per session so claiming never shifts cards mid-tap.
 */
export function orderMissions(missions: DailyMission[]): DailyMission[] {
  const rank = (m: DailyMission) => (m.status === 'COMPLETED' ? 0 : m.status === 'IN_PROGRESS' ? 1 : 2);
  return missions.slice().sort((a, b) => {
    const r = rank(a) - rank(b);
    if (r !== 0)
      return r;
    if (a.status === 'IN_PROGRESS') {
      const ra = a.currentProgress / Math.max(1, a.targetValue);
      const rb = b.currentProgress / Math.max(1, b.targetValue);
      if (rb !== ra)
        return rb - ra;
    }
    return a.slot - b.slot;
  });
}

/**
 * 1-to-1 status-semantic header progress segments, ordered left-to-right by completion state:
 * CLAIMED (green) → COMPLETED (gold) → IN_PROGRESS partial (proportional blue) → NOT_STARTED (empty) → EXPIRED (slate).
 */
export function buildStatusSegments(missions: DailyMission[], ended: boolean): StatusSegment[] {
  const rank = (m: DailyMission) => {
    if (m.status === 'CLAIMED')
      return 0;
    if (m.status === 'COMPLETED')
      return ended ? 4 : 1;
    return m.currentProgress > 0 ? 2 : 3;
  };
  return missions
    .slice()
    .sort((a, b) => {
      const r = rank(a) - rank(b);
      if (r !== 0)
        return r;
      if (a.status === 'IN_PROGRESS') {
        const ra = a.currentProgress / Math.max(1, a.targetValue);
        const rb = b.currentProgress / Math.max(1, b.targetValue);
        if (rb !== ra)
          return rb - ra;
      }
      return a.slot - b.slot;
    })
    .map((m) => {
      if (m.status === 'CLAIMED')
        return { id: m.id, name: m.name, kind: 'claimed', fillPercent: 100 };
      if (m.status === 'COMPLETED')
        return { id: m.id, name: m.name, kind: ended ? 'expired' : 'ready', fillPercent: 100 };
      const pct = Math.min(100, Math.round((m.currentProgress / Math.max(1, m.targetValue)) * 100));
      if (pct > 0)
        return { id: m.id, name: m.name, kind: 'progress', fillPercent: pct };
      return { id: m.id, name: m.name, kind: 'empty', fillPercent: 0 };
    });
}

export function summarizeMissions(missions: DailyMission[], ended: boolean, minutesLeft: number): MissionSummary {
  let claimedCount = 0;
  let readyCount = 0;
  let expiredUnclaimed = 0;
  let inProgressStarted = 0;
  let notStarted = 0;
  let totalCoin = 0;
  let totalXp = 0;
  let earnedCoin = 0;
  let earnedXp = 0;

  for (const m of missions) {
    totalCoin += m.reward.coin;
    totalXp += m.reward.xp;
    if (m.status === 'CLAIMED') {
      claimedCount += 1;
      earnedCoin += m.reward.coin;
      earnedXp += m.reward.xp;
    }
    else if (m.status === 'COMPLETED') {
      if (ended)
        expiredUnclaimed += 1;
      else
        readyCount += 1;
    }
    else if (m.currentProgress > 0) {
      inProgressStarted += 1;
    }
    else {
      notStarted += 1;
    }
  }

  const totalCount = missions.length;
  const completedCount = claimedCount + readyCount + expiredUnclaimed;
  const allClaimed = totalCount > 0 && claimedCount === totalCount;
  const urgent = !ended && minutesLeft < 120 && readyCount > 0;

  return {
    totalCount,
    completedCount,
    claimedCount,
    readyCount,
    expiredUnclaimed,
    inProgressStarted,
    notStarted,
    totalCoin,
    totalXp,
    earnedCoin,
    earnedXp,
    allClaimed,
    urgent,
  };
}

export function formatGrantedMessage(granted: GrantedNotice): string {
  const rewards = [
    granted.coin > 0 && translate('missions.granted_coin', { coin: granted.coin }),
    granted.xp > 0 && translate('missions.granted_xp', { xp: granted.xp }),
    granted.item,
  ]
    .filter(Boolean)
    .join(', ');

  return [
    translate('missions.granted', { rewards }),
    granted.fallback && translate('missions.fallback_coin'),
  ]
    .filter(Boolean)
    .join(' · ');
}
