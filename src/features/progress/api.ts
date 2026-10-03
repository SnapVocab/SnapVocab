import type { QueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ApiResponse } from '../auth/api';
import type {
  HistoryPeriod,
  HomeWidgetDTO,
  ProgressHistoryDTO,
  ProgressSummaryDTO,
  StreakDTO,
  XpOverviewDTO,
} from './types';
import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/api';

/** Everything a learning action can move: word counts, streak, history and XP/level. */
export function invalidateProgress(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['progress'] }),
    queryClient.invalidateQueries({ queryKey: ['gamification', 'xp'] }),
  ]);
}

/**
 * GET /api/progress/summary
 * Learning-state counts, due workload, accuracy and completed quizzes (MH-STATS-01)
 */
export async function getProgressSummary(): Promise<ProgressSummaryDTO> {
  const response = await client<ApiResponse<ProgressSummaryDTO>>({
    url: '/api/progress/summary',
    method: 'GET',
  });
  return response.data.data;
}

export function useProgressSummary() {
  return useQuery<ProgressSummaryDTO, AxiosError>({
    queryKey: ['progress', 'summary'],
    queryFn: getProgressSummary,
    staleTime: 60 * 1000,
  });
}

/**
 * GET /api/progress/streak
 * Current and longest streak with last studied date (MH-STATS-01)
 */
export async function getStreak(): Promise<StreakDTO> {
  const response = await client<ApiResponse<StreakDTO>>({
    url: '/api/progress/streak',
    method: 'GET',
  });
  return response.data.data;
}

export function useStreak() {
  return useQuery<StreakDTO, AxiosError>({
    queryKey: ['progress', 'streak'],
    queryFn: getStreak,
    staleTime: 60 * 1000,
  });
}

/**
 * GET /api/progress/history?period=DAY|WEEK|MONTH&from=...&to=...
 * Learning activity per day/week/month in Asia/Ho_Chi_Minh (MH-STATS-01)
 */
export async function getProgressHistory(
  period: HistoryPeriod = 'DAY',
  from?: string,
  to?: string,
): Promise<ProgressHistoryDTO> {
  const response = await client<ApiResponse<ProgressHistoryDTO>>({
    url: '/api/progress/history',
    method: 'GET',
    params: {
      period,
      from,
      to,
    },
  });
  return response.data.data;
}

export function useProgressHistory(period: HistoryPeriod = 'DAY', from?: string, to?: string) {
  return useQuery<ProgressHistoryDTO, AxiosError>({
    queryKey: ['progress', 'history', period, from, to],
    queryFn: () => getProgressHistory(period, from, to),
    staleTime: 60 * 1000,
  });
}

/**
 * GET /api/progress/home-widget
 * Compact progress for the Home dashboard (MH-MAIN-01)
 */
export async function getHomeWidget(): Promise<HomeWidgetDTO> {
  const response = await client<ApiResponse<HomeWidgetDTO>>({
    url: '/api/progress/home-widget',
    method: 'GET',
  });
  return response.data.data;
}

export function useHomeWidget() {
  return useQuery<HomeWidgetDTO, AxiosError>({
    queryKey: ['progress', 'home-widget'],
    queryFn: getHomeWidget,
    staleTime: 30 * 1000,
  });
}

/**
 * GET /api/gamification/xp
 * Total XP, current level with progress to next, and recent XP events (MH-STATS-02, Home)
 */
export async function getXpOverview(): Promise<XpOverviewDTO> {
  const response = await client<ApiResponse<XpOverviewDTO>>({
    url: '/api/gamification/xp',
    method: 'GET',
  });
  return response.data.data;
}

export function useXpOverview() {
  return useQuery<XpOverviewDTO, AxiosError>({
    queryKey: ['gamification', 'xp'],
    queryFn: getXpOverview,
    staleTime: 30 * 1000,
  });
}
