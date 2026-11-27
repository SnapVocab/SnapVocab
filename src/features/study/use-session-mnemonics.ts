import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { ReviewResult, StudyCard } from './api';
import type { MnemonicTarget } from './components/mnemonic-sheet';
import type { Mnemonic } from './mnemonic-api';
import * as React from 'react';
import { extractTopicItemDisplay } from '@/features/learn/components/collection-detail/topic-item-utils';
import { MIN_FORGET_COUNT } from './mnemonic-api';

/** The card just forgotten for the 2nd+ time, offered a mnemonic above the next card. */
export type LeechPrompt = { topicItemId: number; forgetCount: number; word: string | null };

function wordOf(card: StudyCard) {
  const { word } = extractTopicItemDisplay(card.item);
  return word === '—' ? null : word;
}

/**
 * Mnemonics during a study session. Cards leave the queue once rated, so a leech is caught twice: on the card's back
 * (already forgotten twice before this session) and right after the "Quên" that makes it one (a banner).
 * Mnemonics made here live in `overrides` because the session does not refetch its queue.
 */
export function useSessionMnemonics() {
  const sheetRef = React.useRef<BottomSheetModal>(null);
  const [overrides, setOverrides] = React.useState<Record<number, Mnemonic | null>>({});
  const [forgetCounts, setForgetCounts] = React.useState<Record<number, number>>({});
  const [target, setTarget] = React.useState<MnemonicTarget | null>(null);
  const [prompt, setPrompt] = React.useState<LeechPrompt | null>(null);

  const mnemonicOf = React.useCallback((topicItemId: number, fromQueue?: Mnemonic | null) =>
    topicItemId in overrides ? overrides[topicItemId] : fromQueue ?? null, [overrides]);

  const forgetCountOf = (card: StudyCard) => forgetCounts[card.item.topicItemId] ?? card.forgetCount ?? 0;

  /** What the back of `card` shows: its mnemonic, the button to make one, or nothing. */
  const stripFor = (card: StudyCard) => {
    const mnemonic = mnemonicOf(card.item.topicItemId, card.mnemonic);
    const forgetCount = forgetCountOf(card);
    return { mnemonic, forgetCount, offer: !mnemonic && forgetCount >= MIN_FORGET_COUNT };
  };

  type OpenExtras = { word?: string | null; fromQueue?: Mnemonic | null };
  const open = (topicItemId: number, forgetCount: number, { word = null, fromQueue }: OpenExtras = {}) => {
    setTarget({ topicItemId, word, forgetCount, mnemonic: mnemonicOf(topicItemId, fromQueue) });
    sheetRef.current?.present();
  };

  /** After a rating: the "Quên" that makes a word a leech without a mnemonic raises the banner. */
  const onRated = (card: StudyCard, result: ReviewResult) => {
    const id = card.item.topicItemId;
    if (result.forgetCount === undefined)
      return;
    setForgetCounts(previous => ({ ...previous, [id]: result.forgetCount! }));
    // The sheet may already be open for this card (opened from its back before rating).
    setTarget(current => current?.topicItemId === id ? { ...current, forgetCount: result.forgetCount! } : current);
    const forgotNow = result.forgetCount > forgetCountOf(card);
    if (forgotNow && result.forgetCount >= MIN_FORGET_COUNT && !mnemonicOf(id, card.mnemonic))
      setPrompt({ topicItemId: id, forgetCount: result.forgetCount, word: wordOf(card) });
  };

  const sheet = {
    ref: sheetRef,
    target,
    onChanged: (topicItemId: number, mnemonic: Mnemonic | null) => {
      setOverrides(previous => ({ ...previous, [topicItemId]: mnemonic }));
      setTarget(current => current && current.topicItemId === topicItemId ? { ...current, mnemonic } : current);
      if (mnemonic)
        setPrompt(current => current?.topicItemId === topicItemId ? null : current);
    },
    onRequestClose: () => sheetRef.current?.dismiss(),
    onDismissed: () => setTarget(null),
  };

  return {
    sheet,
    stripFor,
    open,
    onRated,
    prompt,
    openPrompt: () => prompt && open(prompt.topicItemId, prompt.forgetCount, { word: prompt.word }),
    wordOf,
    dismissPrompt: () => setPrompt(null),
  };
}
