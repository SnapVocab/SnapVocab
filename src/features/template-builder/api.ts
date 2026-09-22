import type { AxiosError } from 'axios';
import type { ApiResponse } from '../auth/api';
import type { TopicDTO } from '../learn/types';
import type { SchemaDTO, TopicSchemaDTO } from './types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/api';

export function useTopicSchema(topicId?: number) {
  return useQuery<TopicSchemaDTO, AxiosError>({
    queryKey: ['topic-schema', topicId],
    queryFn: async () => {
      const response = await client<ApiResponse<TopicSchemaDTO>>({
        url: `/api/topics/${topicId}/schema`,
        method: 'GET',
      });

      return response.data.data;
    },
    enabled: topicId !== undefined && topicId !== null,
  });
}

export function useSchema(schemaId?: number) {
  return useQuery<SchemaDTO, AxiosError>({
    queryKey: ['schema', schemaId],
    queryFn: async () => {
      const response = await client<ApiResponse<SchemaDTO>>({
        url: `/api/schemas/${schemaId}`,
        method: 'GET',
      });

      return response.data.data;
    },
    enabled: schemaId !== undefined && schemaId !== null,
  });
}

export function useSchemas() {
  return useQuery<SchemaDTO[], AxiosError>({
    queryKey: ['schemas'],
    queryFn: async () => {
      const response = await client<ApiResponse<SchemaDTO[]>>({
        url: '/api/schemas',
        method: 'GET',
      });

      return response.data.data;
    },
  });
}

export type ForkTopicSchemaParams = {
  topicId: number;
};

export function useForkTopicSchema() {
  const queryClient = useQueryClient();

  return useMutation<TopicSchemaDTO, AxiosError<ApiResponse<unknown>>, ForkTopicSchemaParams>({
    mutationFn: async ({ topicId }) => {
      const response = await client<ApiResponse<TopicSchemaDTO>>({
        url: `/api/topics/${topicId}/schema/fork`,
        method: 'POST',
      });

      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['topic-schema', variables.topicId] });
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
  });
}

export type SetActiveTemplateParams = {
  topicId: number;
  templateId: number;
};

export function useSetActiveTemplate() {
  const queryClient = useQueryClient();

  return useMutation<TopicDTO, AxiosError<ApiResponse<unknown>>, SetActiveTemplateParams>({
    mutationFn: async ({ topicId, templateId }) => {
      const response = await client<ApiResponse<TopicDTO>>({
        url: `/api/topics/${topicId}/active-template/${templateId}`,
        method: 'PUT',
      });

      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['topic-schema', variables.topicId] });
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
  });
}
