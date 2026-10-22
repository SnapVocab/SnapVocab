import type { NotificationItem } from '../api';
import { fireEvent, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { useMarkAllRead, useMarkRead, useNotifications, useUnreadCount } from '../api';
import { NotificationsScreen } from '../notifications-screen';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: jest.fn() }) }));
jest.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({}) }));
jest.mock('../api', () => ({
  useNotifications: jest.fn(),
  useUnreadCount: jest.fn(),
  useMarkRead: jest.fn(),
  useMarkAllRead: jest.fn(),
  reloadFirstPage: jest.fn(),
  notificationErrorCode: () => undefined,
}));
jest.mock('@/features/profile/api', () => ({ useUserSettings: () => ({ data: { srsReminderAt: null } }) }));
jest.mock('@/features/progress', () => {
  const RN = require('react-native');
  return {
    SRS_ENABLED: false,
    SectionError: ({ message, onRetry }: { message: string; onRetry: () => void }) => (
      <RN.Pressable onPress={onRetry}><RN.Text>{message}</RN.Text></RN.Pressable>
    ),
  };
});
jest.mock('@/lib/i18n', () => ({ translate: (key: string) => key }));
jest.mock('@/components/ui/icons', () => new Proxy({}, { get: () => () => null }));
jest.mock('@/components/Snapy', () => ({ Snapy: () => null }));
jest.mock('@/components/ui', () => {
  const RN = require('react-native');
  return {
    SafeAreaView: RN.View,
    FocusAwareStatusBar: () => null,
    showErrorMessage: jest.fn(),
    useColorMode: () => 'light',
    Text: ({ tx, children }: { tx?: string; children?: React.ReactNode }) => <RN.Text>{tx ?? children}</RN.Text>,
    ScreenHeader: ({ title, right }: { title: string; right?: React.ReactNode }) => (
      <RN.View>
        <RN.Text>{title}</RN.Text>
        {right}
      </RN.View>
    ),
    Button: ({ tx, onPress }: { tx: string; onPress: () => void }) => <RN.Pressable accessibilityRole="button" onPress={onPress}><RN.Text>{tx}</RN.Text></RN.Pressable>,
  };
});

const now = new Date();
const reminder: NotificationItem = {
  id: 9,
  type: 'SRS_REMINDER',
  title: 'Đến giờ ôn tập rồi!',
  content: 'Lan ơi, bạn có 12 từ cần ôn.',
  route: '/study/select',
  isRead: false,
  readAt: null,
  createdAt: now.toISOString(),
};
const message: NotificationItem = {
  id: 4,
  type: 'SYSTEM',
  title: 'Bảo trì hệ thống',
  content: 'SnapVocab bảo trì từ 23:00 đến 23:30.',
  route: '/shop',
  isRead: false,
  readAt: null,
  createdAt: new Date(now.getTime() - 10 * 86_400_000).toISOString(),
};
const read: NotificationItem = { ...message, id: 2, route: null, isRead: true, readAt: message.createdAt };

type ListState = Partial<ReturnType<typeof useNotifications>>;
const markRead = jest.fn();
const markAllRead = jest.fn();
const fetchNextPage = jest.fn();
const refetch = jest.fn();

function mockList(state: ListState, unread = 0) {
  jest.mocked(useNotifications).mockReturnValue({
    isPending: false,
    isError: false,
    isRefetchError: false,
    isFetchingNextPage: false,
    isFetchNextPageError: false,
    hasNextPage: false,
    fetchNextPage,
    refetch,
    ...state,
  } as unknown as ReturnType<typeof useNotifications>);
  jest.mocked(useUnreadCount).mockReturnValue({ data: { count: unread }, refetch: jest.fn() } as unknown as ReturnType<typeof useUnreadCount>);
}

const page = (items: NotificationItem[], nextCursor: number | null = null) => ({ pages: [{ items, nextCursor }], pageParams: [null] });

describe('notification inbox (MH-PROFILE-04)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useMarkRead).mockReturnValue({ mutate: markRead } as unknown as ReturnType<typeof useMarkRead>);
    jest.mocked(useMarkAllRead).mockReturnValue({ mutate: markAllRead, isPending: false } as unknown as ReturnType<typeof useMarkAllRead>);
  });

  it('shows a skeleton while the first page loads and no read-all without unread', () => {
    mockList({ isPending: true });
    render(<NotificationsScreen />);
    expect(screen.getByLabelText('notifications.loading')).toBeTruthy();
    expect(screen.queryByText('notifications.mark_all_read')).toBeNull();
  });

  it('empty inbox invites to study while reminders are not released', () => {
    mockList({ data: page([]) } as ListState);
    render(<NotificationsScreen />);
    expect(screen.getByText('notifications.empty_title')).toBeTruthy();
    expect(screen.getByText('notifications.empty_desc')).toBeTruthy();
    fireEvent.press(screen.getByText('notifications.empty_study_cta'));
    expect(mockPush).toHaveBeenCalledWith('/study/select');
  });

  it('first-page error offers a retry; a failed refresh keeps the list with a saved-data notice', () => {
    mockList({ isError: true });
    const view = render(<NotificationsScreen />);
    fireEvent.press(screen.getByText('notifications.load_error'));
    expect(refetch).toHaveBeenCalled();

    mockList({ isError: true, isRefetchError: true, data: page([reminder]) } as ListState, 1);
    view.rerender(<NotificationsScreen />);
    expect(screen.getByText('notifications.cached_error')).toBeTruthy();
    expect(screen.getByText(reminder.title)).toBeTruthy();
  });

  it('a reminder marks itself read and opens review; a message expands to its link', () => {
    mockList({ data: page([reminder, message, read]) } as ListState, 2);
    render(<NotificationsScreen />);
    expect(screen.getByText('notifications.section_today')).toBeTruthy();
    expect(screen.getByText('notifications.section_earlier')).toBeTruthy();
    expect(screen.getByLabelText(`notifications.unread_a11y. ${reminder.title}. ${reminder.content}. notifications.time_just_now`)).toBeTruthy();

    fireEvent.press(screen.getByTestId('notification-9'));
    expect(markRead).toHaveBeenCalledWith(9, expect.anything());
    expect(mockPush).toHaveBeenCalledWith('/study/select');

    expect(screen.queryByText('notifications.open_shop ›')).toBeNull();
    fireEvent.press(screen.getByTestId('notification-4'));
    expect(markRead).toHaveBeenLastCalledWith(4, expect.anything());
    expect(mockPush).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByText('notifications.open_shop ›'));
    expect(mockPush).toHaveBeenLastCalledWith('/shop');

    markRead.mockClear();
    fireEvent.press(screen.getByTestId('notification-2'));
    expect(markRead).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText('notifications.mark_all_read'));
    expect(markAllRead).toHaveBeenCalled();
  });

  it('a failed next page shows a tap-to-retry footer', () => {
    mockList({ data: page([read], 2), hasNextPage: true, isFetchNextPageError: true } as ListState);
    render(<NotificationsScreen />);
    fireEvent.press(screen.getByText('notifications.load_more_error'));
    expect(fetchNextPage).toHaveBeenCalled();
  });
});
