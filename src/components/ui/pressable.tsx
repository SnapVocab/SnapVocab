import type { PressableProps } from 'react-native';
import { Pressable as NativePressable } from 'react-native';
import { useUniwind } from 'uniwind';

// A neutral wash in the foreground color, the Material state layer: it suits any surface it lands on.
const RIPPLE = {
  light: { color: 'rgba(30, 42, 68, 0.10)', foreground: true },
  dark: { color: 'rgba(243, 244, 246, 0.12)', foreground: true },
};

/** Pressable with a consistent Android touch ripple that follows the light/dark theme. */
export function Pressable({ android_ripple, ...props }: PressableProps) {
  const mode = useUniwind().theme === 'dark' ? 'dark' : 'light';
  return (
    <NativePressable
      android_ripple={android_ripple ?? RIPPLE[mode]}
      {...props}
    />
  );
}
