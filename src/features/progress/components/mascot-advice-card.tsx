import type { ProgressSummaryDTO, StreakDTO } from '../types';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Snapy } from '@/components/Snapy';
import { Text } from '@/components/ui';
import { SRS_ENABLED } from '../utils';

/** Render only with loaded data: advice built from missing data would be invented. */
export type MascotAdviceCardProps = {
  summary: ProgressSummaryDTO;
  streak: StreakDTO;
};

export function MascotAdviceCard({ summary, streak }: MascotAdviceCardProps) {
  const { t } = useTranslation();

  const { totalWords, accuracy } = summary;
  const currentStreak = streak.currentStreak;
  const dueCount = SRS_ENABLED ? summary.dueCount : 0;
  // Without SRS no word ever leaves NEW, so "not studied yet" would just be every saved word.
  const savedCount = SRS_ENABLED ? Math.max(0, totalWords - summary.learnedCount) : totalWords;

  let title = t('progressUx.genericTipTitle');
  let body = t('progressUx.genericTipBody');
  let isContextual = true;

  if (dueCount > 0) {
    title = t('progressUx.snapyDueTitle', { count: dueCount });
    body = t('progressUx.snapyDueBody', { count: dueCount });
  }
  else if (savedCount > 0 && currentStreak === 0) {
    title = t('progressUx.snapyNewWordsTitle', { count: savedCount });
    body = t('progressUx.snapyNewWordsBody', { count: savedCount });
  }
  else if (currentStreak >= 7) {
    title = t('progressUx.snapyStreakTitle', { count: currentStreak });
    body = t('progressUx.snapyStreakBody', { count: currentStreak });
  }
  else if (accuracy != null && accuracy >= 0.85) {
    title = t('progressUx.snapyAccuracyTitle', { count: Math.round(accuracy * 100) });
    body = t('progressUx.snapyAccuracyBody', { count: Math.round(accuracy * 100) });
  }
  else if (totalWords === 0) {
    title = t('progressUx.snapyEmptyTitle');
    body = t('progressUx.snapyEmptyBody');
  }
  else {
    isContextual = false;
  }

  return (
    <View
      className={`mb-3 flex-row items-center gap-3 rounded-2xl p-3.5 shadow-2xs ${
        isContextual
          ? 'border border-emerald-500/20 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-500/10'
          : 'border border-line bg-surface'
      }`}
    >
      <Snapy
        pose={isContextual ? 'happy' : 'chao_mung'}
        animation="none"
        className="size-14"
      />
      <View className="flex-1 gap-0.5">
        <Text className="font-nunito text-sm font-extrabold text-neutral-900 dark:text-neutral-100">
          {title}
        </Text>
        <Text className="font-inter text-[13px] text-neutral-600 dark:text-neutral-400">
          {body}
        </Text>
      </View>
    </View>
  );
}
