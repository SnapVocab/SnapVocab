import type { ReviewResult, StudyCard } from '../api';
import type { Mnemonic } from '../mnemonic-api';
import { act, renderHook } from '@testing-library/react-native';
import { mnemonicErrorKey } from '../mnemonic-api';
import { useSessionMnemonics } from '../use-session-mnemonics';

jest.mock('@/lib/api', () => ({ client: jest.fn() }));

function card(topicItemId: number, forgetCount: number, mnemonic: Mnemonic | null = null): StudyCard {
  return {
    item: { topicItemId, main: { word: `word-${topicItemId}` } } as unknown as StudyCard['item'],
    topicId: 1,
    collectionName: 'Hello',
    state: 'LEARNING',
    due: null,
    forgetCount,
    mnemonic,
  };
}
function rated(topicItemId: number, forgetCount: number): ReviewResult {
  return {
    topicItemId,
    state: 'RELEARNING',
    due: '2026-11-27T00:00:00',
    stability: 1,
    difficulty: 5,
    reps: 3,
    lapses: 0,
    xpAwarded: 2,
    becameMastered: false,
    forgetCount,
  };
}
const tip: Mnemonic = { topicItemId: 5, type: 'STORY', keyword: null, content: 'mẹo', updatedAt: '2026-11-26T00:00:00Z' };

describe('mnemonics during a study session', () => {
  it('names the word in the sheet and keeps its count fresh when the open card gets rated', () => {
    const { result } = renderHook(() => useSessionMnemonics());

    act(() => result.current.open(7, 2, { word: result.current.wordOf(card(7, 2)) }));
    expect(result.current.sheet.target).toMatchObject({ topicItemId: 7, word: 'word-7', forgetCount: 2 });

    act(() => result.current.onRated(card(7, 2), rated(7, 3)));
    expect(result.current.sheet.target).toMatchObject({ topicItemId: 7, forgetCount: 3 });
  });

  it('raises the banner on the "Quên" that makes a word a leech, not before', () => {
    const { result } = renderHook(() => useSessionMnemonics());

    act(() => result.current.onRated(card(5, 0), rated(5, 1)));
    expect(result.current.prompt).toBeNull();

    act(() => result.current.onRated(card(6, 1), rated(6, 2)));
    expect(result.current.prompt).toEqual({ topicItemId: 6, forgetCount: 2, word: 'word-6' });
  });

  it('does not nag about a word rated "Tốt" or one that already has a mnemonic', () => {
    const { result } = renderHook(() => useSessionMnemonics());

    act(() => result.current.onRated(card(5, 3), rated(5, 3)));
    expect(result.current.prompt).toBeNull();

    act(() => result.current.onRated(card(5, 3, tip), rated(5, 4)));
    expect(result.current.prompt).toBeNull();
  });

  it('offers a mnemonic on the back of a leech and shows one made during the session', () => {
    const { result } = renderHook(() => useSessionMnemonics());

    expect(result.current.stripFor(card(5, 1))).toEqual({ mnemonic: null, forgetCount: 1, offer: false });
    expect(result.current.stripFor(card(5, 2)).offer).toBe(true);

    act(() => result.current.sheet.onChanged(5, tip));
    expect(result.current.stripFor(card(5, 2))).toEqual({ mnemonic: tip, forgetCount: 2, offer: false });

    act(() => result.current.sheet.onChanged(5, null));
    expect(result.current.stripFor(card(5, 2, tip)).mnemonic).toBeNull();
  });

  it('clears the banner once that word gets its mnemonic', () => {
    const { result } = renderHook(() => useSessionMnemonics());
    act(() => result.current.onRated(card(6, 1), rated(6, 2)));

    act(() => result.current.sheet.onChanged(6, { ...tip, topicItemId: 6 }));

    expect(result.current.prompt).toBeNull();
  });
});

describe('mnemonic error messages', () => {
  const failure = (error: string) => ({ response: { data: { error } } }) as never;

  it('tells quota, AI outage and the rest apart', () => {
    expect(mnemonicErrorKey(failure('MNEMONIC_QUOTA_EXCEEDED'))).toBe('mnemonic.error_quota');
    expect(mnemonicErrorKey(failure('AI_UNAVAILABLE'))).toBe('mnemonic.error_ai');
    expect(mnemonicErrorKey(failure('NOT_A_LEECH'))).toBe('mnemonic.error_not_leech');
    expect(mnemonicErrorKey(null)).toBe('mnemonic.error_generic');
  });
});
