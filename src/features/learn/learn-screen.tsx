import type { LearningHubSummaryResponse } from './learning-state';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { FocusAwareStatusBar, SafeAreaView } from '@/components/ui';
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  RotateCcwIcon,
  SlidersHorizontalIcon,
  WifiOffIcon,
} from '@/components/ui/icons';
import { useCollections } from './api';
import {
  ContinueDeckRow,
  LearningHeader,
  LearningHubSkeleton,
  RecentVocabularyRow,
  RecommendedSessionCard,
  StudyModesGrid,
} from './components';
import {
  determineHubState,
  MOCK_SUMMARY_COMPLETED,
  MOCK_SUMMARY_HAS_DUE,
  MOCK_SUMMARY_IN_PROGRESS,
  MOCK_SUMMARY_NEW_USER,
} from './learning-state';

type TestStateOption = 'default' | 'newUser' | 'inProgress' | 'completed' | 'offline' | 'error';

export function LearnScreen() {
  const router = useRouter();
  const [testMode, setTestMode] = useState<TestStateOption>('default');
  const [showDevControls, setShowDevControls] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { data: collections, refetch: refetchCollections } = useCollections();

  const getActiveSummary = useCallback((): LearningHubSummaryResponse => {
    switch (testMode) {
      case 'newUser':
        return MOCK_SUMMARY_NEW_USER;
      case 'inProgress':
        return MOCK_SUMMARY_IN_PROGRESS;
      case 'completed':
        return MOCK_SUMMARY_COMPLETED;
      default:
        return MOCK_SUMMARY_HAS_DUE;
    }
  }, [testMode]);

  const rawSummary = getActiveSummary();

  // Merge dynamic collections count if available
  const summary = useMemo(() => {
    if (!collections || collections.length === 0) {
      return rawSummary;
    }
    return {
      ...rawSummary,
      studyModes: {
        ...rawSummary.studyModes,
        collectionsCount: collections.length,
      },
    };
  }, [rawSummary, collections]);

  const hubState = determineHubState(summary);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetchCollections();
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  }, [refetchCollections]);

  if (loading) {
    return <LearningHubSkeleton />;
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-neutral-900" edges={['top']}>
      <FocusAwareStatusBar />

      {/* BANNER NGOẠI TUYẾN */}
      {testMode === 'offline' && (
        <View className="z-20 flex-row items-center justify-center gap-2 bg-neutral-800 px-4 py-2">
          <WifiOffIcon width={14} height={14} stroke="#FFFFFF" />
          <Text className="font-inter text-[12.5px] font-bold text-white">
            Đang ngoại tuyến — Sử dụng dữ liệu bộ nhớ đệm
          </Text>
        </View>
      )}

      {/* BANNER BÁO LỖI */}
      {testMode === 'error' && (
        <View className="dark:bg-danger-950/60 z-20 flex-row items-center justify-between border-b border-danger-200 bg-danger-50 px-4 py-2 dark:border-danger-800">
          <View className="flex-1 flex-row items-center gap-2 pr-2">
            <AlertTriangleIcon width={15} height={15} stroke="#DC2626" />
            <Text className="font-inter text-[12px] font-bold text-danger-700 dark:text-danger-400" numberOfLines={1}>
              Không thể đồng bộ tiến độ học mới nhất.
            </Text>
          </View>
          <Pressable
            onPress={onRefresh}
            className="rounded-md bg-danger-600 px-2.5 py-1 active:bg-danger-700"
          >
            <Text className="font-nunito text-[11px] font-extrabold text-white uppercase">
              Thử lại
            </Text>
          </Pressable>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 28 }}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#58CC02"
          />
        )}
      >
        {/* KHỐI 1: HEADER GỌN & TIẾN ĐỘ NGÀY */}
        <LearningHeader
          learned={summary.dailyGoal.learned}
          target={summary.dailyGoal.target}
          xpReward={summary.dailyGoal.xpReward}
          hubState={hubState}
        />

        {/* KHỐI 2: HERO RECOMMENDED SESSION */}
        <RecommendedSessionCard
          summary={summary}
          hubState={hubState}
        />

        {/* KHỐI 3: "BẠN MUỐN HỌC THẾ NÀO?" (Lưới 2x2 với bộ icon 3D SnapVocab) */}
        <StudyModesGrid summary={summary} />

        {/* KHỐI 4: TIẾP TỤC BỘ THẺ */}
        <ContinueDeckRow
          activeSession={summary.activeSession}
          hubState={hubState}
        />

        {/* KHỐI 5: "TỪ VỰNG CỦA BẠN" (Thumbnails ảnh từ vừa lưu + nhãn nguồn) */}
        <RecentVocabularyRow words={summary.recentSavedWords} />

        {/* KHỐI 6: LUYỆN TẬP & ĐÁNH GIÁ (Quiz History) */}
        <View className="mb-4 px-5">
          <View className="mb-2.5 flex-row items-center justify-between">
            <Text className="font-nunito text-[12px] font-extrabold tracking-wider text-neutral-400 uppercase">
              Luyện tập & Đánh giá
            </Text>
          </View>

          <Pressable
            onPress={() => router.push('/(app)/study/quiz-history' as any)}
            className="flex-row items-center justify-between rounded-2xl border border-b-4 border-neutral-200 bg-white p-3.5 active:translate-y-0.5 active:border-b-2 dark:border-neutral-700 dark:bg-neutral-900"
          >
            <View className="flex-row items-center gap-3">
              <View className="size-11 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/40">
                <RotateCcwIcon width={20} height={20} stroke="#0EA5E9" />
              </View>
              <View>
                <Text className="font-nunito text-[15px] font-black text-mascot-navy dark:text-white">
                  Lịch sử bài thi
                </Text>
                <Text className="font-inter text-[12px] text-neutral-400 dark:text-neutral-500">
                  Xem lại kết quả các lượt luyện tập đã nộp
                </Text>
              </View>
            </View>
            <ArrowRightIcon width={16} height={16} stroke="#71717A" />
          </Pressable>
        </View>

        {/* DEV CONTROLS / STATE SWITCHER */}
        <View className="mt-2 items-center border-t border-neutral-200/60 px-5 pt-4 dark:border-neutral-800">
          <Pressable
            onPress={() => setShowDevControls(!showDevControls)}
            className="flex-row items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 active:bg-neutral-200 dark:bg-neutral-800"
          >
            <SlidersHorizontalIcon width={12} height={12} stroke="#757793" />
            <Text className="font-inter text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
              {showDevControls ? 'Ẩn bộ chuyển đổi trạng thái' : `Trạng thái mẫu: ${testMode}`}
            </Text>
          </Pressable>

          {showDevControls && (
            <View className="mt-3 flex-row flex-wrap justify-center gap-1.5">
              {(['default', 'newUser', 'inProgress', 'completed', 'offline', 'error'] as TestStateOption[]).map(
                opt => (
                  <Pressable
                    key={opt}
                    onPress={() => setTestMode(opt)}
                    className={`rounded-lg border px-2.5 py-1 ${
                      testMode === opt
                        ? 'border-primary-600 bg-primary-500'
                        : 'border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800'
                    }`}
                  >
                    <Text
                      className={`font-nunito text-[11px] font-bold ${
                        testMode === opt ? 'text-white' : 'text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      {opt === 'default' ? 'Có thẻ đến hạn (Hero SRS)' : opt}
                    </Text>
                  </Pressable>
                ),
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default LearnScreen;
