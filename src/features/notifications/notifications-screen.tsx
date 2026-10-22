import type { Href } from 'expo-router';
import type { NotificationItem } from './api';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, Pressable, RefreshControl, SectionList, View } from 'react-native';
import { Snapy } from '@/components/Snapy';
import {
  Button,
  FocusAwareStatusBar,
  SafeAreaView,
  ScreenHeader,
  showErrorMessage,
  Text,
  useColorMode,
} from '@/components/ui';
import { BellIcon, ClockRotateIcon } from '@/components/ui/icons';
import { useUserSettings } from '@/features/profile/api';
import { SectionError, SRS_ENABLED } from '@/features/progress';
import { translate } from '@/lib/i18n';
import {
  notificationErrorCode,
  reloadFirstPage,
  useMarkAllRead,
  useMarkRead,
  useNotifications,
  useUnreadCount,
} from './api';
import { groupByDay, relativeTime, routeLabel } from './display';

/** MH-PROFILE-04 (notification.md §3, notification_ui.md §H.2). */
export function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const list = useNotifications();
  const unread = useUnreadCount();
  const settings = useUserSettings();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const [expanded, setExpanded] = React.useState<ReadonlySet<number>>(() => new Set());
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const sections = React.useMemo(() => groupByDay(list.data?.pages.flatMap(page => page.items) ?? []), [list.data]);
  const unreadCount = unread.data?.count ?? 0;
  // Suggest a reminder only once there is something to remind about (DEP-NOTIF-01).
  const suggestReminder = SRS_ENABLED && settings.data?.srsReminderAt === null;

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([reloadFirstPage(queryClient), unread.refetch()]);
    setIsRefreshing(false);
  };

  const open = (item: NotificationItem) => {
    if (!item.isRead) {
      markRead.mutate(item.id, {
        onError: (error) => {
          if (notificationErrorCode(error) !== 'NOTIFICATION_NOT_FOUND')
            showErrorMessage(translate('notifications.mark_read_error'));
        },
      });
    }
    // UI-NOTIF-03: a reminder goes straight to its screen (no waiting for A3); a message expands in place.
    if (item.type === 'SRS_REMINDER' && routeLabel(item.route)) {
      router.push(item.route as Href);
      return;
    }
    setExpanded((previous) => {
      const next = new Set(previous);
      if (!next.delete(item.id))
        next.add(item.id);
      return next;
    });
  };

  const readAll = () => markAllRead.mutate(undefined, {
    onError: () => showErrorMessage(translate('notifications.mark_all_read_error')),
  });

  return (
    <SafeAreaView className="flex-1 bg-[#F7F8FA] dark:bg-neutral-950" edges={['top']}>
      <FocusAwareStatusBar />
      <ScreenHeader
        title={translate('notifications.title')}
        onBack={() => router.back()}
        // Always present so the title does not jump when the action hides (UI-NOTIF-04).
        right={(
          <View className="min-w-12 items-end">
            {unreadCount > 0 && (
              <Pressable
                onPress={readAll}
                disabled={markAllRead.isPending}
                accessibilityRole="button"
                hitSlop={8}
                testID="notifications-read-all"
                className="min-h-10 justify-center px-1 active:opacity-60"
              >
                <Text className="font-nunito text-[15px] font-extrabold text-info-700 dark:text-info-300" tx="notifications.mark_all_read" />
              </Pressable>
            )}
          </View>
        )}
      />

      <SectionList
        sections={sections}
        keyExtractor={item => String(item.id)}
        stickySectionHeadersEnabled={false}
        contentContainerClassName="px-4 pt-5 pb-12"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void onRefresh()} tintColor="#58CC02" />}
        onEndReachedThreshold={0.3}
        onEndReached={() => {
          if (list.hasNextPage && !list.isFetchingNextPage && !list.isFetchNextPageError)
            void list.fetchNextPage();
        }}
        ListHeaderComponent={list.isRefetchError
          ? (
              <View className="mb-3 min-h-10 justify-center rounded-xl bg-neutral-50 px-3 py-2 dark:bg-neutral-800">
                <Text className="font-inter text-sm text-neutral-600 dark:text-neutral-300" tx="notifications.cached_error" />
              </View>
            )
          : null}
        renderSectionHeader={({ section }) => (
          <Text
            className={`mb-2 ml-2 font-inter text-sm font-semibold text-neutral-500 dark:text-neutral-300 ${section.key === sections[0]?.key ? '' : 'mt-6'}`}
            tx={`notifications.section_${section.key}` as const}
          />
        )}
        renderItem={({ item, index, section }) => (
          <NotificationRow
            item={item}
            first={index === 0}
            last={index === section.data.length - 1}
            expanded={expanded.has(item.id)}
            onPress={() => open(item)}
            onOpenRoute={() => router.push(item.route as Href)}
          />
        )}
        ListEmptyComponent={list.isPending
          ? <SkeletonRows />
          : list.isError
            ? <SectionError message={translate('notifications.load_error')} onRetry={() => void list.refetch()} />
            : (
                <EmptyState
                  suggestReminder={suggestReminder}
                  onPress={() => router.push((suggestReminder ? '/settings' : '/study/select') as Href)}
                />
              )}
        ListFooterComponent={list.isFetchingNextPage
          ? <View className="py-4"><ActivityIndicator color="#58CC02" /></View>
          : list.isFetchNextPageError
            ? (
                <Pressable onPress={() => void list.fetchNextPage()} accessibilityRole="button" className="min-h-12 items-center justify-center">
                  <Text className="font-inter text-sm font-semibold text-info-700 dark:text-info-300" tx="notifications.load_more_error" />
                </Pressable>
              )
            : null}
      />
    </SafeAreaView>
  );
}

