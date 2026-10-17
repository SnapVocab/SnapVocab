import type { AxiosError } from 'axios';
import type { ApiResponse } from '@/features/auth/api';
import type { TopicItemData } from '@/features/learn/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { client } from '@/lib/api';

export type FsrsRating = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';
export type StudyCard = {
  item: TopicItemData;
  topicId: number;
  state: 'NEW' | 'LEARNING' | 'REVIEW' | 'RELEARNING' | 'SUSPENDED';
  due: string | null;
};
export type StudyQueue = {
  limit: number;
  dailyGoal: number;
  studiedToday: number;
  remainingToday: number;
  cards: StudyCard[];
};
export type ReviewResult = {
  topicItemId: number;
  state: StudyCard['state'];
  due: string;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  studiedToday: number;
  dailyGoal: number;
  remainingToday: number;
};
export type StudyScope = { collectionId: number; topicId?: number };
function getQueuePath({ collectionId, topicId }: StudyScope) {
  return topicId
    ? `/api/topics/${topicId}/study/queue`
    : `/api/collections/${collectionId}/study/queue`;
}
export function useStudyQueue(scope: StudyScope) {
  return useQuery<StudyQueue, AxiosError<ApiResponse<unknown>>>({
    queryKey: ['study-queue', scope.collectionId, scope.topicId ?? null],
    queryFn: async () =>
      (
        await client<ApiResponse<StudyQueue>>({
          url: getQueuePath(scope),
          method: 'GET',
        })
      ).data.data,
    enabled: Number.isFinite(scope.collectionId) && scope.collectionId > 0,
  });
}
type SubmitRatingParams = StudyScope & {
  topicItemId: number;
  rating: FsrsRating;
};
export function useSubmitStudyRating() {
  return useMutation<
    ReviewResult,
    AxiosError<ApiResponse<unknown>>,
    SubmitRatingParams
  >({
    mutationFn: async ({ collectionId, topicId, topicItemId, rating }) => {
      const url = topicId
        ? `/api/topics/${topicId}/study/items/${topicItemId}/reviews`
        : `/api/collections/${collectionId}/study/items/${topicItemId}/reviews`;
      return (
        await client<ApiResponse<ReviewResult>>({
          url,
          method: 'POST',
          data: { rating },
        })
      ).data.data;
    },
  });
}
