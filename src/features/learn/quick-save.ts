import type { SaveDestination } from './save-destination';
import type { LookupResultDTO } from '@/features/lookup/types';
import { useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { fetchSchema, fetchTopicSchema } from '@/features/template-builder/api';
import { client } from '@/lib/api';
import { invalidateAfterTopicItemAdded } from './api';
import { buildAddWordPayload, initializeFormData, validateAddWordForm } from './components/add-word/add-word-helpers';
import { prefillLookup, withTemplateRoles } from './components/add-word/lookup-prefill';
import { rememberSaveDestination } from './save-destination';

/**
 * saved: a new card in the topic. duplicate: the topic already has this word (AF-07.1).
 * needs_form: the topic asks for something the dictionary cannot fill, so the learner completes the form.
 */
export type QuickSaveOutcome = 'saved' | 'duplicate' | 'needs_form';

type QuickSaveParams = {
  word: LookupResultDTO;
  destination: SaveDestination;
  scanRequestId?: string;
  /** A batch refreshes once at the end with {@link invalidateAfterTopicItemAdded}. */
  skipInvalidate?: boolean;
};

/** Saves a dictionary word into a topic without the form, prefilled the way the add-word form would be. */
export function useQuickSaveWord() {
  const queryClient = useQueryClient();

  return React.useCallback(async ({ word, destination, scanRequestId, skipInvalidate }: QuickSaveParams): Promise<QuickSaveOutcome> => {
    const { topicId } = destination;
    const rawSchema = await queryClient.fetchQuery({
      queryKey: ['topic-schema', topicId],
      queryFn: () => fetchTopicSchema(topicId),
    });
    const schemaId = rawSchema.schemaId;
    const fullSchema = schemaId === undefined
      ? undefined
      : await queryClient.fetchQuery({ queryKey: ['schema', schemaId], queryFn: () => fetchSchema(schemaId) });
    const templates = fullSchema?.templates ?? [];
    const template = (destination.activeTemplateId
      ? templates.find(item => item.id === destination.activeTemplateId)
      : undefined) ?? templates.find(item => item.isDefault) ?? templates[0];
    const schema = withTemplateRoles(rawSchema, template);

    const formData = prefillLookup(schema, initializeFormData(schema), word);
    const payload = buildAddWordPayload(schema, formData);
    if (validateAddWordForm(schema, formData).hasError || Object.keys(payload).length === 0)
      return 'needs_form';

    try {
      await client({
        url: `/api/topics/${topicId}/items`,
        method: 'POST',
        data: payload,
        params: scanRequestId ? { scanRequestId } : undefined,
      });
    }
    catch (error: any) {
      if (error?.response?.status === 409 && error?.response?.data?.error === 'WORD_ALREADY_IN_TOPIC')
        return 'duplicate';
      throw error;
    }
    if (!skipInvalidate)
      invalidateAfterTopicItemAdded(queryClient, topicId);
    rememberSaveDestination(destination);
    return 'saved';
  }, [queryClient]);
}
