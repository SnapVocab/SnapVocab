import * as Notifications from 'expo-notifications';
import { client } from '@/lib/api';
import { storage } from '@/lib/storage';
import { openAction, pushToggle, registerDevice, unregisterDevice } from '../push';

jest.mock('@/lib/api', () => ({ client: jest.fn() }));
jest.mock('@/lib/i18n', () => ({ translate: (key: string) => key }));
jest.mock('expo-device', () => ({ isDevice: true }));
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
}));
jest.mock('@/lib/storage', () => {
  const values = new Map<string, string>();
  return {
    storage: {
      set: (k: string, v: string) => values.set(k, v),
      getString: (k: string) => values.get(k),
      remove: (k: string) => values.delete(k),
    },
  };
});

const request = client as unknown as jest.Mock;
const permission = Notifications.getPermissionsAsync as jest.Mock;
const expoToken = Notifications.getExpoPushTokenAsync as jest.Mock;
const TOKEN = 'ExponentPushToken[abc123]';

beforeEach(() => {
  request.mockReset().mockResolvedValue({ data: { data: {} } });
  permission.mockReset().mockResolvedValue({ status: 'granted' });
  expoToken.mockReset().mockResolvedValue({ data: TOKEN });
  storage.remove('push.expo-token');
});

describe('openAction (notification.md §3.8 handleOpen)', () => {
  const data = { userNotificationId: 981, userId: 42, type: 'SRS_REMINDER', route: '/study/select' };

  it('opens the whitelisted route and marks that inbox row read', () => {
    expect(openAction(data, 42)).toEqual({ kind: 'open', markReadId: 981, route: '/study/select' });
  });

  it('signed out: no deep link, nothing marked (AC-13)', () => {
    expect(openAction(data, null)).toEqual({ kind: 'ignore' });
  });

  it('another account on this device: Home only (AC-15)', () => {
    expect(openAction(data, 77)).toEqual({ kind: 'home' });
  });

  it('a route this app version does not know opens the inbox (§5.3)', () => {
    expect(openAction({ ...data, route: '/admin' }, 42)).toEqual({ kind: 'open', markReadId: 981, route: '/notifications' });
    expect(openAction({ ...data, route: null }, 42)).toMatchObject({ route: '/notifications' });
  });
});

describe('pushToggle (§3.9)', () => {
  it('is on only when the account wants push and the device allows it', () => {
    expect(pushToggle('granted', true)).toEqual({ on: true, blocked: false });
    expect(pushToggle('granted', false)).toEqual({ on: false, blocked: false });
    expect(pushToggle('undetermined', true)).toEqual({ on: false, blocked: false });
    expect(pushToggle('denied', true)).toEqual({ on: false, blocked: true }); // AC-16
  });
});

describe('device token (A5/A6)', () => {
  it('registers the Expo token with its platform once permission is granted', async () => {
    expect(await registerDevice()).toBe(true);
    expect(request).toHaveBeenCalledWith(expect.objectContaining({
      url: '/api/me/devices',
      method: 'POST',
      data: { token: TOKEN, platform: expect.stringMatching(/^(IOS|ANDROID)$/) },
    }));
  });

  it('does nothing without permission', async () => {
    permission.mockResolvedValue({ status: 'denied' });
    expect(await registerDevice()).toBe(false);
    expect(expoToken).not.toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
  });

  it('unregisters the last registered token within 3 seconds and never blocks sign-out (AC-19)', async () => {
    await registerDevice();
    request.mockReset().mockRejectedValue(new Error('offline'));
    await expect(unregisterDevice()).resolves.toBeUndefined();
    expect(request).toHaveBeenCalledWith(expect.objectContaining({
      url: '/api/me/devices/unregister',
      data: { token: TOKEN },
      timeout: 3000,
    }));
    request.mockReset();
    await unregisterDevice(); // already forgotten: no second call
    expect(request).not.toHaveBeenCalled();
  });
});
