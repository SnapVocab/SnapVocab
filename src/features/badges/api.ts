import type { QueryClient } from '@tanstack/react-query';
import type { BadgesView, SeenResult } from './types';
import type { ApiResponse } from '@/features/auth/api';
import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/api';
import { useBadgeSessionStore } from './use-badge-session-store';

export const badgesKey = ['badges'] as const;

const MAX_SEEN_IDS = 50;

export async function getBadges(): Promise<BadgesView> {
  const response = await client<ApiResponse<BadgesView>>({ url: '/api/me/badges', method: 'GET' });
  return response.data.data;
}

export async function postSync(): Promise<BadgesView> {
  const response = await client<ApiResponse<BadgesView>>({ url: '/api/me/badges/sync', method: 'POST' });
  return response.data.data;
}

export async function postSeen(badgeIds: number[]): Promise<SeenResult> {
  const response = await client<ApiResponse<SeenResult>>({ url: '/api/me/badges/seen', method: 'POST', data: { badgeIds } });
  return response.data.data;
}

/** Read-only gallery (badges.md §8.1); grants nothing. Sync results are written into the same cache. */
export function useBadges() {
  return useQuery({ queryKey: badgesKey, queryFn: getBadges, retry: false });
}

let inFlight: Promise<BadgesView | null> | null = null;

/**
 * Grants whatever is due and stores the view (badges.md §6.1, §9). Never throws: failures are silent and the next
 * trigger retries. Concurrent callers share one request. A success also retries ids whose `/seen` failed earlier.
 */
export function syncBadges(queryClient: QueryClient): Promise<BadgesView | null> {
  inFlight ??= postSync()
    .then((view) => {
      queryClient.setQueryData(badgesKey, view);
      const pending = useBadgeSessionStore.getState().pendingSeenIds;
      if (pending.length > 0)
        void markBadgesSeen(queryClient, pending);
      return view;
    })
    .catch(() => null)
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

/**
 * Marks exactly `ids` as seen (badges.md §8.3) and mirrors it in the cache. On failure the ids wait in
 * `pendingSeenIds`; they are already in `shownIds`, so nothing is presented again this session.
 */
export async function markBadgesSeen(queryClient: QueryClient, ids: number[]): Promise<void> {
  const unique = [...new Set(ids)];
  if (unique.length === 0)
    return;
  const store = useBadgeSessionStore.getState();
  for (let i = 0; i < unique.length; i += MAX_SEEN_IDS) {
    const chunk = unique.slice(i, i + MAX_SEEN_IDS);
    try {
      const { unseenCount } = await postSeen(chunk);
      store.clearPendingSeen(chunk);
      queryClient.setQueryData<BadgesView>(badgesKey, old => old && {
        ...old,
        unseenCount,
        badges: old.badges.map(b => (chunk.includes(b.id) && b.earned ? { ...b, seen: true } : b)),
      });
    }
    catch {
      store.addPendingSeen(chunk);
    }
  }
}
