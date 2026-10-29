import type { Href } from 'expo-router';
import type { HomeWidgetDTO, XpOverviewDTO } from '@/features/progress/types';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { XPOrb3D } from '@/components/snapvocab';
import { Snapy } from '@/components/Snapy';
import { FocusAwareStatusBar, SafeAreaView, Text } from '@/components/ui';
import { ChevronRightIcon, TargetIcon } from '@/components/ui/icons';
import { useColorMode } from '@/components/ui/surface';
import { useAuthStore } from '@/features/auth/use-auth-store';
import {
  invalidateProgress,
  SectionError,
  SRS_ENABLED,
  useHomeWidget,
  useStreak,
  useXpOverview,
} from '@/features/progress';
import { translate } from '@/lib/i18n';
import { HomeSearchBar, StudyTodayCard } from './components';

// Same chunky 3D surface as HomeSearchBar.
const CARD_3D = 'mb-3 rounded-2xl border-2 border-b-4 border-line border-b-edge bg-surface';
const PRESSABLE_3D = 'active:translate-y-[2px] active:border-b-2 active:bg-pressed';

// The two progress cards share one row structure, so label, value and caption line up across them.
const STAT_HEADER = 'h-6 flex-row items-center gap-1.5';
const STAT_LABEL = 'font-nunito text-[11px] font-black tracking-wide text-neutral-500 uppercase dark:text-neutral-300';
const STAT_VALUE = 'mt-2 font-nunito text-2xl font-black text-mascot-navy dark:text-white';
const STAT_CAPTION = 'mt-0.5 font-inter text-[11px]/4 text-neutral-500 dark:text-neutral-300';
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
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const isDark = useColorMode() === 'dark';

  const onRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await invalidateProgress(queryClient);
    setIsRefreshing(false);
  }, [queryClient]);

  const displayName = user?.firstName || user?.email?.split('@')[0] || translate('home.default_name');
  // Undefined while loading or on error: the greeting then stays neutral instead of claiming a 0.
  const streak = streakQuery.data?.currentStreak;
  const dueCount = SRS_ENABLED ? widget.data?.dueCount : undefined;

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }} className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <ScrollView
        className="flex-1 px-4 pt-3"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-10"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#58CC02" />}
      >
        {/* Greeting & mascot */}
        <View className={`${CARD_3D} flex-row items-center justify-between p-3`}>
          <View className="flex-1 pr-2">
            <Text className="font-inter text-xs font-semibold text-neutral-400">
              {translate(greetingKey())}
              ,
            </Text>
            <Text className="font-nunito text-lg font-black text-mascot-navy dark:text-white" numberOfLines={1}>
              {displayName}
              {' '}
              👋
            </Text>
            <Text className="mt-1 font-inter text-xs text-neutral-500 dark:text-neutral-400">
              {dueCount
                ? translate('home.due_message', { count: dueCount })
                : streak
                  ? translate('home.streak_message', { count: streak })
                  : translate('home.encouragement')}
            </Text>
          </View>
          <Snapy
            pose={dueCount ? 'thinking' : streak ? 'happy' : 'welcome'}
            animation="bounce"
            className="size-14"
          />
        </View>

        <HomeSearchBar />
        <StudyTodayCard />

        <HomeProgressRow
          vocabulary={widget.data}
          isVocabularyLoading={widget.isLoading}
          onVocabularyPress={() => router.push('/stats')}
          onVocabularyRetry={() => void widget.refetch()}
          xp={xp.data}
          isXpLoading={xp.isLoading}
          onXpPress={() => router.push('/level-progress')}
          onXpRetry={() => void xp.refetch()}
        />

        {/* Daily missions entry */}
        <Pressable
          onPress={() => router.push('/missions' as Href)}
          accessibilityRole="button"
          className={`${CARD_3D} ${PRESSABLE_3D} mt-1 flex-row items-center gap-3 p-4`}
        >
          <View className="size-11 items-center justify-center rounded-xl border-b-[3px] border-brand-edge bg-brand">
            <TargetIcon color={isDark ? '#1B2416' : '#FFFFFF'} size={22} />
          </View>
          <Text className="flex-1 font-nunito text-[16px] font-black text-mascot-navy dark:text-white">
            {translate('home.daily_mission')}
          </Text>
          <ChevronRightIcon color={isDark ? '#9BCB72' : '#58CC02'} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function HomeProgressRow({
  vocabulary,
  isVocabularyLoading,
  onVocabularyPress,
  onVocabularyRetry,
  xp,
  isXpLoading,
  onXpPress,
  onXpRetry,
}: {
  vocabulary?: HomeWidgetDTO;
  isVocabularyLoading: boolean;
  onVocabularyPress: () => void;
  onVocabularyRetry: () => void;
  xp?: XpOverviewDTO;
  isXpLoading: boolean;
  onXpPress: () => void;
  onXpRetry: () => void;
}) {
  const numberFormat = new Intl.NumberFormat();
  return (
    <View className="mb-1 flex-row gap-3">
      <Pressable
        onPress={isVocabularyLoading ? undefined : vocabulary ? onVocabularyPress : onVocabularyRetry}
        accessibilityRole="button"
        className={`${CARD_3D} ${PRESSABLE_3D} min-h-[112px] flex-1 p-3`}
      >
        <View className={STAT_HEADER}>
          <Text className={STAT_LABEL} numberOfLines={1}>
            {translate('home.vocabulary_title')}
          </Text>
        </View>
        <Text className={STAT_VALUE} numberOfLines={1}>
          {isVocabularyLoading ? '…' : vocabulary ? numberFormat.format(vocabulary.totalWords) : '↻'}
        </Text>
        {/* No caption while loading, and "Retry" on error: never success copy without data. */}
        {vocabulary
          ? (
              <Text className={STAT_CAPTION} numberOfLines={2}>
                {translate(SRS_ENABLED ? 'home.words_in_storage_progress' : 'home.words_in_storage', {
                  learned: vocabulary.learnedCount,
                  mastered: vocabulary.masteredCount,
                })}
              </Text>
            )
          : !isVocabularyLoading && <Text className={STAT_RETRY}>{translate('progressUx.retry')}</Text>}
      </Pressable>

      <Pressable
        onPress={isXpLoading ? undefined : xp ? onXpPress : onXpRetry}
        accessibilityRole="button"
        className={`${CARD_3D} ${PRESSABLE_3D} min-h-[112px] flex-1 p-3`}
      >
        <View className={STAT_HEADER}>
          <XPOrb3D size={24} animation="none" />
          <Text className={STAT_LABEL} numberOfLines={1}>XP</Text>
        </View>
        <Text className={STAT_VALUE} numberOfLines={1}>
          {isXpLoading ? '…' : xp ? `${numberFormat.format(xp.totalXp)} XP` : '↻'}
        </Text>
        {xp
          ? (
              <Text className={STAT_CAPTION} numberOfLines={2}>
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
