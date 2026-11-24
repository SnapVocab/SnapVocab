import type { Href } from 'expo-router';
import type { HomeWidgetDTO, XpOverviewDTO } from '@/features/progress/types';
import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import * as React from 'react';
import { RefreshControl, ScrollView, useWindowDimensions, View } from 'react-native';
import { withUniwind } from 'uniwind';
import { XPOrb3D } from '@/components/snapvocab';
import { Snapy } from '@/components/Snapy';
import { FocusAwareStatusBar, Pressable, SafeAreaView, Text } from '@/components/ui';
import { ChevronRightIcon, TargetIcon } from '@/components/ui/icons';
import { useSurface } from '@/components/ui/surface';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { HomeLeaderboardCard, leaderboardKey } from '@/features/leaderboard';
import { notificationKeys } from '@/features/notifications/api';
import {
  invalidateProgress,
  useHomeWidget,
  useStreak,
  useXpOverview,
} from '@/features/progress';
import { invalidateStudy, useStudyToday } from '@/features/study/api';
import { TodayBlock } from '@/features/study/today-block';
import { formatCount } from '@/lib/format-count';
import { getLanguage, translate } from '@/lib/i18n';
import { HomeMyWordsCard, HomeSearchBar } from './components';

// Same chunky 3D surface as HomeSearchBar.
const CARD_3D = 'mb-3 overflow-hidden rounded-2xl border-2 border-b-4 border-line border-b-edge bg-surface';
const PRESSABLE_3D = 'active:translate-y-[2px] active:bg-pressed';
const SafeArea = withUniwind(SafeAreaView);

// The two progress cards share one row structure, so label, value and caption line up across them.
const STAT_HEADER = 'min-h-6 flex-row items-center gap-1.5';
const STAT_LABEL = 'shrink font-nunito text-sm font-black text-neutral-500 dark:text-neutral-300';
const STAT_VALUE = 'mt-2 font-nunito text-2xl font-black text-mascot-navy dark:text-white';
const STAT_CAPTION = 'mt-1 font-inter text-sm/5 text-neutral-500 dark:text-neutral-300';
const STAT_RETRY = 'mt-0.5 font-nunito text-[12px] font-extrabold text-primary-700 dark:text-[#B5D894]';

function greetingKey() {
  const hour = new Date().getHours();
  if (hour < 12)
    return 'home.good_morning';
  return hour < 18 ? 'home.good_afternoon' : 'home.good_evening';
}

export function HomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore(s => s.user);
  const widget = useHomeWidget();
  // Same query as HomeHeader's flame, so the greeting and the header never disagree.
  const streakQuery = useStreak();
  const xp = useXpOverview();
  // Same query as the "Hôm nay" block below and on Learn, so Home never states a second number.
  const today = useStudyToday();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const surface = useSurface();
  const { width, fontScale } = useWindowDimensions();
  const expanded = width >= 840;
  const stackProgress = expanded || width < 360 || fontScale > 1.2;

  // notification.md §3.7: coming back to Home refreshes stale counts only, avoiding refetch storms on tab switches.
  useFocusEffect(React.useCallback(() => {
    void queryClient.refetchQueries({ queryKey: notificationKeys.unreadCount, stale: true });
    void queryClient.refetchQueries({ queryKey: ['study'], stale: true });
    void queryClient.refetchQueries({ queryKey: leaderboardKey('CURRENT', 3), stale: true });
  }, [queryClient]));

  const onRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        invalidateProgress(queryClient),
        invalidateStudy(queryClient),
        queryClient.refetchQueries({ queryKey: leaderboardKey('CURRENT', 3) }),
        queryClient.refetchQueries({ queryKey: ['my-words'] }),
      ]);
    }
    finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  const displayName = user?.firstName || user?.email?.split('@')[0] || translate('home.default_name');
  // Undefined while loading or on error: the greeting then stays neutral instead of claiming a 0.
  const streak = streakQuery.data?.currentStreak;
  const dueCount = today.data?.dueCount;
  const newCount = today.data?.newCount ?? 0;

  return (
    <SafeArea edges={['bottom', 'left', 'right']} className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <ScrollView
        className="flex-1 px-4 pt-3"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-10"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={surface.action} colors={[surface.action]} />}
      >
        <View className="w-full max-w-6xl self-center">
          {/* Greeting & mascot */}
          <View className={`${CARD_3D} flex-row items-center justify-between p-3`}>
            <View className="flex-1 pr-2">
              <Text className="font-inter text-sm font-semibold text-neutral-500 dark:text-neutral-300">
                {translate(greetingKey())}
                ,
              </Text>
              <Text className="font-nunito text-lg font-black text-mascot-navy dark:text-white" numberOfLines={1}>
                {displayName}
              </Text>
              <Text className="mt-1 font-inter text-xs text-neutral-500 dark:text-neutral-400">
                {(dueCount ?? 0) + newCount > 0
                  ? translate('study_limits.summary', { newCount, reviewCount: dueCount ?? 0 })
                  : streak
                    ? translate('home.streak_message', { count: streak })
                    : translate('home.encouragement')}
              </Text>
            </View>
            <Snapy
              pose={dueCount ? 'thinking' : streak ? 'happy' : 'welcome'}
              animation="none"
              className="size-14"
            />
          </View>

          <HomeSearchBar />
          <HomeMyWordsCard />
          <View className={expanded ? 'flex-row items-start gap-6' : ''}>
            <View className={expanded ? 'flex-1' : ''}>
              <TodayBlock compact />
              {expanded && <DailyMissionCard />}
            </View>
            <View className={expanded ? 'flex-1' : ''}>
              <HomeProgressRow
                stacked={stackProgress}
                vocabulary={widget.data}
                isVocabularyLoading={widget.isLoading}
                onVocabularyPress={() => router.push('/stats')}
                onVocabularyRetry={() => void widget.refetch()}
                xp={xp.data}
                isXpLoading={xp.isLoading}
                onXpPress={() => router.push('/level-progress')}
                onXpRetry={() => void xp.refetch()}
              />
            </View>
          </View>
          {!expanded && <DailyMissionCard />}
          {/* leaderboard_ui.md §4: after everything Home already shows, so learning stays first. */}
          <HomeLeaderboardCard />
        </View>
      </ScrollView>
    </SafeArea>
  );
}

