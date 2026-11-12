import type { Leaderboard, LeaderboardWeek } from './types';
import type { ApiResponse } from '@/features/auth/api';
import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/api';
import { expectedWeekStart } from './model';

export const leaderboardKey = (week: LeaderboardWeek, limit: number) => ['leaderboard', week, limit] as const;

export async function getLeaderboard(week: LeaderboardWeek, limit: number): Promise<Leaderboard> {
  const response = await client<ApiResponse<Leaderboard>>({ url: '/api/leaderboards', method: 'GET', params: { week, limit } });
  return response.data.data;
}

/**
 * The backend refreshes the snapshot about once a minute, so asking sooner returns the same asOf (§2.4). Per-account
 * cache reset and foreground focus come from the shared QueryClient provider.
 */
export function useLeaderboard(week: LeaderboardWeek, limit: number) {
  return useQuery({
    queryKey: leaderboardKey(week, limit),
    queryFn: () => getLeaderboard(week, limit),
    staleTime: ({ state }) => {
      if (!state.dataUpdatedAt)
        return 60_000;
      const monday = expectedWeekStart('CURRENT', new Date(state.dataUpdatedAt));
      const rollover = Date.parse(`${monday}T00:00:00+07:00`) + 7 * 24 * 60 * 60 * 1000;
      return Math.min(60_000, rollover - state.dataUpdatedAt);
    },
    refetchOnWindowFocus: true,
  });
}
