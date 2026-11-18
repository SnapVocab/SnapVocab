import type { DailyMission } from '../types';
import en from '@/translations/en.json';
import vi from '@/translations/vi.json';
import { buildStatusSegments, formatResetCountdown, formatShortDuration, orderMissions, summarizeMissions } from '../model';

jest.mock('@/lib/i18n', () => ({
  translate: (key: string, options?: Record<string, unknown>) =>
    (options ? `${key}(${Object.entries(options).map(([k, v]) => `${k}=${v}`).join(',')})` : key),
}));

function makeMission(overrides: Partial<DailyMission>): DailyMission {
  return {
    id: 1,
    code: 'QUIZ_SCORE_80',
    name: 'Trí Nhớ Siêu Phàm',
    description: 'Hoàn thành 1 quiz ≥ 80%',
    category: 'QUIZ',
    triggerEvent: 'QUIZ_COMPLETED',
    slot: 4,
    targetValue: 1,
    currentProgress: 0,
    status: 'IN_PROGRESS',
    reward: { coin: 20, xp: 40, itemCode: null, itemName: null, itemFallbackCoin: null },
    completedAt: null,
    claimedAt: null,
    ...overrides,
  };
}

describe('missions model helpers', () => {
  const sample: DailyMission[] = [
    makeMission({ id: 1, slot: 1, category: 'SCAN', targetValue: 3, currentProgress: 0, status: 'IN_PROGRESS', reward: { coin: 10, xp: 20, itemCode: null, itemName: null, itemFallbackCoin: null } }),
    makeMission({ id: 2, slot: 2, category: 'VOCABULARY', targetValue: 5, currentProgress: 3, status: 'IN_PROGRESS', reward: { coin: 15, xp: 25, itemCode: null, itemName: null, itemFallbackCoin: null } }),
    makeMission({ id: 3, slot: 3, category: 'SRS', targetValue: 5, currentProgress: 4, status: 'IN_PROGRESS', reward: { coin: 15, xp: 30, itemCode: null, itemName: null, itemFallbackCoin: null } }),
    makeMission({ id: 4, slot: 4, category: 'QUIZ', targetValue: 1, currentProgress: 1, status: 'COMPLETED', reward: { coin: 20, xp: 40, itemCode: null, itemName: null, itemFallbackCoin: null } }),
    makeMission({ id: 5, slot: 5, category: 'RETENTION', targetValue: 1, currentProgress: 1, status: 'CLAIMED', reward: { coin: 10, xp: 20, itemCode: null, itemName: null, itemFallbackCoin: null } }),
  ];

  it('orders cards action-first: COMPLETED → IN_PROGRESS (closest first) → CLAIMED', () => {
    expect(orderMissions(sample).map(m => m.id)).toEqual([4, 3, 2, 1, 5]);
  });

  it('builds 1-to-1 status-semantic header segments left-to-right', () => {
    const segs = buildStatusSegments(sample, false);
    expect(segs.map(s => [s.kind, s.fillPercent])).toEqual([
      ['claimed', 100],
      ['ready', 100],
      ['progress', 80],
      ['progress', 60],
      ['empty', 0],
    ]);

    const expiredSegs = buildStatusSegments(sample, true);
    expect(expiredSegs.map(s => s.kind)).toEqual(['claimed', 'progress', 'progress', 'empty', 'expired']);
  });

  it('summarizes Coin, XP, counts, urgency and allClaimed accurately', () => {
    const mid = summarizeMissions(sample, false, 222);
    expect(mid).toMatchObject({
      totalCount: 5,
      completedCount: 2,
      claimedCount: 1,
      readyCount: 1,
      expiredUnclaimed: 0,
      inProgressStarted: 2,
      notStarted: 1,
      totalCoin: 70,
      totalXp: 135,
      earnedCoin: 10,
      earnedXp: 20,
      allClaimed: false,
      urgent: false,
    });

    expect(summarizeMissions(sample, false, 48).urgent).toBe(true);
    expect(summarizeMissions(sample, true, 0)).toMatchObject({ readyCount: 0, expiredUnclaimed: 1, urgent: false });

    const allDone = sample.map(m => ({ ...m, status: 'CLAIMED' as const, currentProgress: m.targetValue }));
    expect(summarizeMissions(allDone, false, 180)).toMatchObject({
      allClaimed: true,
      earnedCoin: 70,
      earnedXp: 135,
      urgent: false,
    });
  });

  it('omits 0 hours when under 1 hour', () => {
    expect(formatResetCountdown(48)).toBe('missions.resets_in_minutes(minutes=48)');
    expect(formatResetCountdown(222)).toBe('missions.resets_in(hours=3,minutes=42)');
    expect(formatShortDuration(48)).toBe('missions.resets_short_m(minutes=48)');
    expect(formatShortDuration(222)).toBe('missions.resets_short_hm(hours=3,minutes=42)');
  });
});

describe('missions translations integrity (prevents M-01 {{coin}} regression)', () => {
  function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
    return Object.entries(obj).flatMap(([k, v]) => {
      const next = prefix ? `${prefix}.${k}` : k;
      return v && typeof v === 'object' && !Array.isArray(v)
        ? flattenKeys(v as Record<string, unknown>, next)
        : [next];
    }).sort();
  }

  it('keeps vi and en missions keys 100% aligned', () => {
    expect(flattenKeys(vi.missions)).toEqual(flattenKeys(en.missions));
  });

  it('uses {{rewards}} interpolation in missions.granted for both vi and en', () => {
    expect(vi.missions.granted).toBe('Đã nhận {{rewards}}');
    expect(en.missions.granted).toBe('Claimed {{rewards}}');
    expect(vi.missions.granted).not.toContain('{{coin}}');
    expect(en.missions.granted).not.toContain('{{coin}}');
  });
});
