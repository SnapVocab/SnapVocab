import { Skeleton, View } from '@/components/ui';

export function LevelCardSkeleton() {
  return (
    <View className="rounded-3xl bg-[#0284C7] p-4">
      <Skeleton className="mb-2 h-8 w-20 rounded-full" />
      <Skeleton className="h-9 w-48" />
      <Skeleton className="mt-3 h-3 w-full" />
    </View>
  );
}

export function MetricCardSkeleton() {
  return (
    <View className="size-28 items-center justify-center rounded-[20px] bg-white dark:bg-neutral-800">
      <Skeleton className="size-8 rounded-full" />
      <Skeleton className="my-2 h-7 w-12" />
      <Skeleton className="h-3 w-16" />
    </View>
  );
}

export function MetricCardsRowSkeleton() {
  return (
    <View className="flex-row justify-between">
      <MetricCardSkeleton />
      <MetricCardSkeleton />
      <MetricCardSkeleton />
    </View>
  );
}

export function MissionCardSkeleton() {
  return (
    <View className="flex-row items-center rounded-3xl bg-white p-4 dark:bg-neutral-800">
      <Skeleton className="size-8 rounded-full" />
      <View className="ml-3 flex-1">
        <Skeleton className="mb-2 h-5 w-40" />
        <Skeleton className="h-3 w-full" />
      </View>
      <Skeleton className="ml-2 h-6 w-12 rounded-full" />
    </View>
  );
}

export function CurrentUnitCardSkeleton() {
  return (
    <View className="gap-3 rounded-[28px] bg-[#29C45C] p-5">
      <Skeleton className="h-4 w-32 rounded-full bg-white/30" />
      <Skeleton className="h-7 w-44 bg-white/30" />
      <Skeleton className="h-3 w-full bg-white/30" />
      <Skeleton className="h-12 w-full rounded-3xl bg-white" />
    </View>
  );
}

export function HomeSkeleton() {
  return (
    <View className="gap-5">
      <LevelCardSkeleton />
      <MetricCardsRowSkeleton />
      <Skeleton className="h-6 w-32" />
      <MissionCardSkeleton />
      <Skeleton className="h-6 w-44" />
      <CurrentUnitCardSkeleton />
    </View>
  );
}
