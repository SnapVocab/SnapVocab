import * as React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function LearningHubSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-neutral-900" edges={['top']}>
      <View className="flex-col gap-4 px-5 py-4">
        {/* Header Skeleton */}
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <View className="h-7 w-36 animate-pulse rounded-lg bg-neutral-200/60 dark:bg-neutral-800" />
            <View className="mt-1 h-3.5 w-56 animate-pulse rounded-md bg-neutral-200/50 dark:bg-neutral-800/80" />
          </View>
          <View className="h-8 w-20 animate-pulse rounded-xl bg-neutral-200/60 dark:bg-neutral-800" />
        </View>

        {/* Daily Goal Bar Skeleton */}
        <View className="h-2.5 w-full animate-pulse rounded-full bg-neutral-200/50 dark:bg-neutral-800/80" />

        {/* HERO Session Card Skeleton */}
        <View className="h-48 w-full animate-pulse rounded-3xl bg-neutral-200/60 dark:bg-neutral-800" />

        {/* 2x2 Grid Skeleton */}
        <View className="gap-2.5">
          <View className="flex-row gap-2.5">
            <View className="h-24 flex-1 animate-pulse rounded-2xl bg-neutral-200/60 dark:bg-neutral-800" />
            <View className="h-24 flex-1 animate-pulse rounded-2xl bg-neutral-200/60 dark:bg-neutral-800" />
          </View>
          <View className="flex-row gap-2.5">
            <View className="h-24 flex-1 animate-pulse rounded-2xl bg-neutral-200/60 dark:bg-neutral-800" />
            <View className="h-24 flex-1 animate-pulse rounded-2xl bg-neutral-200/60 dark:bg-neutral-800" />
          </View>
        </View>

        {/* Continue Deck Row Skeleton */}
        <View className="h-16 w-full animate-pulse rounded-2xl bg-neutral-200/60 dark:bg-neutral-800" />
      </View>
    </SafeAreaView>
  );
}
