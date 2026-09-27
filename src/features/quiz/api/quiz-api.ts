import type { AxiosError } from 'axios';
import type {
  CheckQuestionRequest,
  CreateQuizRequest,
  MatchingAttemptDTO,
  MatchingAttemptRequest,
  PaginationObject,
  QuestionCheckDTO,
  QuizHistoryItemDTO,
  QuizLifecycleDTO,
  QuizPlayDTO,
  QuizResultDTO,
} from '../types';
import type { ApiResponse } from '@/features/auth/api';
import type { TopicDTO } from '@/features/learn/types';
import type { PaginateResponse } from '@/lib/api/types';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useCollections } from '@/features/learn/api';
import { client } from '@/lib/api';

// ---------------------------------------------------------------------------
// 1. Create Quiz
// ---------------------------------------------------------------------------

export type CreateQuizParams = {
  data: CreateQuizRequest;
  idempotencyKey: string;
};

export async function createQuiz(
  data: CreateQuizRequest,
  idempotencyKey: string,
): Promise<QuizPlayDTO> {
  const response = await client<ApiResponse<QuizPlayDTO>>({
    url: '/api/me/quizzes',
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
    data,
  });
  return response.data.data ?? (response.data as unknown as QuizPlayDTO);
}

export function useCreateQuiz() {
  const queryClient = useQueryClient();

  return useMutation<
    QuizPlayDTO,
    AxiosError<ApiResponse<unknown>>,
    CreateQuizParams
  >({
    mutationFn: ({ data, idempotencyKey }) => createQuiz(data, idempotencyKey),
    onSuccess: (data) => {
      queryClient.setQueryData(['quiz', data.quizId], data);
    },
  });
}

// ---------------------------------------------------------------------------
// 2. Get / Resume Quiz Session
// ---------------------------------------------------------------------------

export async function getQuiz(quizId: number): Promise<QuizPlayDTO> {
  const response = await client<ApiResponse<QuizPlayDTO>>({
    url: `/api/me/quizzes/${quizId}`,
    method: 'GET',
  });
  return response.data.data ?? (response.data as unknown as QuizPlayDTO);
}

export function useQuiz(quizId?: number | null, options?: { enabled?: boolean }) {
  return useQuery<QuizPlayDTO, AxiosError<ApiResponse<unknown>>>({
    queryKey: ['quiz', quizId],
    queryFn: () => getQuiz(quizId as number),
    enabled: quizId !== undefined && quizId !== null && (options?.enabled ?? true),
  });
}

// ---------------------------------------------------------------------------
// 3. Check Question (MCQ / FILL_BLANK)
// ---------------------------------------------------------------------------

export type CheckQuestionParams = {
  questionId: number;
  data: CheckQuestionRequest;
  idempotencyKey: string;
};

export async function checkQuestion(
  questionId: number,
  data: CheckQuestionRequest,
  idempotencyKey: string,
): Promise<QuestionCheckDTO> {
  const response = await client<ApiResponse<QuestionCheckDTO>>({
    url: `/api/questions/${questionId}/check`,
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
    data,
  });
  return response.data.data ?? (response.data as unknown as QuestionCheckDTO);
}

export function useCheckQuestion() {
  return useMutation<
    QuestionCheckDTO,
    AxiosError<ApiResponse<unknown>>,
    CheckQuestionParams
  >({
    mutationFn: ({ questionId, data, idempotencyKey }) =>
      checkQuestion(questionId, data, idempotencyKey),
  });
}

// ---------------------------------------------------------------------------
// 4. Matching Pair Attempt
// ---------------------------------------------------------------------------

export type AttemptMatchingPairParams = {
  quizId: number;
  roundNo: number;
  data: MatchingAttemptRequest;
  idempotencyKey: string;
};

export async function attemptMatchingPair({
  quizId,
  roundNo,
  data,
  idempotencyKey,
}: AttemptMatchingPairParams): Promise<MatchingAttemptDTO> {
  const response = await client<ApiResponse<MatchingAttemptDTO>>({
    url: `/api/me/quizzes/${quizId}/rounds/${roundNo}/attempts`,
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
    data,
  });
  return response.data.data ?? (response.data as unknown as MatchingAttemptDTO);
}

export function useAttemptMatchingPair() {
  return useMutation<
    MatchingAttemptDTO,
    AxiosError<ApiResponse<unknown>>,
    AttemptMatchingPairParams
  >({
    mutationFn: params => attemptMatchingPair(params),
  });
}

// ---------------------------------------------------------------------------
// 5. Complete & Cancel Quiz
// ---------------------------------------------------------------------------

export async function completeQuiz(quizId: number): Promise<QuizResultDTO> {
  const response = await client<ApiResponse<QuizResultDTO>>({
    url: `/api/me/quizzes/${quizId}/complete`,
    method: 'POST',
  });
  return response.data.data ?? (response.data as unknown as QuizResultDTO);
}

