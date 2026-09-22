import type { StyleProp, ViewStyle } from 'react-native';
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
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';

export type CoinVisualSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export const SIZES: Record<CoinVisualSize, number> = {
  xs: 24,
  sm: 32,
  md: 48,
  lg: 64,
  xl: 80,
};

export type CoinAnimation = 'none' | 'shine' | 'spin' | 'bounce';

export type Coin3DProps = {
  size?: CoinVisualSize | number;
  amount?: number;
  animation?: CoinAnimation;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
};

export function Coin3D({
  size = 'md',
  amount,
  animation = 'none',
  style,
  testID,
  accessibilityLabel = '3D Gold Coin',
}: Coin3DProps) {
  const numericSize = typeof size === 'number' ? size : SIZES[size] || 48;
  const rotateY = useSharedValue(0);

  useEffect(() => {
    if (animation === 'spin') {
      rotateY.value = withRepeat(
        withTiming(360, { duration: 1800, easing: Easing.linear }),
        -1,
        false,
      );
    }
    else if (animation === 'bounce') {
      rotateY.value = withRepeat(
        withSequence(
          withTiming(15, { duration: 300, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 300, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        true,
      );
    }
    else {
      rotateY.value = withTiming(0, { duration: 200 });
    }
  }, [animation, rotateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rotateY.value}deg` }],
  }));

  return (
    <View style={style} testID={testID} accessibilityLabel={accessibilityLabel}>
      <Animated.View style={[{ width: numericSize, height: numericSize }, animatedStyle]}>
        <Svg width={numericSize} height={numericSize} viewBox="0 0 64 64" fill="none">
          <Defs>
            <RadialGradient id="coinGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFC42E" stopOpacity="0.4" />
              <Stop offset="100%" stopColor="#D97706" stopOpacity="0" />
            </RadialGradient>
            <LinearGradient id="coinSideGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#B45309" />
              <Stop offset="50%" stopColor="#D97706" />
              <Stop offset="100%" stopColor="#78350F" />
            </LinearGradient>
            <LinearGradient id="coinFaceGrad" x1="0.2" y1="0" x2="0.8" y2="1">
              <Stop offset="0%" stopColor="#FFF5C0" />
              <Stop offset="30%" stopColor="#FFD54F" />
              <Stop offset="70%" stopColor="#FFC42E" />
              <Stop offset="100%" stopColor="#F59E0B" />
            </LinearGradient>
            <LinearGradient id="innerRimGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#F59E0B" />
              <Stop offset="100%" stopColor="#FFE082" />
            </LinearGradient>
            <LinearGradient id="starEmblemGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FFF9C4" />
              <Stop offset="100%" stopColor="#D97706" />
            </LinearGradient>
          </Defs>

          <Circle cx="32" cy="34" r="28" fill="url(#coinGlow)" />
          <Circle cx="32" cy="35" r="27" fill="url(#coinSideGrad)" />
          <Circle cx="32" cy="32" r="27" fill="url(#coinFaceGrad)" stroke="#B45309" strokeWidth="1.5" />
          <Circle cx="32" cy="32" r="23" fill="none" stroke="url(#innerRimGrad)" strokeWidth="2.5" />
          <Circle cx="32" cy="32" r="19" fill="url(#coinFaceGrad)" opacity="0.9" />

          <Path
            d="M12 28 C14 18 22 10 32 10 C38 10 44 12 48 16 C42 13 32 12 20 20 C14 24 12 28 12 28 Z"
            fill="#FFFFFF"
            opacity="0.65"
          />

          {amount !== undefined && numericSize >= 40
            ? (
                <SvgText
                  x="32"
                  y="38"
                  textAnchor="middle"
                  fill="#78350F"
                  fontSize="18"
                  fontWeight="900"
                  fontFamily="System"
                >
                  {amount > 999 ? `${(amount / 1000).toFixed(1)}k` : amount}
                </SvgText>
              )
            : (
                <Path
                  d="M32 18.5 L35.5 26.5 L44.5 27.5 L37.8 33.5 L39.8 42 L32 37.5 L24.2 42 L26.2 33.5 L19.5 27.5 L28.5 26.5 Z"
                  fill="url(#starEmblemGrad)"
                  stroke="#B45309"
                  strokeWidth="1"
                />
              )}
        </Svg>
      </Animated.View>
    </View>
  );
}
