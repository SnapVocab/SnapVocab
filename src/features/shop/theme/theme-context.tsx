import type { ThemeKey } from '../types';
import * as React from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { store } from '@/features/auth/use-auth-store';
import { storage } from '@/lib/storage';

export type SurfaceTokens = {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  headerBg: string;
  tabBg: string;
  text: string;
  textMuted: string;
};

export type ThemeDefinition = {
  key: string;
  name: string;
  description: string;
  surfaceTokens: SurfaceTokens;
};

export const SHOP_THEMES: Record<string, ThemeDefinition> = {
  DEFAULT: {
    key: 'DEFAULT',
    name: 'Mặc định',
    description: 'Giao diện tiêu chuẩn thân thiện của SnapVocab',
    surfaceTokens: {
      background: '#F7F8FA',
      surface: '#FFFFFF',
      surfaceMuted: '#F1F5F9',
      border: '#E2E8F0',
      headerBg: '#FFFFFF',
      tabBg: '#FFFFFF',
      text: '#1B1B3A',
      textMuted: '#757793',
    },
  },
  MIDNIGHT_NEON: {
    key: 'MIDNIGHT_NEON',
    name: 'Đêm Neon Huyền Ảo',
    description: 'Sắc tím đêm cyberpunk huyền bí',
    surfaceTokens: {
      background: '#0B0F19',
      surface: '#151B2B',
      surfaceMuted: '#1E2638',
      border: '#2A344A',
      headerBg: '#151B2B',
      tabBg: '#151B2B',
      text: '#F8FAFC',
      textMuted: '#94A3B8',
    },
  },
  SUNSET_AMBER: {
    key: 'SUNSET_AMBER',
    name: 'Hoàng Hôn Hổ Phách',
    description: 'Sắc vàng cam ấm áp của hoàng hôn',
    surfaceTokens: {
      background: '#FFFBEB',
      surface: '#FFFFFF',
      surfaceMuted: '#FEF3C7',
      border: '#FDE68A',
      headerBg: '#FFFFFF',
      tabBg: '#FFFFFF',
      text: '#78350F',
      textMuted: '#B45309',
    },
  },
  FOREST_MINT: {
    key: 'FOREST_MINT',
    name: 'Rừng Bạc Hà',
    description: 'Sắc xanh ngọc thư thái của thiên nhiên',
    surfaceTokens: {
      background: '#F0FDF4',
      surface: '#FFFFFF',
      surfaceMuted: '#DCFCE7',
      border: '#BBF7D0',
      headerBg: '#FFFFFF',
      tabBg: '#FFFFFF',
      text: '#14532D',
      textMuted: '#16A34A',
    },
  },
};

const EQUIPPED_THEME_STORAGE_KEY = 'snapvocab_equipped_theme';

export function isThemeKnown(themeKey?: string | null): boolean {
  if (!themeKey)
    return false;
  return Boolean(SHOP_THEMES[themeKey]);
}

export function getThemeDefinition(themeKey?: string | null): ThemeDefinition {
  if (themeKey && SHOP_THEMES[themeKey]) {
    return SHOP_THEMES[themeKey];
  }
  return SHOP_THEMES.DEFAULT;
}

type ShopThemeContextType = {
  themeKey: string;
  theme: ThemeDefinition;
  setEquippedTheme: (key: string) => void;
};

const ShopThemeContext = createContext<ShopThemeContextType>({
  themeKey: 'DEFAULT',
  theme: SHOP_THEMES.DEFAULT,
  setEquippedTheme: () => {},
});

export function ShopThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeKey, setThemeKeyState] = useState<string>(() => {
    try {
      const stored = storage.getString(EQUIPPED_THEME_STORAGE_KEY);
      if (stored && isThemeKnown(stored)) {
        return stored;
      }
    }
    catch {
      // Fallback
    }
    return 'DEFAULT';
  });

  const setEquippedTheme = React.useCallback((key: string) => {
    const validKey = isThemeKnown(key) ? key : 'DEFAULT';
    setThemeKeyState(validKey);
    try {
      storage.set(EQUIPPED_THEME_STORAGE_KEY, validKey);
    }
    catch {
      // Ignore
    }
  }, []);

  // Equipped theme belongs to the account: reset on account change, inventory sync re-applies the new user's theme.
  useEffect(() => store.subscribe((state, prev) => {
    if (state.user?.id !== prev.user?.id)
      setEquippedTheme('DEFAULT');
  }), [setEquippedTheme]);

  const theme = useMemo(() => getThemeDefinition(themeKey), [themeKey]);

  return (
    <ShopThemeContext.Provider value={{ themeKey, theme, setEquippedTheme }}>
      {children}
    </ShopThemeContext.Provider>
  );
}

export function useShopTheme() {
  return useContext(ShopThemeContext);
}
