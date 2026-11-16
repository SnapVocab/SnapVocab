import type { Leaderboard } from '../types';
import { expectedWeekStart, formatWeekRange, formatXp, gapOf, shouldPinMe, trendOf, updatedParts, visibleSnapshot } from '../model';

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
