import type { BadgeItem } from './types';
import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { AppState, RefreshControl, ScrollView, View } from 'react-native';
import { Button, FocusAwareStatusBar, SafeAreaView, ScreenHeader, Text } from '@/components/ui';
import { Snapy } from '@/components/ui/snapy';
import { translate } from '@/lib/i18n';
import { markBadgesSeen, syncBadges, useBadges } from './api';
import { AchievementDetailSheet } from './components/achievement-detail-sheet';
import { AchievementHero, StatusBanner } from './components/achievement-hero';
import { AchievementShelf } from './components/achievement-shelf';
import { buildSeries, inDisplayOrder, screenState, seriesOf, unseenIds } from './model';
import { useBadgeSessionStore } from './use-badge-session-store';

/** How long the entry sync may take before the cached view is used for the first NEW snapshot (UI-BDG-03). */
const ENTRY_SYNC_TIMEOUT_MS = 3000;

function parseIds(raw: string | string[] | undefined): number[] {
  const value = Array.isArray(raw) ? raw.join(',') : raw;
  return (value ?? '').split(',').map(Number).filter(id => Number.isInteger(id) && id > 0);
}

/** MH-GAME-03 (achievements_ui.md). Opened from Profile or from the unlock modal with `?highlight=`. */
export function AchievementsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ highlight?: string; open?: string }>();
  const query = useBadges();
  const { data } = query;
  const [entrySettled, setEntrySettled] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [introducedIds, setIntroducedIds] = React.useState<number[]>([]);
  const [highlightIds, setHighlightIds] = React.useState<number[]>(() => parseIds(params.highlight));
  const [selected, setSelected] = React.useState<BadgeItem | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const introducedRef = React.useRef<number[]>([]);
  const postedRef = React.useRef<Set<number>>(new Set());

  /** Marks exactly the badges this visit presented; anything synced later stays unseen (UI-BDG-03). */
  const flushIntroduced = React.useCallback(() => {
    const ids = introducedRef.current.filter(id => !postedRef.current.has(id));
    ids.forEach(id => postedRef.current.add(id));
    if (ids.length > 0)
      void markBadgesSeen(queryClient, ids);
  }, [queryClient]);

  useFocusEffect(React.useCallback(() => {
    let active = true;
    setFocused(true);
    setEntrySettled(false);
    const timeout = setTimeout(() => active && setEntrySettled(true), ENTRY_SYNC_TIMEOUT_MS);
    void syncBadges(queryClient).then(() => active && setEntrySettled(true));
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background')
        flushIntroduced();
      else if (state === 'active')
        void syncBadges(queryClient);
    });
    return () => {
      active = false;
      clearTimeout(timeout);
      subscription.remove();
      flushIntroduced();
      // The recognition block belongs to this visit only; the next focus starts in NORMAL.
      introducedRef.current = [];
      setIntroducedIds([]);
      setHighlightIds([]);
      setFocused(false);
    };
  }, [queryClient, flushIntroduced]));

  // Snapshot: once the entry sync settles, every unseen badge rendered by the NEW state joins `introducedIds`.
  React.useEffect(() => {
    if (!focused || !entrySettled || !data)
      return;
    const fresh = unseenIds(data).filter(id => !introducedRef.current.includes(id));
    if (fresh.length === 0)
      return;
    introducedRef.current = [...introducedRef.current, ...fresh];
    setIntroducedIds(introducedRef.current);
    useBadgeSessionStore.getState().markShown(fresh);
  }, [focused, entrySettled, data]);

  // A medal tapped on Profile opens its sheet once the catalog is here (achievements_ui.md §11, P2).
  const openedRef = React.useRef(false);
  React.useEffect(() => {
    if (openedRef.current || !params.open || !data)
      return;
    openedRef.current = true;
    const item = data.badges.find(b => String(b.id) === params.open);
    if (item)
      setSelected(item);
  }, [params.open, data]);

  const onRefresh = async () => {
    setRefreshing(true);
    const view = await syncBadges(queryClient);
    if (!view)
      await query.refetch();
    setRefreshing(false);
  };

  const navigate = (route: '/study/quiz-setup' | '/collections') => router.push(route);
  const seriesList = data ? buildSeries(data) : [];
  const newItems = inDisplayOrder(seriesList, [...introducedIds, ...highlightIds]).filter(i => i.earned);
  const stale = query.isError && !!data;
  const state = data ? screenState(data, { stale, newIds: newItems.map(i => i.id) }) : 'NORMAL';

  return (
    <SafeAreaView className="flex-1 bg-[#F7F8FA] dark:bg-neutral-950" edges={['top']}>
      <FocusAwareStatusBar />
      <ScreenHeader title={translate('badges.title')} onBack={() => router.back()} />
      <ScrollView
        contentContainerClassName="px-4 pt-5 pb-12"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor="#58CC02" />}
      >
        {!data && query.isPending && <Skeleton />}
        {!data && query.isError && (
          <Notice title={translate('badges.error_title')} body={translate('badges.error_body')} onRetry={() => void onRefresh()} />
        )}
        {data && data.badges.length === 0 && <Notice body={translate('badges.empty_catalog')} onRetry={() => void onRefresh()} />}
        {data && data.badges.length > 0 && (
          <>
            {stale && <StatusBanner tone="stale" />}
            <View
              accessible
              accessibilityLabel={translate('badges.collection_a11y', { earned: data.earnedCount, total: data.totalCount })}
              className="mb-4 flex-row flex-wrap items-baseline justify-between gap-x-2"
            >
              <Text className="font-nunito text-[22px] leading-[30px] font-extrabold text-mascot-navy dark:text-white">{translate('badges.collection')}</Text>
              <Text className="font-nunito text-[28px] font-extrabold text-mascot-navy tabular-nums dark:text-white">
                {data.earnedCount}
                <Text className="font-nunito text-[18px] font-extrabold text-neutral-500 dark:text-neutral-400">{`/${data.totalCount}`}</Text>
              </Text>
            </View>
            <AchievementHero state={state} seriesList={seriesList} newItems={newItems} onOpen={setSelected} onNavigate={navigate} />
            {seriesList.map(series => (
              <AchievementShelf
                key={series.metric}
                series={series}
                seriesList={seriesList}
                newIds={newItems.map(i => i.id)}
                stale={stale}
                onSelect={setSelected}
              />
            ))}
          </>
        )}
      </ScrollView>
      <AchievementDetailSheet
        item={selected}
        series={selected ? seriesOf(seriesList, selected) : undefined}
        seriesList={seriesList}
        stale={stale}
        onClose={() => setSelected(null)}
        onNavigate={navigate}
      />
    </SafeAreaView>
  );
}

