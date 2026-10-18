import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as React from 'react';
import { useAddTopicItem, useDeleteCollection } from '@/features/learn/api';
import { useCompleteQuiz } from '@/features/quiz/api/quiz-api';
import { client } from '@/lib/api';

jest.mock('@/lib/api', () => ({ client: jest.fn() }));

const mockedClient = client as unknown as jest.Mock;

function setup() {
  const queryClient = new QueryClient({
    // gcTime: Infinity schedules no GC timers, so the test worker exits cleanly.
    defaultOptions: { queries: { gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } },
  });
  const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const invalidatedKeys = () => invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { wrapper, invalidatedKeys };
}

describe('mutations refresh the progress data they change', () => {
  beforeEach(() => jest.clearAllMocks());

  it('quiz completion refreshes progress (summary/streak/history/home-widget), XP and the user', async () => {
    mockedClient.mockResolvedValue({ data: { data: { quizId: 7, xp: { amount: 50 } } } });
    const { wrapper, invalidatedKeys } = setup();
    const { result } = renderHook(() => useCompleteQuiz(), { wrapper });

    act(() => result.current.mutate(7));
    // The observer settles on notifyManager ticks after the request resolves.
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // ['progress'] is a prefix of every progress query key.
    expect(invalidatedKeys()).toEqual(expect.arrayContaining([
      ['progress'],
      ['gamification', 'xp'],
      ['me'],
    ]));
  });

  it('adding a word refreshes progress (totalWords)', async () => {
    mockedClient.mockResolvedValue({ data: { data: { topicItemId: 1 } } });
    const { wrapper, invalidatedKeys } = setup();
    const { result } = renderHook(() => useAddTopicItem(), { wrapper });

    act(() => result.current.mutate({ topicId: 3, data: { groups: {} } } as never));
    // The observer settles on notifyManager ticks after the request resolves.
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidatedKeys()).toEqual(expect.arrayContaining([['progress']]));
  });

  it('deleting a collection refreshes progress (its words leave totalWords)', async () => {
    mockedClient.mockResolvedValue({ data: {} });
    const { wrapper, invalidatedKeys } = setup();
    const { result } = renderHook(() => useDeleteCollection(), { wrapper });

    act(() => result.current.mutate(9));
    // The observer settles on notifyManager ticks after the request resolves.
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidatedKeys()).toEqual(expect.arrayContaining([['progress']]));
  });
});
