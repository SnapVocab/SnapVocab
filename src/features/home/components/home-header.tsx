import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, UserAvatar } from '@/components/ui';
import { CoinIcon, FlameIcon, NotificationBell } from '@/components/ui/icons';
import { useAuthStore } from '@/features/auth/use-auth-store';

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
  const user = useAuthStore(s => s.user);

  const streakDays = user?.streakDays ?? 0;
  const coins = user?.coin ?? 0;

  return (
    <View
      style={{ paddingTop: insets.top }}
      className="border-b border-neutral-100 bg-white px-4 pb-3 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <View className="flex-row items-center justify-between pt-2">
        {/* User Avatar */}
        <TouchableOpacity
          onPress={onAvatarPress}
          activeOpacity={0.8}
          className="flex-row items-center"
        >
          <UserAvatar
            url={user?.avatarUrl}
            name={user?.firstName ?? user?.email}
            size="md"
            bordered
          />
        </TouchableOpacity>

        {/* Search + Notification */}
        <View className="flex-row items-center gap-2">
          <View className="flex-row items-center rounded-2xl border border-neutral-200 bg-neutral-50/80 px-3 py-1.5 dark:border-neutral-700 dark:bg-neutral-800/80">
            {/* Streak Item */}
            <TouchableOpacity
              onPress={onStreakPress}
              activeOpacity={0.7}
              className="flex-row items-center gap-1.5 pr-2.5 active:opacity-60"
            >
              <FlameIcon color="#F97316" width={18} height={18} />
              <Text className="font-inter text-xs font-black text-orange-600 dark:text-orange-400">
                {streakDays}
              </Text>
            </TouchableOpacity>

            {/* Divider Line */}
            <View className="h-3.5 w-px bg-neutral-200 dark:bg-neutral-700" />

            {/* Coins Item */}
            <TouchableOpacity
              onPress={onCoinPress}
              activeOpacity={0.7}
              className="flex-row items-center gap-1.5 pl-2.5 active:opacity-60"
            >
              <CoinIcon size={19} />
              <Text className="font-inter text-xs font-black text-amber-600 dark:text-amber-400">
                {coins}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Notification Bell */}
          <TouchableOpacity
            onPress={onNotificationPress}
            activeOpacity={0.7}
            className="size-9 items-center justify-center rounded-2xl border border-neutral-200 bg-white active:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
          >
            <NotificationBell color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
