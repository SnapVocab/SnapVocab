import * as React from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export default function SkeletonCollectionDetail() {
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
    <Animated.View style={animatedStyle} className="gap-4">
      {/* Hero Skeleton */}
      <View className="rounded-3xl border border-neutral-200/80 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 flex-row items-center gap-3.5">
            <View className="size-14 rounded-2xl bg-neutral-200/90 dark:bg-neutral-800" />
            <View className="flex-1 gap-2">
              <View className="h-5 w-3/4 rounded-md bg-neutral-200/90 dark:bg-neutral-800" />
              <View className="h-3.5 w-1/2 rounded-md bg-neutral-200/60 dark:bg-neutral-800/60" />
            </View>
          </View>
          <View className="h-6 w-16 rounded-full bg-neutral-200/80 dark:bg-neutral-800" />
        </View>

        {/* Stats placeholder */}
        <View className="mt-4 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60" />

        {/* Button placeholder */}
        <View className="mt-4 h-12 rounded-2xl bg-neutral-200/90 dark:bg-neutral-800" />
      </View>

      {/* Word Cards Skeletons */}
      <View className="gap-2.5">
        {Array.from({ length: 4 }, (_, i) => `skeleton-word-${i}`).map(key => (
          <View
            key={key}
            className="rounded-2xl border border-neutral-200/80 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <View className="flex-row items-center justify-between">
              <View className="h-5 w-1/3 rounded-md bg-neutral-200/90 dark:bg-neutral-800" />
              <View className="h-6 w-16 rounded-full bg-neutral-200/60 dark:bg-neutral-800" />
            </View>
            <View className="mt-2 h-4 w-1/2 rounded-md bg-neutral-200/60 dark:bg-neutral-800/60" />
            <View className="mt-2 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800/40" />
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

export { SkeletonCollectionDetail };
