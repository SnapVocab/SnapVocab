import type { BadgeItem, BadgeSeries } from './types';
import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, AppState, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { AchievementTrophy3D, Coin3D, XPOrb3D } from '@/components/snapvocab';
import { Button, FocusAwareStatusBar, SafeAreaView, ScreenHeader, Text } from '@/components/ui';
import { CheckCircleIcon } from '@/components/ui/icons';
import { Snapy } from '@/components/ui/snapy';
import { translate } from '@/lib/i18n';
import { markBadgesSeen, syncBadges, useBadges } from './api';
import { AchievementDetailSheet } from './components/achievement-detail-sheet';
import { BadgeImage, ProgressBar } from './components/badge-image';
import { NewMedal } from './components/new-medal';
import { RewardChips } from './components/reward-chips';
import { StatusBanner } from './components/status-banner';
import { slotLabel } from './copy';
import { buildSeries, isRecording, screenState, shownProgress, unseenIds } from './model';
import { useBadgeSessionStore } from './use-badge-session-store';

/** How long the entry sync may take before the cached view is used for the first NEW snapshot (UI-BDG-03). */
const ENTRY_SYNC_TIMEOUT_MS = 3000;

type FilterTab = 'all' | 'unlocked' | 'locked';

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
  const [filter, setFilter] = React.useState<FilterTab>('all');
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
      // The recognition marks belong to this visit only; the next focus starts in NORMAL.
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
  const ordered = seriesList.flatMap(s => s.items);
  const newIds = [...introducedIds, ...highlightIds].filter(id => ordered.some(i => i.id === id && i.earned));
  const stale = query.isError && !!data;
  const state = data ? screenState(data, { stale, newIds }) : 'NORMAL';
  const shown = ordered.filter(i => filter === 'all' || (filter === 'unlocked') === i.earned);

  return (
    <SafeAreaView className="flex-1 bg-[#F7F8FA] dark:bg-neutral-950" edges={['top']}>
      <FocusAwareStatusBar />
      <ScreenHeader title={translate('badges.title')} onBack={() => router.back()} />
      <ScrollView
        contentContainerClassName="px-[18px] pt-5 pb-12"
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
            {state === 'RECORDING' && <StatusBanner tone="recording" />}
            <Summary earned={data.earnedCount} total={data.totalCount} rewards={data.rewardTotals} />
            <Filters
              value={filter}
              onChange={setFilter}
              counts={{ all: data.totalCount, unlocked: data.earnedCount, locked: data.totalCount - data.earnedCount }}
            />
            {shown.length > 0
              ? (
                  <View className="flex-row flex-wrap justify-between">
                    {shown.map(item => (
                      <BadgeCard
                        key={item.id}
                        item={item}
                        seriesList={seriesList}
                        isNew={newIds.includes(item.id)}
                        stale={stale}
                        onPress={() => setSelected(item)}
                      />
                    ))}
                  </View>
                )
              : (
                  <View className="my-4 items-center rounded-3xl border-2 border-neutral-100 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900">
                    <Snapy pose="to_mo" animation="none" className="mb-3 size-24" />
                    <Text className="font-nunito text-[16px] font-extrabold text-mascot-navy dark:text-white">{translate('badges.empty_filter.title')}</Text>
                    <Text className="mt-1 text-center font-inter text-[13px] text-neutral-400">
                      {translate(filter === 'unlocked' ? 'badges.empty_filter.unlocked' : 'badges.empty_filter.locked')}
                    </Text>
                  </View>
                )}
          </>
        )}
      </ScrollView>
      <AchievementDetailSheet
        item={selected}
        stale={stale}
        onClose={() => setSelected(null)}
        onNavigate={navigate}
      />
    </SafeAreaView>
  );
}

type SummaryProps = { earned: number; total: number; rewards?: { coin: number; xp: number } };

