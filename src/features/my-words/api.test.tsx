import type { LookupResultDTO } from '@/features/lookup/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as React from 'react';
import { client } from '@/lib/api';
import { useMyWords, useSetMyWord } from './api';

jest.mock('@/lib/api', () => ({ client: Object.assign(jest.fn(), { get: jest.fn() }) }));
const clients: QueryClient[] = [];
afterEach(() => {
  clients.splice(0).forEach(client => client.clear());
});

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  clients.push(queryClient);
  const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  return { queryClient, wrapper };
}

it('saving and removing synchronize detail, lookup and every occurrence in scan results', async () => {
  const { queryClient, wrapper } = setup();
  const word = { wordId: 10, word: 'mug', inMyVocabulary: false } as LookupResultDTO;
  queryClient.setQueryData(['word', 10], word);
  queryClient.setQueryData(['word-lookup', 'mug'], word);
  queryClient.setQueryData(['scan-status', 'scan-1'], { status: 'DONE', result: { items: [{ word }, { word }] } });
  jest.mocked(client).mockResolvedValue({ status: 204 });
  const { result } = renderHook(() => useSetMyWord(), { wrapper });
  await act(async () => {
    await result.current.mutateAsync({ wordId: 10, saved: true });
  });
  expect(client).toHaveBeenCalledWith({ url: '/api/words/my/10', method: 'PUT' });
  expect(queryClient.getQueryData(['word', 10])).toMatchObject({ inMyVocabulary: true });
  expect(queryClient.getQueryData(['word-lookup', 'mug'])).toMatchObject({ inMyVocabulary: true });
  expect(queryClient.getQueryData(['scan-status', 'scan-1'])).toMatchObject({ result: { items: [{ word: { inMyVocabulary: true } }, { word: { inMyVocabulary: true } }] } });
  await act(async () => {
    await result.current.mutateAsync({ wordId: 10, saved: false });
  });
  expect(client).toHaveBeenLastCalledWith({ url: '/api/words/my/10', method: 'DELETE' });
  expect(queryClient.getQueryData(['word', 10])).toMatchObject({ inMyVocabulary: false });
});

it('a failed save leaves membership unchanged', async () => {
  const { queryClient, wrapper } = setup();
  queryClient.setQueryData(['word', 10], { wordId: 10, inMyVocabulary: false });
  jest.mocked(client).mockRejectedValueOnce(new Error('offline'));
  const { result } = renderHook(() => useSetMyWord(), { wrapper });
  await act(async () => {
    await expect(result.current.mutateAsync({ wordId: 10, saved: true })).rejects.toThrow('offline');
  });
  expect(queryClient.getQueryData(['word', 10])).toMatchObject({ inMyVocabulary: false });
});

it('loads all personal-word pages using the backend pagination envelope', async () => {
  const { wrapper } = setup();
  jest.mocked(client.get).mockImplementation(async (_url, config) => ({ data: { data: {
    data: [{ id: config?.params.page === 0 ? 10 : 11, word: 'mug' }],
    meta: { page: config?.params.page ?? 0, pages: 2, total: 2, size: 30 },
  } } }));
  const { result } = renderHook(() => useMyWords(), { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.hasNextPage).toBe(true);
  await act(async () => {
    await result.current.fetchNextPage();
  });
  await waitFor(() => expect(result.current.data?.pages.flatMap(page => page.data).map(word => word.id)).toEqual([10, 11]));
  expect(result.current.hasNextPage).toBe(false);
});
