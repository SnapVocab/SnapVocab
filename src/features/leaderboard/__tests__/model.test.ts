import type { Leaderboard, LeaderboardRow } from '../types';
import { expectedWeekStart, formatWeekRange, formatXp, gapOf, gapProgressOf, remainingParts, shouldPinMe, stageSlotsOf, trendOf, updatedParts, visibleSnapshot } from '../model';

function board(patch: Partial<Leaderboard> = {}): Leaderboard {
  return {
    weekStart: '2026-11-09',
    weekEnd: '2026-11-15',
    timezone: 'Asia/Ho_Chi_Minh',
    endsAt: '2026-11-15T17:00:00Z',
    isFinal: false,
    asOf: '2026-11-10T05:00:12Z',
    participants: 3,
    entries: [
      { rank: 1, displayName: 'Lan', avatarUrl: null, avatarFrameUrl: null, score: 120, rankChange: 1, isMe: false },
      { rank: 2, displayName: 'Minh', avatarUrl: null, avatarFrameUrl: null, score: 90, rankChange: null, isMe: false },
    ],
    me: { eligible: true, rank: 3, score: 40, rankChange: -2, xpToNextRank: 51, nextRank: 2 },
    ...patch,
  };
}

it('formats XP with vi-VN grouping, never abbreviated', () => {
  expect(formatXp(0)).toBe('0');
  expect(formatXp(1240)).toBe('1.240');
  expect(formatXp(1000000)).toBe('1.000.000');
});

it('formats the inclusive week range, both years across New Year', () => {
  expect(formatWeekRange('2026-11-09', '2026-11-15')).toBe('09/11 – 15/11/2026');
  expect(formatWeekRange('2025-12-29', '2026-01-04')).toBe('29/12/2025 – 04/01/2026');
});

it('shows asOf in Vietnam time, with the date only when it is not today there', () => {
  expect(updatedParts('2026-11-10T05:00:12Z', new Date('2026-11-10T09:00:00Z'))).toEqual({ time: '12:00', date: null });
  // 00:30 on 11/11 in Vietnam: the snapshot is from yesterday there.
  expect(updatedParts('2026-11-10T05:00:12Z', new Date('2026-11-10T17:30:00Z'))).toEqual({ time: '12:00', date: '10/11/2026' });
  expect(updatedParts('2026-11-09T17:00:00Z', new Date('2026-11-09T17:00:00Z'))).toEqual({ time: '00:00', date: null });
  expect(updatedParts('not a date', new Date())).toBeNull();
});

it('derives the expected window from the Vietnam calendar', () => {
  expect(expectedWeekStart('CURRENT', new Date('2026-11-10T05:00:00Z'))).toBe('2026-11-09');
  expect(expectedWeekStart('PREVIOUS', new Date('2026-11-10T05:00:00Z'))).toBe('2026-11-02');
  expect(expectedWeekStart('CURRENT', new Date('2026-11-15T16:59:59Z'))).toBe('2026-11-09'); // Sunday 23:59:59
  expect(expectedWeekStart('CURRENT', new Date('2026-11-15T17:00:00Z'))).toBe('2026-11-16'); // Monday 00:00
  expect(expectedWeekStart('PREVIOUS', new Date('2026-01-01T03:00:00Z'))).toBe('2025-12-22');
  const before = new Date('2026-11-15T16:59:00Z');
  const after = new Date('2026-11-15T17:00:00Z');
  const snapshot = board();
  const cached = { data: snapshot, dataUpdatedAt: before.getTime() };
  const fresh = { data: snapshot, dataUpdatedAt: after.getTime() };
  expect(visibleSnapshot(cached, 'CURRENT', before)).toBe(snapshot);
  expect(visibleSnapshot(cached, 'CURRENT', after)).toBeUndefined();
  expect(visibleSnapshot(fresh, 'CURRENT', after)).toBe(snapshot);
});

it('pins "you" only when ranked and absent from the loaded rows (PO choice b)', () => {
  expect(shouldPinMe(board())).toBe(true);
  expect(shouldPinMe(board({ me: { ...board().me, rank: null } }))).toBe(false);
  const mine = board();
  mine.entries[1] = { ...mine.entries[1], isMe: true };
  expect(shouldPinMe(mine)).toBe(false);
  // Tied at rank 2 but cut off by the row limit: still pinned, decided by isMe, not by rank.
  expect(shouldPinMe(board({ me: { ...board().me, rank: 2 } }))).toBe(true);
});

