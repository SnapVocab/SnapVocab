import type { SurfacePalette, SurfaceTokens } from '@/components/ui/surface';
import * as React from 'react';
import { createContext, use, useEffect, useMemo, useState } from 'react';
import { DEFAULT_SURFACE, SurfaceProvider } from '@/components/ui/surface';
import { store } from '@/features/auth/use-auth-store';
import { storage } from '@/lib/storage';

/** Palette only: the name a learner reads is the ShopItem's, from the server. */
export type ThemeDefinition = {
  key: string;
  palette: SurfacePalette;
};

type Surfaces = Omit<SurfaceTokens, 'text' | 'textMuted'>;

/** A theme re-skins surfaces only; text stays the mode's default (shop.md §6.2: foreground is fixed). */
function palette(light: Surfaces, dark: Surfaces): SurfacePalette {
  return {
    light: { ...DEFAULT_SURFACE.light, ...light },
    dark: { ...DEFAULT_SURFACE.dark, ...dark },
  };
}

/**
 * Scope (2026-10-21, PD-SHX-06): a purchased theme applies to Trang chủ (with its header), Hồ sơ and the
 * Shop area — Cửa hàng, Kho đồ, Ví Coin and their modals (via ShopSurface). Tab bar and every other
 * screen keep their default look. The learner-facing scope sentence is `shop.theme.scope`.
 */
export const SHOP_THEMES: Record<string, ThemeDefinition> = {
  DEFAULT: {
    key: 'DEFAULT',
    palette: DEFAULT_SURFACE,
  },
  MIDNIGHT_NEON: {
    key: 'MIDNIGHT_NEON',
    palette: palette(
      { background: '#F5F3FF', surface: '#FFFFFF', surfaceMuted: '#EDE9FE', border: '#DDD6FE', headerBg: '#FFFFFF' },
      { background: '#0B0F19', surface: '#151B2B', surfaceMuted: '#1E2638', border: '#2A344A', headerBg: '#151B2B' },
    ),
  },
  SUNSET_AMBER: {
    key: 'SUNSET_AMBER',
    palette: palette(
      { background: '#FFFBEB', surface: '#FFFFFF', surfaceMuted: '#FEF3C7', border: '#FDE68A', headerBg: '#FFFFFF' },
      { background: '#1A1206', surface: '#261A0A', surfaceMuted: '#33230E', border: '#4A3214', headerBg: '#261A0A' },
    ),
  },
  FOREST_MINT: {
    key: 'FOREST_MINT',
    palette: palette(
      { background: '#F0FDF4', surface: '#FFFFFF', surfaceMuted: '#DCFCE7', border: '#BBF7D0', headerBg: '#FFFFFF' },
      { background: '#04170E', surface: '#0A2417', surfaceMuted: '#103221', border: '#1A4A31', headerBg: '#0A2417' },
    ),
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

  // Equipped theme belongs to the account: a new account starts from DEFAULT; GET /api/users/me (stored on the
  // user, shop.md §10.1) and the inventory sync apply the server's choice.
  useEffect(() => store.subscribe((state, prev) => {
    const equipped = state.user?.equipped;
    if (state.user?.id !== prev.user?.id || (equipped && equipped.themeKey !== prev.user?.equipped?.themeKey))
      setEquippedTheme(equipped?.themeKey ?? 'DEFAULT');
  }), [setEquippedTheme]);

  const theme = useMemo(() => getThemeDefinition(themeKey), [themeKey]);

  return (
    <ShopThemeContext value={{ themeKey, theme, setEquippedTheme }}>
      {children}
    </ShopThemeContext>
  );
}

export function useShopTheme() {
  return use(ShopThemeContext);
}

/**
 * Wrap a themed screen: it and its modals take the equipped theme's surfaces. DEFAULT provides nothing, so
 * Shop screens fall back to DEFAULT_SURFACE and class-styled screens (Home, Profile) keep their own look.
 */
export function ShopSurface({ children }: { children: React.ReactNode }) {
  const { themeKey, theme } = useShopTheme();
  return <SurfaceProvider palette={themeKey === 'DEFAULT' ? null : theme.palette}>{children}</SurfaceProvider>;
}
