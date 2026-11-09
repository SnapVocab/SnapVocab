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
import { Image } from '@/components/ui/image';
import { CARD_FRAME_WINDOW, CARD_FRAME_WINDOW_RADIUS, cardFrameSize } from '../card-frame';

type Props = {
  side?: CardSide;
  onFlip?: (nextSide: CardSide) => void;
  isInteractive?: boolean;
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  minHeight?: number;
  className?: string;
  /** Equipped card frame: the card becomes 3:4 with its content inside the frame window (card_frame_plan.md). */
  frameUrl?: string | null;
  /** Height the framed card may use; without it the card is as wide as its parent. */
  maxHeight?: number;
  onFrameError?: () => void;
};

export function FlipCardContainer({
  side: controlledSide,
  onFlip,
  isInteractive = true,
  frontContent,
  backContent,
  minHeight = 420,
  className = '',
  frameUrl,
  maxHeight,
  onFrameError,
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

  // A frame that fails to load is dropped for that URL: the card stays learnable without it (AC-CF-06).
  const [failedFrameUrl, setFailedFrameUrl] = React.useState<string | null>(null);
  const [width, setWidth] = React.useState(0);
  if (frameUrl && failedFrameUrl !== frameUrl) {
    const size = cardFrameSize(width, maxHeight);
    const contentWindow = {
      position: 'absolute' as const,
      left: size.width * CARD_FRAME_WINDOW.x,
      top: size.height * CARD_FRAME_WINDOW.y,
      width: size.width * CARD_FRAME_WINDOW.width,
      height: size.height * CARD_FRAME_WINDOW.height,
      borderRadius: size.width * CARD_FRAME_WINDOW_RADIUS,
    };
    // Each face carries its own frame, so the back reads the right way round after the flip.
    const face = (faceStyle: typeof frontAnimatedStyle, faceSide: CardSide, content: React.ReactNode) => (
      <Animated.View
        style={[StyleSheet.absoluteFillObject, faceStyle]}
        pointerEvents={currentSide === faceSide ? 'box-none' : 'none'}
      >
        <View style={contentWindow} className="overflow-hidden bg-surface">
          {content}
        </View>
        <View pointerEvents="none" style={StyleSheet.absoluteFillObject} testID={`card-frame-${faceSide.toLowerCase()}`}>
          {/* contentFit fill is exact: card and asset are both 3:4. */}
          <Image
            source={{ uri: frameUrl }}
            style={StyleSheet.absoluteFillObject}
            contentFit="fill"
            placeholder={null}
            onError={() => {
              setFailedFrameUrl(frameUrl);
              onFrameError?.();
            }}
          />
        </View>
      </Animated.View>
    );
    return (
      <GestureDetector gesture={tapGesture}>
        <View testID="card-frame" className={`w-full ${className}`} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
          {width > 0 && (
            <View style={{ width: size.width, height: size.height, alignSelf: 'center' }}>
              {face(frontAnimatedStyle, 'FRONT', frontContent)}
              {face(backAnimatedStyle, 'BACK', backContent)}
            </View>
          )}
        </View>
      </GestureDetector>
    );
  }

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
