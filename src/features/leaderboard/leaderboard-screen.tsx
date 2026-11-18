import type { Leaderboard, LeaderboardRow, LeaderboardWeek } from './types';
import { useFocusEffect, useRouter } from 'expo-router';
import * as React from 'react';
import { AppState, FlatList, Pressable, RefreshControl, View } from 'react-native';
import { Button, FocusAwareStatusBar, SafeAreaView, ScreenHeader, Text, useSurface } from '@/components/ui';
import { InfoIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';
import { useLeaderboard } from './api';
import { LeaderboardInfoSheet } from './components/leaderboard-info-sheet';
import { GapLine, LeaderboardRowView, MeRowView, SkeletonRows } from './components/leaderboard-row';
import { LeaderboardTop3Stage } from './components/leaderboard-top3-stage';
import { formatWeekRange, formatXp, gapOf, gapProgressOf, remainingParts, shouldPinMe, updatedParts, visibleSnapshot } from './model';

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

function WeekSwitch({ week, onChange, statusPill }: {
  week: LeaderboardWeek;
  onChange: (week: LeaderboardWeek) => void;
  statusPill?: { text: string; tone: 'neutral' | 'final' | 'settling' } | null;
}) {
  const pillStyle = statusPill?.tone === 'final'
    ? 'bg-primary-50 dark:bg-primary-500/15'
    : statusPill?.tone === 'settling'
      ? 'bg-amber-50 dark:bg-amber-400/15'
      : 'bg-neutral-50 dark:bg-neutral-800';
  const pillTextStyle = statusPill?.tone === 'final'
    ? 'text-primary-800 dark:text-primary-300'
    : statusPill?.tone === 'settling'
      ? 'text-amber-800 dark:text-amber-200'
      : 'text-neutral-600 dark:text-neutral-300';

  return (
    <View className="flex-row flex-wrap items-center justify-between gap-2 bg-surface px-4 pt-1 pb-2">
      <View accessibilityRole="tablist" className="flex-row rounded-xl bg-neutral-50 p-0.5 dark:bg-neutral-800">
        {(['CURRENT', 'PREVIOUS'] as const).map((value) => {
          const active = value === week;
          return (
            <Pressable
              key={value}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => onChange(value)}
              className={`min-h-9 items-center justify-center rounded-[10px] px-3.5 py-1.5 ${active ? 'bg-surface dark:bg-neutral-700' : ''}`}
            >
              <Text className={`text-center font-nunito text-[13px] font-extrabold ${active ? 'text-mascot-navy dark:text-white' : 'text-neutral-500 dark:text-neutral-300'}`}>
                {translate(value === 'CURRENT' ? 'leaderboard.period.current' : 'leaderboard.period.previous')}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {statusPill && (
        <View className={`rounded-full px-2.5 py-1 ${pillStyle}`}>
          <Text className={`font-inter text-[11px] font-bold ${pillTextStyle}`}>
            {statusPill.text}
          </Text>
        </View>
      )}
    </View>
  );
}

/** `fromRank` is the first list row's own rank: a tie across the stage edge (1–2–3–3) starts the list at 3, not 4. */
function ListSectionHeader({ fromRank }: { fromRank: number }) {
  return (
    <View className="flex-row items-center justify-between border-b border-line bg-surface px-4 pt-3.5 pb-1.5">
      <Text accessibilityRole="header" className="font-nunito text-[11px] font-extrabold tracking-wider text-neutral-500 uppercase dark:text-neutral-300">
        {translate('leaderboard.list_range', { rank: fromRank })}
      </Text>
      <Text importantForAccessibility="no" className="font-nunito text-[11px] font-extrabold tracking-wider text-neutral-500 uppercase dark:text-neutral-300">
        {translate('leaderboard.xp_column')}
      </Text>
    </View>
  );
}

function MeTop3Banner({ data, week, gapLabel, gapProgress }: {
  data: Leaderboard;
  week: LeaderboardWeek;
  gapLabel?: string;
  gapProgress?: number | null;
}) {
  if (week === 'CURRENT' && gapLabel) {
    return (
      <View className="mx-3 mt-2.5 rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 dark:border-primary-500/30 dark:bg-primary-500/15">
        <GapLine gap={gapLabel} pct={gapProgress} />
      </View>
    );
  }
  if (week === 'PREVIOUS' && data.me.rank !== null) {
    return (
      <View className="mx-3 mt-2.5 flex-row items-center justify-between gap-2 rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 dark:border-primary-500/30 dark:bg-primary-500/15">
        <Text className="flex-1 font-inter text-xs font-bold text-primary-800 dark:text-primary-300">
          {translate('leaderboard.me_previous_top3', { rank: data.me.rank, xp: formatXp(data.me.score) })}
        </Text>
        <Text className="font-nunito text-[11px] font-extrabold text-primary-800/80 dark:text-primary-300/80">
          {translate('leaderboard.top3_badge')}
        </Text>
      </View>
    );
  }
  return null;
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
    <View className="gap-1 bg-surface px-4 pt-0.5 pb-2">
      <View className="flex-row flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
        <View className="flex-row flex-wrap items-center gap-x-1.5">
          <Text className="font-nunito text-[13px] font-black text-mascot-navy dark:text-white">
            {formatWeekRange(data.weekStart, data.weekEnd)}
          </Text>
          <Text className="font-inter text-xs text-neutral-500 dark:text-neutral-300">·</Text>
          <Text className="font-inter text-xs text-neutral-500 dark:text-neutral-300">
            {translate('leaderboard.count', { count: data.participants })}
          </Text>
        </View>
        <Text className="font-inter text-xs text-neutral-500 dark:text-neutral-300">
          {refreshing ? translate('leaderboard.refreshing') : updated}
        </Text>
      </View>
      {week === 'PREVIOUS' && !data.isFinal && (
        <Text className="font-inter text-xs text-neutral-500 dark:text-neutral-300">{translate('leaderboard.finalizing_note')}</Text>
      )}
      {week === 'PREVIOUS' && (
        <Text className="font-inter text-xs text-neutral-500 dark:text-neutral-300">{translate('leaderboard.previous_trend_note')}</Text>
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
  const gapProgress = data ? gapProgressOf(data, week) : null;
  const top3 = data ? data.entries.slice(0, 3) : [];
  const rest = data ? data.entries.slice(3) : [];
  const meInTop3 = top3.some(row => row.isMe);
  const remaining = data && week === 'CURRENT' ? remainingParts(data.endsAt, now) : null;
  const statusPill = !data
    ? null
    : week === 'PREVIOUS'
      ? {
          text: translate(data.isFinal ? 'leaderboard.status.final' : 'leaderboard.status.finalizing'),
          tone: data.isFinal ? 'final' as const : 'settling' as const,
        }
      : remaining
        ? {
            text: remaining.count !== undefined ? translate(remaining.key, { count: remaining.count }) : translate(remaining.key),
            tone: 'neutral' as const,
          }
        : null;

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
      <WeekSwitch week={week} onChange={changeWeek} statusPill={statusPill} />
      {!data
        ? (query.isError && !query.isFetching
            ? <LoadError onRetry={() => void refetch()} />
            : <SkeletonRows count={6} />)
        : (
            <FlatList
              ref={listRef}
              style={{ flex: 1 }}
              data={rest}
              keyExtractor={(row, index) => `${index + 3}:${row.rank}`}
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
                  {top3.length > 0 && <LeaderboardTop3Stage entries={top3} week={week} />}
                  {meInTop3 && (
                    <MeTop3Banner
                      data={data}
                      week={week}
                      gapLabel={gapLabel}
                      gapProgress={gapProgress}
                    />
                  )}
                  {rest.length > 0 && <ListSectionHeader fromRank={rest[0].rank} />}
                </>
              )}
              renderItem={({ item }) => (
                <LeaderboardRowView
                  row={item}
                  week={week}
                  gap={item.isMe ? gapLabel : undefined}
                  gapProgress={item.isMe ? gapProgress : undefined}
                />
              )}
              ListEmptyComponent={data.entries.length === 0 ? <EmptyBoard data={data} week={week} onLearn={goLearn} /> : null}
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
          <MeRowView me={data.me} week={week} gap={gapLabel} gapProgress={gapProgress} />
        </View>
      )}
      <LeaderboardInfoSheet open={infoOpen} onClose={() => setInfoOpen(false)} />
    </SafeAreaView>
  );
}