function Skeleton() {
  return (
    <View accessibilityLabel={translate('badges.title')} className="gap-6">
      <View className="h-9 w-2/3 rounded-xl bg-neutral-200 dark:bg-neutral-800" />
      {[0, 1, 2].map(row => (
        <View key={row} className="gap-3">
          <View className="h-5 w-1/2 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
          <View className="flex-row justify-around">
            {[0, 1, 2].map(i => <View key={i} className="size-14 rounded-full bg-neutral-200 dark:bg-neutral-800" />)}
          </View>
          <View className="h-3 rounded-full bg-neutral-200 dark:bg-neutral-800" />
        </View>
      ))}
    </View>
  );
}

function Notice({ title, body, onRetry }: { title?: string; body: string; onRetry: () => void }) {
  return (
    <View className="items-center gap-2 rounded-3xl border-[1.5px] border-b-4 border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <Snapy pose="suy_nghi" animation="none" className="h-[78px] w-[60px]" />
      {title && <Text className="text-center font-nunito text-[18px] font-extrabold text-mascot-navy dark:text-white">{title}</Text>}
      <Text className="text-center font-inter text-[15px] text-neutral-500 dark:text-neutral-300">{body}</Text>
      <Button variant="primary" label={translate('badges.retry')} textClassName="font-nunito" onPress={onRetry} />
    </View>
  );
}
