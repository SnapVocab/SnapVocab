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

export function useCollection(id?: number | string) {
  return useQuery<Collection, AxiosError>({
    queryKey: ['collection', id],
    queryFn: async () => {
      const response = await client<ApiResponse<Collection>>({
        url: `/api/collections/${id}`,
        method: 'GET',
      });

      return response.data.data;
    },
    enabled: id !== undefined && id !== null && id !== '',
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collection', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['collection', String(variables.id)] });
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
