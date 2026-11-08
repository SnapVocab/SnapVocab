import * as React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { AchievementGlow } from '@/components/snapvocab';
import { useReduceMotion } from '../use-reduce-motion';

/** Recognition motion for a newly presented medal: spring 0.85 → 1 and a 2s halo (reduced: static halo, 600ms). */
export function NewMedal({ isNew, size, children }: { isNew: boolean; size: number; children: React.ReactNode }) {
  const reduce = useReduceMotion();
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);
  React.useEffect(() => {
    if (!isNew)
      return;
    glow.value = 1;
    if (reduce) {
      glow.value = withTiming(0, { duration: 600 });
      return;
    }
    scale.value = 0.85;
    scale.value = withSpring(1, { damping: 12, stiffness: 140 });
    glow.value = withTiming(0, { duration: 2000 });
  }, [isNew, reduce, scale, glow]);
  const medalStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  const halo = Math.round(size * 1.5);
  return (
    <View className="items-center justify-center">
      {isNew && (
        <Animated.View pointerEvents="none" className="absolute" style={[{ width: halo, height: halo }, glowStyle]}>
          <AchievementGlow size={halo} />
        </Animated.View>
      )}
      <Animated.View style={medalStyle}>{children}</Animated.View>
    </View>
  );
}
