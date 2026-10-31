import * as React from 'react';
import { useMMKVString } from 'react-native-mmkv';
import { Uniwind } from 'uniwind';

import { storage } from '../storage';

const SELECTED_THEME = 'SELECTED_THEME';
export type ColorSchemeType = 'light' | 'dark' | 'system';

function resolveTheme(theme: string | undefined): ColorSchemeType {
  return theme === 'light' || theme === 'dark' ? theme : 'system';
}
/** Read/edit the saved preference. For styling, use the active Uniwind theme. */
export function useSelectedTheme() {
  const [theme, _setTheme] = useMMKVString(SELECTED_THEME, storage);

  const setSelectedTheme = React.useCallback(
    (t: ColorSchemeType) => {
      Uniwind.setTheme(t);
      _setTheme(t);
    },
    [_setTheme],
  );

  const selectedTheme = resolveTheme(theme);
  return { selectedTheme, setSelectedTheme } as const;
}
// to be used in the root file to load the selected theme from MMKV
export function loadSelectedTheme() {
  Uniwind.setTheme(resolveTheme(storage.getString(SELECTED_THEME)));
}
