import { useUniwind } from 'uniwind';

/** Role tokens for shared components. Components read roles, never hex values. */
export type SurfaceTokens = {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  headerBg: string;
  text: string;
  textMuted: string;
  action: string;
  onBrand: string;
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
    action: '#326F09',
    onBrand: '#1B2416',
  },
  dark: {
    background: '#181A1F',
    surface: '#22252B',
    surfaceMuted: '#292E36',
    border: '#363B43',
    headerBg: '#22252B',
    text: '#F3F4F6',
    textMuted: '#B5BBC5',
    action: '#B5D894',
    onBrand: '#1B2416',
  },
};

/** The user's resolved light/dark choice (Settings → Giao diện). */
export function useColorMode(): keyof SurfacePalette {
  return useUniwind().theme === 'dark' ? 'dark' : 'light';
}

export function useSurface(): SurfaceTokens {
  return DEFAULT_SURFACE[useColorMode()];
}
