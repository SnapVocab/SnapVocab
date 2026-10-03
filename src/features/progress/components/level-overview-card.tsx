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
  const { t } = useTranslation();

  if (isLoading || !xpOverview) {
    return (
      <View className="mb-4 h-36 rounded-3xl bg-neutral-200 dark:bg-neutral-800" />
    );
  }

  const { level, totalXp } = xpOverview;

  // Fallback when level configuration does not exist in backend yet
  if (!level) {
    return (
      <View className="mb-3 flex-row items-center gap-3.5 rounded-2xl border border-neutral-100 bg-white px-4 py-3 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900">
        <XPOrb3D size={40} animation="none" />
        <View className="flex-1">
          <Text className="font-nunito text-base font-extrabold text-neutral-900 dark:text-white">
            {`${totalXp} XP`}
          </Text>
          <Text className="font-inter text-xs text-neutral-500 dark:text-neutral-400">
            {t('progressUx.noLevelCompact')}
          </Text>
        </View>
      </View>
    );
  }

  const nextXp = level.nextLevelXp;
  const hasNext = nextXp !== null && nextXp !== undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('progressUx.levelDetails')}
      onPress={() => router.push('/level-progress')}
      className="mb-3 gap-3 rounded-3xl border border-sky-100 bg-sky-50/70 p-5 active:bg-sky-100/60 dark:border-sky-950 dark:bg-neutral-900"
    >
      <View className="flex-row items-center justify-between">
        <View className="mr-2 flex-1 flex-row items-center gap-3.5">
          <XPOrb3D size={44} animation="none" />
          <View className="flex-1">
            <Text className="font-nunito text-lg font-black text-neutral-900 dark:text-white">
              {t('progressUx.level', {
                count: level.levelNumber,
                title: level.title || '',
              })}
            </Text>
            <Text className="font-nunito text-base font-extrabold text-info-600 dark:text-info-400">
              {hasNext ? `${totalXp} / ${nextXp} XP` : `${totalXp} XP`}
            </Text>
          </View>
        </View>

        <ChevronRightIcon color="#0B8FCE" />
      </View>

      <RatioBar
        progress={hasNext ? level.progress : 1}
        label={t('progressUx.levelProgress')}
      />

      <Text className="font-inter text-xs font-semibold text-neutral-500 dark:text-neutral-400">
        {hasNext
          ? t('progressUx.remaining', { count: Math.max(0, nextXp - totalXp) })
          : t('progressUx.maxLevel')}
      </Text>
    </Pressable>
  );
}
