import * as React from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { twMerge } from 'tailwind-merge';

type Props = {
  className?: string;
};

export default function SkeletonCollectionCard({ className }: Props) {
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.45, { duration: 750 }), withTiming(1, { duration: 750 })),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading collection"
      className={twMerge(
        'flex-row items-center justify-between rounded-2xl border border-line bg-surface p-3.5',
        className,
      )}
    >
      <Animated.View style={animatedStyle} className="flex-1 flex-row items-center justify-between">
        {/* Left section: Folder icon skeleton + Title & translation bars */}
        <View className="mr-3 flex-1 flex-row items-center gap-3.5">
          {/* Folder Icon placeholder */}
          <View className="size-12 rounded-2xl bg-neutral-200/90 dark:bg-neutral-800" />

          {/* Texts placeholder */}
          <View className="flex-1 gap-2">
            {/* Name placeholder */}
            <View className="h-4 w-3/5 rounded-md bg-neutral-200/90 dark:bg-neutral-800" />
            {/* Translation placeholder */}
            <View className="h-3.5 w-4/5 rounded-md bg-neutral-200/60 dark:bg-neutral-800/60" />
          </View>
        </View>

        {/* Right section: 3-dots action button placeholder */}
        <View className="size-10 rounded-xl bg-neutral-200/70 dark:bg-neutral-800/70" />
      </Animated.View>
    </View>
  );
}

export { SkeletonCollectionCard };

export function SkeletonCollectionList({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <View className={twMerge('gap-2.5', className)}>
      {Array.from({ length: count }, (_, i) => `skeleton-item-${i}`).map(key => (
        <SkeletonCollectionCard key={key} />
      ))}
    </View>
  );
}
