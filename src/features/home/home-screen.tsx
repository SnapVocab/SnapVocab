import type { HomeWidgetDTO } from '@/features/progress/types';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { Snapy } from '@/components/Snapy';
import { FocusAwareStatusBar, SafeAreaView, Text } from '@/components/ui';
import { ChevronRightIcon } from '@/components/ui/icons';
import { useAuthStore } from '@/features/auth/use-auth-store';
import {
  deriveVocabularySegments,
  invalidateProgress,
  LevelOverviewCard,
  MultiSegmentBar,
  SectionError,
  SRS_ENABLED,
  useHomeWidget,
  useXpOverview,
} from '@/features/progress';
import {
  HomeSearchBar,
  QuickStudyGrid,
} from './components';

export function HomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore(s => s.user);
  const widget = useHomeWidget();
  const xp = useXpOverview();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await invalidateProgress(queryClient);
    setIsRefreshing(false);
  }, [queryClient]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Chào buổi sáng';
    }
    if (hour < 18) {
      return 'Chào buổi chiều';
    }
    return 'Chào buổi tối';
  };

  const displayName = user?.firstName || user?.email?.split('@')[0] || 'bạn';
  // Undefined while loading or on error: the greeting then stays neutral instead of claiming a 0.
  const streak = widget.data?.currentStreak;
  const dueCount = SRS_ENABLED ? widget.data?.dueCount : undefined;

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }} className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <FocusAwareStatusBar />
      <ScrollView
        className="flex-1 px-4 pt-3"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-10"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#58CC02" />
        }
      >
        {/* Top Greeting & Mascot Header */}
        <View className="mb-4 flex-row items-center justify-between rounded-3xl border border-neutral-100 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
          <View className="flex-1 pr-2">
            <Text className="font-inter text-xs font-semibold text-neutral-400">
              {getGreeting()}
              ,
            </Text>
            <Text className="font-nunito text-xl font-black text-neutral-900 dark:text-white" numberOfLines={1}>
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

          <View className="size-16 items-center justify-center">
            <Snapy
              pose={dueCount ? 'thinking' : streak ? 'happy' : 'welcome'}
              animation="bounce"
              className="size-16"
            />
          </View>
        </View>

        {/* Search Bar */}
        <View className="mb-4">
          <HomeSearchBar />
        </View>

        {/* PROGRESS MINI WIDGET (Tappable -> /stats) */}
        {widget.isLoading
          ? <View className="mb-4 h-28 rounded-3xl bg-neutral-100 dark:bg-neutral-800" />
          : widget.isError || !widget.data
            ? <SectionError onRetry={() => void widget.refetch()} />
            : <VocabularyWidget data={widget.data} onPress={() => router.push('/stats')} />}

        {/* LEVEL & XP STATUS CARD — same semantics as Stats (loading / no level / max / normal) */}
        {xp.isError
          ? <SectionError onRetry={() => void xp.refetch()} />
          : <LevelOverviewCard xpOverview={xp.data} isLoading={xp.isLoading} />}

        {/* QUICK STUDY MODES GRID (2x2) */}
        <View className="mt-2">
          <QuickStudyGrid />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function VocabularyWidget({ data, onPress }: { data: HomeWidgetDTO; onPress: () => void }) {
  const { totalWords, learnedCount, newCount, learningAndReviewingCount, masteredCount }
    = deriveVocabularySegments(data);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="mb-4 rounded-3xl border border-neutral-100 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900"
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
        <Text className="font-nunito text-2xl font-black text-neutral-900 dark:text-white">
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
    </TouchableOpacity>
  );
}

export default HomeScreen;
