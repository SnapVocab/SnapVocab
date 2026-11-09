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
  newCount: number;
  lastStudiedAt: string | null;
};

export type StudyCounts = {
  collectionId: number;
  topicId: number | null;
  newCount: number;
  reviewCount: number;
  learningCount: number;
  dueCount: number;
};
export type CollectionStudyOverview = { collection: StudyCounts; topics: StudyCounts[] };
export type CollectionStudySettings = {
  collectionId: number;
  userId: number;
  newCardsPerDay: number;
  reviewCardsPerDay: number;
  customized: boolean;
};

export function useCollectionStudyCounts(type?: 'USER' | 'SYSTEM') {
  return useQuery<StudyCounts[], StudyError>({
    queryKey: ['study', 'counts', type ?? 'all'],
    queryFn: () => get(`/api/study/counts${type ? `?type=${type}` : ''}`),
    refetchOnWindowFocus: true,
  });
}

export function useCollectionStudyOverview(collectionId?: number | string) {
  return useQuery<CollectionStudyOverview, StudyError>({
    queryKey: ['study', 'overview', String(collectionId)],
    queryFn: () => get(`/api/collections/${collectionId}/study/today`),
    enabled: Number(collectionId) > 0,
    refetchOnWindowFocus: true,
  });
}

export function useCollectionStudySettings(collectionId: number) {
  return useQuery<CollectionStudySettings, StudyError>({
    queryKey: ['study', 'settings', collectionId],
    queryFn: () => get(`/api/collections/${collectionId}/study/settings`),
    enabled: collectionId > 0,
  });
}

export function useSaveCollectionStudySettings(collectionId: number) {
  const queryClient = useQueryClient();
  return useMutation<CollectionStudySettings | void, StudyError, Pick<CollectionStudySettings, 'newCardsPerDay' | 'reviewCardsPerDay'> | null>({
    mutationFn: async (settings) => {
      const response = await client<ApiResponse<CollectionStudySettings>>({
        url: `/api/collections/${collectionId}/study/settings`,
        method: settings === null ? 'DELETE' : 'PUT',
        ...(settings === null ? {} : { data: settings }),
      });
      return response.data?.data;
    },
    onSuccess: () => invalidateStudy(queryClient),
  });
}
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
    refetchOnWindowFocus: true,
  });
}

export function useStudyLibrary() {
  return useQuery<StudyCollection[], StudyError>({
    queryKey: studyKeys.library,
    queryFn: () => get<StudyCollection[]>('/api/study/collections'),
    refetchOnWindowFocus: true,
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
    onSuccess: () => Promise.all([invalidateProgress(queryClient), invalidateStudy(queryClient)]),
  });
}