export function useCompleteQuiz() {
  const queryClient = useQueryClient();

  return useMutation<
    QuizResultDTO,
    AxiosError<ApiResponse<unknown>>,
    number
  >({
    mutationFn: (quizId: number) => completeQuiz(quizId),
    onSuccess: (data) => {
      const user = useAuthStore.getState().user;
      if (data.xp && user && !queryClient.getQueryData(['quiz-result', data.quizId])) {
        useAuthStore.getState().updateUser({ exp: user.exp + data.xp.amount });
      }
      queryClient.setQueryData(['quiz-result', data.quizId], data);
      queryClient.invalidateQueries({ queryKey: ['quiz', data.quizId] });
      queryClient.invalidateQueries({ queryKey: ['quiz-history'] });
    },
  });
}

export type CancelQuizParams = {
  quizId: number;
  idempotencyKey?: string;
};

export async function cancelQuiz(
  quizId: number,
  idempotencyKey?: string,
): Promise<QuizLifecycleDTO> {
  const headers: Record<string, string> = {};
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }
  const response = await client<ApiResponse<QuizLifecycleDTO>>({
    url: `/api/me/quizzes/${quizId}/cancel`,
    method: 'POST',
    headers,
  });
  return response.data.data ?? (response.data as unknown as QuizLifecycleDTO);
}

export function useCancelQuiz() {
  const queryClient = useQueryClient();

  return useMutation<
    QuizLifecycleDTO,
    AxiosError<ApiResponse<unknown>>,
    CancelQuizParams
  >({
    mutationFn: ({ quizId, idempotencyKey }) => cancelQuiz(quizId, idempotencyKey),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quiz', data.quizId] });
      queryClient.invalidateQueries({ queryKey: ['quiz-history'] });
    },
  });
}

// ---------------------------------------------------------------------------
// 6. Result
// ---------------------------------------------------------------------------

export async function getQuizResult(quizId: number): Promise<QuizResultDTO> {
  const response = await client<ApiResponse<QuizResultDTO>>({
    url: `/api/me/quizzes/${quizId}/result`,
    method: 'GET',
  });
  return response.data.data ?? (response.data as unknown as QuizResultDTO);
}

export function useQuizResult(
  quizId?: number | null,
  options?: { enabled?: boolean },
) {
  return useQuery<QuizResultDTO, AxiosError<ApiResponse<unknown>>>({
    queryKey: ['quiz-result', quizId],
    queryFn: () => getQuizResult(quizId as number),
    enabled: quizId !== undefined && quizId !== null && (options?.enabled ?? true),
  });
}

// ---------------------------------------------------------------------------
// 7. History (Paging via page / size)
// ---------------------------------------------------------------------------

export type GetQuizHistoryParams = {
  page?: number;
  size?: number;
};

export async function getQuizHistory(
  params?: GetQuizHistoryParams,
): Promise<PaginationObject<QuizHistoryItemDTO[]>> {
  const response = await client<ApiResponse<PaginationObject<QuizHistoryItemDTO[]>>>({
    url: '/api/me/quizzes',
    method: 'GET',
    params: {
      page: params?.page ?? 0,
      size: params?.size ?? 20,
    },
  });
  return response.data.data;
}

export function useQuizHistory(params?: GetQuizHistoryParams) {
  return useQuery<PaginationObject<QuizHistoryItemDTO[]>, AxiosError>({
    queryKey: ['quiz-history', params?.page, params?.size],
    queryFn: () => getQuizHistory(params),
  });
}

export function useInfiniteQuizHistory(size = 20) {
  return useInfiniteQuery({
    queryKey: ['quiz-history-infinite', size],
    queryFn: ({ pageParam = 0 }) => getQuizHistory({ page: pageParam, size }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage?.meta)
        return undefined;
      const { page, pages } = lastPage.meta;
      return page + 1 < pages ? page + 1 : undefined;
    },
  });
}

// ---------------------------------------------------------------------------
// 8. Available Topics for Quiz Setup
// ---------------------------------------------------------------------------

export type QuizAvailableTopic = TopicDTO & {
  collectionName: string;
};

export function useQuizAvailableTopics() {
  const { data: collections = [], isLoading: isLoadingCollections } = useCollections();

  const query = useQuery<QuizAvailableTopic[]>({
    queryKey: ['quiz-available-topics', collections.map(c => c.id)],
    queryFn: async () => {
      if (!collections || collections.length === 0)
        return [];

      const topicLists = await Promise.all(
        collections.map(async (col) => {
          try {
            const res = await client<ApiResponse<PaginateResponse<TopicDTO>>>({
              url: `/api/collections/${col.id}/topics`,
              method: 'GET',
              params: { size: 100 },
            });
            const list = res.data?.data?.data ?? [];
            return list.map(t => ({
              ...t,
              collectionName: col.name,
            }));
          }
          catch {
            return [];
          }
        }),
      );

      return topicLists.flat();
    },
    enabled: collections.length > 0,
  });

  return {
    ...query,
    isLoading: isLoadingCollections || query.isLoading,
  };
}
