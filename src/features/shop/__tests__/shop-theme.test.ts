import { DEFAULT_SURFACE } from '@/components/ui/surface';
import {
  getThemeDefinition,
  isThemeKnown,
  SHOP_THEMES,
} from '../theme/theme-context';

/** WCAG 2.x contrast ratio of two #RRGGBB colors. */
function contrast(a: string, b: string) {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const modes = ['light', 'dark'] as const;
const cases = Object.values(SHOP_THEMES).flatMap(theme => modes.map(mode => [theme.key, mode] as const));

describe('shop Theme registry and unknown key handling', () => {
  it('correctly recognizes supported themes', () => {
    expect(isThemeKnown('DEFAULT')).toBe(true);
    expect(isThemeKnown('MIDNIGHT_NEON')).toBe(true);
    expect(isThemeKnown('SUNSET_AMBER')).toBe(true);
    expect(isThemeKnown('FOREST_MINT')).toBe(true);
  });

  it('rejects unknown theme keys without crashing', () => {
    expect(isThemeKnown('CYBERPUNK_2077')).toBe(false);
    expect(isThemeKnown('UNKNOWN_PALETTE')).toBe(false);
    expect(isThemeKnown(null)).toBe(false);
    expect(isThemeKnown(undefined)).toBe(false);
  });

  it('falls back to DEFAULT theme definition when an unknown key is provided', () => {
    const defaultDef = getThemeDefinition('DEFAULT');
    const fallbackDef = getThemeDefinition('NON_EXISTENT_THEME');

    expect(fallbackDef.key).toBe('DEFAULT');
    expect(fallbackDef).toEqual(defaultDef);
  });

  // shop.md §6.2: every ThemeDefinition declares light and dark; foreground stays fixed; only surfaces change.
  it.each(cases)('%s/%s keeps the mode\'s fixed text and only role tokens', (key, mode) => {
    const tokens = SHOP_THEMES[key].palette[mode];
    expect(tokens.text).toBe(DEFAULT_SURFACE[mode].text);
    expect(tokens.textMuted).toBe(DEFAULT_SURFACE[mode].textMuted);
    expect(Object.keys(tokens).sort()).toEqual(Object.keys(DEFAULT_SURFACE[mode]).sort());
  });

  // shop.md §6.2: automated contrast ≥ 4.5:1 for text and muted text on every surface, every theme × mode.
  it.each(cases)('%s/%s text contrast is at least 4.5:1 on every surface', (key, mode) => {
    const t = SHOP_THEMES[key].palette[mode];
    for (const bg of [t.background, t.surface, t.surfaceMuted, t.headerBg]) {
      expect(contrast(t.text, bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.textMuted, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
