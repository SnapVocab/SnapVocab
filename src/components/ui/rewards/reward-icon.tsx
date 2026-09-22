import type { StyleProp, ViewStyle } from 'react-native';
import type { CoinVisualSize } from './coin-3d';
import * as React from 'react';
import { Coin3D } from './coin-3d';
import { XPOrb3D } from './xp-orb-3d';

export type RewardType = 'coin' | 'xp' | 'star';

export type RewardIconProps = {
  type?: RewardType;
  size?: CoinVisualSize | number;
  amount?: number;
  animation?: 'none' | 'pulse' | 'bounce' | 'shine' | 'spin' | 'float';
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
};

export function RewardIcon({
  type = 'coin',
  size = 'md',
  amount,
  animation = 'none',
  style,
  testID,
  accessibilityLabel,
}: RewardIconProps) {
  switch (type) {
    case 'xp':
    case 'star':
      return (
        <XPOrb3D
          size={size}
          animation={animation === 'pulse' || animation === 'float' ? animation : 'none'}
          style={style}
          testID={testID}
          accessibilityLabel={accessibilityLabel}
        />
      );
    case 'coin':
    default:
      return (
        <Coin3D
          size={size}
          amount={amount}
          animation={animation === 'spin' || animation === 'bounce' ? animation : 'none'}
          style={style}
          testID={testID}
          accessibilityLabel={accessibilityLabel}
        />
      );
  }
}
