import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as React from 'react';
import { client } from '@/lib/api';
import { useSaveCollectionStudySettings } from '../api';

jest.mock('@/lib/api', () => ({ client: jest.fn() }));

describe('personal collection settings', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([
    [{ newCardsPerDay: 0, reviewCardsPerDay: 200 }, 'PUT'],
    [null, 'DELETE'],
  ] as const)('saves or resets settings and refreshes every daily counter (%s)', async (settings, method) => {
    jest.mocked(client).mockResolvedValue({ data: { data: settings } } as never);
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false, gcTime: Infinity } } });
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useSaveCollectionStudySettings(3), { wrapper });
    act(() => result.current.mutate(settings));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client).toHaveBeenCalledWith({
      url: '/api/collections/3/study/settings',
      method,
      ...(settings === null ? {} : { data: settings }),
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['study'] });
  });
});
