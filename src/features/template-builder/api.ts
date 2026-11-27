import type { AxiosError } from 'axios';
import type { ApiResponse } from '../auth/api';
import type { TopicDTO } from '../learn/types';
import type { SchemaDTO, TemplateDTO, TemplateElementDTO, TopicSchemaDTO } from './types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/api';

export async function fetchTopicSchema(topicId: number): Promise<TopicSchemaDTO> {
  const response = await client<ApiResponse<TopicSchemaDTO>>({
    url: `/api/topics/${topicId}/schema`,
    method: 'GET',
  });
  return response.data.data;
}

export async function fetchSchema(schemaId: number): Promise<SchemaDTO> {
  const response = await client<ApiResponse<SchemaDTO>>({
    url: `/api/schemas/${schemaId}`,
    method: 'GET',
  });
  return response.data.data;
}

export function useTopicSchema(topicId?: number) {
  return useQuery<TopicSchemaDTO, AxiosError>({
    queryKey: ['topic-schema', topicId],
    queryFn: () => fetchTopicSchema(topicId as number),
    enabled: topicId !== undefined && topicId !== null,
  });
}

export function useSchema(schemaId?: number) {
  return useQuery<SchemaDTO, AxiosError>({
    queryKey: ['schema', schemaId],
    queryFn: () => fetchSchema(schemaId as number),
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

export type CreateTemplateParams = {
  schemaId: number;
  name: string;
  isDefault?: boolean;
  elements: TemplateElementDTO[];
};

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation<TemplateDTO, AxiosError<ApiResponse<unknown>>, CreateTemplateParams>({
    mutationFn: async ({ schemaId, name, isDefault = false, elements }) => {
      const response = await client<ApiResponse<TemplateDTO>>({
        url: `/api/schemas/${schemaId}/templates`,
        method: 'POST',
        data: { name, isDefault, elements },
      });

      return response.data.data;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['schema', created.schemaId] });
      queryClient.invalidateQueries({ queryKey: ['schemas'] });
      queryClient.invalidateQueries({ queryKey: MY_TEMPLATES_KEY });
    },
  });
}

/** One entry of "Mẫu thẻ của tôi" (GET /api/schemas/templates/mine). */
export type MyTemplateDTO = {
  id: number;
  /** A topic only shows templates of its own schema: a new topic using this template is created on it. */
  schemaId: number;
  name: string;
  usageCount: number;
  frontFields: string[];
  backFields: string[];
  updatedAt: string | null;
};

export const MY_TEMPLATES_KEY = ['my-templates'] as const;

export function useMyTemplates(enabled = true) {
  return useQuery<MyTemplateDTO[], AxiosError>({
    queryKey: MY_TEMPLATES_KEY,
    enabled,
    queryFn: async () => {
      const response = await client<ApiResponse<MyTemplateDTO[]>>({ url: '/api/schemas/templates/mine', method: 'GET' });
      return response.data.data ?? [];
    },
  });
}

export type UpdateTemplateParams = {
  schemaId: number;
  templateId: number;
  name: string;
  elements: TemplateElementDTO[];
};

/** "Cập nhật mẫu này": every topic showing the template changes with it. */
export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation<TemplateDTO, AxiosError<ApiResponse<unknown>>, UpdateTemplateParams>({
    mutationFn: async ({ schemaId, templateId, name, elements }) => {
      const response = await client<ApiResponse<TemplateDTO>>({
        url: `/api/schemas/${schemaId}/templates/${templateId}`,
        method: 'PUT',
        data: { name, elements },
      });
      return response.data.data;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['schema', updated.schemaId] });
      queryClient.invalidateQueries({ queryKey: ['topic-schema'] });
      queryClient.invalidateQueries({ queryKey: MY_TEMPLATES_KEY });
    },
  });
}

/** Only a template no topic shows; the server answers 409 TEMPLATE_IN_USE otherwise. */
export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<ApiResponse<unknown>>, { schemaId: number; templateId: number }>({
    mutationFn: async ({ schemaId, templateId }) => {
      await client({ url: `/api/schemas/${schemaId}/templates/${templateId}`, method: 'DELETE' });
    },
    onSuccess: (_, { schemaId }) => {
      queryClient.invalidateQueries({ queryKey: ['schema', schemaId] });
      queryClient.invalidateQueries({ queryKey: MY_TEMPLATES_KEY });
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
