import { Skeleton, View } from '@/components/ui';

export function ProfileCardSkeleton() {
  return (
    <View className="items-center justify-center gap-2 rounded-4xl bg-[#8253EC] p-4">
      <Skeleton className="size-[58] rounded-full bg-white/30" />
      <Skeleton className="h-6 w-24 bg-white/30" />
      <Skeleton className="h-4 w-16 bg-white/30" />
      <Skeleton className="h-4 w-56 bg-white/30" />
    </View>
  );
}
