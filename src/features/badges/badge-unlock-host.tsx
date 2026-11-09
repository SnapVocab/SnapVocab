import type { Href } from 'expo-router';
import type { UnlockIntensity } from './use-badge-session-store';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'expo-router';
import * as React from 'react';
import { AppState } from 'react-native';
import { markBadgesSeen, syncBadges, useBadges } from './api';
import { BadgeUnlockModal } from './components/badge-unlock-modal';
import { buildSeries, inDisplayOrder, unseenIds } from './model';
import { useBadgeSessionStore } from './use-badge-session-store';

/**
 * Routes where the modal waits (UI-BDG-01, UI-BDG-03): a learning session, Quiz Result (it has its own celebration
 * and a continuation row) and Achievements (it presents new badges in place).
 */
export const DEFERRED_ROUTES = ['/study/quiz-session', '/study/flashcard-session', '/study/quiz-result', '/profile/achievements'];

export function isDeferredRoute(pathname: string): boolean {
  return DEFERRED_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`));
}

/**
 * Mounted once inside the signed-in stack. Syncs on app open and foreground (badges.md §9), and opens the unlock
 * modal at the first route outside the denylist while unseen badges remain unpresented this session.
 */
export function BadgeUnlockHost() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const { data } = useBadges();
  const shownIds = useBadgeSessionStore(s => s.shownIds);
  const request = useBadgeSessionStore(s => s.request);
  const [current, setCurrent] = React.useState<{ ids: number[]; intensity: UnlockIntensity } | null>(null);

  React.useEffect(() => {
    void syncBadges(queryClient);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active')
        void syncBadges(queryClient);
    });
    return () => subscription.remove();
  }, [queryClient]);

  React.useEffect(() => {
    if (current)
      return;
    const store = useBadgeSessionStore.getState();
    if (request) {
      store.clearRequest();
      setCurrent(request);
      return;
    }
    if (!data || isDeferredRoute(pathname))
      return;
    const pending = unseenIds(data).filter(id => !shownIds.includes(id));
    if (pending.length === 0)
      return;
    store.markShown(pending);
    setCurrent({ ids: pending, intensity: 'normal' });
  }, [current, request, data, pathname, shownIds]);

  if (!current || !data)
    return null;
  const seriesList = buildSeries(data);
  const items = inDisplayOrder(seriesList, current.ids);

  const close = () => {
    void markBadgesSeen(queryClient, current.ids);
    setCurrent(null);
  };
  const viewCollection = () => {
    close();
    router.push({ pathname: '/profile/achievements', params: { highlight: current.ids.join(',') } } as unknown as Href);
  };

  return <BadgeUnlockModal items={items} seriesList={seriesList} intensity={current.intensity} onClose={close} onViewCollection={viewCollection} />;
}
