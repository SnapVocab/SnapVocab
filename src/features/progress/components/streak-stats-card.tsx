import type { StreakDTO } from '../types';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { StreakFlame3D } from '@/components/snapvocab';
import { Text } from '@/components/ui';
import { formatDate } from '../utils';

export type StreakStatsCardProps = {
  streak?: StreakDTO;
  isLoading?: boolean;
};

/** Within the last week: the learner sees that a Streak Freeze was used, not just that a unit is gone (PD-SF-07). */
function usedRecently(date?: string | null) {
  return !!date && Date.now() - Date.parse(date) < 8 * 24 * 60 * 60 * 1000;
}

function FreezeLines({ streak }: { streak: StreakDTO }) {
  const { t } = useTranslation();
  return (
    <>
      {!!streak.freezeCount && (
        <Text className="font-inter text-xs text-sky-700 dark:text-sky-300">
          {t('progressUx.freezeHeld', { count: streak.freezeCount })}
        </Text>
      )}
      {usedRecently(streak.lastFrozenDate) && (
        <Text className="font-inter text-xs text-sky-700 dark:text-sky-300">
          {t('progressUx.freezeUsed', { date: formatDate(streak.lastFrozenDate!) })}
        </Text>
      )}
    </>
  );
}

export function StreakStatsCard({ streak, isLoading }: StreakStatsCardProps) {
  const { t } = useTranslation();

  if (isLoading || !streak) {
    return (
      <View className="mb-4 h-20 rounded-3xl bg-neutral-100 dark:bg-neutral-800" />
    );
  }

  // The current streak baseline is 1, but it must not imply a study history.
  const active = streak.currentStreak > 0 && streak.lastStudiedDate !== null;
  const broken = !active && streak.longestStreak > 0;

  if (!active) {
    return (
      <View className="mb-3 flex-row items-center gap-3.5 rounded-2xl border border-line bg-surface p-3.5 shadow-2xs">
        <StreakFlame3D size={36} state="inactive" animation="none" />
        <View className="flex-1">
          <Text className="font-nunito text-sm font-bold text-neutral-800 dark:text-neutral-200">
            {t(broken ? 'progressUx.streakBroken' : 'progressUx.startStreak')}
          </Text>
          <Text className="font-inter text-[13px] text-neutral-500 dark:text-neutral-400">
            {broken
              ? t('progressUx.streakBrokenSubtitle', { count: streak.longestStreak })
              : t('progressUx.streakZeroSubtitle')}
          </Text>
          <FreezeLines streak={streak} />
        </View>
      </View>
    );
  }

  // The current streak is already in the Activity row; this card adds the record and last study day.
  return (
    <View className="mb-3 flex-row items-center gap-3.5 rounded-2xl border border-line bg-surface p-4 shadow-2xs">
      <StreakFlame3D size={40} state="active" animation="none" />
      <View className="flex-1 gap-0.5">
        <Text className="font-nunito text-xl font-black text-mascot-700 dark:text-mascot-500">
          {t('progressUx.record', { count: streak.longestStreak })}
        </Text>
        {streak.lastStudiedDate && (
          <Text className="font-inter text-xs text-neutral-500 dark:text-neutral-400">
            {t('progressUx.lastStudy', { date: formatDate(streak.lastStudiedDate) })}
          </Text>
        )}
        <FreezeLines streak={streak} />
      </View>
    </View>
  );
}
