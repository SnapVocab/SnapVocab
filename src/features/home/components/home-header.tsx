import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { withUniwind } from 'uniwind';
import { SafeAreaView, Text, UserAvatar } from '@/components/ui';
import { CoinIcon, FlameIcon, NotificationBell } from '@/components/ui/icons';
import { useThemeConfig } from '@/components/ui/use-theme-config';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useUnreadCount } from '@/features/notifications/api';
import { useStreak } from '@/features/progress/api';
import { formatCount } from '@/lib/format-count';

const SafeArea = withUniwind(SafeAreaView);

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
  const theme = useThemeConfig();
  const { t, i18n } = useTranslation();
  const user = useAuthStore(s => s.user);

  // Same source as Home/Stats: the live streak (0 after a missed day), not users.streak_days.
  // "–" while loading or on error: unknown is not 0.
  const streakDays = useStreak().data?.currentStreak ?? '–';
  const coins = user?.coin ?? 0;
  // A dot, not a number (notification_ui.md UI-NOTIF-02); no dot while loading or on error without cache.
  const unread = useUnreadCount().data?.count ?? 0;

  return (
    <SafeArea
      edges={['top']}
      className="border-b border-line bg-surface px-4 pb-3"
    >
      <View className="w-full max-w-6xl flex-row flex-wrap items-center justify-between gap-2 self-center pt-1">
        {/* User Avatar with tactile frame */}
        <Pressable
          onPress={onAvatarPress}
          accessibilityRole="button"
          accessibilityLabel={t('home.open_profile')}
          className="size-12 items-center justify-center rounded-full active:opacity-80"
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
            accessibilityLabel={typeof streakDays === 'number' ? t('progressUx.streakA11y', { count: streakDays }) : t('home.streak_unavailable_a11y')}
            className="min-h-12 min-w-12 flex-row items-center justify-center gap-1.5 rounded-2xl border-2 border-b-[3px] border-orange-200 border-b-orange-300 bg-orange-50 px-2.5 py-1.5 active:translate-y-px active:border-b-2 active:bg-orange-100 dark:border-orange-400/25 dark:border-b-orange-400/45 dark:bg-orange-400/10 dark:active:bg-orange-400/20"
          >
            <FlameIcon color="#F97316" width={18} height={18} />
            <Text className="font-nunito text-xs font-black text-orange-700 dark:text-orange-300">
              {typeof streakDays === 'number' ? formatCount(streakDays, i18n.language) : streakDays}
            </Text>
          </Pressable>

          {/* Coins 3D Badge */}
          <Pressable
            onPress={onCoinPress}
            accessibilityRole="button"
            accessibilityLabel={t('home.wallet_a11y', { amount: coins })}
            className="min-h-12 min-w-12 flex-row items-center justify-center gap-1.5 rounded-2xl border-2 border-b-[3px] border-amber-200 border-b-amber-300 bg-amber-50 px-2.5 py-1.5 active:translate-y-px active:border-b-2 active:bg-amber-100 dark:border-amber-400/25 dark:border-b-amber-400/45 dark:bg-amber-400/10 dark:active:bg-amber-400/20"
          >
            <CoinIcon size={18} />
            <Text className="font-nunito text-xs font-black text-amber-700 dark:text-amber-400">
              {formatCount(coins, i18n.language)}
            </Text>
          </Pressable>

          {/* Notification Bell 3D Button */}
          <Pressable
            onPress={onNotificationPress}
            accessibilityRole="button"
            accessibilityLabel={unread > 0 ? t('notifications.bell_unread_a11y', { count: unread }) : t('notifications.bell_a11y')}
            testID="home-notifications"
            className="size-12 items-center justify-center rounded-2xl border-2 border-b-[3px] border-line border-b-edge bg-surface-raised active:translate-y-px active:border-b-2 active:bg-pressed"
          >
            <NotificationBell color={theme.colors.text} unread={unread > 0} />
          </Pressable>
        </View>
      </View>
    </SafeArea>
  );
}

export default HomeHeader;
