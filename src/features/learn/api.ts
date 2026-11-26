import type { QueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ApiResponse } from '../auth/api';
import type {
  AddTopicItemParams,
  Collection,
  CollectionTopicParams,
  CreateTopicDTO,
  DeleteTopicItemParams,
  TopicDTO,
  TopicItemData,
  UpdateCollectionDTO,
  UpdateTopicItemParams,
} from './types';
import type { CursorPaginationResponse, PaginateResponse } from '@/lib/api';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { syncBadges } from '@/features/badges/api';
import { invalidateProgress } from '@/features/progress/api';
import { invalidateStudy } from '@/features/study/api';
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
      void invalidateStudy(queryClient);
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
      void invalidateStudy(queryClient);
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
      void invalidateStudy(queryClient);
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
      // Every infinite topic list: the topic picker keys the collection id as a number, this mutation gets a string.
      queryClient.invalidateQueries({ queryKey: ['collection-topics-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      void invalidateStudy(queryClient);
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
    onSuccess: (_, variables) => invalidateAfterTopicItemAdded(queryClient, variables.topicId),
  });
}

/** Everything a new topic item changes: the topic's lists, counts, study queue, progress and badges. */
export function invalidateAfterTopicItemAdded(queryClient: QueryClient, topicId: number | string) {
  queryClient.invalidateQueries({ queryKey: ['topic-items', topicId] });
  queryClient.invalidateQueries({ queryKey: ['topic-items', String(topicId)] });
  queryClient.invalidateQueries({ queryKey: ['topic-items-cursor', topicId] });
  queryClient.invalidateQueries({ queryKey: ['topic-items-cursor', String(topicId)] });
  queryClient.invalidateQueries({ queryKey: ['topic-items-infinite', topicId] });
  queryClient.invalidateQueries({ queryKey: ['topic-items-infinite', String(topicId)] });
  queryClient.invalidateQueries({ queryKey: ['collections'] });
  void invalidateStudy(queryClient);
  queryClient.invalidateQueries({ queryKey: ['collection-topics'] });
  invalidateProgress(queryClient);
  // A quiz-ready word may complete a word badge; a credited scan save is a study day (badges.md §9).
  void syncBadges(queryClient);
}

export function useTopicItem(topicId?: number | string, itemId?: number | string) {
  return useQuery<TopicItemData, AxiosError>({
    queryKey: ['topic-item', topicId, itemId],
    queryFn: async () => {
      const response = await client<ApiResponse<TopicItemData>>({
        url: `/api/topics/${topicId}/items/${itemId}`,
        method: 'GET',
      });
      const item = response.data.data as TopicItemData & Record<string, any>;
      if (item.groups) {
        return item;
      }
      const { topicItemId, createdAt, ...groups } = item;
      return { topicItemId, createdAt, groups };
    },
    enabled: topicId !== undefined && topicId !== null && itemId !== undefined && itemId !== null,
  });
}

export function useUpdateTopicItem() {
  const queryClient = useQueryClient();

  return useMutation<TopicItemData, AxiosError<ApiResponse<unknown>>, UpdateTopicItemParams>({
    mutationFn: async ({ topicId, itemId, data }) => {
      const response = await client<ApiResponse<TopicItemData>>({
        url: `/api/topics/${topicId}/items/${itemId}`,
        method: 'PUT',
        data,
      });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['topic-item', variables.topicId, variables.itemId] });
      queryClient.invalidateQueries({ queryKey: ['topic-items', variables.topicId] });
      queryClient.invalidateQueries({ queryKey: ['topic-items', String(variables.topicId)] });
      queryClient.invalidateQueries({ queryKey: ['topic-items-cursor', variables.topicId] });
      queryClient.invalidateQueries({ queryKey: ['topic-items-cursor', String(variables.topicId)] });
      queryClient.invalidateQueries({ queryKey: ['topic-items-infinite', variables.topicId] });
      queryClient.invalidateQueries({ queryKey: ['topic-items-infinite', String(variables.topicId)] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      void invalidateStudy(queryClient);
      queryClient.invalidateQueries({ queryKey: ['collection-topics'] });
    },
  });
}

export function useDeleteTopicItem() {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<ApiResponse<unknown>>, DeleteTopicItemParams>({
    mutationFn: async ({ topicId, itemId }) => {
      await client({
        url: `/api/topics/${topicId}/items/${itemId}`,
        method: 'DELETE',
      });
    },
    onSuccess: (_, variables) => {
      queryClient.removeQueries({ queryKey: ['topic-item', variables.topicId, variables.itemId] });
      queryClient.invalidateQueries({ queryKey: ['topic-items', variables.topicId] });
      queryClient.invalidateQueries({ queryKey: ['topic-items', String(variables.topicId)] });
      queryClient.invalidateQueries({ queryKey: ['topic-items-cursor', variables.topicId] });
      queryClient.invalidateQueries({ queryKey: ['topic-items-cursor', String(variables.topicId)] });
      queryClient.invalidateQueries({ queryKey: ['topic-items-infinite', variables.topicId] });
      queryClient.invalidateQueries({ queryKey: ['topic-items-infinite', String(variables.topicId)] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      void invalidateStudy(queryClient);
      queryClient.invalidateQueries({ queryKey: ['collection-topics'] });
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
