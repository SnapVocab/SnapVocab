import type { QuizHistorySummaryResponse, QuizMode } from './types';

export type HistoryFilterMode = 'ALL' | QuizMode;

export function formatQuizDuration(durationMs?: number | null): string {
  if (!durationMs || durationMs <= 0)
    return '0s';
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0)
    return `${seconds}s`;
  if (seconds === 0)
    return `${minutes}m`;
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

export function formatQuizSubmittedDate(submittedAt?: string | null): string {
  if (!submittedAt)
    return '';
  try {
    const date = new Date(submittedAt);
    if (Number.isNaN(date.getTime()))
      return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes} · ${day}/${month}/${year}`;
  }
  catch {
    return '';
  }
}

/**
 * Formats accuracy to a whole percentage (0..100).
 * Handles both double ratio (0..1) from Quiz v2 and legacy bps (0..10000).
 */
export function formatQuizAccuracy(accuracy?: number | null): number {
  if (accuracy === undefined || accuracy === null)
    return 0;
  if (accuracy <= 1) {
    return Math.round(accuracy * 100);
  }
  return Math.round(accuracy / 100);
}

export function filterQuizHistoryItems(
  items: QuizHistorySummaryResponse[],
  filter: HistoryFilterMode,
): QuizHistorySummaryResponse[] {
  if (filter === 'ALL')
    return items;
  return items.filter(item => item.mode === filter);
}