type RowProps = {
  item: NotificationItem;
  first: boolean;
  last: boolean;
  expanded: boolean;
  onPress: () => void;
  onOpenRoute: () => void;
};

/** One flat row inside a rounded day group (notification_ui.md §H.3). Unread = dot + heavier title, no tint. */
function NotificationRow({ item, first, last, expanded, onPress, onOpenRoute }: RowProps) {
  const isDark = useColorMode() === 'dark';
  const [truncated, setTruncated] = React.useState(false);
  const isReminder = item.type === 'SRS_REMINDER';
  const routeTx = routeLabel(item.route);
  const navigates = isReminder && !!routeTx;
  const Icon = isReminder ? ClockRotateIcon : BellIcon;
  const time = relativeTime(item.createdAt);
  const label = [!item.isRead && translate('notifications.unread_a11y'), item.title, item.content, time]
    .filter(Boolean)
    .join('. ');

  return (
    <View
      className={`border-x border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900 ${
        first ? 'rounded-t-3xl border-t' : ''} ${last ? 'rounded-b-3xl border-b' : ''}`}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={translate(navigates ? 'notifications.hint_open' : 'notifications.hint_expand')}
        accessibilityState={navigates ? undefined : { expanded }}
        testID={`notification-${item.id}`}
        className={`flex-row gap-3 px-4 py-3 active:bg-neutral-50 dark:active:bg-neutral-800 ${
          first ? 'rounded-t-3xl' : ''} ${last && !(expanded && routeTx && !navigates) ? 'rounded-b-3xl' : ''}`}
      >
        <View className="size-10 items-center justify-center rounded-xl bg-neutral-50 dark:bg-neutral-700">
          <Icon color={isDark ? '#9597AD' : '#3D3F5E'} size={22} />
        </View>

        <View className="flex-1">
          <View className="flex-row items-baseline gap-2">
            <Text
              numberOfLines={1}
              className={`flex-1 font-nunito text-base ${item.isRead
                ? 'font-bold text-neutral-500 dark:text-neutral-300'
                : 'font-extrabold text-neutral-800 dark:text-neutral-50'}`}
            >
              {item.title}
            </Text>
            <Text className="font-inter text-sm text-neutral-500 dark:text-neutral-300">{time}</Text>
          </View>
          <Text
            numberOfLines={expanded ? undefined : 2}
            className={`mt-0.5 font-inter text-sm ${item.isRead ? 'text-neutral-500 dark:text-neutral-300' : 'text-neutral-600 dark:text-neutral-200'}`}
          >
            {item.content}
          </Text>
          {!navigates && (
            // Invisible full-width copy: tells whether 2 lines cut the message, the same way on iOS and Android.
            <Text
              style={{ position: 'absolute', left: 0, right: 0, opacity: 0 }}
              className="font-inter text-sm"
              onTextLayout={event => setTruncated(event.nativeEvent.lines.length > 2)}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              pointerEvents="none"
            >
              {item.content}
            </Text>
          )}
          {!navigates && truncated && (
            <Text
              className="mt-1 font-inter text-sm font-semibold text-info-700 dark:text-info-300"
              tx={expanded ? 'notifications.collapse' : 'notifications.expand'}
            />
          )}
        </View>

        <View className="w-2 pt-2.5">
          {!item.isRead && <View className="size-2 rounded-full bg-primary-700 dark:bg-primary-300" />}
        </View>
      </Pressable>

      {expanded && routeTx && !navigates && (
        <Pressable
          onPress={onOpenRoute}
          accessibilityRole="link"
          hitSlop={8}
          className="mb-2 ml-17 min-h-12 justify-center self-start"
        >
          <Text className="font-inter text-sm font-semibold text-info-700 dark:text-info-300">{`${translate(routeTx)} ›`}</Text>
        </Pressable>
      )}

      {!last && <View className="absolute right-0 bottom-0 left-17 h-px bg-neutral-50 dark:bg-neutral-800" />}
    </View>
  );
}

function SkeletonRows() {
  return (
    <View
      accessible
      accessibilityLabel={translate('notifications.loading')}
      className="overflow-hidden rounded-3xl border border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900"
    >
      {Array.from({ length: 5 }, (_, i) => (
        <View key={i} className="flex-row gap-3 p-4">
          <View className="size-10 rounded-xl bg-neutral-50 dark:bg-neutral-800" />
          <View className="flex-1 justify-center gap-2">
            <View className="h-3.5 w-3/5 rounded-full bg-neutral-50 dark:bg-neutral-800" />
            <View className="h-3.5 w-11/12 rounded-full bg-neutral-50 dark:bg-neutral-800" />
          </View>
        </View>
      ))}
    </View>
  );
}

function EmptyState({ suggestReminder, onPress }: { suggestReminder: boolean; onPress: () => void }) {
  return (
    <View className="items-center px-6 pt-16">
      <Snapy pose="welcome" className="size-28" />
      <Text className="mt-4 text-center font-nunito text-lg font-extrabold text-neutral-800 dark:text-white" tx="notifications.empty_title" />
      <Text
        className="mt-2 text-center font-inter text-sm text-neutral-500 dark:text-neutral-300"
        tx={suggestReminder ? 'notifications.empty_reminder_desc' : 'notifications.empty_desc'}
      />
      <Button
        tx={suggestReminder ? 'notifications.empty_reminder_cta' : 'notifications.empty_study_cta'}
        onPress={onPress}
        fullWidth={false}
        className="mt-6 px-8"
      />
    </View>
  );
}
