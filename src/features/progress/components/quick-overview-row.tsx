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

  return (
    <View className="mb-3 rounded-2xl border border-neutral-100 bg-white p-3.5 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900">
      <View className="flex-row items-center divide-x divide-neutral-100 dark:divide-neutral-800">
        {/* Col 1: Từ đã lưu */}
        <View className="flex-1 items-center px-2">
          <Text className="font-nunito text-2xl font-black text-neutral-900 dark:text-white">
            {summary.totalWords}
          </Text>
          <Text className="font-inter text-xs font-semibold text-neutral-400 dark:text-neutral-400">
            {t('progressUx.overviewSaved')}
          </Text>
        </View>

        {/* Col 2: Streak */}
        <View className="flex-1 items-center px-2">
          <Text className="font-nunito text-2xl font-black text-mascot-500">
            {streak.currentStreak}
          </Text>
          <Text className="font-inter text-xs font-semibold text-neutral-400 dark:text-neutral-400">
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
          <Text className="font-inter text-xs font-semibold text-neutral-400 dark:text-neutral-400">
            {third.label}
          </Text>
        </View>
      </View>
    </View>
  );
}
