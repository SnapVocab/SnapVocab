import type { ItemSaveState } from './components/detected-item-card';
import type { ScanItem } from './types';
import type { SaveDestination } from '@/features/learn/save-destination';
import type { LookupResultDTO } from '@/features/lookup/types';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { showErrorMessage, showSuccessMessage } from '@/components/ui';
import { invalidateAfterTopicItemAdded } from '@/features/learn/api';
import { useQuickSaveWord } from '@/features/learn/quick-save';
import { forgetSaveDestination, isDestinationGone, resolveSaveDestination, useSaveDestination, useSavedThroughForm } from '@/features/learn/save-destination';
import { translate } from '@/lib/i18n';

/**
 * Saving scanned words into a topic (BF-07): one tap per word, or "Lưu N từ" for the words the AI is fairly sure of,
 * into the remembered topic, else the default one; "Đổi" picks another.
 */
export function useScanSave(requestId: string, items: ScanItem[]) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const destination = useSaveDestination();
  const quickSave = useQuickSaveWord();
  const [ownStates, setSaveStates] = useState<Record<number, ItemSaveState>>({});
  // Cards completed in the add-word form ("Điền thủ công") count as saved when the learner comes back.
  const savedThroughForm = useSavedThroughForm(state => state.words);
  const saveStates: Record<number, ItemSaveState> = { ...ownStates };
  items.forEach((item, index) => {
    const key = (item.word?.word ?? item.label).trim().toLowerCase();
    if (ownStates[index] !== 'saving' && savedThroughForm.includes(key))
      saveStates[index] = 'saved';
  });
  const [savingAll, setSavingAll] = useState(false);
  const setSaveState = (index: number, state: ItemSaveState) => setSaveStates(prev => ({ ...prev, [index]: state }));

  /** Opens the add-word form on the destination topic, prefilled from the word when the dictionary knows it. */
  const openForm = async (item: ScanItem) => {
    try {
      const target = await resolveSaveDestination(destination);
      router.push({
        pathname: '/collections/add-word',
        params: {
          topicId: String(target.topicId),
          topicName: target.topicName,
          collectionId: String(target.collectionId),
          collectionName: target.collectionName,
          word: item.word?.word ?? item.label,
          ...(item.word?.wordId ? { wordId: String(item.word.wordId) } : {}),
          ...(target.activeTemplateId ? { activeTemplateId: String(target.activeTemplateId) } : {}),
          scanRequestId: requestId,
        },
      });
    }
    catch {
      showErrorMessage(translate('scan.result.save_error'));
    }
  };

  /** The remembered topic may have been deleted since: forget it, say so, and save into the default topic. */
  const saveInto = async (word: LookupResultDTO, target: SaveDestination, skipInvalidate = false) => {
    try {
      return { outcome: await quickSave({ word, destination: target, scanRequestId: requestId, skipInvalidate }), target };
    }
    catch (error) {
      if (!isDestinationGone(error))
        throw error;
      forgetSaveDestination();
      showErrorMessage(translate('scan.result.destination_gone'));
      const fallback = await resolveSaveDestination(null);
      return { outcome: await quickSave({ word, destination: fallback, scanRequestId: requestId, skipInvalidate }), target: fallback };
    }
  };

  const saveOne = async (index: number, item: ScanItem) => {
    if (!item.word)
      return;
    setSaveState(index, 'saving');
    try {
      const { outcome, target } = await saveInto(item.word as LookupResultDTO, await resolveSaveDestination(destination));
      setSaveState(index, outcome);
      if (outcome === 'saved')
        showSuccessMessage(translate('scan.result.saved_to', { topic: target.topicName }));
    }
    catch {
      setSaveState(index, 'error');
    }
  };

  // Low-reliability guesses are saved one by one, never in bulk.
  const bulkIndexes = items.flatMap((item, index) => item.word?.wordId && item.reliability !== 'LOW'
    && ['idle', 'error', undefined].includes(saveStates[index]) ? [index] : []);
  const savedCount = Object.values(saveStates).filter(state => state === 'saved').length;
  const busy = savingAll || Object.values(saveStates).includes('saving');

  /** "Lưu tất cả" (BF-07 step 1): one after another into one topic, then one refresh. */
  const saveAll = async () => {
    setSavingAll(true);
    let target: SaveDestination;
    try {
      target = await resolveSaveDestination(destination);
    }
    catch {
      setSavingAll(false);
      showErrorMessage(translate('scan.result.save_error'));
      return;
    }
    let saved = 0;
    let manual = 0;
    for (const index of bulkIndexes) {
      setSaveState(index, 'saving');
      try {
        const result = await saveInto(items[index].word as LookupResultDTO, target, true);
        // After a fallback the rest of the batch goes to the default topic too.
        target = result.target;
        setSaveState(index, result.outcome);
        if (result.outcome === 'saved')
          saved += 1;
        if (result.outcome === 'needs_form')
          manual += 1;
      }
      catch {
        setSaveState(index, 'error');
      }
    }
    if (saved > 0)
      invalidateAfterTopicItemAdded(queryClient, target.topicId);
    setSavingAll(false);
    if (saved > 0)
      showSuccessMessage(translate('scan.result.saved_many', { count: saved, topic: target.topicName }));
    if (manual > 0)
      showErrorMessage(translate('scan.result.needs_form_many', { count: manual }));
  };

  return {
    destination,
    saveStates,
    savingAll,
    bulkIndexes,
    savedCount,
    busy,
    openForm,
    saveOne,
    saveAll,
    /** A new scan of the same photo starts over. */
    reset: () => setSaveStates({}),
    changeDestination: () => router.push({ pathname: '/scan-save', params: { mode: 'pick' } }),
  };
}
