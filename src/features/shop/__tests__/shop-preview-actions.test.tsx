import type { ShopItemDTO } from '../types';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { ThemePreviewModal } from '@/components/shop/item-preview-modal';
import { ShopItemCard } from '@/components/shop/ShopItemCard';

jest.mock('lucide-react-native', () => ({ CheckIcon: () => null, XIcon: () => null }));
jest.mock('@/components/snapvocab', () => ({
  AvatarFrame: require('react-native').View,
  Coin3D: () => null,
  getAvatarFrame: () => undefined,
}));
jest.mock('@/components/ui', () => {
  const RN = require('react-native');
  const { DEFAULT_SURFACE } = jest.requireActual('@/components/ui/surface');
  return {
    useColorMode: () => 'light',
    useSurface: () => DEFAULT_SURFACE.light,
    Button: ({ label, onPress, disabled }: { label: string; onPress?: () => void; disabled?: boolean }) => (
      <RN.Pressable accessibilityRole="button" onPress={onPress} disabled={disabled}><RN.Text>{label}</RN.Text></RN.Pressable>
    ),
  };
});

const theme: ShopItemDTO = {
  itemId: 7,
  code: 'theme_neon',
  type: 'THEME',
  name: 'Đêm Neon',
  description: 'Sắc tím đêm',
  iconUrl: null,
  price: 300,
  availableUntil: null,
  config: { themeKey: 'MIDNIGHT_NEON' },
  owned: false,
  quantity: 0,
  equipped: false,
  canPurchase: true,
  blockReason: null,
};

describe('shop previews and cards act on the item\'s real state', () => {
  afterEach(cleanup);

  it.each([
    [{ owned: false, equipped: false }, 'Mua · 300 Coin'],
    [{ owned: true, equipped: false }, 'Áp dụng giao diện'],
    [{ owned: true, equipped: true }, 'Đang dùng'],
  ])('theme preview footer for %o is "%s"', (state, label) => {
    const onAction = jest.fn();
    render(<ThemePreviewModal item={{ ...theme, ...state }} onClose={jest.fn()} onAction={onAction} />);
    fireEvent.press(screen.getByText(label));
    expect(onAction).toHaveBeenCalledTimes(state.equipped ? 0 : 1);
  });

  it('theme preview renders a sample Shop screen with its scope, and no tab bar', () => {
    render(<ThemePreviewModal item={theme} onClose={jest.fn()} onAction={jest.fn()} />);
    expect(screen.getByText('Thẻ ×2 Kinh nghiệm')).toBeTruthy();
    expect(screen.getByText('Phần thưởng nhiệm vụ')).toBeTruthy();
    expect(screen.getByText('Áp dụng cho Cửa hàng, Kho đồ và Ví Coin.')).toBeTruthy();
    expect(screen.queryByText('Trang chủ')).toBeNull();
  });

  it('theme card: both body and buy button open the mandatory preview, never buy directly', () => {
    const onPress = jest.fn();
    const onPreview = jest.fn();
    render(<ShopItemCard item={theme} userCoins={1000} onPress={onPress} onPreview={onPreview} />);
    expect(screen.getByText('Giao diện cửa hàng')).toBeTruthy();
    fireEvent.press(screen.getByText('Mua ·'));
    fireEvent.press(screen.getByText('Đêm Neon'));
    expect(onPreview).toHaveBeenCalledTimes(2);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('booster card buy button goes straight to purchase', () => {
    const booster: ShopItemDTO = { ...theme, type: 'XP_BOOSTER', config: { maxQuantity: 5 } };
    const onPress = jest.fn();
    render(<ShopItemCard item={booster} userCoins={1000} onPress={onPress} onPreview={jest.fn()} />);
    fireEvent.press(screen.getByText('Mua ·'));
    expect(onPress).toHaveBeenCalledWith(booster);
  });

  it('maxed booster shows status, not a buy button', () => {
    const booster: ShopItemDTO = { ...theme, type: 'XP_BOOSTER', config: { maxQuantity: 3 }, quantity: 3, blockReason: 'MAX_QUANTITY_REACHED' };
    render(<ShopItemCard item={booster} userCoins={1000} onPress={jest.fn()} />);
    expect(screen.getByText('Đã đạt tối đa')).toBeTruthy();
    expect(screen.getByText('×3/3')).toBeTruthy();
    expect(screen.queryByText('Mua ·')).toBeNull();
  });
});
