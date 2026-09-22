import type { SvgProps } from 'react-native-svg';
import * as React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

type Props = SvgProps & {
  size?: number;
};

/**
 * Shiny 3D Game Gold Coin
 */
export function CoinIcon({ size = 18, width, height, ...props }: Props) {
  const iconWidth = width ?? size;
  const iconHeight = height ?? size;

  return (
    <Svg width={iconWidth} height={iconHeight} viewBox="0 0 24 24" fill="none" {...props}>
      {/* Outer shadow / 3D base */}
      <Circle cx="12" cy="13" r="10" fill="#B45309" />
      {/* Outer rim */}
      <Circle cx="12" cy="11.5" r="10" fill="#F59E0B" />
      {/* Inner surface */}
      <Circle cx="12" cy="11.5" r="7.5" fill="#FBBF24" />
      {/* Inner embossed rim */}
      <Circle cx="12" cy="11.5" r="6" stroke="#D97706" strokeWidth={1} strokeDasharray="2 1.5" />
      {/* Center Star / Coin Symbol */}
      <Path
        d="M12 7.5L13.2 10.2L16 10.5L13.8 12.4L14.5 15.2L12 13.8L9.5 15.2L10.2 12.4L8 10.5L10.8 10.2L12 7.5Z"
        fill="#D97706"
      />
      {/* Top highlight shine */}
      <Path
        d="M7.5 7.5C9 5.5 11.5 4.5 14 4.8"
        stroke="#FEF08A"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Retro Pixel / Arcade 8-bit Gold Coin
 */
export function RetroCoinIcon({ size = 18, width, height, ...props }: Props) {
  const iconWidth = width ?? size;
  const iconHeight = height ?? size;

  return (
    <Svg width={iconWidth} height={iconHeight} viewBox="0 0 16 16" fill="none" {...props}>
      {/* Dark Outline */}
      <Rect x="5" y="1" width="6" height="1" fill="#78350F" />
      <Rect x="5" y="14" width="6" height="1" fill="#78350F" />
      <Rect x="3" y="2" width="2" height="1" fill="#78350F" />
      <Rect x="11" y="2" width="2" height="1" fill="#78350F" />
      <Rect x="3" y="13" width="2" height="1" fill="#78350F" />
      <Rect x="11" y="13" width="2" height="1" fill="#78350F" />
      <Rect x="2" y="3" width="1" height="2" fill="#78350F" />
      <Rect x="13" y="3" width="1" height="2" fill="#78350F" />
      <Rect x="2" y="11" width="1" height="2" fill="#78350F" />
      <Rect x="13" y="11" width="1" height="2" fill="#78350F" />
      <Rect x="1" y="5" width="1" height="6" fill="#78350F" />
      <Rect x="14" y="5" width="1" height="6" fill="#78350F" />

      {/* Gold Inner Body */}
      <Rect x="5" y="2" width="6" height="12" fill="#F59E0B" />
      <Rect x="3" y="3" width="10" height="10" fill="#F59E0B" />
      <Rect x="2" y="5" width="12" height="6" fill="#F59E0B" />

      {/* Light Gold Highlights */}
      <Rect x="5" y="2" width="5" height="1" fill="#FEF08A" />
      <Rect x="3" y="3" width="3" height="1" fill="#FEF08A" />
      <Rect x="2" y="5" width="1" height="4" fill="#FEF08A" />

      {/* Center Retro Slot / Star */}
      <Rect x="7" y="4" width="2" height="8" fill="#FEF08A" />
      <Rect x="6" y="5" width="4" height="2" fill="#FEF08A" />
      <Rect x="6" y="9" width="4" height="2" fill="#FEF08A" />
      <Rect x="8" y="5" width="2" height="6" fill="#B45309" />
    </Svg>
  );
}
