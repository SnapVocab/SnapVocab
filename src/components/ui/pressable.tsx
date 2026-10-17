import type { PressableProps } from 'react-native';
import { Pressable as NativePressable } from 'react-native';

/** Pressable with a consistent, subtle theme-colored Android touch ripple. */
export function Pressable({ android_ripple, ...props }: PressableProps) {
  return (
    <NativePressable
      android_ripple={android_ripple ?? { color: 'rgba(88, 204, 2, 0.14)' }}
      {...props}
    />
  );
}
