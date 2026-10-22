import type { ProgressSummaryDTO } from './types';

/**
 * SRS metrics (learned/reviewing/mastered/due) are real: study reviews write `fsrs_records`, and `dueCount`
 * compares in UTC since TD-NOTIF-01 (learn_ui.md DEP-LEARN-04). False hides them, for a build without SRS.
 */
export const SRS_ENABLED = true;

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
