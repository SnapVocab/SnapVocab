import type { ProgressSummaryDTO } from '../types';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { SRS_ENABLED } from '../utils';

export type AccuracyStatsCardProps = {
  summary?: ProgressSummaryDTO;
  isLoading?: boolean;
};

export function AccuracyStatsCard({ summary, isLoading }: AccuracyStatsCardProps) {
  const router = useRouter();
  const { t } = useTranslation();

  if (isLoading || !summary) {
    return <View className="mb-4 h-20 rounded-2xl bg-neutral-100 dark:bg-neutral-800" />;
  }

  // reviewCount counts SRS review events, which nothing records until SRS exists.
  const hasData =
    summary.accuracy !== null ||
    summary.completedQuizCount > 0 ||
    (SRS_ENABLED && summary.reviewCount > 0);

  if (!hasData) {
    return (
      <View className="mb-3 gap-2 px-1 pt-1">
        <Text className="font-nunito text-base font-bold text-neutral-800 dark:text-neutral-200">
          {t('progressUx.performance')}
        </Text>
        <View className="gap-1.5 rounded-2xl bg-neutral-50/80 p-3.5 dark:bg-neutral-900/60">
          <Text className="font-nunito text-sm font-extrabold text-neutral-800 dark:text-neutral-200">
            {t('progressUx.noPerformanceData')}
          </Text>
          <Text className="font-inter text-xs text-neutral-400 dark:text-neutral-400">
            {t('progressUx.performanceEmptyHint')}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/study/quiz-setup')}
            className="mt-0.5 self-start"
          >
            <Text className="font-nunito text-xs font-extrabold text-info-600 dark:text-info-400">
              {t('progressUx.tryQuizLink')}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="mb-3 gap-2.5 px-1 pt-1">
      <Text className="font-nunito text-base font-bold text-neutral-800 dark:text-neutral-200">
        {t('progressUx.performance')}
      </Text>

      <View className="flex-row items-center divide-x divide-neutral-200/60 rounded-2xl border border-neutral-100 bg-white p-3.5 dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
        <View className="flex-1 items-center px-2">
          <Text className="font-nunito text-2xl font-black text-mascot-navy dark:text-white">
            {summary.accuracy !== null
              ? `${Math.round(summary.accuracy * 100)}%`
              : '--'}
          </Text>
          <Text className="font-inter text-xs font-semibold text-neutral-400">
            {t('progressUx.accuracy')}
          </Text>
        </View>

        <View className="flex-1 items-center px-2">
          <Text className="font-nunito text-2xl font-black text-info-600 dark:text-info-400">
            {summary.completedQuizCount}
          </Text>
          <Text className="font-inter text-xs font-semibold text-neutral-400">
            {t('progressUx.quizzes')}
          </Text>
        </View>

        {SRS_ENABLED && (
          <View className="flex-1 items-center px-2">
            <Text className="font-nunito text-2xl font-black text-primary-600 dark:text-primary-400">
              {summary.reviewCount}
            </Text>
            <Text className="font-inter text-xs font-semibold text-neutral-400">
              {t('progressUx.reviews')}
            </Text>
          </View>
        )}
      </View>

      {summary.accuracy === null && (
        <Text className="font-inter text-[11px] text-neutral-400">
          {t('progressUx.accuracyHint')}
        </Text>
      )}
    </View>
  );
}
