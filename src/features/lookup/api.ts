import type { AxiosError } from 'axios';
import type {
  LookupResultDTO,
  WordSuggestionParams,
  WordSuggestionResponse,
} from './types';
import type { ApiResponse } from '@/features/auth/api';
import type { PaginateResponse } from '@/lib/api/types';
import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/api';

export function useWordSuggestions(params: WordSuggestionParams) {
  return useQuery<PaginateResponse<WordSuggestionResponse>, AxiosError>({
    queryKey: ['word-suggestions', params],
    queryFn: async () => {
      const response = await client<ApiResponse<PaginateResponse<WordSuggestionResponse>>>({
        url: '/api/words/suggest',
        method: 'GET',
        params,
      });

      return response.data.data;
    },
    enabled: Boolean(params.q && params.q.trim().length > 0),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24,
  });
}

export function useWordById(id?: number | string | null) {
  return useQuery<LookupResultDTO, AxiosError>({
    queryKey: ['word', id],
    queryFn: async () => {
      const response = await client<ApiResponse<LookupResultDTO>>({
        url: `/api/words/${id}`,
        method: 'GET',
      });

      return response.data.data;
    },
    enabled: id !== undefined && id !== null && id !== '',
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
  });
}

export function useWordLookup(q?: string | null) {
  return useQuery<LookupResultDTO, AxiosError>({
    queryKey: ['word-lookup', q],
    queryFn: async () => {
      const response = await client<ApiResponse<LookupResultDTO>>({
        url: '/api/words/lookup',
        method: 'GET',
        params: { q },
      });

      return response.data.data;
    },
    enabled: Boolean(q && q.trim().length > 0),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
  });
}