function Summary({ earned, total, rewards }: SummaryProps) {
  const percent = total > 0 ? Math.round((earned / total) * 100) : 0;
  return (
    <View className="mb-5 rounded-[28px] border-2 border-b-4 border-neutral-200/80 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <View accessible accessibilityLabel={translate('badges.collection_a11y', { earned, total })} className="flex-row items-center">
        <View className="mr-4 size-20 items-center justify-center rounded-2xl border-2 border-b-4 border-reward-200 border-b-reward-300 bg-reward-50">
          <AchievementTrophy3D size="lg" />
        </View>
        <View className="flex-1">
          <Text className="font-nunito text-[18px] leading-tight font-extrabold text-mascot-navy dark:text-white">{translate('badges.summary.title')}</Text>
          <View className="mt-1 mb-2 flex-row items-center justify-between">
            <Text className="font-inter text-[13px] font-bold text-neutral-500 dark:text-neutral-300">{translate('badges.summary.count', { earned, total })}</Text>
            <Text className="font-nunito text-[14px] font-extrabold text-primary-600">{`${percent}%`}</Text>
          </View>
          <ProgressBar percent={percent} className="h-3" />
        </View>
      </View>
      {rewards && (
        <View className="mt-4 flex-row items-center justify-between border-t border-neutral-100 pt-3.5 dark:border-neutral-800">
          <Text className="font-inter text-[12px] font-bold text-neutral-400">{translate('badges.summary.rewards')}</Text>
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center rounded-xl border border-reward-200 bg-reward-50 px-2.5 py-1">
              <Coin3D size="xs" style={{ marginRight: 4 }} />
              <Text className="font-nunito text-[12px] font-extrabold text-reward-700">{translate('badges.reward.coin', { count: rewards.coin })}</Text>
            </View>
            <View className="flex-row items-center rounded-xl border border-info-200 bg-info-50 px-2.5 py-1">
              <XPOrb3D size="xs" style={{ marginRight: 4 }} />
              <Text className="font-nunito text-[12px] font-extrabold text-info-700">{translate('badges.reward.xp', { count: rewards.xp })}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

function Filters({ value, onChange, counts }: { value: FilterTab; onChange: (tab: FilterTab) => void; counts: Record<FilterTab, number> }) {
  return (
    <View className="mb-4 flex-row rounded-2xl border border-neutral-200/80 bg-neutral-200/60 p-1 dark:border-neutral-800 dark:bg-neutral-800">
      {(['all', 'unlocked', 'locked'] as const).map((tab) => {
        const active = value === tab;
        return (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(tab)}
            className={`flex-1 items-center rounded-xl py-2 ${active ? 'border border-b-2 border-neutral-200/70 border-b-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-900' : 'opacity-75'}`}
          >
            <Text className={`font-nunito text-[13px] ${active ? `font-extrabold ${tab === 'unlocked' ? 'text-success-600' : 'text-mascot-navy dark:text-white'}` : 'font-bold text-neutral-500'}`}>
              {translate(`badges.filter.${tab}`, { count: counts[tab] })}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type CardProps = { item: BadgeItem; seriesList: BadgeSeries[]; isNew: boolean; stale: boolean; onPress: () => void };

function BadgeCard({ item, seriesList, isNew, stale, onPress }: CardProps) {
  const percent = Math.round((shownProgress(item) / item.threshold) * 100);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={slotLabel(item, seriesList)}
      onPress={onPress}
      className={`mb-4 w-[48%] items-center overflow-hidden rounded-3xl border-2 border-b-4 bg-white p-3.5 active:translate-y-[2px] active:border-b-2 dark:bg-neutral-900 ${item.earned ? 'border-neutral-200/80 border-b-neutral-300 dark:border-neutral-700' : 'border-neutral-100 border-b-neutral-200/80 dark:border-neutral-800'}`}
    >
      <View className="mb-1 h-5 w-full flex-row items-center justify-end">
        {isNew && (
          <View className="rounded-full border-[1.5px] border-[#E5A500] bg-[#FFF1C2] px-[7px]">
            <Text className="font-nunito text-[11px] font-extrabold text-[#8A5A00]">{translate('badges.new_pill')}</Text>
          </View>
        )}
      </View>

      <View className="my-1">
        <NewMedal isNew={isNew} size={96}>
          <BadgeImage item={item} size={96} />
        </NewMedal>
      </View>

      <Text
        numberOfLines={2}
        className={`mb-1 h-10 px-1 text-center font-nunito text-[15px] leading-tight font-extrabold ${item.earned ? 'text-mascot-navy dark:text-white' : 'text-neutral-500 dark:text-neutral-300'}`}
      >
        {item.name}
      </Text>

      <View className="mb-2.5 min-h-5 justify-center">
        <RewardChips reward={item.reward} />
      </View>

      {item.earned
        ? (
            <View className="w-full flex-row items-center justify-center gap-1 rounded-xl border border-success-200 bg-success-50 py-1">
              <CheckCircleIcon width={13} height={13} color="#3C8C00" />
              <Text className="font-nunito text-[11px] font-extrabold tracking-wide text-success-700 uppercase">{translate('badges.status.unlocked')}</Text>
            </View>
          )
        : isRecording(item)
          ? (
              <View className="w-full flex-row items-center justify-center gap-1 rounded-xl border border-reward-200 bg-reward-50 py-1">
                {!stale && <ActivityIndicator size="small" color="#A87400" />}
                <Text className="font-nunito text-[11px] font-extrabold text-[#8A5A00]">{translate(stale ? 'badges.eligible' : 'badges.recording')}</Text>
              </View>
            )
          : (
              <View className="w-full pt-1">
                <View className="mb-1 flex-row items-center justify-between">
                  <Text className="font-inter text-[10px] font-bold text-neutral-400">{translate('badges.progress')}</Text>
                  <Text className="font-nunito text-[11px] font-extrabold text-neutral-600 tabular-nums dark:text-neutral-300">{`${shownProgress(item)} / ${item.threshold}`}</Text>
                </View>
                <ProgressBar percent={percent} className="h-2" />
              </View>
            )}
    </Pressable>
  );
}

function Skeleton() {
  return (
    <View accessibilityLabel={translate('badges.title')} className="gap-4">
      <View className="h-28 rounded-[28px] bg-neutral-200 dark:bg-neutral-800" />
      <View className="h-10 rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
      <View className="flex-row flex-wrap justify-between gap-y-4">
        {[0, 1, 2, 3].map(i => <View key={i} className="h-52 w-[48%] rounded-3xl bg-neutral-200 dark:bg-neutral-800" />)}
      </View>
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
