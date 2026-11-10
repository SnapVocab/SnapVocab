import type { Href } from 'expo-router';
import type { PushData } from './push';
import type { UserSettings } from '@/features/profile/types';
import { hashKey, useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useNavigationContainerRef, useRouter } from 'expo-router';
import * as React from 'react';
import { AppState } from 'react-native';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { settingsKey } from '@/features/profile/api';
import { markRead, notificationKeys } from './api';
import { ensureChannel, openAction, readPermission, registerDevice, silenceForeground } from './push';

/**
 * Push wiring for the whole app (notification.md §3.8–§3.9), mounted once in the root layout. Renders nothing.
 * Registration failures are silent: the in-app inbox works without push.
 */
export function PushHost() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const status = useAuthStore(s => s.status);
  const userId = useAuthStore(s => s.user?.id ?? null);
  const registered = React.useRef(false);
  const handled = React.useRef(new Set<string>());
  const coldStartChecked = React.useRef(false);
  const navigationRef = useNavigationContainerRef();
  const pendingResponse = React.useRef<Notifications.NotificationResponse | null>(null);

  const subscribeReadiness = React.useCallback((onChange: () => void) => {
    // A preloaded root state can have a key before the container is ready.
    // Subscribe to the same ref that Expo Router checks before navigating.
    const removeReady = navigationRef.addListener('ready', onChange);
    const removeState = navigationRef.addListener('state', onChange);
    return () => {
      removeReady();
      removeState();
    };
  }, [navigationRef]);
  const getReadiness = React.useCallback(() => navigationRef.isReady(), [navigationRef]);
  const navigationReady = React.useSyncExternalStore(subscribeReadiness, getReadiness, () => false);

  React.useEffect(() => {
    silenceForeground();
    void ensureChannel().catch(() => {});
  }, []);

  // App icon number = unread count (OQ-NOTIF-06): follows every fetch, optimistic read and sign-out (cache cleared).
  React.useEffect(() => {
    const unreadHash = hashKey(notificationKeys.unreadCount);
    let last: number | undefined;
    return queryClient.getQueryCache().subscribe((event) => {
      if (event.query.queryHash !== unreadHash)
        return;
      const count = event.type === 'removed' ? 0 : (event.query.state.data as { count?: number } | undefined)?.count;
      if (typeof count !== 'number' || count === last)
        return;
      last = count;
      void Notifications.setBadgeCountAsync(count).catch(() => {});
    });
  }, [queryClient]);

  // One registration per app session once signed in (§3.9); signing out resets it for the next account.
  React.useEffect(() => {
    if (status !== 'signIn') {
      registered.current = false;
      return;
    }
    if (registered.current)
      return;
    registered.current = true;
    void registerDevice().catch(() => {});
  }, [status]);

  React.useEffect(() => {
    if (status !== 'signIn')
      return;
    const token = Notifications.addPushTokenListener(() => void registerDevice().catch(() => {}));
    // Back from the OS settings: permission may have changed.
    const appState = AppState.addEventListener('change', async (state) => {
      if (state !== 'active')
        return;
      const pushEnabled = queryClient.getQueryData<UserSettings>(settingsKey)?.pushEnabled ?? true;
      if (pushEnabled && (await readPermission()) === 'granted')
        void registerDevice().catch(() => {});
    });
    // Foreground push: no banner (silenceForeground), only the bell catches up (§3.7).
    const received = Notifications.addNotificationReceivedListener(() =>
      void queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount }));
    return () => {
      token.remove();
      appState.remove();
      received.remove();
    };
  }, [status, queryClient]);

  const open = React.useCallback((response: Notifications.NotificationResponse) => {
    const auth = useAuthStore.getState();
    // Native notification callbacks can arrive before the root navigator mounts.
    if (!navigationRef.isReady() || auth.status === 'idle') {
      pendingResponse.current = response;
      return;
    }
    const id = response.notification.request.identifier;
    if (handled.current.has(id))
      return;
    handled.current.add(id);
    const currentUserId = auth.status === 'signIn' ? auth.user?.id ?? null : null;
    const action = openAction(response.notification.request.content.data as PushData, currentUserId);
    if (action.kind === 'ignore')
      return; // the auth guard shows sign-in; after it the learner lands on Home
    router.navigate('/' as Href);
    if (action.kind === 'open') {
      if (action.markReadId != null)
        void markRead(action.markReadId).catch(() => {}); // 404: removed by retention, ignore (§5.3)
      router.push(action.route as Href); // pushed over Home, so Back returns there
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    }
  }, [navigationRef, router, queryClient]);

  React.useEffect(() => {
    if (!pendingResponse.current || !navigationReady || status === 'idle')
      return;
    const response = pendingResponse.current;
    pendingResponse.current = null;
    open(response);
  }, [navigationReady, status, open]);

  React.useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    return () => subscription.remove();
  }, [open]);

  // Killed app opened from a push: decide once the persisted session is known, then forget it so a later sign-in
  // never replays the deep link.
  React.useEffect(() => {
    if (status === 'idle' || !navigationReady || coldStartChecked.current)
      return;
    coldStartChecked.current = true;
    const last = Notifications.getLastNotificationResponse();
    if (last) {
      open(last);
      Notifications.clearLastNotificationResponse();
    }
  }, [status, userId, navigationReady, open]);

  return null;
}
