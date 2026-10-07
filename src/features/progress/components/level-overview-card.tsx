import type { XpOverviewDTO } from '../types';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { XPOrb3D } from '@/components/snapvocab';
import { Text } from '@/components/ui';
import { ChevronRightIcon } from '@/components/ui/icons';
import { RatioBar } from './progress-primitives';

export type LevelOverviewCardProps = {
  xpOverview?: XpOverviewDTO;
  isLoading?: boolean;
};

export function LevelOverviewCard({ xpOverview, isLoading }: LevelOverviewCardProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const fmt = (n: number) => n.toLocaleString(i18n.language);

  if (isLoading || !xpOverview) {
    return (
      <View className="mb-4 h-36 rounded-3xl bg-neutral-200 dark:bg-neutral-800" />
    );
  }

  const { level, totalXp } = xpOverview;

  // No level configured yet: no level is invented, but the XP history stays reachable.
  if (!level) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('progressUx.xpHistory')}
        onPress={() => router.push('/level-progress')}
        className="mb-3 flex-row items-center gap-3.5 rounded-2xl border border-neutral-100 bg-white px-4 py-3 shadow-2xs active:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <XPOrb3D size={40} animation="none" />
        <View className="flex-1">
          <Text className="font-nunito text-base font-extrabold text-neutral-900 dark:text-white">
            {`${fmt(totalXp)} XP`}
          </Text>
          <Text className="font-inter text-[13px] text-neutral-500 dark:text-neutral-400">
            {t('progressUx.noLevelCompact')}
          </Text>
        </View>
        <ChevronRightIcon color="#0B8FCE" />
      </Pressable>
    );
  }

  const nextXp = level.nextLevelXp;
  const hasNext = nextXp !== null && nextXp !== undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('progressUx.levelDetails')}
      onPress={() => router.push('/level-progress')}
      className="mb-3 gap-3 rounded-3xl border border-info-100 bg-info-50 p-5 active:bg-info-100 dark:border-info-700/40 dark:bg-neutral-900"
    >
      <View className="flex-row items-center justify-between">
        <View className="mr-2 flex-1 flex-row items-center gap-3.5">
          <XPOrb3D size={44} animation="none" />
          <View className="flex-1">
            <Text className="font-nunito text-lg font-black text-neutral-900 dark:text-white">
              {level.title
                ? t('progressUx.level', { count: level.levelNumber, title: level.title })
                : t('progressUx.levelNumber', { count: level.levelNumber })}
            </Text>
            {/* Cumulative XP; the bar below is progress inside the current level, not totalXp / nextLevelXp. */}
            <Text className="font-nunito text-base font-extrabold text-info-600 dark:text-info-400">
              {t('progressUx.totalXp', { xp: fmt(totalXp) })}
            </Text>
          </View>
        </View>

        <ChevronRightIcon color="#0B8FCE" />
      </View>

      <RatioBar
        progress={hasNext ? level.progress : 1}
        label={t('progressUx.levelProgress')}
      />

      <Text className="font-inter text-[13px] font-semibold text-neutral-500 dark:text-neutral-400">
        {hasNext
          ? t('progressUx.remaining', { xp: fmt(Math.max(0, nextXp - totalXp)), level: level.levelNumber + 1 })
          : t('progressUx.maxLevel')}
      </Text>
    </Pressable>
  );
}
