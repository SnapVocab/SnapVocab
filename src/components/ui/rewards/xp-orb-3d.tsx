import type { StyleProp, ViewStyle } from 'react-native';
import type { CoinVisualSize } from './coin-3d';
import * as React from 'react';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import { SIZES } from './coin-3d';

export type XPOrbAnimation = 'none' | 'pulse' | 'float';

export type XPOrb3DProps = {
  size?: CoinVisualSize | number;
  animation?: XPOrbAnimation;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
};

export function XPOrb3D({
  size = 'md',
  animation = 'none',
  style,
  testID,
  accessibilityLabel = 'XP Energy Orb',
}: XPOrb3DProps) {
  const numericSize = typeof size === 'number' ? size : SIZES[size] || 48;
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (animation === 'float') {
      translateY.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 900, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      );
    }
    else {
      translateY.value = withTiming(0, { duration: 200 });
    }
  }, [animation, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={style} testID={testID} accessibilityLabel={accessibilityLabel}>
      <Animated.View style={[{ width: numericSize, height: numericSize }, animatedStyle]}>
        <Svg width={numericSize} height={numericSize} viewBox="0 0 64 64" fill="none">
          <Defs>
            <RadialGradient id="orbGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#1CB0F6" stopOpacity="0.6" />
              <Stop offset="60%" stopColor="#A855F7" stopOpacity="0.3" />
              <Stop offset="100%" stopColor="#007AFF" stopOpacity="0" />
            </RadialGradient>
            <LinearGradient id="orbBodyGrad" x1="0.1" y1="0.1" x2="0.9" y2="0.9">
              <Stop offset="0%" stopColor="#E0F2FE" />
              <Stop offset="25%" stopColor="#38BDF8" />
              <Stop offset="65%" stopColor="#1CB0F6" />
              <Stop offset="100%" stopColor="#6366F1" />
            </LinearGradient>
            <RadialGradient id="coreSpark" cx="40%" cy="40%" r="50%">
              <Stop offset="0%" stopColor="#FFFFFF" />
              <Stop offset="40%" stopColor="#C084FC" />
              <Stop offset="100%" stopColor="#7E22CE" stopOpacity="0.9" />
            </RadialGradient>
            <LinearGradient id="boltGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FFFFFF" />
              <Stop offset="60%" stopColor="#FEF08A" />
              <Stop offset="100%" stopColor="#F59E0B" />
            </LinearGradient>
          </Defs>

          <Circle cx="32" cy="32" r="30" fill="url(#orbGlow)" />
          <Circle cx="32" cy="32" r="25" fill="url(#orbBodyGrad)" stroke="#0284C7" strokeWidth="1.5" />
          <Circle cx="30" cy="30" r="18" fill="url(#coreSpark)" opacity="0.85" />

          <Path
            d="M34 15.5 L20 35.5 L31 35.5 L26 51.5 L44 29.5 L33 29.5 Z"
            fill="#0284C7"
            opacity="0.35"
          />
          <G>
            <Path
              d="M34 14 L20 34 L31 34 L26 50 L44 28 L33 28 Z"
              fill="url(#boltGrad)"
              stroke="#B45309"
              strokeWidth="0.8"
            />
          </G>

          <Circle cx="24" cy="22" r="4.5" fill="#FFFFFF" opacity="0.75" />
          <Circle cx="21" cy="26" r="1.5" fill="#FFFFFF" opacity="0.6" />
        </Svg>
      </Animated.View>
    </View>
  );
}
