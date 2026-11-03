import type { BadgesView } from '../types';
import { QueryClient } from '@tanstack/react-query';
import { client } from '@/lib/api';
import { badgesKey, markBadgesSeen, syncBadges } from '../api';
import { useBadgeSessionStore } from '../use-badge-session-store';

jest.mock('@/lib/api', () => ({ client: jest.fn() }));

const earned = { id: 1, code: 'QUIZ_1', name: 'Q', description: '', metric: 'QUIZ_COMPLETED', threshold: 1, currentValue: 1, iconKey: 'clipboard-check', sortOrder: 20, earned: true, earnedAt: '2026-10-07T03:00:00Z', seen: false };
const view: BadgesView = { earnedCount: 1, totalCount: 1, unseenCount: 1, badges: [earned] };
const ok = (data: unknown) => Promise.resolve({ data: { statusCode: 200, data } });

describe('badge api', () => {
  beforeEach(() => {
    jest.mocked(client).mockReset();
    useBadgeSessionStore.setState({ shownIds: [], pendingSeenIds: [], request: null });
  });

  it('sync stores the view, shares one request between concurrent callers and never throws', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
    jest.mocked(client).mockImplementation(() => ok(view) as never);
    const [a, b] = await Promise.all([syncBadges(queryClient), syncBadges(queryClient)]);
    expect(a).toEqual(view);
    expect(b).toEqual(view);
    expect(client).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData(badgesKey)).toEqual(view);

    jest.mocked(client).mockImplementation(() => Promise.reject(new Error('offline')) as never);
    await expect(syncBadges(queryClient)).resolves.toBeNull();
  });

  it('a failed /seen waits in pendingSeenIds and is retried after the next successful sync', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
    queryClient.setQueryData(badgesKey, view);
    jest.mocked(client).mockImplementationOnce(() => Promise.reject(new Error('offline')) as never);
    await markBadgesSeen(queryClient, [1]);
    expect(useBadgeSessionStore.getState().pendingSeenIds).toEqual([1]);
    expect(queryClient.getQueryData<BadgesView>(badgesKey)?.badges[0].seen).toBe(false);

    jest.mocked(client).mockImplementation(((config: { url: string }) =>
      config.url.endsWith('/seen') ? ok({ unseenCount: 0 }) : ok(view)) as never);
    await syncBadges(queryClient);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(jest.mocked(client).mock.calls.at(-1)?.[0]).toMatchObject({ url: '/api/me/badges/seen', data: { badgeIds: [1] } });
    expect(useBadgeSessionStore.getState().pendingSeenIds).toEqual([]);
    expect(queryClient.getQueryData<BadgesView>(badgesKey)?.badges[0].seen).toBe(true);
  });

  it('sends /seen in chunks of at most 50 ids', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
    jest.mocked(client).mockImplementation(() => ok({ unseenCount: 0 }) as never);
    await markBadgesSeen(queryClient, Array.from({ length: 120 }, (_, i) => i + 1));
    expect(jest.mocked(client).mock.calls.map(([c]) => (c as unknown as { data: { badgeIds: number[] } }).data.badgeIds.length)).toEqual([50, 50, 20]);
  });
});
