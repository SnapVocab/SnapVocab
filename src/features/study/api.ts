import type { QueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ApiResponse } from '@/features/auth/api';
import type { TopicItemData } from '@/features/learn/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invalidateProgress } from '@/features/progress/api';
import { client } from '@/lib/api';

export type FsrsRating = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';
export type StudyCard = {
  item: TopicItemData;
  topicId: number;
  /** Source tag: one Learn-tab session mixes collections. */
  collectionName: string;
  state: 'NEW' | 'LEARNING' | 'REVIEW' | 'RELEARNING' | 'SUSPENDED';
  due: string | null;
};
export type StudyQueue = {
  limit: number;
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
  /** Booster included; 0 when the card was already reviewed today. */
  xpAwarded: number;
  becameMastered: boolean;
};
/** learn_ui.md §4.1: the one source for "hôm nay" on Learn and Home. */
export type StudyToday = {
  dueCount: number;
  newCount: number;
  sessionCount: number;
  studiedToday: number;
  newPerDay: number;
  backlog: boolean;
  returning: boolean;
  dueTomorrow: number;
  totalWords: number;
};
export type StudyCollection = {
  id: number;
  name: string;
  translation: string;
  type: 'SYSTEM' | 'USER';
  wordCount: number;
  dueCount: number;
  lastStudiedAt: string | null;
};
/** Neither id = the Learn tab's session across the learner's whole library. */
export type StudyScope = { collectionId?: number; topicId?: number };

type StudyError = AxiosError<ApiResponse<unknown>>;

const studyKeys = {
  all: ['study'] as const,
  today: ['study', 'today'] as const,
  library: ['study', 'collections'] as const,
};

function scopePath({ collectionId, topicId }: StudyScope) {
  if (topicId)
    return `/api/topics/${topicId}/study`;
  return collectionId ? `/api/collections/${collectionId}/study` : '/api/study';
}

async function get<T>(url: string) {
  return (await client<ApiResponse<T>>({ url, method: 'GET' })).data.data;
}

export function useStudyToday() {
  return useQuery<StudyToday, StudyError>({
    queryKey: studyKeys.today,
    queryFn: () => get<StudyToday>('/api/study/today'),
  });
}

export function useStudyLibrary() {
  return useQuery<StudyCollection[], StudyError>({
    queryKey: studyKeys.library,
    queryFn: () => get<StudyCollection[]>('/api/study/collections'),
  });
}

/** Outside ['study'] so finishing a session can refresh Learn without reshuffling the open queue. */
export function useStudyQueue(scope: StudyScope) {
  return useQuery<StudyQueue, StudyError>({
    queryKey: ['study-queue', scope.collectionId ?? null, scope.topicId ?? null],
    queryFn: () => get<StudyQueue>(`${scopePath(scope)}/queue`),
    // A new session never starts from yesterday's cards.
    gcTime: 0,
  });
}

/** After a session: today's numbers and the library's due counts changed. */
export function invalidateStudy(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: studyKeys.all });
}

type SubmitRatingParams = StudyScope & {
  topicItemId: number;
  rating: FsrsRating;
};
export function useSubmitStudyRating() {
  const queryClient = useQueryClient();
  return useMutation<ReviewResult, StudyError, SubmitRatingParams>({
    mutationFn: async ({ topicItemId, rating, ...scope }) =>
      (
        await client<ApiResponse<ReviewResult>>({
          url: `${scopePath(scope)}/items/${topicItemId}/reviews`,
          method: 'POST',
          data: { rating },
        })
      ).data.data,
    // A rating moves streak, XP and missions (master 2026-10-31).
    onSuccess: () => invalidateProgress(queryClient),
  });
}
