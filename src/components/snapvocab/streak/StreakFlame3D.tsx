import type { GameVisualProps } from '../core/GameVisual';
import * as React from 'react';
import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import { GameVisual } from '../core/GameVisual';
import { resolveVisualSize } from '../core/SnapVocabVisualSize';

export type StreakFlameState = 'active' | 'inactive' | 'broken' | 'milestone';
export type StreakFlameAnimation = 'none' | 'pulse' | 'bounce';

export type StreakFlame3DProps = {
  state?: StreakFlameState;
  animation?: StreakFlameAnimation;
} & GameVisualProps;

export function StreakFlame3D({
  size = 'md',
  state = 'active',
  animation = 'none',
  style,
  testID,
  accessibilityLabel = 'Streak Flame',
}: StreakFlame3DProps) {
  const numericSize = resolveVisualSize(size);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (animation === 'pulse' && state === 'active') {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 750, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 750, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    }
    else if (animation === 'bounce') {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.18, { duration: 400, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 400, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        true,
      );
    }
    else {
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [animation, scale, state]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isInactive = state === 'inactive' || state === 'broken';
  const isMilestone = state === 'milestone';
  const baseScale = isInactive ? 0.9 : 1;

  return (
    <GameVisual size={size} style={style} testID={testID} accessibilityLabel={accessibilityLabel}>
      <Animated.View
        style={[
          { width: numericSize, height: numericSize, transform: [{ scale: baseScale }] },
          animatedStyle,
        ]}
      >
        <Svg width={numericSize} height={numericSize} viewBox="0 0 64 64" fill="none">
          <Defs>
            {/* Outer Glow Gradient */}
            <RadialGradient id="flameGlow" cx="55%" cy="60%" r="50%">
              <Stop offset="0%" stopColor={isMilestone ? '#FFD700' : '#FF8A00'} stopOpacity="0.6" />
              <Stop offset="100%" stopColor={isMilestone ? '#FFA000' : '#FF3B30'} stopOpacity="0" />
            </RadialGradient>

            {/* Main Outer Flame Gradient */}
            <LinearGradient id="outerFlameGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={isInactive ? '#A1A1AA' : isMilestone ? '#FFF176' : '#FF9500'} />
              <Stop offset="60%" stopColor={isInactive ? '#71717A' : isMilestone ? '#FFB300' : '#FF3B30'} />
              <Stop offset="100%" stopColor={isInactive ? '#52525B' : isMilestone ? '#E65100' : '#C2185B'} />
            </LinearGradient>

            {/* Mid Flame Gradient */}
            <LinearGradient id="midFlameGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={isInactive ? '#D4D4D8' : '#FFE082'} />
              <Stop offset="50%" stopColor={isInactive ? '#A1A1AA' : '#FFC42E'} />
              <Stop offset="100%" stopColor={isInactive ? '#71717A' : '#FF8A00'} />
            </LinearGradient>

            {/* Inner Hot Core Gradient */}
            <LinearGradient id="innerCoreGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={isInactive ? '#F4F4F5' : '#FFFFFF'} />
              <Stop offset="40%" stopColor={isInactive ? '#E4E4E7' : '#FFF59D'} />
              <Stop offset="100%" stopColor={isInactive ? '#A1A1AA' : '#FFB300'} />
            </LinearGradient>
          </Defs>

          {/* Background Glow (Active / Milestone only, hidden when dormant) */}
          {!isInactive && <Circle cx="32" cy="36" r="26" fill="url(#flameGlow)" />}

          {/* Outer Layer 3D Shadow Base with dynamic flame flick and tongue */}
          <Path
            d="M32 4 C32 4 36 12 39 17 C42 13 46 11 49 15 C53 20 54 28 54 38 C54 50 44 59 32 59 C20 59 10 50 10 38 C10 26 18 17 24 11 C24 18 28 21 31 19 C32 15 32 4 32 4 Z"
            fill="url(#outerFlameGrad)"
          />

          {/* Mid Flame Layer */}
          <Path
            d="M32 13 C32 13 35 19 37 23 C40 20 43 18 45 22 C48 26 48 32 48 39 C48 48 41 54 32 54 C23 54 16 48 16 39 C16 30 22 23 26 18 C26 23 29 25 31 23 C32 20 32 13 32 13 Z"
            fill="url(#midFlameGrad)"
          />

          {/* Inner Glowing Core */}
          <Path
            d="M32 23 C32 23 34 27 35 30 C37 28 39 27 40 30 C42 33 42 37 42 41 C42 47 37 50.5 32 50.5 C27 50.5 22 47 22 41 C22 35 26 30 28 27 C28 30 30 31 31 30 C32 28 32 23 32 23 Z"
            fill="url(#innerCoreGrad)"
          />

          {/* Highlight Specular Crescent */}
          <Path
            d="M26 15 C28 12 30 9 32 6 C33 10 35 14 36 17 C33 15 29 17 26 15 Z"
            fill="#FFFFFF"
            opacity={isInactive ? 0.3 : 0.85}
          />

          {/* Sparkles for Milestone */}
          {isMilestone && (
            <G>
              <Circle cx="12" cy="18" r="3" fill="#FFE082" opacity="0.9" />
              <Circle cx="50" cy="22" r="2.5" fill="#FFF" opacity="0.8" />
              <Circle cx="44" cy="10" r="2" fill="#FFD700" opacity="0.9" />
            </G>
          )}

          {/* Broken Flame X Mark if Broken */}
          {state === 'broken' && (
            <G stroke="#EF4444" strokeWidth="4" strokeLinecap="round">
              <Path d="M22 28L42 48" />
              <Path d="M42 28L22 48" />
            </G>
          )}
        </Svg>
      </Animated.View>
    </GameVisual>
  );
}
