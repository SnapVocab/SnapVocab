import {
  getThemeDefinition,
  isThemeKnown,
  SHOP_THEMES,
} from '../theme/theme-context';

describe('Shop Theme registry and unknown key handling', () => {
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

  it('provides surface tokens without mutating brand and semantic colors', () => {
    const theme = SHOP_THEMES.MIDNIGHT_NEON;
    expect(theme.surfaceTokens).toHaveProperty('background');
    expect(theme.surfaceTokens).toHaveProperty('surface');
    expect(theme.surfaceTokens).toHaveProperty('surfaceMuted');
    expect(theme.surfaceTokens).toHaveProperty('border');
    expect(theme.surfaceTokens).toHaveProperty('headerBg');
    expect(theme.surfaceTokens).toHaveProperty('tabBg');

    // Semantic tokens like primary/danger/coin are not in surfaceTokens
    expect(theme.surfaceTokens).not.toHaveProperty('primary');
    expect(theme.surfaceTokens).not.toHaveProperty('danger');
    expect(theme.surfaceTokens).not.toHaveProperty('coin');
  });
});
