import type { NotificationResponse } from 'expo-notifications';
import { act, render } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import * as React from 'react';
import { PushHost } from '../push-host';

let mockNavigationKey: string | undefined;
let mockNavigationReady = false;
const mockNavigationListeners = {
  ready: new Set<() => void>(),
  state: new Set<() => void>(),
};
const mockNavigationRef = {
  isReady: () => mockNavigationReady,
  addListener: (event: keyof typeof mockNavigationListeners, listener: () => void) => {
    mockNavigationListeners[event].add(listener);
    return () => mockNavigationListeners[event].delete(listener);
  },
};
let mockStatus = 'signIn';
const mockRouter = { navigate: jest.fn(), push: jest.fn() };
const mockQueryClient = {
  getQueryCache: () => ({ subscribe: () => jest.fn() }),
  invalidateQueries: jest.fn(),
};
let mockResponseListener: (response: NotificationResponse) => void;
jest.mock('expo-router', () => ({
  useRootNavigationState: () => ({ key: mockNavigationKey }),
  useNavigationContainerRef: () => mockNavigationRef,
  useRouter: () => mockRouter,
}));
jest.mock('@tanstack/react-query', () => ({
  hashKey: JSON.stringify,
  useQueryClient: () => mockQueryClient,
}));
jest.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: Object.assign(
    (selector: any) => selector({ status: mockStatus, user: { id: 2 } }),
    { getState: () => ({ status: mockStatus, user: { id: 2 } }) },
  ),
}));
jest.mock('@/features/profile/api', () => ({ settingsKey: ['settings'] }));
jest.mock('../api', () => ({
  markRead: jest.fn(() => Promise.resolve()),
  notificationKeys: { unreadCount: ['unread'], all: ['notifications'] },
}));
jest.mock('../push', () => ({
  silenceForeground: jest.fn(),
  ensureChannel: jest.fn(() => Promise.resolve()),
  registerDevice: jest.fn(() => Promise.resolve()),
  readPermission: jest.fn(() => Promise.resolve('denied')),
  openAction: (_data: unknown, userId: number | null) => userId
    ? { kind: 'open', route: '/notifications' }
    : { kind: 'ignore' },
}));
jest.mock('expo-notifications', () => ({
  addPushTokenListener: () => ({ remove: jest.fn() }),
  addNotificationReceivedListener: () => ({ remove: jest.fn() }),
  addNotificationResponseReceivedListener: (listener: typeof mockResponseListener) => {
    mockResponseListener = listener;
    return { remove: jest.fn() };
  },
  getLastNotificationResponse: jest.fn(),
  clearLastNotificationResponse: jest.fn(),
}));

const response = {
  notification: { request: { identifier: 'cold-start', content: { data: {} } } },
} as NotificationResponse;

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(Notifications.getLastNotificationResponse).mockReturnValue(null);
  mockNavigationKey = undefined;
  mockNavigationReady = false;
  mockNavigationListeners.ready.clear();
  mockNavigationListeners.state.clear();
  mockStatus = 'signIn';
});

it('defers an early native notification until the navigator mounts and opens it once', () => {
  render(<PushHost />);
  act(() => mockResponseListener(response));
  expect(mockRouter.navigate).not.toHaveBeenCalled();
  mockNavigationKey = 'root';
  jest.mocked(Notifications.getLastNotificationResponse).mockReturnValue(response);
  act(() => {
    mockNavigationReady = true;
    mockNavigationListeners.ready.forEach(listener => listener());
  });
  expect(mockRouter.navigate).toHaveBeenCalledTimes(1);
  expect(mockRouter.push).toHaveBeenCalledWith('/notifications');
});

it('waits for session hydration and discards a notification when signed out', () => {
  mockStatus = 'idle';
  mockNavigationKey = 'root';
  mockNavigationReady = true;
  const view = render(<PushHost />);
  act(() => mockResponseListener(response));
  expect(mockRouter.push).not.toHaveBeenCalled();
  mockStatus = 'signOut';
  view.rerender(<PushHost />);
  expect(mockRouter.navigate).not.toHaveBeenCalled();
  expect(mockRouter.push).not.toHaveBeenCalled();
});

it('does not open a cached cold-start push just because the root state already has a key', () => {
  mockNavigationKey = 'root';
  jest.mocked(Notifications.getLastNotificationResponse).mockReturnValue(response);
  render(<PushHost />);

  expect(mockRouter.navigate).not.toHaveBeenCalled();
  expect(Notifications.clearLastNotificationResponse).not.toHaveBeenCalled();

  act(() => {
    mockNavigationReady = true;
    mockNavigationListeners.ready.forEach(listener => listener());
  });
  expect(mockRouter.navigate).toHaveBeenCalledTimes(1);
  expect(mockRouter.push).toHaveBeenCalledWith('/notifications');
  expect(Notifications.clearLastNotificationResponse).toHaveBeenCalledTimes(1);
});

it('drains a native callback on the ready event without requiring a route rerender', () => {
  render(<PushHost />);
  act(() => mockResponseListener(response));

  act(() => {
    mockNavigationReady = true;
    mockNavigationListeners.ready.forEach(listener => listener());
  });
  expect(mockRouter.push).toHaveBeenCalledTimes(1);
});

it('checks live readiness when a callback arrives during navigator remount', () => {
  mockNavigationKey = 'root';
  mockNavigationReady = true;
  render(<PushHost />);

  act(() => {
    mockNavigationReady = false;
    mockResponseListener(response);
    mockNavigationListeners.state.forEach(listener => listener());
  });
  expect(mockRouter.navigate).not.toHaveBeenCalled();

  act(() => {
    mockNavigationReady = true;
    mockNavigationListeners.ready.forEach(listener => listener());
  });
  expect(mockRouter.push).toHaveBeenCalledTimes(1);
});

it('unsubscribes navigation readiness listeners on unmount', () => {
  const view = render(<PushHost />);
  view.unmount();
  expect(mockNavigationListeners.ready.size).toBe(0);
  expect(mockNavigationListeners.state.size).toBe(0);
});
