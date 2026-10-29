import type { CardSide } from '../types';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
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
  const [internalSide, setInternalSide] = React.useState<CardSide>(
    controlledSide ?? 'FRONT',
  );
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

  // Tap flips the card; movement beyond the tap threshold is left to the nested
  // ScrollView so long card content can be read without accidentally flipping.
  const tapGesture = React.useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(300)
        .maxDistance(8)
        .enabled(isInteractive)
        .onEnd((_event, success) => {
          if (success)
            runOnJS(toggleFlip)();
        }),
    [isInteractive, toggleFlip],
  );

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
    <GestureDetector gesture={tapGesture}>
      <View className={`w-full ${className}`}>
        <View style={{ minHeight }} className="w-full">
          {/* Front Face */}
          <Animated.View
            style={[StyleSheet.absoluteFillObject, frontAnimatedStyle]}
            className="overflow-hidden rounded-[28px] border border-line bg-surface shadow-xl shadow-slate-900/10 dark:shadow-black/30"
            pointerEvents={currentSide === 'FRONT' ? 'auto' : 'none'}
          >
            {frontContent}
          </Animated.View>

          {/* Back Face */}
          <Animated.View
            style={[StyleSheet.absoluteFillObject, backAnimatedStyle]}
            className="overflow-hidden rounded-[28px] border border-line bg-surface shadow-xl shadow-slate-900/10 dark:shadow-black/30"
            pointerEvents={currentSide === 'BACK' ? 'auto' : 'none'}
          >
            {backContent}
          </Animated.View>
        </View>
      </View>
    </GestureDetector>
  );
}

export default FlipCardContainer;
