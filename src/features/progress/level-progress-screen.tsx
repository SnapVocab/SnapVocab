import { useRouter } from 'expo-router';
import * as React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { XPOrb3D } from '@/components/snapvocab';
import { FocusAwareStatusBar, SafeAreaView, ScreenHeader, Text } from '@/components/ui';
import { useXpOverview } from './api';
import { RatioBar, RecentXpEventsList, SectionError } from './components';

export function LevelProgressScreen() {
  const router = useRouter();
  const { data: xpOverview, isLoading, isError, refetch, isRefetching } = useXpOverview();

  // Only read inside the loaded branch below; a null level stays "no level", never level 1.
  const totalXp = xpOverview?.totalXp ?? 0;
  const level = xpOverview?.level;
  const levelNumber = level?.levelNumber;
  // A level without a title is still that level; only a missing level is "no level".
  const levelTitle = level ? (level.title ?? `Cấp ${level.levelNumber}`) : 'Chưa có cấp độ';
  const progressPercent = level?.progress ? Math.min(100, Math.round(level.progress * 100)) : 0;
  const nextXp = level?.nextLevelXp;
  const remainingXp = nextXp ? Math.max(0, nextXp - totalXp) : 0;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }} className="flex-1 bg-[#F7F8FA] dark:bg-neutral-950">
      <FocusAwareStatusBar />

      <ScreenHeader title="Cấp độ & Kinh nghiệm" onBack={() => router.back()} />

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pt-5 pb-12"
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
            <View className="mb-4 items-center rounded-3xl border border-info-100 bg-linear-to-b from-info-50 to-white p-6 shadow-sm dark:border-info-700/40 dark:from-info-700/20 dark:to-neutral-900">
              <View className="size-20 items-center justify-center rounded-3xl bg-info-100/60 dark:bg-info-700/30">
                <XPOrb3D size="lg" animation="float" />
              </View>

              <View className="mt-3 flex-row items-center gap-2">
                {level?.title && (
                  <View className="rounded-full bg-info-700 px-3 py-0.5">
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

              {/* Cumulative XP, not a numerator for the bar: the bar is progress inside this level. */}
              <View className="mt-2 items-center">
                <Text className="font-nunito text-3xl font-black text-info-600 dark:text-info-400">
                  {`${totalXp.toLocaleString('vi-VN')} XP`}
                </Text>
                <Text className="font-inter text-[13px] font-semibold text-neutral-500">
                  Tổng XP tích lũy
                </Text>
              </View>

              {/* Level Progress Bar */}
              {nextXp ? (
                <View className="mt-4 w-full">
                  <RatioBar progress={level?.progress ?? 0} label={`Tiến độ cấp ${levelNumber}`} />

                  <View className="mt-2 flex-row justify-between">
                    <Text className="font-inter text-[13px] text-neutral-500">
                      {`${progressPercent}% cấp ${levelNumber}`}
                    </Text>
                    <Text className="font-inter text-[13px] font-bold text-info-700 dark:text-info-400">
                      {`Còn ${remainingXp.toLocaleString('vi-VN')} XP lên cấp ${(levelNumber ?? 0) + 1}`}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text className="mt-2 font-inter text-[13px] font-semibold text-emerald-600 dark:text-emerald-400">
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
