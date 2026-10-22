import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ApiResponse } from '@/features/auth/api';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/api';

/** notification.md §4.3. An unknown future type renders like SYSTEM. */
export type NotificationType = 'SRS_REMINDER' | 'SYSTEM';

export type NotificationItem = {
  /** user_notifications id: the one A3 takes and the cursor pages by. */
  id: number;
  type: NotificationType;
  title: string;
  content: string;
  route: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};

export type NotificationPage = { items: NotificationItem[]; nextCursor: number | null };
type UnreadCount = { count: number };
type ListData = InfiniteData<NotificationPage, number | null>;

export const notificationKeys = {
  all: ['notifications'] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
  list: ['notifications', 'list'] as const,
};

const PAGE_SIZE = 20;

export async function getNotifications(cursor: number | null): Promise<NotificationPage> {
  const response = await client<ApiResponse<NotificationPage>>({
    url: '/api/me/notifications',
    method: 'GET',
    params: { cursor: cursor ?? undefined, size: PAGE_SIZE },
  });
  return response.data.data;
}

export async function getUnreadCount(): Promise<UnreadCount> {
  const response = await client<ApiResponse<UnreadCount>>({ url: '/api/me/notifications/unread-count', method: 'GET' });
  return response.data.data;
}

export async function markRead(id: number): Promise<{ id: number; isRead: boolean; readAt: string }> {
  const response = await client<ApiResponse<{ id: number; isRead: boolean; readAt: string }>>({
    url: `/api/me/notifications/${id}/read`,
    method: 'PUT',
  });
  return response.data.data;
}

export async function markAllRead(): Promise<{ updated: number }> {
  const response = await client<ApiResponse<{ updated: number }>>({ url: '/api/me/notifications/read-all', method: 'POST' });
  return response.data.data;
}

export function notificationErrorCode(error: unknown) {
  return (error as AxiosError<ApiResponse<unknown>>)?.response?.data?.error;
}

/** Home bell (§3.2, §3.7): refetch when the app comes back to the foreground; Home focus refetches once stale. */
export function useUnreadCount() {
  return useQuery<UnreadCount, AxiosError>({
    queryKey: notificationKeys.unreadCount,
    queryFn: getUnreadCount,
    staleTime: 60_000,
    refetchOnWindowFocus: 'always',
  });
}

export function useNotifications() {
  return useInfiniteQuery<NotificationPage, AxiosError, ListData, typeof notificationKeys.list, number | null>({
    queryKey: notificationKeys.list,
    queryFn: ({ pageParam }) => getNotifications(pageParam),
    initialPageParam: null,
    getNextPageParam: lastPage => lastPage.nextCursor ?? undefined,
  });
}

/** Pull-to-refresh and retry reload the first page only (§3.3), not every page scrolled so far. */
export function reloadFirstPage(queryClient: QueryClient) {
  queryClient.setQueryData<ListData>(notificationKeys.list, old => old && {
    pages: old.pages.slice(0, 1),
    pageParams: old.pageParams.slice(0, 1),
  });
  return queryClient.refetchQueries({ queryKey: notificationKeys.list, exact: true });
}

type Snapshot = { list?: ListData; count?: UnreadCount };

async function snapshot(queryClient: QueryClient): Promise<Snapshot> {
  // A refetch landing after the optimistic edit would bring the old read state back.
  await queryClient.cancelQueries({ queryKey: notificationKeys.all });
  return {
    list: queryClient.getQueryData<ListData>(notificationKeys.list),
    count: queryClient.getQueryData<UnreadCount>(notificationKeys.unreadCount),
  };
}

function restore(queryClient: QueryClient, previous?: Snapshot) {
  queryClient.setQueryData(notificationKeys.list, previous?.list);
  queryClient.setQueryData(notificationKeys.unreadCount, previous?.count);
}

function patchItems(queryClient: QueryClient, patch: (item: NotificationItem) => NotificationItem) {
  queryClient.setQueryData<ListData>(notificationKeys.list, old => old && {
    ...old,
    pages: old.pages.map(page => ({ ...page, items: page.items.map(patch) })),
  });
}

/** A3, optimistic (§3.6). A 404 means retention removed it: the list is refetched instead of restored. */
export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation<Awaited<ReturnType<typeof markRead>>, AxiosError, number, Snapshot>({
    mutationFn: markRead,
    onMutate: async (id) => {
      const previous = await snapshot(queryClient);
      const wasUnread = previous.list?.pages.some(page => page.items.some(item => item.id === id && !item.isRead));
      patchItems(queryClient, item => item.id === id && !item.isRead ? { ...item, isRead: true, readAt: new Date().toISOString() } : item);
      if (wasUnread)
        queryClient.setQueryData<UnreadCount>(notificationKeys.unreadCount, old => old && { count: Math.max(0, old.count - 1) });
      return previous;
    },
    onSuccess: result => patchItems(queryClient, item => item.id === result.id ? { ...item, readAt: result.readAt } : item),
    onError: (error, _id, previous) => {
      if (notificationErrorCode(error) === 'NOTIFICATION_NOT_FOUND') {
        void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        return;
      }
      restore(queryClient, previous);
    },
  });
}

/** A4, optimistic (§3.6); the list is refetched afterwards so readAt matches the server. */
export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation<{ updated: number }, AxiosError, void, Snapshot>({
    mutationFn: markAllRead,
    onMutate: async () => {
      const previous = await snapshot(queryClient);
      const now = new Date().toISOString();
      patchItems(queryClient, item => item.isRead ? item : { ...item, isRead: true, readAt: now });
      queryClient.setQueryData<UnreadCount>(notificationKeys.unreadCount, { count: 0 });
      return previous;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: notificationKeys.list }),
    onError: (_error, _vars, previous) => restore(queryClient, previous),
  });
}
