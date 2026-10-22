import type { ReactNode } from 'react';
import { createContext, use } from 'react';
import { useUniwind } from 'uniwind';

/** Role tokens for shared components. Components read roles, never hex values, so an area can be re-skinned later. */
export type SurfaceTokens = {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  headerBg: string;
  text: string;
  textMuted: string;
};

/** Light/dark are the user's choice and always respected: every palette defines both. */
export type SurfacePalette = { light: SurfaceTokens; dark: SurfaceTokens };

export const DEFAULT_SURFACE: SurfacePalette = {
  light: {
    background: '#F7F8FA',
    surface: '#FFFFFF',
    surfaceMuted: '#F1F5F9',
    border: '#E2E8F0',
    headerBg: '#FFFFFF',
    text: '#1E2A44',
    textMuted: '#565879',
  },
  dark: {
    background: '#0A0A0A',
    surface: '#0D0E1A',
    surfaceMuted: '#171A2F',
    border: '#171A2F',
    headerBg: '#0D0E1A',
    text: '#FFFFFF',
    textMuted: '#9597AD',
  },
};

const SurfaceContext = createContext<SurfacePalette | null>(null);

/** Re-skins the surfaces of everything below it (screens and their modals); outside, or with null, the app default applies. */
export function SurfaceProvider({ palette, children }: { palette: SurfacePalette | null; children: ReactNode }) {
  return <SurfaceContext value={palette}>{children}</SurfaceContext>;
}

/** The user's resolved light/dark choice (Settings → Giao diện), independent of any Shop theme. */
export function useColorMode(): keyof SurfacePalette {
  return useUniwind().theme === 'dark' ? 'dark' : 'light';
}

export function useSurface(): SurfaceTokens {
  return (use(SurfaceContext) ?? DEFAULT_SURFACE)[useColorMode()];
}

/**
 * The provided palette's tokens, or null when none is provided. For screens styled with classes (Trang chủ,
 * Hồ sơ): they keep their own look and only take a theme's surfaces when one is equipped (shop.md §6.4).
 */
export function useSurfaceOverride(): SurfaceTokens | null {
  const palette = use(SurfaceContext);
  const mode = useColorMode();
  return palette && palette[mode];
}
