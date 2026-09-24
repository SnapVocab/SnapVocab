import type { CreateQuizRequest, QuizHistorySummaryResponse, QuizMode, QuizStatus } from './types';

export * from './utils/idempotency';

export type HistoryFilterMode = 'ALL' | QuizMode;

/**
 * Formats `durationSeconds` from the Result API (D14) as mm:ss, or hh:mm:ss from one hour up.
 * The play-screen stopwatch is UX only and is never the source of this value.
 */
export function formatQuizDuration(durationSeconds?: number | null): string {
  const total = Math.floor(durationSeconds ?? 0);
  if (!Number.isFinite(total) || total <= 0)
    return '00:00';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}

/** True when the backend closed this session on its 24h TTL (D16), so it cannot be continued. */
export function isQuizSessionExpired(error: unknown): boolean {
  const code = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
  return code === 'QUIZ_SESSION_EXPIRED';
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

/**
 * What a history row offers (D16): a session is resumable only while IN_PROGRESS — the backend has
 * already turned anything past its 24h TTL into EXPIRED, which offers nothing.
 */
export function quizHistoryAction(status: QuizStatus): 'RESUME' | 'REVIEW' | 'NONE' {
  if (status === 'EXPIRED')
    return 'NONE';
  return status === 'IN_PROGRESS' ? 'RESUME' : 'REVIEW';
}

/**
 * D18: the unfinished session a Setup start would duplicate — same topic, mode, direction and size.
 * "5 câu trắc nghiệm" of another topic is a different context and must not be resumed by mistake.
 * History is expired server-side before it is returned (D17), so IN_PROGRESS here is still in TTL.
 */
export function findResumableQuiz(
  items: QuizHistorySummaryResponse[],
  request: CreateQuizRequest,
): QuizHistorySummaryResponse | undefined {
  return items.find(item =>
    item.status === 'IN_PROGRESS'
    && item.topicId === request.topicId
    && item.mode === request.mode
    && (item.direction ?? null) === (request.direction ?? null)
    && item.questionCount === request.requestedCount);
}

export function filterQuizHistoryItems(
  items: QuizHistorySummaryResponse[],
  filter: HistoryFilterMode,
): QuizHistorySummaryResponse[] {
  if (filter === 'ALL')
    return items;
  return items.filter(item => item.mode === filter);
}
