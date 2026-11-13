import type { Leaderboard, LeaderboardRow, LeaderboardWeek } from './types';
import { useFocusEffect, useRouter } from 'expo-router';
import * as React from 'react';
import { AppState, FlatList, Pressable, RefreshControl, View } from 'react-native';
import { Button, FocusAwareStatusBar, SafeAreaView, ScreenHeader, Text, useSurface } from '@/components/ui';
import { InfoIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';
import { useLeaderboard } from './api';
import { LeaderboardInfoSheet } from './components/leaderboard-info-sheet';
import { LeaderboardRowView, MeRowView, SkeletonRows, useStackedLeaderboardRow } from './components/leaderboard-row';
import { formatWeekRange, gapOf, shouldPinMe, updatedParts, visibleSnapshot } from './model';

const LIMIT = 50;
/** PREVIOUS while it settles: ask again at most twice, a minute apart, while the screen is shown (§2.4). */
const FINALIZE_RETRY_MS = 60_000;

export function updatedLabel(asOf: string, now: Date): string | null {
  const parts = updatedParts(asOf, now);
  if (!parts)
    return null;
  return parts.date
    ? translate('leaderboard.updated_date', { time: parts.time, date: parts.date })
    : translate('leaderboard.updated', { time: parts.time });
}

function WeekSwitch({ week, onChange }: { week: LeaderboardWeek; onChange: (week: LeaderboardWeek) => void }) {
  return (
    <View accessibilityRole="tablist" className="flex-row gap-4 border-b border-line bg-surface px-4">
      {(['CURRENT', 'PREVIOUS'] as const).map((value) => {
        const active = value === week;
        return (
          <Pressable
            key={value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(value)}
            className={`min-h-12 flex-1 items-center justify-center border-b-[3px] py-2 active:bg-pressed ${active ? 'border-primary-500' : 'border-transparent'}`}
          >
            <Text className={`text-center font-nunito text-[15px] font-extrabold ${active ? 'text-primary-800 dark:text-primary-300' : 'text-neutral-500 dark:text-neutral-300'}`}>
              {translate(value === 'CURRENT' ? 'leaderboard.period.current' : 'leaderboard.period.previous')}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ColumnLabels() {
  return (
    <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden className="flex-row items-center gap-2 border-b border-line bg-surface px-4 py-2">
      <Text className="min-w-10 text-center font-inter text-xs font-semibold text-neutral-500 dark:text-neutral-300">{translate('leaderboard.columns.rank')}</Text>
      <Text className="flex-1 font-inter text-xs font-semibold text-neutral-500 dark:text-neutral-300">{translate('leaderboard.columns.learner')}</Text>
      <Text className="font-inter text-xs font-semibold text-neutral-500 dark:text-neutral-300">XP</Text>
    </View>
  );
}

function Meta({ data, week, now, refreshing, cachedError, onRetry }: {
  data: Leaderboard;
  week: LeaderboardWeek;
  now: Date;
  refreshing: boolean;
  cachedError: boolean;
  onRetry: () => void;
}) {
  const updated = updatedLabel(data.asOf, now);
  return (
    <View className="gap-1 border-b border-line bg-surface-raised px-4 py-3">
      <Text className="font-nunito text-base font-black text-mascot-navy dark:text-white">{formatWeekRange(data.weekStart, data.weekEnd)}</Text>
      {week === 'PREVIOUS' && (
        <Text className={`font-inter text-[13px] font-bold ${data.isFinal ? 'text-primary-800 dark:text-primary-300' : 'text-amber-800 dark:text-amber-200'}`}>
          {translate(data.isFinal ? 'leaderboard.status.final' : 'leaderboard.status.finalizing')}
        </Text>
      )}
      <View className="flex-row flex-wrap justify-between gap-x-3">
        <Text className="font-inter text-[13px] text-neutral-500 dark:text-neutral-300">{translate('leaderboard.count', { count: data.participants })}</Text>
        <Text className="font-inter text-[13px] text-neutral-500 dark:text-neutral-300">
          {refreshing ? translate('leaderboard.refreshing') : updated}
        </Text>
      </View>
      {week === 'PREVIOUS' && !data.isFinal && (
        <Text className="font-inter text-[13px] text-neutral-500 dark:text-neutral-300">{translate('leaderboard.finalizing_note')}</Text>
      )}
      {week === 'PREVIOUS' && (
        <Text className="font-inter text-[13px] text-neutral-500 dark:text-neutral-300">{translate('leaderboard.previous_trend_note')}</Text>
      )}
      {cachedError && <CachedError onRetry={onRetry} />}
    </View>
  );
}

export function CachedError({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="gap-2 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-400/10">
      <Text accessibilityLiveRegion="polite" className="font-inter text-[13px] text-amber-800 dark:text-amber-200">{translate('leaderboard.cached_error')}</Text>
      <View className="items-start">
        <Button tx="leaderboard.retry" variant="outline" onPress={onRetry} />
      </View>
    </View>
  );
}

/** Unranked / admin note and the learn CTA, in the scroll flow, never pinned (§2.3, §5). */
export function PersonalNote({ data, week, onLearn }: { data: Leaderboard; week: LeaderboardWeek; onLearn: () => void }) {
  const empty = data.entries.length === 0;
  if (!data.me.eligible)
    return <Text className="p-4 font-inter text-[15px] text-neutral-600 dark:text-neutral-200">{translate('leaderboard.admin')}</Text>;
  if (empty || data.me.rank !== null)
    return null;
  return (
    <View className="gap-3 p-4">
      <Text className="font-inter text-[15px] text-neutral-700 dark:text-neutral-100">
        {translate(week === 'CURRENT' ? 'leaderboard.unranked_current' : 'leaderboard.unranked_previous')}
      </Text>
      {week === 'CURRENT' && <Button tx="leaderboard.learn" onPress={onLearn} />}
    </View>
  );
}

export function EmptyBoard({ data, week, onLearn }: { data: Leaderboard; week: LeaderboardWeek; onLearn: () => void }) {
  return (
    <View className="gap-2 px-4 py-8">
      <Text className="font-nunito text-lg font-black text-mascot-navy dark:text-white">
        {translate(week === 'CURRENT' ? 'leaderboard.empty_current_title' : 'leaderboard.empty_previous')}
      </Text>
      {week === 'CURRENT' && data.me.eligible && (
        <>
          <Text className="font-inter text-[15px] text-neutral-600 dark:text-neutral-200">{translate('leaderboard.empty_current_body')}</Text>
          <Button tx="leaderboard.learn" onPress={onLearn} />
        </>
      )}
    </View>
  );
}

export function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="gap-3 px-4 py-8">
      <Text className="font-inter text-[15px] text-neutral-700 dark:text-neutral-100">{translate('leaderboard.error')}</Text>
      <Button tx="leaderboard.retry" variant="outline" onPress={onRetry} />
    </View>
  );
}

/** MH-GAME-01: this week / last week, top 50 rows, "you" pinned only outside them. */
export function LeaderboardScreen() {
  const router = useRouter();
  const surface = useSurface();
  const [week, setWeek] = React.useState<LeaderboardWeek>('CURRENT');
  const [infoOpen, setInfoOpen] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [pulling, setPulling] = React.useState(false);
  const listRef = React.useRef<FlatList<LeaderboardRow>>(null);
  const query = useLeaderboard(week, LIMIT);
  const { refetch } = query;
  const now = new Date();
  const data = visibleSnapshot(query, week, now);

  // Navigating back does not refetch on React Native by itself: reload on focus when the cached board is stale.
  const staleRef = React.useRef(query.isStale);
  staleRef.current = query.isStale || (!!query.data && !data);
  useFocusEffect(React.useCallback(() => {
    setFocused(true);
    if (staleRef.current)
      void refetch({ cancelRefetch: false });
    return () => setFocused(false);
  }, [refetch]));

  const settling = week === 'PREVIOUS' && data?.isFinal === false;
  React.useEffect(() => {
    if (!focused || !settling)
      return;
    function refreshIfActive() {
      if (AppState.currentState === 'active')
        void refetch();
    }
    const first = setTimeout(refreshIfActive, FINALIZE_RETRY_MS);
    const second = setTimeout(refreshIfActive, 2 * FINALIZE_RETRY_MS);
    return () => {
      clearTimeout(first);
      clearTimeout(second);
    };
  }, [focused, settling, refetch]);

  function changeWeek(next: LeaderboardWeek) {
    if (next === week)
      return;
    setWeek(next);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }

  async function pullToRefresh() {
    setPulling(true);
    try {
      await refetch();
    }
    finally {
      setPulling(false);
    }
  }

  const goLearn = () => router.push('/learn');
  const pinned = data && shouldPinMe(data);
  const gap = data && gapOf(data, week);
  const gapLabel = gap ? translate(gap.key, { xp: gap.xp, rank: gap.rank }) : undefined;
  const stacked = useStackedLeaderboardRow();

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-surface" edges={['top', 'bottom']}>
      <FocusAwareStatusBar />
      <ScreenHeader
        title={translate('leaderboard.title')}
        onBack={() => router.back()}
        right={(
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={translate('leaderboard.help')}
            onPress={() => setInfoOpen(true)}
            className="size-12 items-center justify-center rounded-full active:bg-pressed"
          >
            <InfoIcon width={22} height={22} color={surface.text} />
          </Pressable>
        )}
      />
      <WeekSwitch week={week} onChange={changeWeek} />
      {!data
        ? (query.isError && !query.isFetching
            ? <LoadError onRetry={() => void refetch()} />
            : <SkeletonRows count={6} />)
        : (
            <FlatList
              ref={listRef}
              style={{ flex: 1 }}
              data={data.entries}
              keyExtractor={(row, index) => `${index}:${row.rank}`}
              refreshControl={<RefreshControl refreshing={pulling} onRefresh={() => void pullToRefresh()} />}
              ListHeaderComponent={(
                <>
                  <Meta
                    data={data}
                    week={week}
                    now={now}
                    refreshing={query.isFetching && !pulling}
                    cachedError={query.isError}
                    onRetry={() => void refetch()}
                  />
                  {data.entries.length > 0 && !stacked && <ColumnLabels />}
                </>
              )}
              renderItem={({ item }) => (
                <LeaderboardRowView row={item} week={week} gap={item.isMe ? gapLabel : undefined} />
              )}
              ListEmptyComponent={<EmptyBoard data={data} week={week} onLearn={goLearn} />}
              ListFooterComponent={(
                <>
                  <PersonalNote data={data} week={week} onLearn={goLearn} />
                  {data.entries.length > 0 && (
                    <Text className="p-4 text-center font-inter text-[13px] text-neutral-500 dark:text-neutral-300">
                      {translate('leaderboard.footer', { n: data.entries.length, count: data.participants })}
                    </Text>
                  )}
                </>
              )}
            />
          )}
      {pinned && (
        <View className="border-t border-line bg-surface">
          <MeRowView me={data.me} week={week} gap={gapLabel} />
        </View>
      )}
      <LeaderboardInfoSheet open={infoOpen} onClose={() => setInfoOpen(false)} />
    </SafeAreaView>
  );
}
