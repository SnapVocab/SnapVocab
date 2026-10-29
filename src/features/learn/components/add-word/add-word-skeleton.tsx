import * as React from 'react';
import { View } from 'react-native';

export function AddWordSkeleton() {
  return (
    <View className="flex-1 p-4">
      {/* Banner Skeleton */}
      <View className="mb-6 h-20 w-full animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800" />

      {/* Section 1 Skeleton */}
      <View className="mb-6 rounded-3xl border border-line bg-surface p-4">
        <View className="mb-4 h-6 w-36 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
        <View className="mb-4 h-12 w-full animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800" />
        <View className="mb-4 h-12 w-full animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800" />
      </View>

      {/* Section 2 Skeleton */}
      <View className="mb-6 rounded-3xl border border-line bg-surface p-4">
        <View className="mb-4 h-6 w-44 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
        <View className="mb-4 h-12 w-full animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800" />
        <View className="mb-4 h-24 w-full animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800" />
      </View>
    </View>
  );
}
