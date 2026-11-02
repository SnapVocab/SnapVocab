import type { ShopItemDTO } from '../types';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { ThemePreviewModal } from '@/components/shop/item-preview-modal';
import { ShopItemDetailModal } from '@/components/shop/shop-item-detail-modal';
import { ShopItemCard } from '@/components/shop/ShopItemCard';
import i18n from '@/lib/i18n';

// Explicit locale for assertions, independent of the first-install default.
beforeAll(async () => {
  await i18n.changeLanguage('vi');
});

jest.mock('lucide-react-native', () => ({ CheckIcon: () => null, XIcon: () => null, SnowflakeIcon: () => null }));
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
    [{ owned: true, equipped: false }, 'Áp dụng'],
    [{ owned: true, equipped: true }, 'Đang dùng'],
  ])('theme preview footer for %o is "%s"', (state, label) => {
    const onAction = jest.fn();
    render(<ThemePreviewModal item={{ ...theme, ...state }} onClose={jest.fn()} onAction={onAction} />);
    fireEvent.press(screen.getByText(label));
    expect(onAction).toHaveBeenCalledTimes(state.equipped ? 0 : 1);
  });

  it('theme preview renders a sample Shop screen with its scope, and no tab bar', () => {
    render(<ThemePreviewModal item={theme} onClose={jest.fn()} onAction={jest.fn()} />);
    expect(screen.getByText('Thẻ nhân đôi XP')).toBeTruthy();
    expect(screen.getByText('Thưởng nhiệm vụ')).toBeTruthy();
    expect(screen.getByText('Áp dụng cho Cửa hàng, Kho đồ và Ví Coin.')).toBeTruthy();
    expect(screen.queryByText('Trang chủ')).toBeNull();
    expect(screen.getByText(theme.description!)).toBeTruthy();
  });

  it('theme card: both body and buy button open the mandatory preview, never buy directly', () => {
    const onPress = jest.fn();
    const onPreview = jest.fn();
    render(<ShopItemCard item={theme} userCoins={1000} onPress={onPress} onPreview={onPreview} />);
    expect(screen.getByText('Giao diện cửa hàng')).toBeTruthy();
    expect(screen.queryByText('Mua ·')).toBeNull();
    expect(screen.getByText('300')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Mua Đêm Neon với giá 300 Coin' }));
    fireEvent.press(screen.getByText('Đêm Neon'));
    expect(onPreview).toHaveBeenCalledTimes(2);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('booster card buy button goes straight to purchase', () => {
    const booster: ShopItemDTO = { ...theme, type: 'XP_BOOSTER', config: { maxQuantity: 5 } };
    const onPress = jest.fn();
    render(<ShopItemCard item={booster} userCoins={1000} onPress={onPress} onPreview={jest.fn()} />);
    fireEvent.press(screen.getByRole('button', { name: 'Mua XP ×2 với giá 300 Coin' }));
    expect(onPress).toHaveBeenCalledWith(booster);
  });

  it('card body opens details without buying and does not truncate descriptions on the card', () => {
    const booster: ShopItemDTO = { ...theme, type: 'XP_BOOSTER', config: { multiplier: 2, durationMinutes: 15 } };
    const onPress = jest.fn();
    const onPreview = jest.fn();
    render(<ShopItemCard item={booster} userCoins={1000} onPress={onPress} onPreview={onPreview} />);
    expect(screen.queryByText(theme.description!)).toBeNull();
    fireEvent.press(screen.getByText('XP ×2'));
    expect(onPreview).toHaveBeenCalledWith(booster);
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByText('15 phút')).toBeTruthy();
  });

  it.each(['STREAK_FREEZE', 'XP_BOOSTER'] as const)('detail sheet exposes the full description and requires an explicit buy action for %s', (type) => {
    const item: ShopItemDTO = { ...theme, type, config: {}, description: 'Full item details. '.repeat(30) };
    const onBuy = jest.fn();
    render(<ShopItemDetailModal item={item} onClose={jest.fn()} onBuy={onBuy} />);
    expect(screen.getByText(item.description!)).toBeTruthy();
    expect(onBuy).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText('300'));
    expect(onBuy).toHaveBeenCalledWith(item);
  });

  it('maxed booster shows status, not a buy button', () => {
    const booster: ShopItemDTO = { ...theme, type: 'XP_BOOSTER', config: { maxQuantity: 3 }, quantity: 3, blockReason: 'MAX_QUANTITY_REACHED' };
    render(<ShopItemCard item={booster} userCoins={1000} onPress={jest.fn()} />);
    expect(screen.getByText('Đã đạt tối đa')).toBeTruthy();
    expect(screen.getByText('×3/3')).toBeTruthy();
    expect(screen.queryByText('Mua ·')).toBeNull();
  });

  // streak_freeze.md §7: stackable like a booster, bought straight from the card, capped by maxQuantity.
  it('streak freeze card buys directly, shows held units and the cap', () => {
    const freeze: ShopItemDTO = { ...theme, type: 'STREAK_FREEZE', config: { maxQuantity: 2 }, quantity: 1 };
    const onPress = jest.fn();
    const view = render(<ShopItemCard item={freeze} userCoins={1000} onPress={onPress} onPreview={jest.fn()} />);
    expect(screen.getAllByText('Bảo vệ chuỗi học').length).toBeGreaterThan(0);
    expect(screen.getByText('×1/2')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: `Mua Bảo vệ chuỗi học với giá ${freeze.price} Coin` }));
    expect(onPress).toHaveBeenCalledWith(freeze);

    view.rerender(<ShopItemCard item={{ ...freeze, quantity: 2, blockReason: 'MAX_QUANTITY_REACHED' }} userCoins={1000} onPress={onPress} />);
    expect(screen.getByText('Đã đạt tối đa')).toBeTruthy();
  });
});
