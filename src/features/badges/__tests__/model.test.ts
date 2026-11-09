import type { BadgeItem, BadgesView } from '../types';
import { isDeferredRoute } from '../badge-unlock-host';
import {
  buildSeries,
  formatEarnedDate,
  isSeriesFinal,
  metricRoute,
  recentEarned,
  screenState,
} from '../model';

jest.mock('../api', () => ({}));
jest.mock('../components/badge-unlock-modal', () => ({}));

let nextId = 1;
function badge(over: Partial<BadgeItem>): BadgeItem {
  return {
    id: nextId++,
    code: 'X',
    name: 'Badge',
    description: '',
    metric: 'QUIZ_COMPLETED',
    threshold: 1,
    currentValue: 0,
    imageUrl: null,
    sortOrder: 0,
    earned: false,
    earnedAt: null,
    seen: null,
    ...over,
  };
}
function view(badges: BadgeItem[]): BadgesView {
  const earned = badges.filter(b => b.earned).length;
  return { earnedCount: earned, totalCount: badges.length, unseenCount: badges.filter(b => b.seen === false).length, badges };
}

describe('badge model', () => {
  it('orders series by min sortOrder and items by threshold, never by response order (B8)', () => {
    const words10 = badge({ metric: 'DISTINCT_WORDS_ADDED', threshold: 10, sortOrder: 40 });
    const quiz50 = badge({ metric: 'QUIZ_COMPLETED', threshold: 50, sortOrder: 5 });
    const quiz1 = badge({ metric: 'QUIZ_COMPLETED', threshold: 1, sortOrder: 20 });
    const series = buildSeries(view([words10, quiz50, quiz1]));
    expect(series.map(s => s.metric)).toEqual(['QUIZ_COMPLETED', 'DISTINCT_WORDS_ADDED']);
    expect(series[0].items.map(i => i.threshold)).toEqual([1, 50]);
  });

  it('applies screen-state priority NEW → COMPLETE → RECORDING → EMPTY → NORMAL (B9)', () => {
    const recording = view([badge({ threshold: 1, currentValue: 1 })]);
    expect(screenState(recording, { stale: false, newIds: [] })).toBe('RECORDING');
    expect(screenState(recording, { stale: true, newIds: [] })).toBe('EMPTY');
    expect(screenState(recording, { stale: false, newIds: [9] })).toBe('NEW');
    expect(screenState(view([badge({ earned: true, threshold: 1, currentValue: 1 })]), { stale: false, newIds: [] })).toBe('COMPLETE');
    expect(screenState(view([badge({ earned: true }), badge({ threshold: 10 })]), { stale: false, newIds: [] })).toBe('NORMAL');
  });

  it('orders the Profile strip by earnedAt, then sortOrder, then id — all descending', () => {
    const at = '2026-10-07T03:00:00Z';
    const a = badge({ earned: true, earnedAt: at, sortOrder: 10 });
    const b = badge({ earned: true, earnedAt: at, sortOrder: 11 });
    const c = badge({ earned: true, earnedAt: '2026-10-01T03:00:00Z', sortOrder: 99 });
    const d = badge({ earned: true, earnedAt: '2026-09-01T03:00:00Z' });
    expect(recentEarned(view([a, c, b, d])).map(x => x.id)).toEqual([b.id, a.id, c.id]);
  });

  it('marks only the top of a multi-milestone series as final', () => {
    const [series] = buildSeries(view([badge({ threshold: 1 }), badge({ threshold: 10 })]));
    expect(isSeriesFinal(series.items[1], series)).toBe(true);
    expect(isSeriesFinal(series.items[0], series)).toBe(false);
    const [single] = buildSeries(view([badge({ metric: 'PERFECT_QUIZ', threshold: 1 })]));
    expect(isSeriesFinal(single.items[0], single)).toBe(false);
  });

  it('formats earnedAt in Asia/Ho_Chi_Minh and routes CTAs by metric', () => {
    expect(formatEarnedDate('2026-10-06T18:30:00Z')).toBe('07/10/2026');
    expect(formatEarnedDate(null)).toBe('');
    expect(metricRoute('DISTINCT_WORDS_ADDED')).toBe('/collections');
    expect(metricRoute('LONGEST_STREAK_DAYS')).toBe('/study/quiz-setup');
    expect(metricRoute('SOMETHING_NEW')).toBeNull();
  });

  it('defers the unlock modal on learning, Quiz Result and Achievements routes only', () => {
    expect(['/study/quiz-session', '/study/quiz-result', '/profile/achievements'].every(isDeferredRoute)).toBe(true);
    expect(['/', '/learn', '/profile', '/study/quiz-setup'].some(isDeferredRoute)).toBe(false);
  });
});
