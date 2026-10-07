import type { DailyMissions } from '../types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import * as React from 'react';
import { client } from '@/lib/api';
import { claimMission, getDailyMissions, missionsKey, useClaimMission } from '../api';

const mockUpdateUser = jest.fn();
jest.mock('@/lib/api', () => ({ client: jest.fn() }));
jest.mock('@/features/auth/use-auth-store', () => ({ useAuthStore: { getState: () => ({ updateUser: mockUpdateUser }) } }));
const request = client as unknown as jest.Mock;

describe('daily Mission requests and claim recovery', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reads the server envelope and sends the caller’s claim key unchanged', async () => {
    request.mockResolvedValueOnce({ data: { data: { missions: [] } } });
    expect(await getDailyMissions()).toEqual({ missions: [] });
    expect(request).toHaveBeenLastCalledWith({ url: '/api/me/daily-missions', method: 'GET' });
    request.mockResolvedValueOnce({ data: { data: { replayed: true } } });
    expect(await claimMission(7, 'same-key')).toEqual({ replayed: true });
    expect(request).toHaveBeenLastCalledWith({ url: '/api/me/daily-missions/7/claim', method: 'POST', headers: { 'Idempotency-Key': 'same-key' } });
  });

  it('does not credit a lost response; retry accepts the authoritative replay and invalidates balances', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
    queryClient.setQueryData(missionsKey, { missions: [{ id: 7, status: 'COMPLETED' }] });
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    const view = renderHook(() => useClaimMission(), { wrapper });
    request.mockRejectedValueOnce(new Error('lost response'));
    await act(async () => {
      await expect(view.result.current.mutateAsync({ missionId: 7, idempotencyKey: 'stable' })).rejects.toThrow('lost response');
    });
    expect(mockUpdateUser).not.toHaveBeenCalled();
    request.mockResolvedValueOnce({ data: { data: { missionId: 7, status: 'CLAIMED', coinBalance: 85, totalXp: 160, replayed: true } } });
    await act(async () => {
      await view.result.current.mutateAsync({ missionId: 7, idempotencyKey: 'stable' });
    });
    expect(request.mock.calls.map(args => args[0].headers['Idempotency-Key'])).toEqual(['stable', 'stable']);
    expect(mockUpdateUser).toHaveBeenCalledWith({ coin: 85, exp: 160 });
    expect(queryClient.getQueryData<DailyMissions>(missionsKey)?.missions[0].status).toBe('CLAIMED');
    for (const queryKey of [['shop'], ['gamification', 'xp'], ['me'], missionsKey]) {
      expect(invalidate).toHaveBeenCalledWith({ queryKey });
    }
    view.unmount();
    queryClient.clear();
  });
});
