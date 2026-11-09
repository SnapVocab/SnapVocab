import type { StudyToday } from '../api';
import { sessionMinutes, todayState } from '../today-state';

const base: StudyToday = {
  dueCount: 0,
  newCount: 0,
  sessionCount: 0,
  studiedToday: 0,
  newPerDay: 10,
  backlog: false,
  returning: false,
  dueTomorrow: 0,
  totalWords: 40,
};

describe('todayState', () => {
  it('follows learn_ui.md §10.1 priority', () => {
    expect(todayState({ ...base, totalWords: 0, dueCount: 3 })).toEqual({ kind: 'empty' });
    expect(todayState({ ...base, backlog: true, returning: true, dueCount: 300, sessionCount: 20 }))
      .toEqual({ kind: 'backlog', count: 20 });
    expect(todayState({ ...base, returning: true, dueCount: 30, sessionCount: 10 }))
      .toEqual({ kind: 'returning', count: 10 });
    expect(todayState({ ...base, dueCount: 8, studiedToday: 20, sessionCount: 8 }))
      .toEqual({ kind: 'in_progress', due: 8, studied: 20, count: 8 });
    expect(todayState({ ...base, dueCount: 12, newCount: 5, sessionCount: 17 }))
      .toEqual({ kind: 'due', due: 12, newCount: 5, count: 17 });
    expect(todayState({ ...base, newCount: 5, sessionCount: 5, studiedToday: 3 }))
      .toEqual({ kind: 'new', newCount: 5, afterReview: true });
    expect(todayState({ ...base, dueTomorrow: 14 })).toEqual({ kind: 'done', dueTomorrow: 14 });
  });

  it('a returning learner with nothing to do is done, not returning', () => {
    expect(todayState({ ...base, returning: true }).kind).toBe('done');
  });

  it('estimates at least one minute', () => {
    expect(sessionMinutes(1)).toBe(1);
    expect(sessionMinutes(20)).toBe(3);
  });
});
