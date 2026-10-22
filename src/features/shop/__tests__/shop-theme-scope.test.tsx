import type { User } from '@/features/auth/use-auth-store';
import { act, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { Text } from 'react-native';
import { useSurface, useSurfaceOverride } from '@/components/ui/surface';
import { store } from '@/features/auth/use-auth-store';
import { SHOP_THEMES, ShopSurface, ShopThemeProvider } from '../theme/theme-context';

function Probe() {
  const t = useSurfaceOverride();
  return (
    <>
      <Text testID="override">{t ? t.background : 'none'}</Text>
      <Text testID="surface">{useSurface().background}</Text>
    </>
  );
}

const read = (id: string) => screen.getByTestId(id).props.children;
function equip(themeKey: string | null) {
  act(() => store.setState({ user: { id: 1, equipped: { themeKey, avatarFrameUrl: null } } as User }));
}

// shop.md §6.4: Home and Profile keep their own look until a theme is equipped; screens outside stay default.
describe('themed screens', () => {
  it('only an equipped theme overrides surfaces, and only inside ShopSurface', () => {
    render(
      <ShopThemeProvider>
        <ShopSurface><Probe /></ShopSurface>
      </ShopThemeProvider>,
    );
    const light = SHOP_THEMES.MIDNIGHT_NEON.palette.light;

    equip(null);
    expect(read('override')).toBe('none');
    expect(read('surface')).toBe(SHOP_THEMES.DEFAULT.palette.light.background);

    equip('MIDNIGHT_NEON');
    expect(read('override')).toBe(light.background);
    expect(read('surface')).toBe(light.background);
  });

  it('outside ShopSurface an equipped theme changes nothing', () => {
    render(<ShopThemeProvider><Probe /></ShopThemeProvider>);
    equip('MIDNIGHT_NEON');
    expect(read('override')).toBe('none');
    expect(read('surface')).toBe(SHOP_THEMES.DEFAULT.palette.light.background);
  });
});
