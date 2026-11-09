import type { MetricKey } from './model';
import type { BadgeItem, BadgeSeries } from './types';
import type { TxKeyPath } from '@/lib/i18n';
import { translate } from '@/lib/i18n';
import { formatEarnedDate, isRecording, metricKey, milestonePosition, shownProgress } from './model';

const NOTES: Partial<Record<MetricKey, TxKeyPath>> = {
  streak: 'badges.metric.streak.note',
  perfect: 'badges.metric.perfect.note',
  words: 'badges.metric.words.note',
};

export function seriesTitle(metric: string): string {
  return translate(`badges.metric.${metricKey(metric)}.title` as TxKeyPath);
}

/** Unit word for a metric; unknown metrics have none. */
export function unitOf(metric: string): string {
  const key = metricKey(metric);
  return key === 'other' ? '' : translate(`badges.metric.${key}.unit` as TxKeyPath);
}

export function noteOf(metric: string): string | null {
  const tx = NOTES[metricKey(metric)];
  return tx ? translate(tx) : null;
}

export function ctaOf(metric: string): string | null {
  const key = metricKey(metric);
  if (key === 'other')
    return null;
  return translate(key === 'words' ? 'badges.cta.words' : 'badges.cta.quiz');
}

/** "{value} {unit}" without a dangling space for unit-less metrics. */
export function amount(value: number, metric: string): string {
  return `${value} ${unitOf(metric)}`.trim();
}

/** One screen-reader sentence per shelf slot (achievements_ui.md §4). */
export function slotLabel(item: BadgeItem, seriesList: BadgeSeries[]): string {
  const { index, count } = milestonePosition(seriesList, item);
  const common = { name: item.name, index, count, series: seriesTitle(item.metric) };
  if (item.earned)
    return translate('badges.slot.earned', { ...common, date: formatEarnedDate(item.earnedAt) });
  if (isRecording(item))
    return translate('badges.slot.recording', common);
  return translate('badges.slot.locked', { ...common, current: shownProgress(item), threshold: item.threshold, unit: unitOf(item.metric) });
}
