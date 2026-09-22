import * as React from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export default function SkeletonTopicList({ count = 5 }: { count?: number }) {
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
    <Animated.View style={animatedStyle} className="gap-2.5">
      {Array.from({ length: count }, (_, i) => `skeleton-topic-${i}`).map(key => (
        <View
          key={key}
          className="flex-row items-center justify-between rounded-2xl border border-neutral-200/80 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <View className="mr-3 flex-1 flex-row items-center gap-3.5">
            <View className="size-12 rounded-2xl bg-neutral-200/90 dark:bg-neutral-800" />
            <View className="flex-1 gap-2">
              <View className="h-4 w-3/5 rounded-md bg-neutral-200/90 dark:bg-neutral-800" />
              <View className="h-3.5 w-4/5 rounded-md bg-neutral-200/60 dark:bg-neutral-800/60" />
            </View>
          </View>
          <View className="size-8 rounded-lg bg-neutral-200/70 dark:bg-neutral-800/70" />
        </View>
      ))}
    </Animated.View>
  );
}

export { SkeletonTopicList };
