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
  QuizMode,
  QuizPlayDTO,
  QuizResultDTO,
  QuizStatus,
} from '../types';
import type { ApiResponse } from '@/features/auth/api';
import type { TopicDTO } from '@/features/learn/types';
import type { PaginateResponse } from '@/lib/api/types';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { syncBadges } from '@/features/badges/api';
import { useCollections } from '@/features/learn/api';
import { meKey } from '@/features/profile/api';
import { invalidateProgress } from '@/features/progress/api';
import { client } from '@/lib/api';

/** Prefix of every history query, so one invalidation reaches the mounted list. */
export const quizHistoryKey = ['quiz-history'] as const;

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
      queryClient.invalidateQueries({ queryKey: quizHistoryKey });
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
      queryClient.setQueryData(['quiz-result', data.quizId], data);
      queryClient.invalidateQueries({ queryKey: ['quiz', data.quizId] });
      queryClient.invalidateQueries({ queryKey: quizHistoryKey });
      // Completing a quiz awards XP and records the day's learning event (streak, history).
      // The server is the only source: no optimistic exp bump that could double-count.
      invalidateProgress(queryClient);
      queryClient.invalidateQueries({ queryKey: meKey });
      // Badges are granted only by sync (badges.md §6.1, §9).
      void syncBadges(queryClient);
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
      queryClient.invalidateQueries({ queryKey: quizHistoryKey });
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
  /** Server-side filters; omitted = all. */
  mode?: QuizMode;
  status?: QuizStatus;
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
      mode: params?.mode,
      status: params?.status,
    },
  });
  return response.data.data;
}

export function useInfiniteQuizHistory(size = 20, mode?: QuizMode) {
  return useInfiniteQuery({
    queryKey: [...quizHistoryKey, 'infinite', size, mode ?? 'ALL'],
    queryFn: ({ pageParam = 0 }) => getQuizHistory({ page: pageParam, size, mode }),
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

/** Every topic of a collection, page by page (the endpoint is paged). */
export async function fetchCollectionTopics(collectionId: number): Promise<TopicDTO[]> {
  const list: TopicDTO[] = [];
  for (let page = 0, pages = 1; page < pages; page++) {
    const res = await client<ApiResponse<PaginateResponse<TopicDTO>>>({
      url: `/api/collections/${collectionId}/topics`,
      method: 'GET',
      params: { page, size: 100 },
    });
    list.push(...(res.data?.data?.data ?? []));
    pages = res.data?.data?.meta?.pages ?? 0;
  }
  return list;
}

export function useQuizAvailableTopics() {
  const collectionsQuery = useCollections();
  const collections = collectionsQuery.data ?? [];

  const query = useQuery<QuizAvailableTopic[]>({
    queryKey: ['quiz-available-topics', collections.map(c => c.id)],
    queryFn: async () => {
      if (!collections || collections.length === 0)
        return [];

      const topicLists = await Promise.all(
        // A failed collection fails the query: a network error must not read as "no topics".
        collections.map(async (col) => {
          const list = await fetchCollectionTopics(col.id);
          return list.map(t => ({
            ...t,
            collectionName: col.name,
          }));
        }),
      );

      return topicLists.flat();
    },
    enabled: collections.length > 0,
  });

  return {
    ...query,
    isLoading: collectionsQuery.isLoading || query.isLoading,
    isError: collectionsQuery.isError || query.isError,
    refetch: () => (collectionsQuery.isError ? collectionsQuery.refetch() : query.refetch()),
  };
}
