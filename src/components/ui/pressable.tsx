import type { PressableProps } from 'react-native';
import { Pressable as NativePressable } from 'react-native';
import { useUniwind } from 'uniwind';

// A neutral wash in the foreground color, the Material state layer: it suits any surface it lands on.
const RIPPLE = {
  light: { color: 'rgba(30, 42, 68, 0.10)', foreground: true },
  dark: { color: 'rgba(243, 244, 246, 0.12)', foreground: true },
};

const DEFAULT_PRESS_RETENTION = { top: 20, right: 20, bottom: 20, left: 20 };

/** Pressable with a consistent Android touch ripple and generous press retention. */
export function Pressable({ android_ripple, pressRetentionOffset, ...props }: PressableProps) {
  const mode = useUniwind().theme === 'dark' ? 'dark' : 'light';
  return (
    <NativePressable
      android_ripple={android_ripple ?? RIPPLE[mode]}
      pressRetentionOffset={pressRetentionOffset ?? DEFAULT_PRESS_RETENTION}
      {...props}
    />
  );
}
