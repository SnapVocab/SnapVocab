import type { InfiniteData } from '@tanstack/react-query';
import type { NotificationItem, NotificationPage } from '../api';
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as React from 'react';
import { client } from '@/lib/api';
import { notificationKeys, reloadFirstPage, useMarkAllRead, useMarkRead, useNotifications } from '../api';
import { groupByDay, relativeTime, routeLabel } from '../display';

jest.mock('@/lib/api', () => ({ client: jest.fn() }));
jest.mock('@/lib/i18n', () => ({
  translate: (key: string, options?: { count: number }) => (options ? `${key}:${options.count}` : key),
}));
const request = client as unknown as jest.Mock;
// Deliver React Query updates synchronously, inside act(), instead of on a later timer.
notifyManager.setScheduler(callback => callback());

function item(id: number, isRead: boolean, createdAt = '2026-10-18T13:00:00Z'): NotificationItem {
  return {
    id,
    type: 'SYSTEM',
    title: `t${id}`,
    content: 'c',
    route: null,
    isRead,
    readAt: isRead ? '2026-10-17T00:00:00Z' : null,
    createdAt,
  };
}

function setup() {
  // gcTime Infinity: no 5-minute cache timers left keeping Jest alive after the run.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  queryClient.setQueryData<InfiniteData<NotificationPage, number | null>>(notificationKeys.list, {
    pages: [{ items: [item(3, false), item(2, true)], nextCursor: 2 }, { items: [item(1, false)], nextCursor: null }],
    pageParams: [null, 2],
  });
  queryClient.setQueryData(notificationKeys.unreadCount, { count: 2 });
  const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  const items = () => queryClient.getQueryData<InfiniteData<NotificationPage>>(notificationKeys.list)!.pages.flatMap(p => p.items);
  const count = () => queryClient.getQueryData<{ count: number }>(notificationKeys.unreadCount)!.count;
  return { queryClient, wrapper, items, count };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('notification display rules (§3.5, §2.3)', () => {
  const now = Date.parse('2026-10-18T13:00:00Z');
  const ago = (ms: number) => new Date(now - ms).toISOString();

  it('relative time steps from "just now" to a date at 7 days', () => {
    expect(relativeTime(ago(30_000), now)).toBe('notifications.time_just_now');
    expect(relativeTime(ago(-60_000), now)).toBe('notifications.time_just_now');
    expect(relativeTime(ago(5 * 60_000), now)).toBe('notifications.time_minutes:5');
    expect(relativeTime(ago(59 * 60_000), now)).toBe('notifications.time_minutes:59');
    expect(relativeTime(ago(60 * 60_000), now)).toBe('notifications.time_hours:1');
    expect(relativeTime(ago(24 * 3_600_000 - 1), now)).toBe('notifications.time_hours:23');
    expect(relativeTime(ago(24 * 3_600_000), now)).toBe('notifications.time_days:1');
    expect(relativeTime(ago(7 * 24 * 3_600_000 - 1), now)).toBe('notifications.time_days:6');
    expect(relativeTime(ago(7 * 24 * 3_600_000), now)).toMatch(/^\d{2}\/10\/2026$/);
    expect(relativeTime('not a date', now)).toBe('');
  });

  it('groups by local calendar day, keeps order and drops empty sections', () => {
    const local = (day: number, hour: number) => new Date(2026, 9, day, hour, 0).toISOString();
    const today = new Date(2026, 9, 18, 9, 0);
    const sections = groupByDay([
      item(5, false, local(18, 8)),
      item(4, false, local(18, 0)),
      item(3, false, local(17, 23)),
      item(2, false, local(16, 12)),
      item(1, false, local(10, 12)),
    ], today);
    expect(sections.map(s => [s.key, s.data.map(i => i.id)])).toEqual([
      ['today', [5, 4]],
      ['yesterday', [3]],
      ['earlier', [2, 1]],
    ]);
    expect(groupByDay([item(1, false, local(10, 12))], today).map(s => s.key)).toEqual(['earlier']);
  });

  it('only whitelisted routes get a link', () => {
    expect(routeLabel('/shop')).toBe('notifications.open_shop');
    expect(routeLabel('/study/select')).toBe('notifications.open_study');
    expect(routeLabel('/admin')).toBeNull();
    expect(routeLabel('constructor')).toBeNull();
    expect(routeLabel(null)).toBeNull();
  });
});

