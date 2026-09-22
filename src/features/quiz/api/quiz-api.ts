import type { AxiosError } from 'axios';
import type {
  CheckMatchingRoundRequest,
  CheckQuestionRequest,
  CreateQuizRequest,
  MatchingRoundCommitDto,
  PaginationObject,
  QuestionCommitDto,
  QuizCompleteDto,
  QuizHistorySummaryResponse,
  QuizLifecycleDto,
  QuizPlayDto,
  QuizPlayResponse,
  QuizResultResponse,
} from '../types';
import type { ApiResponse } from '@/features/auth/api';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
): Promise<QuizPlayDto> {
  const response = await client<ApiResponse<QuizPlayDto>>({
    url: '/api/v1/me/quizzes',
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
    data,
  });
  return response.data.data;
}

export function useCreateQuiz() {
  const queryClient = useQueryClient();

  return useMutation<
    QuizPlayDto,
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
// 2. Resume / Query Quiz Lifecycle Snapshot
// ---------------------------------------------------------------------------

export async function getQuiz(quizId: number): Promise<QuizPlayDto> {
  const response = await client<ApiResponse<QuizPlayDto>>({
    url: `/api/v1/me/quizzes/${quizId}`,
    method: 'GET',
  });
  return response.data.data;
}

export function useQuiz(quizId?: number | null, options?: { enabled?: boolean }) {
  return useQuery<QuizPlayDto, AxiosError<ApiResponse<unknown>>>({
    queryKey: ['quiz', quizId],
    queryFn: () => getQuiz(quizId as number),
    enabled: quizId !== undefined && quizId !== null && (options?.enabled ?? true),
  });
}

// ---------------------------------------------------------------------------
// 3. Play with Feedback
// ---------------------------------------------------------------------------

export async function getQuizPlay(quizId: number): Promise<QuizPlayResponse> {
  const response = await client<ApiResponse<QuizPlayResponse>>({
    url: `/api/v1/me/quizzes/${quizId}/play`,
    method: 'GET',
  });
  return response.data.data;
}

export function useQuizPlay(quizId?: number | null, options?: { enabled?: boolean }) {
  return useQuery<QuizPlayResponse, AxiosError<ApiResponse<unknown>>>({
    queryKey: ['quiz-play', quizId],
    queryFn: () => getQuizPlay(quizId as number),
    enabled: quizId !== undefined && quizId !== null && (options?.enabled ?? true),
  });
}

// ---------------------------------------------------------------------------
// 4. Check & Skip Question (MCQ / Fill Blank)
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
): Promise<QuestionCommitDto> {
  const response = await client<ApiResponse<QuestionCommitDto>>({
    url: `/api/v1/questions/${questionId}/check`,
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
    data,
  });
  return response.data.data;
}

export function useCheckQuestion() {
  return useMutation<
    QuestionCommitDto,
    AxiosError<ApiResponse<unknown>>,
    CheckQuestionParams
  >({
    mutationFn: ({ questionId, data, idempotencyKey }) =>
      checkQuestion(questionId, data, idempotencyKey),
  });
}

export type SkipQuestionParams = {
  questionId: number;
  idempotencyKey: string;
};

export async function skipQuestion(
  questionId: number,
  idempotencyKey: string,
): Promise<QuestionCommitDto> {
  const response = await client<ApiResponse<QuestionCommitDto>>({
    url: `/api/v1/questions/${questionId}/skip`,
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
  });
  return response.data.data;
}

export function useSkipQuestion() {
  return useMutation<
    QuestionCommitDto,
    AxiosError<ApiResponse<unknown>>,
    SkipQuestionParams
  >({
    mutationFn: ({ questionId, idempotencyKey }) =>
      skipQuestion(questionId, idempotencyKey),
  });
}

// ---------------------------------------------------------------------------
// 5. Check & Skip Matching Round
// ---------------------------------------------------------------------------

export type CheckMatchingRoundParams = {
  quizId: number;
  roundNo: number;
  data: CheckMatchingRoundRequest;
  idempotencyKey: string;
};

export async function checkMatchingRound({
  quizId,
  roundNo,
  data,
  idempotencyKey,
}: CheckMatchingRoundParams): Promise<MatchingRoundCommitDto> {
  const response = await client<ApiResponse<MatchingRoundCommitDto>>({
    url: `/api/v1/me/quizzes/${quizId}/rounds/${roundNo}/check`,
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
    data,
  });
  return response.data.data;
}

export function useCheckMatchingRound() {
  return useMutation<
    MatchingRoundCommitDto,
    AxiosError<ApiResponse<unknown>>,
    CheckMatchingRoundParams
  >({
    mutationFn: params => checkMatchingRound(params),
  });
}

export type SkipMatchingRoundParams = {
  quizId: number;
  roundNo: number;
  idempotencyKey: string;
};

