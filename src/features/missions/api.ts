import type { AxiosError } from 'axios';
import type { ClaimResult, DailyMissions } from './types';
import type { ApiResponse } from '@/features/auth/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { client } from '@/lib/api';

export const missionsKey = ['daily-missions'] as const;

export async function getDailyMissions(): Promise<DailyMissions> {
  const response = await client<ApiResponse<DailyMissions>>({ url: '/api/me/daily-missions', method: 'GET' });
  return response.data.data;
}

export async function claimMission(missionId: number, idempotencyKey: string): Promise<ClaimResult> {
  const response = await client<ApiResponse<ClaimResult>>({
    url: `/api/me/daily-missions/${missionId}/claim`,
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
  });
  return response.data.data;
}

export function missionErrorCode(error: unknown) {
  return (error as AxiosError<ApiResponse<unknown>>)?.response?.data?.error;
}

export function useDailyMissions() {
  return useQuery({
    queryKey: missionsKey,
    queryFn: async () => ({ ...await getDailyMissions(), receivedAt: Date.now() }),
    retry: false,
  });
}

export function useClaimMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ missionId, idempotencyKey }: { missionId: number; idempotencyKey: string }) => claimMission(missionId, idempotencyKey),
    retry: false,
    onSuccess: (result) => {
      queryClient.setQueryData<DailyMissions>(missionsKey, old => old && ({
        ...old,
        missions: old.missions.map(m => m.id === result.missionId ? { ...m, status: result.status } : m),
      }));
      useAuthStore.getState().updateUser({ coin: result.coinBalance, exp: result.totalXp });
      void queryClient.invalidateQueries({ queryKey: ['shop'] });
      void queryClient.invalidateQueries({ queryKey: ['gamification', 'xp'] });
      // Write the server balance into the me cache too: Profile reads me before the store, and a
      // failed me refetch would otherwise keep showing the pre-claim XP.
      queryClient.setQueryData<{ coin?: number; exp?: number }>(['me'], old => old && { ...old, coin: result.coinBalance, exp: result.totalXp });
      void queryClient.invalidateQueries({ queryKey: ['me'] });
      void queryClient.invalidateQueries({ queryKey: missionsKey });
    },
    onError: (error) => {
      if (['MISSION_EXPIRED', 'MISSION_NOT_COMPLETED'].includes(missionErrorCode(error) ?? '')) {
        void queryClient.invalidateQueries({ queryKey: missionsKey });
      }
    },
  });
}
