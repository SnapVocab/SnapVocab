import type { AxiosError } from 'axios';
import type { ApiResponse } from '@/features/auth/api';
import type { LookupResultDTO, MyWordResponse } from '@/features/lookup/types';
import type { ScanRequestStatus } from '@/features/scan/types';
import type { PaginateResponse } from '@/lib/api/types';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/api';

export function useMyWords() {
  return useInfiniteQuery({
    queryKey: ['my-words'],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const response = await client.get<ApiResponse<PaginateResponse<MyWordResponse>>>('/api/words/my', {
        params: { page: pageParam, size: 30 },
      });
      return response.data.data;
    },
    getNextPageParam: page => page.meta.page + 1 < page.meta.pages ? page.meta.page + 1 : undefined,
  });
}

export function useSetMyWord() {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, { wordId: number; saved: boolean }>({
    mutationFn: async ({ wordId, saved }) => {
      await client({ url: `/api/words/my/${wordId}`, method: saved ? 'PUT' : 'DELETE' });
    },
    onSuccess: async (_, { wordId, saved }) => {
      // Update every occurrence, including duplicate detections of the same word.
      for (const key of ['word', 'word-lookup']) {
        await queryClient.cancelQueries({ queryKey: [key] });
        queryClient.setQueriesData<LookupResultDTO>({ queryKey: [key] }, data =>
          data?.wordId === wordId ? { ...data, inMyVocabulary: saved } : data);
      }
      await queryClient.cancelQueries({ queryKey: ['scan-status'] });
      queryClient.setQueriesData<ScanRequestStatus>({ queryKey: ['scan-status'] }, data =>
        data?.result
          ? { ...data, result: { ...data.result, items: data.result.items.map(item =>
              item.word?.wordId === wordId ? { ...item, word: { ...item.word, inMyVocabulary: saved } } : item) } }
          : data);
      await queryClient.invalidateQueries({ queryKey: ['my-words'] });
      // Queries without a wordId (old cached responses) must be refreshed too.
      void queryClient.invalidateQueries({ queryKey: ['word'] });
      void queryClient.invalidateQueries({ queryKey: ['word-lookup'] });
    },
  });
}
