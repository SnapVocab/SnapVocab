import type { CardSide } from '../types';
import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  side?: CardSide;
  onFlip?: (nextSide: CardSide) => void;
  isInteractive?: boolean;
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  minHeight?: number;
  className?: string;
};

export function FlipCardContainer({
  side: controlledSide,
  onFlip,
  isInteractive = true,
  frontContent,
  backContent,
  minHeight = 420,
  className = '',
}: Props) {
  const [internalSide, setInternalSide] = React.useState<CardSide>(controlledSide ?? 'FRONT');
  const currentSide = controlledSide ?? internalSide;

  // 0 = FRONT (0deg), 1 = BACK (180deg)
  const flipAnim = useSharedValue(currentSide === 'FRONT' ? 0 : 1);

  React.useEffect(() => {
    const targetVal = currentSide === 'FRONT' ? 0 : 1;
    flipAnim.value = withTiming(targetVal, { duration: 320 });
  }, [currentSide, flipAnim]);

  const toggleFlip = React.useCallback(() => {
    if (!isInteractive)
      return;
    const nextSide: CardSide = currentSide === 'FRONT' ? 'BACK' : 'FRONT';
    if (controlledSide === undefined) {
      setInternalSide(nextSide);
    }
    onFlip?.(nextSide);
  }, [isInteractive, currentSide, controlledSide, onFlip]);

  // Front face animation (0deg -> 180deg)
  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(flipAnim.value, [0, 1], [0, 180]);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateValue}deg` }],
      opacity: flipAnim.value >= 0.5 ? 0 : 1,
      zIndex: flipAnim.value < 0.5 ? 2 : 1,
    };
  });

  // Back face animation (180deg -> 360deg)
  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(flipAnim.value, [0, 1], [180, 360]);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateValue}deg` }],
      opacity: flipAnim.value >= 0.5 ? 1 : 0,
      zIndex: flipAnim.value >= 0.5 ? 2 : 1,
    };
  });

  return (
    <Pressable
      onPress={toggleFlip}
      disabled={!isInteractive}
      android_ripple={{ color: 'transparent' }}
      className={`w-full ${className}`}
    >
      <View style={{ minHeight }} className="w-full">
        {/* Front Face */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            frontAnimatedStyle,
          ]}
          className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-xl shadow-slate-900/10 dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-black/30"
          pointerEvents={currentSide === 'FRONT' ? 'auto' : 'none'}
        >
          {frontContent}
        </Animated.View>

        {/* Back Face */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            backAnimatedStyle,
          ]}
          className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-xl shadow-slate-900/10 dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-black/30"
          pointerEvents={currentSide === 'BACK' ? 'auto' : 'none'}
        >
          {backContent}
        </Animated.View>
      </View>
    </Pressable>
  );
}

export default FlipCardContainer;