function DailyMissionCard() {
  const router = useRouter();
  const surface = useSurface();
  return (
    <Pressable
      onPress={() => router.push('/missions' as Href)}
      accessibilityRole="button"
      className={`${CARD_3D} ${PRESSABLE_3D} mt-1 flex-row items-center gap-3 p-4`}
    >
      <View className="size-11 items-center justify-center rounded-xl border-b-[3px] border-brand-edge bg-brand">
        <TargetIcon color={surface.onBrand} size={22} />
      </View>
      <Text className="flex-1 font-nunito text-[16px] font-black text-mascot-navy dark:text-white">
        {translate('home.daily_mission')}
      </Text>
      <ChevronRightIcon color={surface.action} />
    </Pressable>
  );
}

function HomeProgressRow({
  stacked,
  vocabulary,
  isVocabularyLoading,
  onVocabularyPress,
  onVocabularyRetry,
  xp,
  isXpLoading,
  onXpPress,
  onXpRetry,
}: {
  stacked: boolean;
  vocabulary?: HomeWidgetDTO;
  isVocabularyLoading: boolean;
  onVocabularyPress: () => void;
  onVocabularyRetry: () => void;
  xp?: XpOverviewDTO;
  isXpLoading: boolean;
  onXpPress: () => void;
  onXpRetry: () => void;
}) {
  const numberFormat = new Intl.NumberFormat(getLanguage());
  const progressLabel = isVocabularyLoading ? translate('home.progress_loading')
    : vocabulary ? translate('home.learning_progress_a11y', {
      learned: numberFormat.format(vocabulary.learnedCount),
      mastered: numberFormat.format(vocabulary.masteredCount),
      created: numberFormat.format(vocabulary.totalWords),
    }) : translate('home.progress_retry');
  const xpLabel = isXpLoading ? translate('home.xp_loading')
    : xp ? translate('home.xp_progress_a11y', { amount: numberFormat.format(xp.totalXp) }) : translate('home.xp_retry');
  return (
    <View className={stacked ? 'mb-1 gap-3' : 'mb-1 flex-row gap-3'}>
      <Pressable
        onPress={isVocabularyLoading ? undefined : vocabulary ? onVocabularyPress : onVocabularyRetry}
        accessibilityRole="button"
        accessibilityLabel={progressLabel}
        disabled={isVocabularyLoading}
        accessibilityState={{ disabled: isVocabularyLoading, busy: isVocabularyLoading }}
        className={`${CARD_3D} ${PRESSABLE_3D} min-h-[112px] p-4 ${stacked ? '' : 'flex-1'}`}
      >
        <View className={STAT_HEADER}>
          <Text className={STAT_LABEL}>
            {translate('home.learning_progress_title')}
          </Text>
        </View>
        <Text className={STAT_VALUE}>
          {isVocabularyLoading ? '…' : vocabulary ? formatCount(vocabulary.learnedCount, getLanguage()) : '↻'}
        </Text>
        {/* No caption while loading, and "Retry" on error: never success copy without data. */}
        {vocabulary
          ? (
              <>
                <Text className={STAT_CAPTION} tx="home.cards_learned_label" />
                <Text className={STAT_CAPTION}>
                  {translate('home.card_progress_details', {
                    mastered: numberFormat.format(vocabulary.masteredCount),
                  })}
                </Text>
              </>
            )
          : !isVocabularyLoading && <Text className={STAT_RETRY}>{translate('progressUx.retry')}</Text>}
      </Pressable>

      <Pressable
        onPress={isXpLoading ? undefined : xp ? onXpPress : onXpRetry}
        accessibilityRole="button"
        accessibilityLabel={xpLabel}
        disabled={isXpLoading}
        accessibilityState={{ disabled: isXpLoading, busy: isXpLoading }}
        className={`${CARD_3D} ${PRESSABLE_3D} min-h-[112px] p-4 ${stacked ? '' : 'flex-1'}`}
      >
        <View className={STAT_HEADER}>
          <XPOrb3D size={24} animation="none" />
          <Text className={STAT_LABEL}>XP</Text>
        </View>
        <Text className={STAT_VALUE}>
          {isXpLoading ? '…' : xp ? `${formatCount(xp.totalXp, getLanguage())} XP` : '↻'}
        </Text>
        {xp
          ? (
              <Text className={STAT_CAPTION}>
                {xp.level
                  ? translate('progressUx.level', { count: xp.level.levelNumber, title: xp.level.title })
                  : translate('progressUx.noLevelCompact')}
              </Text>
            )
          : !isXpLoading && <Text className={STAT_RETRY}>{translate('progressUx.retry')}</Text>}
      </Pressable>
    </View>
  );
}

export default HomeScreen;