export async function skipMatchingRound(
  quizId: number,
  roundNo: number,
  idempotencyKey: string,
): Promise<MatchingRoundCommitDto> {
  const response = await client<ApiResponse<MatchingRoundCommitDto>>({
    url: `/api/v1/me/quizzes/${quizId}/rounds/${roundNo}/skip`,
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
  });
  return response.data.data;
}

export function useSkipMatchingRound() {
  return useMutation<
    MatchingRoundCommitDto,
    AxiosError<ApiResponse<unknown>>,
    SkipMatchingRoundParams
  >({
    mutationFn: ({ quizId, roundNo, idempotencyKey }) =>
      skipMatchingRound(quizId, roundNo, idempotencyKey),
  });
}

// ---------------------------------------------------------------------------
// 6. Complete, Cancel & Review Quiz
// ---------------------------------------------------------------------------

export async function completeQuiz(quizId: number): Promise<QuizCompleteDto> {
  const response = await client<ApiResponse<QuizCompleteDto>>({
    url: `/api/v1/me/quizzes/${quizId}/complete`,
    method: 'POST',
  });
  return response.data.data;
}

export function useCompleteQuiz() {
  const queryClient = useQueryClient();

  return useMutation<
    QuizCompleteDto,
    AxiosError<ApiResponse<unknown>>,
    number
  >({
    mutationFn: (quizId: number) => completeQuiz(quizId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quiz', data.quizId] });
      queryClient.invalidateQueries({ queryKey: ['quiz-play', data.quizId] });
      queryClient.invalidateQueries({ queryKey: ['quiz-history'] });
    },
  });
}

export type CancelQuizParams = {
  quizId: number;
  idempotencyKey: string;
};

export async function cancelQuiz(
  quizId: number,
  idempotencyKey: string,
): Promise<QuizLifecycleDto> {
  const response = await client<ApiResponse<QuizLifecycleDto>>({
    url: `/api/v1/me/quizzes/${quizId}/cancel`,
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
  });
  return response.data.data;
}

export function useCancelQuiz() {
  const queryClient = useQueryClient();

  return useMutation<
    QuizLifecycleDto,
    AxiosError<ApiResponse<unknown>>,
    CancelQuizParams
  >({
    mutationFn: ({ quizId, idempotencyKey }) => cancelQuiz(quizId, idempotencyKey),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quiz', data.quizId] });
      queryClient.invalidateQueries({ queryKey: ['quiz-play', data.quizId] });
      queryClient.invalidateQueries({ queryKey: ['quiz-history'] });
    },
  });
}

export type ReviewQuizParams = {
  sourceQuizId: number;
  idempotencyKey: string;
};

export async function reviewQuiz(
  sourceQuizId: number,
  idempotencyKey: string,
): Promise<QuizPlayDto> {
  const response = await client<ApiResponse<QuizPlayDto>>({
    url: `/api/v1/me/quizzes/${sourceQuizId}/review`,
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
  });
  return response.data.data;
}

export function useReviewQuiz() {
  const queryClient = useQueryClient();

  return useMutation<
    QuizPlayDto,
    AxiosError<ApiResponse<unknown>>,
    ReviewQuizParams
  >({
    mutationFn: ({ sourceQuizId, idempotencyKey }) =>
      reviewQuiz(sourceQuizId, idempotencyKey),
    onSuccess: (data) => {
      queryClient.setQueryData(['quiz', data.quizId], data);
      queryClient.invalidateQueries({ queryKey: ['quiz-history'] });
    },
  });
}

// ---------------------------------------------------------------------------
// 7. Result
// ---------------------------------------------------------------------------

export async function getQuizResult(quizId: number): Promise<QuizResultResponse> {
  const response = await client<ApiResponse<QuizResultResponse>>({
    url: `/api/v1/me/quizzes/${quizId}/result`,
    method: 'GET',
  });
  return response.data.data;
}

export function useQuizResult(
  quizId?: number | null,
  options?: { enabled?: boolean },
) {
  return useQuery<QuizResultResponse, AxiosError<ApiResponse<unknown>>>({
    queryKey: ['quiz-result', quizId],
    queryFn: () => getQuizResult(quizId as number),
    enabled: quizId !== undefined && quizId !== null && (options?.enabled ?? true),
  });
}

// ---------------------------------------------------------------------------
// 8. History (Paging via page / size)
// ---------------------------------------------------------------------------

export type GetQuizHistoryParams = {
  page?: number;
  size?: number;
};

export async function getQuizHistory(
  params?: GetQuizHistoryParams,
): Promise<PaginationObject<QuizHistorySummaryResponse[]>> {
  const response = await client<any>({
    url: '/api/v1/me/quizzes',
    method: 'GET',
    params: {
      page: params?.page ?? 0,
      size: params?.size ?? 20,
    },
  });
  if (response.data?.data && response.data?.data?.meta) {
    return response.data.data;
  }
  return response.data;
}

export function useQuizHistory(params?: GetQuizHistoryParams) {
  return useQuery<PaginationObject<QuizHistorySummaryResponse[]>, AxiosError>({
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
