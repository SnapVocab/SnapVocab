import type { AxiosError } from 'axios';
import type { ApiResponse } from '../auth/api';
import type {
  AddTopicItemParams,
  Collection,
  CollectionTopicParams,
  CreateTopicDTO,
  TopicDTO,
  TopicItemData,
  UpdateCollectionDTO,
} from './types';
import type { CursorPaginationResponse, PaginateResponse } from '@/lib/api';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { syncBadges } from '@/features/badges/api';
import { invalidateProgress } from '@/features/progress/api';
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
      // Its words leave the learner's vocabulary total.
      invalidateProgress(queryClient);
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

export type CreateTopicParams = {
  collectionId: number | string;
  data: CreateTopicDTO;
};

export function useCreateTopic() {
  const queryClient = useQueryClient();

  return useMutation<TopicDTO, AxiosError<ApiResponse<unknown>>, CreateTopicParams>({
    mutationFn: async ({ collectionId, data }) => {
      const response = await client<ApiResponse<TopicDTO>>({
        url: `/api/collections/${collectionId}/topics`,
        method: 'POST',
        data,
      });

      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collection-topics', variables.collectionId] });
      queryClient.invalidateQueries({ queryKey: ['collection-topics', String(variables.collectionId)] });
      queryClient.invalidateQueries({ queryKey: ['collection-topics-infinite', variables.collectionId] });
      queryClient.invalidateQueries({ queryKey: ['collection-topics-infinite', String(variables.collectionId)] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

export function useAddTopicItem() {
  const queryClient = useQueryClient();

  return useMutation<TopicItemData, AxiosError<ApiResponse<unknown>>, AddTopicItemParams>({
    mutationFn: async ({ topicId, data, scanRequestId }) => {
      const response = await client<ApiResponse<TopicItemData>>({
        url: `/api/topics/${topicId}/items`,
        method: 'POST',
        data,
        params: scanRequestId ? { scanRequestId } : undefined,
      });

      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['topic-items', variables.topicId] });
      queryClient.invalidateQueries({ queryKey: ['topic-items', String(variables.topicId)] });
      queryClient.invalidateQueries({ queryKey: ['topic-items-cursor', variables.topicId] });
      queryClient.invalidateQueries({ queryKey: ['topic-items-cursor', String(variables.topicId)] });
      queryClient.invalidateQueries({ queryKey: ['topic-items-infinite', variables.topicId] });
      queryClient.invalidateQueries({ queryKey: ['topic-items-infinite', String(variables.topicId)] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collection-topics'] });
      invalidateProgress(queryClient);
      // A quiz-ready word may complete a word badge; a credited scan save is a study day (badges.md §9).
      void syncBadges(queryClient);
    },
  });
}

export function useTopicItems(topicId?: number | string, page = 0, size = 20) {
  return useQuery<PaginateResponse<TopicItemData>, AxiosError>({
    queryKey: ['topic-items', topicId, { page, size }],
    queryFn: async () => {
      const response = await client<ApiResponse<PaginateResponse<TopicItemData>>>({
        url: `/api/topics/${topicId}`,
        method: 'GET',
        params: { page, size },
      });

      return response.data.data;
    },
    enabled: topicId !== undefined && topicId !== null && topicId !== '',
  });
}

export function useInfiniteTopicItems(topicId?: number | string | null, limit = 20) {
  return useInfiniteQuery<CursorPaginationResponse<TopicItemData>, AxiosError>({
    queryKey: ['topic-items-cursor', topicId, limit],
    queryFn: async ({ pageParam }) => {
      const response = await client<ApiResponse<CursorPaginationResponse<TopicItemData>>>({
        url: `/api/topics/${topicId}/cursor`,
        method: 'GET',
        params: {
          cursor: pageParam ?? undefined,
          limit,
        },
      });

      return response.data.data;
    },
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasNext || lastPage.nextCursor === null || lastPage.nextCursor === undefined) {
        return undefined;
      }
      return lastPage.nextCursor;
    },
    enabled: topicId !== undefined && topicId !== null && topicId !== '',
  });
}
