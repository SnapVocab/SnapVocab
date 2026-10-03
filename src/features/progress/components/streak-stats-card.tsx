import type { StreakDTO } from '../types';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { StreakFlame3D } from '@/components/snapvocab';
import { Text } from '@/components/ui';

export type StreakStatsCardProps = {
  streak?: StreakDTO;
  isLoading?: boolean;
};

export function StreakStatsCard({ streak, isLoading }: StreakStatsCardProps) {
  const { t } = useTranslation();

  if (isLoading || !streak) {
    return (
      <View className="mb-4 h-20 rounded-3xl bg-neutral-100 dark:bg-neutral-800" />
    );
  }

  const active = streak.currentStreak > 0;
  // currentStreak is 0 both for "never studied" and "missed a day"; longestStreak tells them apart.
  const broken = !active && streak.longestStreak > 0;

  if (!active) {
    return (
      <View className="mb-3 flex-row items-center gap-3.5 rounded-2xl border border-neutral-100 bg-white p-3.5 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900">
        <StreakFlame3D size={36} state="inactive" animation="none" />
        <View className="flex-1">
          <Text className="font-nunito text-sm font-bold text-neutral-800 dark:text-neutral-200">
            {t(broken ? 'progressUx.streakBroken' : 'progressUx.startStreak')}
          </Text>
          <Text className="font-inter text-xs text-neutral-500 dark:text-neutral-400">
            {broken
              ? t('progressUx.streakBrokenSubtitle', { count: streak.longestStreak })
              : t('progressUx.streakZeroSubtitle')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="mb-3 gap-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900">
      <View className="flex-row items-center gap-3.5">
        <StreakFlame3D size={40} state="active" animation="none" />
        <View className="flex-1">
          <Text className="font-nunito text-lg font-black text-mascot-500">
            {t('progressUx.streak', { count: streak.currentStreak })}
          </Text>
          <Text className="font-inter text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            {t('progressUx.record', { count: streak.longestStreak })}
          </Text>
        </View>
      </View>

      {streak.lastStudiedDate && (
        <Text className="font-inter text-xs text-neutral-400 dark:text-neutral-400">
          {t('progressUx.lastStudy', { date: streak.lastStudiedDate })}
        </Text>
      )}
    </View>
  );
}
