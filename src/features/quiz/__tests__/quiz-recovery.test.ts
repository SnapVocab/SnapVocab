import type { QuizPlayDTO } from '../types';
import { renderHook } from '@testing-library/react-native';
import { useCompleteQuiz } from '../api/quiz-api';
import { useFinishQuiz } from '../hooks/use-finish-quiz';
import { classifyQuizError, firstUnresolvedIndex, isQuizFullyResolved } from '../utils';

jest.mock('expo-router', () => ({ useRouter: () => ({ replace: jest.fn() }) }));
jest.mock('../api/quiz-api', () => ({ useCompleteQuiz: jest.fn() }));
jest.mock('../hooks/use-expired-session-handler', () => ({ useExpiredSessionHandler: () => () => false }));

const apiError = (status: number, error?: string) => ({ response: { status, data: { error } } });

describe('classifyQuizError', () => {
  it('keeps the request locked when the server may have committed it (no response / 5xx)', () => {
    expect(classifyQuizError(new Error('Network Error'))).toBe('UNCONFIRMED');
    expect(classifyQuizError(apiError(503))).toBe('UNCONFIRMED');
  });

  it('resyncs when the server state moved on', () => {
    expect(classifyQuizError(apiError(409, 'QUESTION_ALREADY_CHECKED'))).toBe('RESYNC');
    expect(classifyQuizError(apiError(409, 'MATCHING_TILE_ALREADY_MATCHED'))).toBe('RESYNC');
    expect(classifyQuizError(apiError(409, 'QUIZ_NOT_IN_PROGRESS'))).toBe('RESYNC');
    expect(classifyQuizError(apiError(409, 'QUIZ_HAS_UNRESOLVED_UNITS'))).toBe('RESYNC');
  });

  it('separates expiry and definitive rejections', () => {
    expect(classifyQuizError(apiError(410, 'QUIZ_SESSION_EXPIRED'))).toBe('EXPIRED');
    expect(classifyQuizError(apiError(422, 'INVALID_OPTION'))).toBe('REJECTED');
  });
});

describe('resume from server Play state (D18)', () => {
  const q = (resolved: boolean) => ({ resolved }) as QuizPlayDTO['questions'][number];

  it('starts at the first ungraded question and skips graded ones when advancing', () => {
    const questions = [q(true), q(true), q(false), q(true), q(false)];
    expect(firstUnresolvedIndex(questions)).toBe(2);
    expect(firstUnresolvedIndex(questions, 2)).toBe(4);
    expect(firstUnresolvedIndex(questions, 4)).toBe(-1);
  });

  it('detects a session where only complete is left', () => {
    const base = { questions: [], matchingRounds: [] } as unknown as QuizPlayDTO;
    expect(isQuizFullyResolved({ ...base, mode: 'MCQ', questions: [q(true), q(true)] })).toBe(true);
    expect(isQuizFullyResolved({ ...base, mode: 'MCQ', questions: [q(true), q(false)] })).toBe(false);
    const round = (completed: boolean) => ({ completed }) as QuizPlayDTO['matchingRounds'][number];
    expect(isQuizFullyResolved({ ...base, mode: 'MATCHING', matchingRounds: [round(true), round(true)] })).toBe(true);
    expect(isQuizFullyResolved({ ...base, mode: 'MATCHING', matchingRounds: [round(true), round(false)] })).toBe(false);
    expect(isQuizFullyResolved({ ...base, mode: 'MATCHING' })).toBe(false);
  });
});

describe('useFinishQuiz resync', () => {
  it('reloads the session instead of retrying when units are still unresolved', () => {
    const mutate = jest.fn();
    jest.mocked(useCompleteQuiz).mockReturnValue({ mutate, isPending: false } as unknown as ReturnType<typeof useCompleteQuiz>);
    const onResync = jest.fn();
    const { result } = renderHook(() => useFinishQuiz(7, onResync));

    result.current.finish();
    mutate.mock.calls[0][1].onError(apiError(409, 'QUIZ_HAS_UNRESOLVED_UNITS'));
    expect(onResync).toHaveBeenCalledTimes(1);
  });
});
