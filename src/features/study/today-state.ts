import type { Href } from 'expo-router';
import type { StudyToday } from './api';

/** Where a learner with an empty library starts: the ready-made sets. */
export const EXPLORE_HREF = { pathname: '/(app)/collections', params: { view: 'explore' } } as Href;

/** learn_ui.md §10.1: what the "Hôm nay" block says, in priority order. */
export type TodayState =
  | { kind: 'empty' }
  | { kind: 'backlog'; count: number }
  | { kind: 'returning'; count: number }
  | { kind: 'in_progress'; due: number; studied: number; count: number }
  | { kind: 'due'; due: number; newCount: number; count: number }
  | { kind: 'new'; newCount: number; afterReview: boolean }
  | { kind: 'done'; dueTomorrow: number };

export function todayState(today: StudyToday): TodayState {
  const { totalWords, backlog, returning, dueCount, newCount, sessionCount, studiedToday, dueTomorrow } = today;
  if (totalWords === 0)
    return { kind: 'empty' };
  if (backlog)
    return { kind: 'backlog', count: sessionCount };
  if (returning && sessionCount > 0)
    return { kind: 'returning', count: sessionCount };
  if (dueCount > 0 && studiedToday > 0)
    return { kind: 'in_progress', due: dueCount, studied: studiedToday, count: sessionCount };
  if (dueCount > 0)
    return { kind: 'due', due: dueCount, newCount, count: sessionCount };
  if (newCount > 0)
    return { kind: 'new', newCount, afterReview: studiedToday > 0 };
  return { kind: 'done', dueTomorrow };
}

/** ponytail: flat 9 s per card until real review timings are measured (learn_ui.md §8.2 B, V-7). */
export function sessionMinutes(cards: number) {
  return Math.max(1, Math.ceil((cards * 9) / 60));
}
