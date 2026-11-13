import type { Leaderboard, LeaderboardWeek } from './types';
import type { TxKeyPath } from '@/lib/i18n';

/** Vietnam has no DST: shifting by +7 h and reading UTC fields gives Vietnam wall time. */
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const pad = (n: number) => String(n).padStart(2, '0');

function vnWall(instant: Date) {
  const d = new Date(instant.getTime() + VN_OFFSET_MS);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), hh: d.getUTCHours(), mm: d.getUTCMinutes(), dow: d.getUTCDay() };
}

/** 1240 → "1.240" (vi-VN grouping, never abbreviated to 1,2K). */
export function formatXp(n: number): string {
  return String(Math.trunc(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** "09/11 – 15/11/2026"; a range across New Year shows both years. Both ends are inclusive dates (weekEnd is Sunday). */
export function formatWeekRange(weekStart: string, weekEnd: string): string {
  const [y1, m1, d1] = weekStart.split('-');
  const [y2, m2, d2] = weekEnd.split('-');
  return y1 === y2 ? `${d1}/${m1} – ${d2}/${m2}/${y2}` : `${d1}/${m1}/${y1} – ${d2}/${m2}/${y2}`;
}

/** asOf in Vietnam time: "12:00", plus the date when it is not today in Vietnam (§6). Null when asOf is unusable. */
export function updatedParts(asOf: string, now: Date): { time: string; date: string | null } | null {
  const at = new Date(asOf);
  if (Number.isNaN(at.getTime()))
    return null;
  const a = vnWall(at);
  const n = vnWall(now);
  const sameDay = a.y === n.y && a.m === n.m && a.d === n.d;
  return { time: `${pad(a.hh)}:${pad(a.mm)}`, date: sameDay ? null : `${pad(a.d)}/${pad(a.m)}/${a.y}` };
}

/** Monday ('yyyy-MM-dd') of the window a week tab should show at `now`, by the Vietnam calendar. */
export function expectedWeekStart(week: LeaderboardWeek, now: Date): string {
  const v = vnWall(now);
  const sinceMonday = (v.dow + 6) % 7;
  const monday = new Date(Date.UTC(v.y, v.m - 1, v.d) - (sinceMonday + (week === 'PREVIOUS' ? 7 : 0)) * DAY_MS);
  return `${monday.getUTCFullYear()}-${pad(monday.getUTCMonth() + 1)}-${pad(monday.getUTCDate())}`;
}

/** Hide snapshots from another window if fetched before this window began. */
export function visibleSnapshot(
  { data, dataUpdatedAt }: { data: Leaderboard | undefined; dataUpdatedAt: number },
  week: LeaderboardWeek,
  now: Date,
) {
  const expected = expectedWeekStart(week, now);
  if (data && (data.weekStart === expected || expectedWeekStart(week, new Date(dataUpdatedAt)) === expected))
    return data;
  return undefined;
}

/** PO choice (b): pin "you" at the bottom only when ranked but outside the loaded rows; never track scrolling. */
export function shouldPinMe(data: Leaderboard): boolean {
  return data.me.rank !== null && !data.entries.some(e => e.isMe);
}

export type Trend = { symbol: '▲' | '▼' | '—'; amount: number | null; tone: 'up' | 'down' | 'flat'; a11yKey: TxKeyPath };

/** §3: compared with 00:00 today; null never becomes 0 and is not "new". */
export function trendOf(rankChange: number | null): Trend {
  if (rankChange === null) {
    return { symbol: '—', amount: null, tone: 'flat', a11yKey: 'leaderboard.trend.a11y_none' };
  }
  if (rankChange > 0)
    return { symbol: '▲', amount: rankChange, tone: 'up', a11yKey: 'leaderboard.trend.a11y_up' };
  if (rankChange < 0)
    return { symbol: '▼', amount: -rankChange, tone: 'down', a11yKey: 'leaderboard.trend.a11y_down' };
  return { symbol: '—', amount: null, tone: 'flat', a11yKey: 'leaderboard.trend.a11y_same' };
}

/** Gap line under "you": only this week, only when the API gives one; rank 1 (tied included) gets its own line. */
export function gapOf(data: Leaderboard, week: LeaderboardWeek): { key: TxKeyPath; xp?: string; rank?: number } | null {
  const { me } = data;
  if (week !== 'CURRENT' || me.rank === null)
    return null;
  if (me.rank === 1)
    return { key: 'leaderboard.me_first' };
  if (me.xpToNextRank === null || me.nextRank === null)
    return null;
  return { key: 'leaderboard.gap', xp: formatXp(me.xpToNextRank), rank: me.nextRank };
}
