import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { FocusAwareStatusBar, SafeAreaView, ScreenHeader } from '@/components/ui';
import { translate } from '@/lib/i18n';
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
  const summaryData = summary.isError ? undefined : summary.data;
  const streakData = streak.isError ? undefined : streak.data;

  // Covers every progress query on screen, including the history chart's own query.
  const onRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await invalidateProgress(queryClient);
    setIsRefreshing(false);
  }, [queryClient]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }} className="flex-1 bg-[#F7F8FA] dark:bg-neutral-950">
      <FocusAwareStatusBar />

      <ScreenHeader title={translate('progressUx.statsTitle')} onBack={() => router.back()} />

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pt-5 pb-12"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#58CC02" />
        }
      >
        {summary.isError && <SectionError onRetry={() => void summary.refetch()} />}

        {/* A failed refetch hides that query's numbers everywhere, never in one card but not another. */}
        {/* 1. Activity (Saved | Streak | Quizzes) */}
        <QuickOverviewRow
          summary={summaryData}
          streak={streakData}
          isLoading={summary.isLoading || streak.isLoading}
        />

        {/* 2. Performance */}
        {!summary.isError && (
          <AccuracyStatsCard summary={summary.data} isLoading={summary.isLoading} />
        )}

        {/* 3. Streak */}
        {streak.isError
          ? <SectionError onRetry={() => void streak.refetch()} />
          : <StreakStatsCard streak={streak.data} isLoading={streak.isLoading} />}

        {/* 4. Activity History (owns its loading/error/empty states) */}
        <ActivityHistoryChart />

        {/* 5. Vocabulary (SRS note while SRS is off) */}
        {!summary.isError && (
          <LearningStateCard summary={summary.data} isLoading={summary.isLoading} />
        )}

        {/* 6. Level & XP: MH-STATS-02 has its own screen, so it follows the learning stats. */}
        {xp.isError
          ? <SectionError onRetry={() => void xp.refetch()} />
          : <LevelOverviewCard xpOverview={xp.data} isLoading={xp.isLoading} />}

        {/* 7. Snapy advice — only from fresh loaded data, never from defaults or a failed refetch */}
        {summaryData && streakData && (
          <MascotAdviceCard summary={summaryData} streak={streakData} />
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

export default StatsScreen;
