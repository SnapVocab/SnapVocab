import type { AxiosError } from 'axios';
import type { ApiResponse } from '../auth/api';
import type { Collection, UpdateCollectionDTO } from './types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/api';

export type GetCollectionsParams = {
  type?: 'SYSTEM' | 'USER';
};

export function useCollections(params?: GetCollectionsParams) {
  return useQuery<Collection[], AxiosError>({
    queryKey: ['collections', params],
    queryFn: async () => {
      const response = await client<ApiResponse<Collection[]>>({
        url: '/api/collections',
        method: 'GET',
        params,
      });

      return response.data.data;
    },
  });
}

export type UpdateCollectionParams = {
  id: number;
  data: UpdateCollectionDTO;
};

export function useUpdateCollection() {
  const queryClient = useQueryClient();

  return useMutation<Collection, AxiosError<ApiResponse<unknown>>, UpdateCollectionParams>({
    mutationFn: async ({ id, data }) => {
      const response = await client<ApiResponse<Collection>>({
        url: `/api/collections/${id}`,
        method: 'PUT',
        data,
      });

      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation<Collection, AxiosError<ApiResponse<unknown>>, UpdateCollectionDTO>({
    mutationFn: async (data) => {
      const response = await client<ApiResponse<Collection>>({
        url: '/api/collections',
        method: 'POST',
        data,
      });

      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<ApiResponse<unknown>>, number>({
    mutationFn: async (id) => {
      await client({
        url: `/api/collections/${id}`,
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}
