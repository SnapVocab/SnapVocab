import type { CreateQuizRequest, QuizHistorySummaryResponse, QuizMode, QuizPlayDTO, QuizStatus } from './types';

export * from './utils/idempotency';

export type HistoryFilterMode = 'ALL' | QuizMode;

/**
 * Formats `durationSeconds` from the Result API (D15) as mm:ss, or hh:mm:ss from one hour up.
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

type QuizApiError = { response?: { status?: number; data?: { error?: string } } };

/** True when the backend closed this session on its 24h TTL (D17), so it cannot be continued. */
export function isQuizSessionExpired(error: unknown): boolean {
  return (error as QuizApiError)?.response?.data?.error === 'QUIZ_SESSION_EXPIRED';
}

/** The client's copy of the session is behind the server: reload Play state instead of retrying. */
const RESYNC_CODES = new Set([
  'QUESTION_ALREADY_CHECKED',
  'MATCHING_LEFT_ALREADY_RESOLVED',
  'MATCHING_TILE_ALREADY_MATCHED',
  'QUIZ_NOT_IN_PROGRESS',
  'QUIZ_HAS_UNRESOLVED_UNITS',
]);

/**
 * How a failed check / attempt / complete must be recovered:
 * - EXPIRED: session is gone (410).
 * - RESYNC: server state moved on (graded elsewhere, terminal, unresolved units) → reload Play.
 * - REJECTED: other 4xx — the server wrote nothing, so a new answer with a new key is safe.
 * - UNCONFIRMED: no response or 5xx — the server may have committed; only the SAME request with
 *   the SAME key may be retried, otherwise the replayed grading would not match the shown answer.
 */
export function classifyQuizError(error: unknown): 'EXPIRED' | 'RESYNC' | 'REJECTED' | 'UNCONFIRMED' {
  const response = (error as QuizApiError)?.response;
  if (response?.data?.error === 'QUIZ_SESSION_EXPIRED')
    return 'EXPIRED';
  if (response?.data?.error && RESYNC_CODES.has(response.data.error))
    return 'RESYNC';
  return response?.status && response.status < 500 ? 'REJECTED' : 'UNCONFIRMED';
}

/** Index of the first MCQ/Fill question the server has not graded yet, or -1 when all are resolved. */
export function firstUnresolvedIndex(questions: QuizPlayDTO['questions'], after = -1): number {
  return questions.findIndex((q, i) => i > after && !q.resolved);
}

/** Every unit is resolved server-side, so the only thing left is to complete the quiz. */
export function isQuizFullyResolved(quiz: QuizPlayDTO): boolean {
  return quiz.mode === 'MATCHING'
    ? quiz.matchingRounds.length > 0 && quiz.matchingRounds.every(r => r.completed)
    : quiz.questions.length > 0 && quiz.questions.every(q => q.resolved);
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
 * What a history row offers (D17): a session is resumable only while IN_PROGRESS — the backend has
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
