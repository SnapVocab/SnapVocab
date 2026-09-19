import type { AxiosError } from 'axios';
import type { ApiResponse } from '../auth/api';
import type { Collection, CollectionTopicParams, TopicDTO, UpdateCollectionDTO } from './types';
import type { PaginateResponse } from '@/lib/api/types';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export function useCollectionTopics(id: number | string, params: CollectionTopicParams) {
  return useQuery<PaginateResponse<TopicDTO>, AxiosError>({
    queryKey: ['collection-topics', id, params],
    queryFn: async () => {
      const queryParams: Record<string, unknown> = {};
      if (params.parentId !== undefined && params.parentId !== null) {
        queryParams.parentId = params.parentId;
      }
      if (params.page !== undefined && params.page !== null) {
        queryParams.page = params.page;
      }
      if (params.size !== undefined && params.size !== null) {
        queryParams.size = params.size;
      }

      const response = await client<ApiResponse<PaginateResponse<TopicDTO>>>({
        url: `/api/collections/${id}/topics`,
        method: 'GET',
        params: queryParams,
      });

      return response.data.data;
    },
    enabled: id !== undefined && id !== null && id !== '',
  });
}

export type InfiniteCollectionTopicParams = {
  parentId?: number | null;
  size?: number;
};

export function useInfiniteCollectionTopics(
  id: number | string,
  params?: InfiniteCollectionTopicParams,
) {
  return useInfiniteQuery<PaginateResponse<TopicDTO>, AxiosError>({
    queryKey: ['collection-topics-infinite', id, params],
    queryFn: async ({ pageParam = 0 }) => {
      const queryParams: Record<string, unknown> = {
        page: pageParam,
        size: params?.size ?? 15,
      };
      if (params?.parentId !== undefined && params?.parentId !== null) {
        queryParams.parentId = params.parentId;
      }

      const response = await client<ApiResponse<PaginateResponse<TopicDTO>>>({
        url: `/api/collections/${id}/topics`,
        method: 'GET',
        params: queryParams,
      });

      return response.data.data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.meta;
      return page + 1 < pages ? page + 1 : undefined;
    },
    enabled: id !== undefined && id !== null && id !== '',
  });
}