it('maps rankChange to the trend mark without turning null into 0', () => {
  expect(trendOf(3)).toMatchObject({ symbol: '▲', amount: 3, tone: 'up' });
  expect(trendOf(-2)).toMatchObject({ symbol: '▼', amount: 2, tone: 'down' });
  expect(trendOf(0)).toMatchObject({ symbol: '—', amount: null, a11yKey: 'leaderboard.trend.a11y_same' });
  expect(trendOf(null).a11yKey).toBe('leaderboard.trend.a11y_none');
});

it('shows the API gap this week only, and rank 1 instead of a gap', () => {
  expect(gapOf(board(), 'CURRENT')).toEqual({ key: 'leaderboard.gap', xp: '51', rank: 2 });
  expect(gapOf(board(), 'PREVIOUS')).toBeNull();
  expect(gapOf(board({ me: { ...board().me, rank: 1, xpToNextRank: null, nextRank: null } }), 'CURRENT')).toEqual({ key: 'leaderboard.me_first' });
  expect(gapOf(board({ me: { ...board().me, rank: null } }), 'CURRENT')).toBeNull();
});

it('computes the gap bar fill from API score and xpToNextRank', () => {
  expect(gapProgressOf(board(), 'CURRENT')).toBe(44);
  expect(gapProgressOf(board(), 'PREVIOUS')).toBeNull();
  expect(gapProgressOf(board({ me: { ...board().me, rank: 1, xpToNextRank: null, nextRank: null } }), 'CURRENT')).toBeNull();
});

it('derives remaining time label before endsAt', () => {
  const endsAt = '2026-11-15T17:00:00Z';
  expect(remainingParts(endsAt, new Date('2026-11-12T17:00:00Z'))).toEqual({ key: 'leaderboard.remaining_days', count: 3 });
  // Wed 16:30 VN = 4 d 7.5 h left: whole days, rounded down (QA 2026-11-18 saw "5")
  expect(remainingParts(endsAt, new Date('2026-11-11T09:30:00Z'))).toEqual({ key: 'leaderboard.remaining_days', count: 4 });
  expect(remainingParts(endsAt, new Date('2026-11-15T12:00:00Z'))).toEqual({ key: 'leaderboard.remaining_hours', count: 5 });
  expect(remainingParts(endsAt, new Date('2026-11-15T12:30:00Z'))).toEqual({ key: 'leaderboard.remaining_hours', count: 4 });
  expect(remainingParts(endsAt, new Date('2026-11-15T16:30:00Z'))).toEqual({ key: 'leaderboard.remaining_soon' });
  expect(remainingParts(endsAt, new Date('2026-11-15T17:00:00Z'))).toBeNull();
  expect(remainingParts('invalid', new Date())).toBeNull();
});

it('arranges Top 3 slots for Olympic 2-1-3, tie 1-2-2, and fair dual-laurel tie 1-1-3', () => {
  const mk = (rank: number, displayName: string): LeaderboardRow => ({
    rank,
    displayName,
    avatarUrl: null,
    avatarFrameUrl: null,
    score: 100,
    rankChange: null,
    isMe: false,
  });

  expect(stageSlotsOf([])).toEqual([]);

  const standard = stageSlotsOf([mk(1, 'A'), mk(2, 'B'), mk(3, 'C')]);
  expect(standard.map(s => [s.row.displayName, s.elevated, s.laurel, s.pinTone])).toEqual([
    ['B', false, false, 'silver'],
    ['A', true, true, 'gold'],
    ['C', false, false, 'bronze'],
  ]);

  const tie2 = stageSlotsOf([mk(1, 'A'), mk(2, 'B'), mk(2, 'C')]);
  expect(tie2.map(s => [s.row.displayName, s.elevated, s.laurel, s.pinTone])).toEqual([
    ['B', false, false, 'silver'],
    ['A', true, true, 'gold'],
    ['C', false, false, 'silver'],
  ]);

  const tie1 = stageSlotsOf([mk(1, 'A'), mk(1, 'B'), mk(3, 'C')]);
  expect(tie1.map(s => [s.row.displayName, s.elevated, s.laurel, s.pinTone])).toEqual([
    ['A', true, true, 'gold'],
    ['B', true, true, 'gold'],
    ['C', false, false, 'bronze'],
  ]);

  const twoTied = stageSlotsOf([mk(1, 'A'), mk(1, 'B')]);
  expect(twoTied.map(s => [s.row.displayName, s.elevated, s.laurel])).toEqual([
    ['A', true, true],
    ['B', true, true],
  ]);
});
