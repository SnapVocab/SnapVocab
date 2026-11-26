import type { LookupResultDTO } from '@/features/lookup/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-native';
import * as React from 'react';
import { client } from '@/lib/api';
import { invalidateAfterTopicItemAdded } from '../api';
import { useQuickSaveWord } from '../quick-save';
import { rememberSaveDestination } from '../save-destination';

jest.mock('@/lib/api', () => ({ client: jest.fn() }));
jest.mock('../api', () => ({ invalidateAfterTopicItemAdded: jest.fn() }));
jest.mock('../save-destination', () => ({ rememberSaveDestination: jest.fn() }));

const destination = { collectionId: 7, collectionName: 'My vocabulary', topicId: 51, topicName: 'New words', activeTemplateId: 11 };
const word = {
  wordId: 10,
  word: 'mug',
  langCode: 'vi',
  translations: [{ langCode: 'vi', translation: 'cái cốc' }],
  meanings: [],
  pronunciations: [],
} as unknown as LookupResultDTO;

function topicSchema(required: boolean) {
  return {
    topicId: 51,
    schemaId: 1,
    groups: [{
      groupId: 1,
      name: 'main',
      label: 'Main',
      multiple: false,
      position: 1,
      attributes: [
        { attributeId: 1, name: 'word', label: 'Word', dataType: 'TEXT', required: true, position: 1 },
        { attributeId: 2, name: 'meaning', label: 'Meaning', dataType: 'TEXT', required: true, position: 2 },
        { attributeId: 3, name: 'note', label: 'Note', dataType: 'TEXT', required, position: 3 },
      ],
    }],
  };
}

const schema = {
  id: 1,
  isSystem: true,
  name: 'Default',
  groups: [],
  templates: [{
    id: 11,
    schemaId: 1,
    name: 'Default',
    isDefault: true,
    elements: [
      { position: 1, type: 'FIELD', field: { schemaAttributeId: 1, semanticRole: 'TARGET_WORD', hideIfEmpty: false, audioAction: false } },
      { position: 2, type: 'FIELD', field: { schemaAttributeId: 2, semanticRole: 'NATIVE_TRANSLATION', hideIfEmpty: false, audioAction: false } },
    ],
  }],
};

/** GET topic schema, GET schema, then whatever the POST does. */
function serve(noteRequired: boolean, post: () => Promise<unknown>) {
  jest.mocked(client).mockImplementation((async (config: { url: string; method: string }) => {
    if (config.method === 'POST')
      return post();
    return { data: { data: config.url.startsWith('/api/topics/') ? topicSchema(noteRequired) : schema } };
  }) as any);
}

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  return renderHook(() => useQuickSaveWord(), { wrapper }).result;
}

beforeEach(() => jest.clearAllMocks());

it('saves the dictionary entry into the topic, with the scan it came from', async () => {
  serve(false, async () => ({ data: { data: { topicItemId: 99 } } }));
  const quickSave = setup();

  await expect(quickSave.current({ word, destination, scanRequestId: 'scan-1' })).resolves.toBe('saved');

  expect(client).toHaveBeenCalledWith({
    url: '/api/topics/51/items',
    method: 'POST',
    data: { main: { word: 'mug', meaning: 'cái cốc' } },
    params: { scanRequestId: 'scan-1' },
  });
  expect(invalidateAfterTopicItemAdded).toHaveBeenCalledWith(expect.anything(), 51);
  expect(rememberSaveDestination).toHaveBeenCalledWith(destination);
});

it('reports a word the topic already has instead of failing', async () => {
  serve(false, async () => {
    throw Object.assign(new Error('conflict'), { response: { status: 409, data: { error: 'WORD_ALREADY_IN_TOPIC' } } });
  });
  const quickSave = setup();

  await expect(quickSave.current({ word, destination })).resolves.toBe('duplicate');
  expect(invalidateAfterTopicItemAdded).not.toHaveBeenCalled();
});

it('sends the learner to the form when a required field has no dictionary value', async () => {
  serve(true, async () => ({}));
  const quickSave = setup();

  await expect(quickSave.current({ word, destination })).resolves.toBe('needs_form');
  expect(client).not.toHaveBeenCalledWith(expect.objectContaining({ method: 'POST' }));
});

it('a batch save leaves the refresh to the caller', async () => {
  serve(false, async () => ({ data: { data: { topicItemId: 99 } } }));
  const quickSave = setup();

  await quickSave.current({ word, destination, skipInvalidate: true });
  expect(invalidateAfterTopicItemAdded).not.toHaveBeenCalled();
});

it('other errors reach the caller', async () => {
  serve(false, async () => {
    throw Object.assign(new Error('server'), { response: { status: 500 } });
  });
  const quickSave = setup();

  await expect(quickSave.current({ word, destination })).rejects.toMatchObject({ response: { status: 500 } });
});
