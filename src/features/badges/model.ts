import type { BadgeItem, BadgeMetric, BadgeSeries, BadgesView } from './types';

/** Copy/route keys per metric (achievements_ui.md §4). Unknown metrics fall back to `other`. */
export type MetricKey = 'streak' | 'quiz' | 'perfect' | 'words' | 'other';

const METRIC_KEYS: Record<string, MetricKey> = {
  LONGEST_STREAK_DAYS: 'streak',
  QUIZ_COMPLETED: 'quiz',
  PERFECT_QUIZ: 'perfect',
  DISTINCT_WORDS_ADDED: 'words',
};

export function metricKey(metric: BadgeMetric): MetricKey {
  return METRIC_KEYS[metric] ?? 'other';
}

/** CTA target for a locked badge; `null` for metrics without a known activity. */
export function metricRoute(metric: BadgeMetric): '/study/quiz-setup' | '/collections' | null {
  const key = metricKey(metric);
  if (key === 'words')
    return '/collections';
  return key === 'other' ? null : '/study/quiz-setup';
}

/** Item order inside a series: threshold, sortOrder, id (B8). */
function byMilestone(a: BadgeItem, b: BadgeItem) {
  return a.threshold - b.threshold || a.sortOrder - b.sortOrder || a.id - b.id;
}

/**
 * Groups badges into series, never trusting the response order (B8): series by their smallest sortOrder, then by the
 * metric's first appearance; items by threshold, sortOrder, id.
 */
export function buildSeries(view: BadgesView): BadgeSeries[] {
  const groups = new Map<string, { firstIndex: number; minSort: number; items: BadgeItem[] }>();
  view.badges.forEach((item, index) => {
    const group = groups.get(item.metric);
    if (group) {
      group.items.push(item);
      group.minSort = Math.min(group.minSort, item.sortOrder);
    }
    else {
      groups.set(item.metric, { firstIndex: index, minSort: item.sortOrder, items: [item] });
    }
  });
  return [...groups.entries()]
    .sort(([, a], [, b]) => a.minSort - b.minSort || a.firstIndex - b.firstIndex)
    .map(([metric, group]) => {
      const items = group.items.slice().sort(byMilestone);
      // Every item of a metric carries the same server value (BadgeService.metrics).
      return { metric, currentValue: Math.max(...items.map(i => i.currentValue)), items };
    });
}

/** Reached the threshold but not recorded by a sync yet. */
export function isRecording(item: BadgeItem): boolean {
  return !item.earned && item.currentValue >= item.threshold;
}

/** Displayed progress never exceeds the threshold; the raw value stays uncapped in the API. */
export function shownProgress(item: BadgeItem): number {
  return Math.min(item.currentValue, item.threshold);
}

/** Highest threshold of a series with at least two milestones (stronger unlock feedback, B6). */
export function isSeriesFinal(item: BadgeItem, series: BadgeSeries): boolean {
  return series.items.length >= 2 && series.items[series.items.length - 1].id === item.id;
}

export function seriesOf(seriesList: BadgeSeries[], item: BadgeItem): BadgeSeries | undefined {
  return seriesList.find(s => s.metric === item.metric);
}

/** 1-based position inside its series. */
export function milestonePosition(seriesList: BadgeSeries[], item: BadgeItem): { index: number; count: number } {
  const series = seriesOf(seriesList, item);
  if (!series)
    return { index: 1, count: 1 };
  return { index: series.items.findIndex(i => i.id === item.id) + 1, count: series.items.length };
}

/** Badges in shelf order: series order, then milestone order (modal and NEW hero lists). */
export function inDisplayOrder(seriesList: BadgeSeries[], ids: Iterable<number>): BadgeItem[] {
  const wanted = new Set(ids);
  return seriesList.flatMap(s => s.items.filter(i => wanted.has(i.id)));
}

/** Profile strip: earnedAt, sortOrder, id — all descending (badges.md §2.4). */
export function recentEarned(view: BadgesView, limit = 3): BadgeItem[] {
  return view.badges
    .filter(b => b.earned && b.earnedAt)
    .sort((a, b) => Date.parse(b.earnedAt!) - Date.parse(a.earnedAt!) || b.sortOrder - a.sortOrder || b.id - a.id)
    .slice(0, limit);
}

export function unseenIds(view: BadgesView): number[] {
  return view.badges.filter(b => b.seen === false).map(b => b.id);
}

export type ScreenState = 'NEW' | 'COMPLETE' | 'RECORDING' | 'EMPTY' | 'NORMAL';

/** Priority NEW → COMPLETE → RECORDING → EMPTY → NORMAL (B9); RECORDING is suppressed while data is stale. */
export function screenState(view: BadgesView, opts: { stale: boolean; newIds: number[] }): ScreenState {
  if (opts.newIds.length > 0)
    return 'NEW';
  if (view.totalCount > 0 && view.earnedCount === view.totalCount)
    return 'COMPLETE';
  if (!opts.stale && view.badges.some(isRecording))
    return 'RECORDING';
  if (view.earnedCount === 0)
    return 'EMPTY';
  return 'NORMAL';
}

/** "dd/MM/yyyy" in Asia/Ho_Chi_Minh (badges.md §2.2), independent of the device zone. */
export function formatEarnedDate(iso: string | null): string {
  if (!iso)
    return '';
  const time = Date.parse(iso);
  if (Number.isNaN(time))
    return '';
  const d = new Date(time + 7 * 3600_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}
