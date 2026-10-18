import type { ProgressSummaryDTO } from './types';

/**
 * The backend has no SRS lifecycle yet: nothing creates or updates `fsrs_records`, so
 * learned/reviewing/mastered/due/review counts are structurally 0. While false, the UI hides
 * those metrics instead of presenting the zeros as real learning state.
 * ponytail: compile-time flag; flip it when FSRS enrollment + review ship.
 */
export const SRS_ENABLED = false;

/** Non-overlapping split (mastered ⊂ learned): new + learning/reviewing + mastered = total. */
export function deriveVocabularySegments(
  summary?: Pick<ProgressSummaryDTO, 'totalWords' | 'learnedCount' | 'masteredCount'> | null,
) {
  const totalWords = summary?.totalWords ?? 0;
  const learnedCount = summary?.learnedCount ?? 0;
  const masteredCount = summary?.masteredCount ?? 0;
  const newCount = Math.max(0, totalWords - learnedCount);
  const learningAndReviewingCount = Math.max(0, learnedCount - masteredCount);

  return {
    totalWords,
    learnedCount,
    newCount,
    learningAndReviewingCount,
    masteredCount,
    isValidSum: newCount + learningAndReviewingCount + masteredCount === totalWords,
  };
}

/** "2026-10-06" (or an ISO timestamp) -> "06/10/2026". Unparseable input is returned as-is. */
export function formatDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : iso;
}
