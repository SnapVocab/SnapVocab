import { useRouter } from 'expo-router';
import * as React from 'react';
import { RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import { XPOrb3D } from '@/components/snapvocab';
import { FocusAwareStatusBar, SafeAreaView, Text } from '@/components/ui';
import { ChevronLeftIcon } from '@/components/ui/icons';
import { useXpOverview } from './api';
import { RecentXpEventsList, SectionError } from './components';

export function LevelProgressScreen() {
  const router = useRouter();
  const { data: xpOverview, isLoading, isError, refetch, isRefetching } = useXpOverview();

  // Only read inside the loaded branch below; a null level stays "no level", never level 1.
  const totalXp = xpOverview?.totalXp ?? 0;
  const level = xpOverview?.level;
  const levelNumber = level?.levelNumber;
  const levelTitle = level?.title ?? 'Chưa có cấp độ';
  const progressPercent = level?.progress ? Math.min(100, Math.round(level.progress * 100)) : 0;
  const nextXp = level?.nextLevelXp;
  const remainingXp = nextXp ? Math.max(0, nextXp - totalXp) : 0;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }} className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <FocusAwareStatusBar />

      {/* Top Header */}
      <View className="flex-row items-center justify-between border-b border-neutral-100 bg-white px-4 py-3.5 dark:border-neutral-800 dark:bg-neutral-900">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="size-9 items-center justify-center rounded-xl bg-neutral-100 active:bg-neutral-200 dark:bg-neutral-800"
        >
          <ChevronLeftIcon color="#64748B" />
        </TouchableOpacity>

        <Text className="font-nunito text-base font-extrabold text-neutral-900 dark:text-white">
          Cấp độ & Kinh nghiệm
        </Text>

        <View className="size-9" />
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="p-4 pb-12"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#58CC02" />
        }
      >
        {isLoading ? (
          <View className="mb-4 h-56 rounded-3xl bg-neutral-200 dark:bg-neutral-800" />
        ) : isError || !xpOverview ? (
          <SectionError onRetry={() => void refetch()} />
        ) : (
          <>
            {/* Hero Level Banner */}
            <View className="mb-4 items-center rounded-3xl border border-blue-100 bg-linear-to-b from-blue-50 to-white p-6 shadow-sm dark:border-blue-900/40 dark:from-blue-950/40 dark:to-neutral-900">
              <View className="size-20 items-center justify-center rounded-3xl bg-blue-100/60 dark:bg-blue-900/40">
                <XPOrb3D size="lg" animation="float" />
              </View>

              <View className="mt-3 flex-row items-center gap-2">
                {level && (
                  <View className="rounded-full bg-primary-500 px-3 py-0.5">
                    <Text className="font-nunito text-xs font-black text-white">
                      CẤP
                      {' '}
                      {levelNumber}
                    </Text>
                  </View>
                )}
                <Text className="font-nunito text-xl font-black text-neutral-900 dark:text-white">
                  {levelTitle}
                </Text>
              </View>

              <View className="mt-2 flex-row items-baseline gap-1.5">
                <Text className="font-nunito text-3xl font-black text-blue-600 dark:text-blue-400">
                  {totalXp.toLocaleString('vi-VN')}
                </Text>
                <Text className="font-inter text-sm font-semibold text-neutral-400">
                  {nextXp ? `/ ${nextXp.toLocaleString('vi-VN')} XP` : 'XP'}
                </Text>
              </View>

              {/* Level Progress Bar */}
              {nextXp ? (
                <View className="mt-4 w-full">
                  <View className="h-3 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <View
                      style={{ width: `${progressPercent}%` }}
                      className="h-full rounded-full bg-blue-500"
                    />
                  </View>

                  <View className="mt-2 flex-row justify-between">
                    <Text className="font-inter text-xs text-neutral-400">
                      {progressPercent}
                      % hoàn thành
                    </Text>
                    <Text className="font-inter text-xs font-bold text-blue-600 dark:text-blue-400">
                      Cần thêm
                      {' '}
                      {remainingXp.toLocaleString('vi-VN')}
                      {' '}
                      XP
                    </Text>
                  </View>
                </View>
              ) : (
                <Text className="mt-2 font-inter text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {level ? 'Bạn đã đạt cấp cao nhất hiện có.' : 'XP vẫn được ghi nhận. Mốc cấp độ chưa được thiết lập.'}
                </Text>
              )}
            </View>

            {/* Recent XP Events */}
            <RecentXpEventsList events={xpOverview.recentEvents} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default LevelProgressScreen;
