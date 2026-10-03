import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import { FocusAwareStatusBar, SafeAreaView, Text } from '@/components/ui';
import { ChevronLeftIcon } from '@/components/ui/icons';
import {
  invalidateProgress,
  useProgressSummary,
  useStreak,
  useXpOverview,
} from './api';
import {
  AccuracyStatsCard,
  ActivityHistoryChart,
  LearningStateCard,
  LevelOverviewCard,
  MascotAdviceCard,
  QuickOverviewRow,
  SectionError,
  StreakStatsCard,
} from './components';

export function StatsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const summary = useProgressSummary();
  const streak = useStreak();
  const xp = useXpOverview();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Covers every progress query on screen, including the history chart's own query.
  const onRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await invalidateProgress(queryClient);
    setIsRefreshing(false);
  }, [queryClient]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }} className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <FocusAwareStatusBar />

      {/* Top Header */}
      <View className="flex-row items-center justify-between border-b border-neutral-100 bg-white px-4 py-3.5 dark:border-neutral-800 dark:bg-neutral-900">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="size-9 items-center justify-center rounded-xl bg-neutral-100 active:bg-neutral-200 dark:bg-neutral-800"
        >
          <ChevronLeftIcon color="#64748B" />
        </TouchableOpacity>

        <Text className="font-nunito text-base font-extrabold text-neutral-900 dark:text-white">
          Thống kê học tập
        </Text>

        <View className="size-9" />
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="p-4 pb-12"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#58CC02" />
        }
      >
        {/* 1. Level Hero (Navigation to Level Progress) */}
        {xp.isError
          ? <SectionError onRetry={() => void xp.refetch()} />
          : <LevelOverviewCard xpOverview={xp.data} isLoading={xp.isLoading} />}

        {/* Summary-backed sections: one error card stands in for all of them. */}
        {summary.isError && <SectionError onRetry={() => void summary.refetch()} />}

        {/* 2. Quick Overview (Saved | Streak | Quizzes) — nothing if either query failed */}
        <QuickOverviewRow
          summary={summary.data}
          streak={streak.data}
          isLoading={summary.isLoading || streak.isLoading}
        />

        {/* 3. Snapy Mascot Advice — only from loaded data, never from defaults */}
        {summary.data && streak.data && (
          <MascotAdviceCard summary={summary.data} streak={streak.data} />
        )}

        {/* 4. Vocabulary */}
        {!summary.isError && (
          <LearningStateCard summary={summary.data} isLoading={summary.isLoading} />
        )}

        {/* 5. Streak */}
        {streak.isError
          ? <SectionError onRetry={() => void streak.refetch()} />
          : <StreakStatsCard streak={streak.data} isLoading={streak.isLoading} />}

        {/* 6. Performance */}
        {!summary.isError && (
          <AccuracyStatsCard summary={summary.data} isLoading={summary.isLoading} />
        )}

        {/* 7. Activity History (owns its loading/error/empty states) */}
        <ActivityHistoryChart />

      </ScrollView>
    </SafeAreaView>
  );
}

export default StatsScreen;
