import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, UserAvatar, useSurface, useSurfaceOverride } from '@/components/ui';
import { CoinIcon, FlameIcon, NotificationBell } from '@/components/ui/icons';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useUnreadCount } from '@/features/notifications/api';
import { useStreak } from '@/features/progress/api';

export type HomeHeaderProps = {
  onAvatarPress?: () => void;
  onStreakPress?: () => void;
  onCoinPress?: () => void;
  onSearchPress?: () => void;
  onNotificationPress?: () => void;
};

export function HomeHeader({
  onAvatarPress,
  onStreakPress,
  onCoinPress,
  onSearchPress: _onSearchPress,
  onNotificationPress,
}: HomeHeaderProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const user = useAuthStore(s => s.user);

  // Same source as Home/Stats: the live streak (0 after a missed day), not users.streak_days.
  // "–" while loading or on error: unknown is not 0.
  const streakDays = useStreak().data?.currentStreak ?? '–';
  const coins = user?.coin ?? 0;
  // A dot, not a number (notification_ui.md UI-NOTIF-02); no dot while loading or on error without cache.
  const unread = useUnreadCount().data?.count ?? 0;
  const surface = useSurface();
  // An equipped theme re-skins the header too (shop.md §6.4); without one it keeps its own look.
  const themed = useSurfaceOverride();

  return (
    <View
      style={[{ paddingTop: insets.top }, themed && { backgroundColor: themed.headerBg, borderColor: themed.border }]}
      className="border-b border-neutral-100 bg-white px-4 pb-3 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <View className="flex-row items-center justify-between pt-1">
        {/* User Avatar with tactile frame */}
        <Pressable
          onPress={onAvatarPress}
          className="active:opacity-80"
        >
          <UserAvatar
            url={user?.avatarUrl}
            name={user?.firstName ?? user?.email}
            size="md"
            bordered
          />
        </Pressable>

        {/* Gamified Status Counters + Notification */}
        <View className="flex-row items-center gap-2">
          {/* Streak 3D Badge */}
          <Pressable
            onPress={onStreakPress}
            accessibilityRole="button"
            accessibilityLabel={typeof streakDays === 'number' ? t('progressUx.streakA11y', { count: streakDays }) : undefined}
            className="flex-row items-center gap-1.5 rounded-2xl border-2 border-b-[3px] border-orange-200 border-b-orange-400 bg-orange-50 px-2.5 py-1.5 active:translate-y-px active:border-b-2 dark:border-orange-800 dark:border-b-orange-900 dark:bg-orange-950/40"
          >
            <FlameIcon color="#F97316" width={18} height={18} />
            <Text className="font-nunito text-xs font-black text-orange-600 dark:text-orange-400">
              {streakDays}
            </Text>
          </Pressable>

          {/* Coins 3D Badge */}
          <Pressable
            onPress={onCoinPress}
            className="flex-row items-center gap-1.5 rounded-2xl border-2 border-b-[3px] border-amber-200 border-b-amber-400 bg-amber-50 px-2.5 py-1.5 active:translate-y-px active:border-b-2 dark:border-amber-800 dark:border-b-amber-900 dark:bg-amber-950/40"
          >
            <CoinIcon size={18} />
            <Text className="font-nunito text-xs font-black text-amber-700 dark:text-amber-400">
              {coins}
            </Text>
          </Pressable>

          {/* Notification Bell 3D Button */}
          <Pressable
            onPress={onNotificationPress}
            accessibilityRole="button"
            accessibilityLabel={unread > 0 ? t('notifications.bell_unread_a11y', { count: unread }) : t('notifications.bell_a11y')}
            testID="home-notifications"
            style={themed && { backgroundColor: themed.surfaceMuted, borderColor: themed.border }}
            className="size-10 items-center justify-center rounded-2xl border-2 border-b-[3px] border-neutral-200/90 border-b-neutral-300 bg-white active:translate-y-px active:border-b-2 dark:border-neutral-700 dark:border-b-neutral-800 dark:bg-neutral-800"
          >
            <NotificationBell color={surface.text} unread={unread > 0} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default HomeHeader;