describe('notification cache updates (§3.6)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('mark read is optimistic, keeps the server readAt and only counts an unread row once', async () => {
    const { wrapper, items, count } = setup();
    const view = renderHook(() => useMarkRead(), { wrapper });
    const pending = deferred<unknown>();
    request.mockReturnValueOnce(pending.promise);

    act(() => view.result.current.mutate(3));
    await waitFor(() => expect(items().find(i => i.id === 3)?.isRead).toBe(true));
    expect(count()).toBe(1);
    expect(request).toHaveBeenLastCalledWith({ url: '/api/me/notifications/3/read', method: 'PUT' });

    await act(async () => pending.resolve({ data: { data: { id: 3, isRead: true, readAt: '2026-10-18T13:05:12Z' } } }));
    await waitFor(() => expect(items().find(i => i.id === 3)?.readAt).toBe('2026-10-18T13:05:12Z'));

    request.mockResolvedValueOnce({ data: { data: { id: 2, isRead: true, readAt: '2026-10-17T00:00:00Z' } } });
    await act(async () => view.result.current.mutateAsync(2));
    expect(count()).toBe(1);
  });

  it('mark read failure restores the row and the count; a 404 refetches instead', async () => {
    const { queryClient, wrapper, items, count } = setup();
    const view = renderHook(() => useMarkRead(), { wrapper });

    request.mockRejectedValueOnce({ response: { data: { error: 'INTERNAL_ERROR' } } });
    await act(async () => view.result.current.mutateAsync(1).catch(() => {}));
    expect(items().find(i => i.id === 1)?.isRead).toBe(false);
    expect(count()).toBe(2);

    const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
    request.mockRejectedValueOnce({ response: { data: { error: 'NOTIFICATION_NOT_FOUND' } } });
    await act(async () => view.result.current.mutateAsync(1).catch(() => {}));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: notificationKeys.all });
  });

  it('mark all read empties the count at once, rolls back on error and refetches the list on success', async () => {
    const { queryClient, wrapper, items, count } = setup();
    const view = renderHook(() => useMarkAllRead(), { wrapper });

    request.mockRejectedValueOnce(new Error('offline'));
    await act(async () => view.result.current.mutateAsync().catch(() => {}));
    expect(items().filter(i => !i.isRead).map(i => i.id)).toEqual([3, 1]);
    expect(count()).toBe(2);

    const invalidate = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
    request.mockResolvedValueOnce({ data: { data: { updated: 2 } } });
    await act(async () => view.result.current.mutateAsync());
    expect(items().every(i => i.isRead)).toBe(true);
    expect(count()).toBe(0);
    expect(request).toHaveBeenLastCalledWith({ url: '/api/me/notifications/read-all', method: 'POST' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: notificationKeys.list });
  });

  it('pull to refresh reloads the first page only', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    request
      .mockResolvedValueOnce({ data: { data: { items: [item(2, false)], nextCursor: 2 } } })
      .mockResolvedValueOnce({ data: { data: { items: [item(1, false)], nextCursor: null } } })
      .mockResolvedValueOnce({ data: { data: { items: [item(3, false), item(2, false)], nextCursor: 2 } } });
    const view = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(view.result.current.data?.pages).toHaveLength(1));
    await act(async () => view.result.current.fetchNextPage());
    await waitFor(() => expect(view.result.current.data?.pages).toHaveLength(2));
    expect(request).toHaveBeenLastCalledWith({ url: '/api/me/notifications', method: 'GET', params: { cursor: 2, size: 20 } });

    await act(async () => reloadFirstPage(queryClient));
    await waitFor(() => expect(view.result.current.data?.pages.map(p => p.items.map(i => i.id))).toEqual([[3, 2]]));
    expect(request).toHaveBeenCalledTimes(3);
    expect(request).toHaveBeenLastCalledWith({ url: '/api/me/notifications', method: 'GET', params: { cursor: undefined, size: 20 } });
  });
});
