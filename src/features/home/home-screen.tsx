import type { Href } from 'expo-router';
import type { HomeWidgetDTO } from '@/features/progress/types';
import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Snapy } from '@/components/Snapy';
import { FocusAwareStatusBar, SafeAreaView, Text, useSurfaceOverride } from '@/components/ui';
import { ChevronRightIcon, TargetIcon } from '@/components/ui/icons';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { notificationKeys } from '@/features/notifications/api';
import {
  deriveVocabularySegments,
  invalidateProgress,
  LevelOverviewCard,
  MultiSegmentBar,
  SectionError,
  SRS_ENABLED,
  useHomeWidget,
  useStreak,
  useXpOverview,
} from '@/features/progress';
import { ShopSurface } from '@/features/shop/theme/theme-context';
import { invalidateStudy, useStudyToday } from '@/features/study/api';
import { TodayBlock } from '@/features/study/today-block';
import { translate } from '@/lib/i18n';
import { HomeSearchBar } from './components';

// Same chunky 3D surface as HomeSearchBar.
const CARD_3D = 'mb-4 rounded-2xl border-2 border-b-4 border-neutral-200/90 border-b-neutral-300 bg-white dark:border-neutral-700 dark:border-b-neutral-800 dark:bg-neutral-900';
const PRESSABLE_3D = 'active:translate-y-[2px] active:border-b-2';

function greetingKey() {
  const hour = new Date().getHours();
  if (hour < 12)
    return 'home.good_morning';
  return hour < 18 ? 'home.good_afternoon' : 'home.good_evening';
}

/** Themed screen (shop.md §6.4): an equipped theme re-skins its surfaces; its header is wrapped in the tab layout. */
export function HomeScreen() {
  return (
    <ShopSurface>
      <HomeScreenContent />
    </ShopSurface>
  );
}

function HomeScreenContent() {
  const router = useRouter();
  const t = useSurfaceOverride();
  const card = t && { backgroundColor: t.surface, borderColor: t.border };
  const queryClient = useQueryClient();
  const user = useAuthStore(s => s.user);
  const widget = useHomeWidget();
  // Same query as HomeHeader's flame, so the greeting and the header never disagree.
  const streakQuery = useStreak();
  const xp = useXpOverview();
  // Same query as the "Hôm nay" block below and on Learn, so Home never states a second number.
  const today = useStudyToday();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // notification.md §3.7: coming back to Home refreshes the bell once its count is past its 60 s staleTime.
  useFocusEffect(React.useCallback(() => {
    void queryClient.refetchQueries({ queryKey: notificationKeys.unreadCount, stale: true });
  }, [queryClient]));

  const onRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([invalidateProgress(queryClient), invalidateStudy(queryClient)]);
    setIsRefreshing(false);
  }, [queryClient]);

  const displayName = user?.firstName || user?.email?.split('@')[0] || 'bạn';
  // Undefined while loading or on error: the greeting then stays neutral instead of claiming a 0.
  const streak = streakQuery.data?.currentStreak;
  const dueCount = today.data?.dueCount;

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[{ flex: 1 }, t && { backgroundColor: t.background }]} className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <ScrollView
        className="flex-1 px-4 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-10"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#58CC02" />}
      >
        {/* Greeting & mascot */}
        <View style={card} className={`${CARD_3D} flex-row items-center justify-between p-4`}>
          <View className="flex-1 pr-2">
            <Text className="font-inter text-xs font-semibold text-neutral-400">
              {translate(greetingKey())}
              ,
            </Text>
            <Text className="font-nunito text-xl font-black text-mascot-navy dark:text-white" numberOfLines={1}>
              {displayName}
              {' '}
              👋
            </Text>
            <Text className="mt-1 font-inter text-xs text-neutral-500 dark:text-neutral-400">
              {dueCount
                ? `Hôm nay bạn có ${dueCount} từ cần ôn tập!`
                : streak
                  ? `Tuyệt vời! Bạn đang duy trì chuỗi ${streak} ngày học!`
                  : 'Sẵn sàng chinh phục thêm từ vựng mới nào!'}
            </Text>
          </View>
          <Snapy
            pose={dueCount ? 'thinking' : streak ? 'happy' : 'welcome'}
            animation="bounce"
            className="size-16"
          />
        </View>

        <HomeSearchBar />
        <TodayBlock compact />

        {/* Vocabulary widget (tappable -> /stats) */}
        {widget.isLoading
          ? <View style={t && { backgroundColor: t.surfaceMuted }} className="mb-4 h-28 rounded-2xl bg-neutral-100 dark:bg-neutral-800" />
          : widget.isError || !widget.data
            ? <SectionError onRetry={() => void widget.refetch()} />
            : <VocabularyWidget data={widget.data} onPress={() => router.push('/stats')} />}

        {/* Level & XP — same semantics as Stats (loading / no level / max / normal) */}
        {xp.isError
          ? <SectionError onRetry={() => void xp.refetch()} />
          : <LevelOverviewCard xpOverview={xp.data} isLoading={xp.isLoading} />}

        {/* Daily missions entry */}
        <Pressable
          onPress={() => router.push('/missions' as Href)}
          accessibilityRole="button"
          style={card}
          className={`${CARD_3D} ${PRESSABLE_3D} mt-4 flex-row items-center gap-3 p-4`}
        >
          <View className="size-11 items-center justify-center rounded-xl border-2 border-b-[3px] border-primary-400 border-b-primary-600 bg-primary-500">
            <TargetIcon color="#FFFFFF" size={22} />
          </View>
          <Text className="flex-1 font-nunito text-[16px] font-black text-mascot-navy dark:text-white">
            {translate('home.daily_mission')}
          </Text>
          <ChevronRightIcon color="#58CC02" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function VocabularyWidget({ data, onPress }: { data: HomeWidgetDTO; onPress: () => void }) {
  const { totalWords, learnedCount, newCount, learningAndReviewingCount, masteredCount }
    = deriveVocabularySegments(data);
  const t = useSurfaceOverride();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={t && { backgroundColor: t.surface, borderColor: t.border }}
      className={`${CARD_3D} ${PRESSABLE_3D} p-5`}
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-nunito text-xs font-black tracking-wider text-neutral-400 uppercase">
          Từ vựng của bạn
        </Text>
        <View className="flex-row items-center gap-1">
          <Text className="font-inter text-xs font-bold text-primary-600 dark:text-primary-400">
            Chi tiết
          </Text>
          <ChevronRightIcon color="#58CC02" />
        </View>
      </View>

      <View className="mt-2.5 flex-row items-baseline gap-2">
        <Text className="font-nunito text-2xl font-black text-mascot-navy dark:text-white">
          {totalWords}
        </Text>
        <Text className="font-inter text-xs text-neutral-500">
          {SRS_ENABLED
            ? `từ trong kho (${learnedCount} đã học · ${masteredCount} thuần thục)`
            : 'từ trong kho'}
        </Text>
      </View>

      {/* Learning-state bar only when SRS produces those states. Segments never overlap. */}
      {SRS_ENABLED && (
        <View className="mt-3">
          <MultiSegmentBar
            label="Phân bố trạng thái từ vựng"
            segments={[
              { value: newCount, color: '#9E7DFA', label: 'Chưa học' },
              { value: learningAndReviewingCount, color: '#FFA447', label: 'Đang học / ôn' },
              { value: masteredCount, color: '#58CC02', label: 'Thành thạo' },
            ]}
          />
        </View>
      )}
    </Pressable>
  );
}

export default HomeScreen;
