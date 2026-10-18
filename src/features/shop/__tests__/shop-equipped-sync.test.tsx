import type { User } from '@/features/auth/use-auth-store';
import { act, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { Text } from 'react-native';
import { store } from '@/features/auth/use-auth-store';
import { ShopThemeProvider, useShopTheme } from '../theme/theme-context';

function Probe() {
  return <Text testID="theme">{useShopTheme().themeKey}</Text>;
}

const user = (id: number, equipped?: User['equipped']) => ({ id, equipped }) as User;
const theme = () => screen.getByTestId('theme').props.children;

describe('the equipped theme follows the stored user (GET /api/users/me, shop.md §10.1)', () => {
  it('applies the server theme, keeps it across partial updates, resets on account change', () => {
    render(<ShopThemeProvider><Probe /></ShopThemeProvider>);

    act(() => store.setState({ user: user(1) }));
    expect(theme()).toBe('DEFAULT');

    act(() => store.setState({ user: user(1, { themeKey: 'MIDNIGHT_NEON', avatarFrameUrl: null }) }));
    expect(theme()).toBe('MIDNIGHT_NEON');

    // A coin sync does not touch equipment.
    act(() => store.getState().updateUser({ coin: 5 }));
    expect(theme()).toBe('MIDNIGHT_NEON');

    // Unequipped on another device.
    act(() => store.setState({ user: user(1, { themeKey: null, avatarFrameUrl: null }) }));
    expect(theme()).toBe('DEFAULT');

    // A theme this app version does not know falls back to DEFAULT (shop.md §6.3).
    act(() => store.setState({ user: user(1, { themeKey: 'FUTURE_THEME', avatarFrameUrl: null }) }));
    expect(theme()).toBe('DEFAULT');

    act(() => store.setState({ user: user(1, { themeKey: 'FOREST_MINT', avatarFrameUrl: null }) }));
    act(() => store.setState({ user: user(2) }));
    expect(theme()).toBe('DEFAULT');
  });
});
