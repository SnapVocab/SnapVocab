import type { AxiosError } from 'axios';
import type {
  GenerateStoryRequest,
  StoryDTO,
  StoryListResponse,
  StoryTopicSummaryDTO,
  StoryTopicWordsResponse,
  SubmitStoryClozeRequest,
  SubmitStoryClozeResponse,
} from './types';
import type { ApiResponse } from '@/features/auth/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/api';

export const storyKeys = {
  all: ['stories'] as const,
  list: (page = 0) => ['stories', 'list', page] as const,
  detail: (id: number) => ['stories', 'detail', id] as const,
  topics: ['stories', 'system-topics'] as const,
  topicWords: (topicId: number) => ['stories', 'topic-words', topicId] as const,
};

export function useStoryTopics() {
  return useQuery<StoryTopicSummaryDTO[], AxiosError>({
    queryKey: storyKeys.topics,
    queryFn: async () => {
      const response = await client.get<ApiResponse<StoryTopicSummaryDTO[]>>('/api/stories/topics');
      return response.data.data;
    },
  });
}

export function useStoryTopicWords(topicId?: number | null) {
  return useQuery<StoryTopicWordsResponse, AxiosError>({
    queryKey: storyKeys.topicWords(topicId ?? 0),
    queryFn: async () => {
      const response = await client.get<ApiResponse<StoryTopicWordsResponse>>(
        `/api/stories/topics/${topicId}/words`,
      );
      return response.data.data;
    },
    enabled: Boolean(topicId && topicId > 0),
  });
}

export function useStories(page = 0, size = 20) {
  return useQuery<StoryListResponse, AxiosError>({
    queryKey: storyKeys.list(page),
    queryFn: async () => {
      const response = await client.get<ApiResponse<StoryListResponse>>('/api/stories', {
        params: { page, size },
      });
      return response.data.data;
    },
  });
}

export function useStory(id?: number) {
  return useQuery<StoryDTO, AxiosError>({
    queryKey: storyKeys.detail(id ?? 0),
    queryFn: async () => {
      const response = await client.get<ApiResponse<StoryDTO>>(`/api/stories/${id}`);
      return response.data.data;
    },
    enabled: id !== undefined && id > 0,
  });
}

export function useGenerateStory() {
  const queryClient = useQueryClient();
  return useMutation<StoryDTO, AxiosError<ApiResponse<unknown>>, GenerateStoryRequest>({
    mutationFn: async (data) => {
      const response = await client.post<ApiResponse<StoryDTO>>('/api/stories/generate', data);
      return response.data.data;
    },
    onSuccess: (created) => {
      queryClient.setQueryData(storyKeys.detail(created.id), created);
      void queryClient.invalidateQueries({ queryKey: storyKeys.all });
    },
  });
}

export function useSubmitStoryCloze() {
  const queryClient = useQueryClient();
  return useMutation<
    SubmitStoryClozeResponse,
    AxiosError<ApiResponse<unknown>>,
    { storyId: number; data: SubmitStoryClozeRequest }
  >({
    mutationFn: async ({ storyId, data }) => {
      const response = await client.post<ApiResponse<SubmitStoryClozeResponse>>(
        `/api/stories/${storyId}/submit`,
        data,
      );
      return response.data.data;
    },
    onSuccess: (_, { storyId }) => {
      void queryClient.invalidateQueries({ queryKey: storyKeys.detail(storyId) });
      void queryClient.invalidateQueries({ queryKey: storyKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['progress'] });
      void queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useDeleteStory() {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError<ApiResponse<unknown>>, number>({
    mutationFn: async (storyId) => {
      await client.delete(`/api/stories/${storyId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: storyKeys.all });
    },
  });
}
