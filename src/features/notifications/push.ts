import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { client } from '@/lib/api';
import { translate } from '@/lib/i18n';
import { storage } from '@/lib/storage';
import { routeLabel } from './display';

/** notification.md §3.8–§3.9 and §4.3 A5/A6: OS permission, Expo push token, what a tapped push opens. */

export type PushPermission = 'granted' | 'denied' | 'undetermined';

/** What the push payload carries (J1, PushSender). */
export type PushData = { userNotificationId?: number; userId?: number; type?: string; route?: string | null };

export type OpenAction =
  | { kind: 'ignore' }
  | { kind: 'home' }
  | { kind: 'open'; markReadId: number | null; route: string };

/** §3.8 handleOpen: signed out → no deep link; another account's push → Home; else its route, or the inbox. */
export function openAction(data: PushData | null | undefined, currentUserId: number | null): OpenAction {
  if (currentUserId == null)
    return { kind: 'ignore' };
  if (!data || data.userId !== currentUserId)
    return { kind: 'home' };
  const route = data.route && routeLabel(data.route) ? data.route : '/notifications';
  return { kind: 'open', markReadId: typeof data.userNotificationId === 'number' ? data.userNotificationId : null, route };
}

/** §3.9 "Thông báo đẩy": shown on only when the account wants push AND this device allows it. */
export function pushToggle(permission: PushPermission, pushEnabled: boolean) {
  return { on: permission === 'granted' && pushEnabled, blocked: permission === 'denied' };
}

// ---- device side ----

export const SRS_CHANNEL = 'srs-reminder';
/** Last token sent with A5, so sign-out (even after a restart) can send A6 for it. */
const TOKEN_KEY = 'push.expo-token';

export async function readPermission(): Promise<PushPermission> {
  const { status } = await Notifications.getPermissionsAsync();
  return status as PushPermission;
}

/** Only asks while undetermined (§3.9); the OS will not show the prompt again once answered. */
export async function askPermission(): Promise<PushPermission> {
  const current = await readPermission();
  if (current !== 'undetermined')
    return current;
  const { status } = await Notifications.requestPermissionsAsync();
  return status as PushPermission;
}

/** Android 13: the channel must exist before the first permission request. */
export async function ensureChannel() {
  if (Platform.OS !== 'android')
    return;
  await Notifications.setNotificationChannelAsync(SRS_CHANNEL, {
    name: translate('notifications.channel_name'),
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/** In the foreground a push never interrupts the session (§3.8): no banner, list entry, sound or badge. */
export function silenceForeground() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: false, shouldShowList: false, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

/**
 * A5 when this is a real device with permission granted: fetch the Expo token and register it with the backend.
 * Emulators and denied permission do nothing. Errors propagate to the caller, which ignores them.
 */
export async function registerDevice(): Promise<boolean> {
  if (!Device.isDevice || (await readPermission()) !== 'granted')
    return false;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  const { data: token } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  await client({
    url: '/api/me/devices',
    method: 'POST',
    data: { token, platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID' },
  });
  storage.set(TOKEN_KEY, token);
  return true;
}

/** A6 before sign-out clears the access token (§3.9): 3 seconds at most, failures ignored. */
export async function unregisterDevice(): Promise<void> {
  const token = storage.getString(TOKEN_KEY);
  if (!token)
    return;
  try {
    await client({ url: '/api/me/devices/unregister', method: 'POST', data: { token }, timeout: 3000 });
  }
  catch {
    // Offline sign-out: the token moves to the next account on this device, or J3 drops it after 60 days (§5.2).
  }
  storage.remove(TOKEN_KEY);
}
