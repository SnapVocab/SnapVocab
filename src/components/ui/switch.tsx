import type { SwitchProps } from 'react-native';
import { Switch as NativeSwitch } from 'react-native';
import { useUniwind } from 'uniwind';

// On: the brand fill (softened in dark). Off: a track that still reads against the row it sits on.
const COLORS = {
  light: { on: '#58CC02', off: '#CDD0DA', thumbOn: '#FFFFFF', thumbOff: '#FFFFFF' },
  dark: { on: '#91B86C', off: '#4A535F', thumbOn: '#F3F4F6', thumbOff: '#AEB4BE' },
};

/** The app's one toggle: same colors everywhere, in both light and dark mode. */
export function Switch({ value, trackColor, thumbColor, ...props }: SwitchProps) {
  const c = COLORS[useUniwind().theme === 'dark' ? 'dark' : 'light'];
  return (
    <NativeSwitch
      value={value}
      trackColor={trackColor ?? { false: c.off, true: c.on }}
      thumbColor={thumbColor ?? (value ? c.thumbOn : c.thumbOff)}
      ios_backgroundColor={c.off}
      {...props}
    />
  );
}
