import type { ProgressSummaryDTO, StreakDTO } from '../types';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import { SRS_ENABLED } from '../utils';

export type QuickOverviewRowProps = {
  summary?: ProgressSummaryDTO;
  streak?: StreakDTO;
  isLoading?: boolean;
};

export function QuickOverviewRow({ summary, streak, isLoading = false }: QuickOverviewRowProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <View className="mb-4 h-20 rounded-3xl bg-neutral-100 dark:bg-neutral-800" />
    );
  }
  // A failed query is reported by its own section; never show zeros in its place.
  if (!summary || !streak) {
    return null;
  }

  // Without SRS, "due" is structurally 0; show the quiz count the backend actually tracks.
  const third = SRS_ENABLED
    ? { value: summary.dueCount, label: t('progressUx.overviewDue'), highlight: summary.dueCount > 0 }
    : { value: summary.completedQuizCount, label: t('progressUx.quizzes'), highlight: false };

  // "Activity" group: how much you do. Results (accuracy) live in AccuracyStatsCard.
  return (
    <View className="mb-3 gap-2 px-1 pt-1">
      <Text className="font-nunito text-base font-bold text-neutral-800 dark:text-neutral-200">
        {t('progressUx.quickOverview')}
      </Text>
      <View className="flex-row divide-x divide-line rounded-2xl border border-line bg-surface p-3.5 shadow-2xs">
        {/* Col 1: Từ đã lưu */}
        <View className="flex-1 items-center px-2">
          <Text className="font-nunito text-2xl font-black text-neutral-900 dark:text-white">
            {summary.totalWords}
          </Text>
          <Text className="text-center font-inter text-[13px]/4 font-semibold text-neutral-500 dark:text-neutral-400">
            {t('progressUx.overviewSaved')}
          </Text>
        </View>

        {/* Col 2: Streak */}
        <View className="flex-1 items-center px-2">
          <Text className="font-nunito text-2xl font-black text-mascot-700 dark:text-mascot-500">
            {streak.currentStreak}
          </Text>
          <Text className="text-center font-inter text-[13px]/4 font-semibold text-neutral-500 dark:text-neutral-400">
            {t('progressUx.overviewStreak')}
          </Text>
        </View>

        {/* Col 3: Cần ôn (SRS) / Quiz hoàn thành */}
        <View className="flex-1 items-center px-2">
          <Text
            className={`font-nunito text-2xl font-black ${
              third.highlight ? 'text-amber-500' : 'text-neutral-900 dark:text-white'
            }`}
          >
            {third.value}
          </Text>
          <Text className="text-center font-inter text-[13px]/4 font-semibold text-neutral-500 dark:text-neutral-400">
            {third.label}
          </Text>
        </View>
      </View>
    </View>
  );
}
