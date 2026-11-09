import * as React from 'react';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

/** Soft gold halo (`elev-reward`) placed behind a newly earned medal; callers animate its opacity. */
export function AchievementGlow({ size }: { size: number }) {
  const id = `glw${React.useId().replace(/\W/g, '')}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFD15C" stopOpacity={0.8} />
          <Stop offset="1" stopColor="#FFD15C" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={50} cy={50} r={50} fill={`url(#${id})`} />
    </Svg>
  );
}
