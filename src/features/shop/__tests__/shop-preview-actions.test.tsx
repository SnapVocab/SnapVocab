import type { ShopItemDTO } from '../types';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { FramePreviewModal } from '@/components/shop/item-preview-modal';
import { ShopItemDetailModal } from '@/components/shop/shop-item-detail-modal';
import { ShopItemCard } from '@/components/shop/ShopItemCard';
import i18n from '@/lib/i18n';

// Explicit locale for assertions, independent of the first-install default.
beforeAll(async () => {
  await i18n.changeLanguage('vi');
});

// Card frame preview flips like the study card: FlipCardContainer needs these (jest-setup's mocks fall short).
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: require('react-native').View },
  useSharedValue: (value: number) => ({ value }),
  useAnimatedStyle: (fn: () => object) => fn(),
  withTiming: (value: number) => value,
  interpolate: (_value: number, _input: number[], output: number[]) => output[0],
  runOnJS: (fn: () => void) => fn,
}));
jest.mock('react-native-gesture-handler', () => {
  const tap: any = new Proxy({}, { get: () => () => tap });
  return { GestureDetector: ({ children }: { children: React.ReactNode }) => children, Gesture: { Tap: () => tap } };
});
jest.mock('@/components/ui/image', () => ({ Image: require('react-native').View }));
jest.mock('lucide-react-native', () => ({ CheckIcon: () => null, XIcon: () => null, SnowflakeIcon: () => null }));
jest.mock('@/components/snapvocab', () => ({
  AvatarFrame: require('react-native').View,
  Coin3D: () => null,
}));
jest.mock('@/components/ui', () => {
  const RN = require('react-native');
  const { DEFAULT_SURFACE } = jest.requireActual('@/components/ui/surface');
  return {
    useColorMode: () => 'light',
    useSurface: () => DEFAULT_SURFACE.light,
    Pressable: RN.Pressable,
    BouncingDots: () => null,
    Button: ({ label, onPress, disabled }: { label: string; onPress?: () => void; disabled?: boolean }) => (
      <RN.Pressable accessibilityRole="button" onPress={onPress} disabled={disabled}><RN.Text>{label}</RN.Text></RN.Pressable>
    ),
  };
});

const frame: ShopItemDTO = {
  itemId: 7,
  code: 'frame_neon',
  type: 'AVATAR_FRAME',
  name: 'Khung Neon',
  description: 'Viền tím đêm',
  iconUrl: null,
  price: 300,
  availableUntil: null,
  config: { frameUrl: null },
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
    [{ owned: true, equipped: false }, 'Trang bị'],
    [{ owned: true, equipped: true }, 'Đang dùng'],
  ])('frame preview footer for %o is "%s"', (state, label) => {
    const onAction = jest.fn();
    render(<FramePreviewModal item={{ ...frame, ...state }} onClose={jest.fn()} onAction={onAction} />);
    fireEvent.press(screen.getByText(label));
    expect(onAction).toHaveBeenCalledTimes(state.equipped ? 0 : 1);
  });

  it.each([
    [{ owned: false, equipped: false }, 'Mua · 300 Coin'],
    [{ owned: true, equipped: false }, 'Trang bị'],
    [{ owned: true, equipped: true }, 'Đang dùng'],
  ])('card frame preview shows a framed sample card; footer for %o is "%s"', (state, label) => {
    const cardFrame: ShopItemDTO = { ...frame, type: 'CARD_FRAME', config: { frameUrl: 'https://cdn/card.png' }, ...state };
    const onAction = jest.fn();
    render(<FramePreviewModal item={cardFrame} onClose={jest.fn()} onAction={onAction} />);
    expect(screen.getByText('Thử khung thẻ')).toBeTruthy();
    fireEvent(screen.getByTestId('card-frame'), 'layout', { nativeEvent: { layout: { width: 300, height: 0, x: 0, y: 0 } } });
    expect(screen.getByTestId('card-frame-front')).toBeTruthy();
    expect(screen.getByText('apple')).toBeTruthy();
    expect(screen.getByText('quả táo')).toBeTruthy();
    fireEvent.press(screen.getByText(label));
    expect(onAction).toHaveBeenCalledTimes(state.equipped ? 0 : 1);
  });

  it('owned card frame card offers Trang bị and goes through the equip path', () => {
    const cardFrame: ShopItemDTO = { ...frame, type: 'CARD_FRAME', owned: true, blockReason: 'ALREADY_OWNED' };
    const onPress = jest.fn();
    render(<ShopItemCard item={cardFrame} userCoins={1000} onPress={onPress} />);
    expect(screen.getByText('Khung thẻ')).toBeTruthy();
    fireEvent.press(screen.getByText('Trang bị'));
    expect(onPress).toHaveBeenCalledWith(cardFrame);
  });

  it('booster card buy button goes straight to purchase', () => {
    const booster: ShopItemDTO = { ...frame, type: 'XP_BOOSTER', config: { maxQuantity: 5 } };
    const onPress = jest.fn();
    render(<ShopItemCard item={booster} userCoins={1000} onPress={onPress} onPreview={jest.fn()} />);
    fireEvent.press(screen.getByRole('button', { name: 'Mua XP ×2 với giá 300 Coin' }));
    expect(onPress).toHaveBeenCalledWith(booster);
  });

  it('card body opens details without buying and does not truncate descriptions on the card', () => {
    const booster: ShopItemDTO = { ...frame, type: 'XP_BOOSTER', config: { multiplier: 2, durationMinutes: 15 } };
    const onPress = jest.fn();
    const onPreview = jest.fn();
    render(<ShopItemCard item={booster} userCoins={1000} onPress={onPress} onPreview={onPreview} />);
    expect(screen.queryByText(frame.description!)).toBeNull();
    fireEvent.press(screen.getByText('XP ×2'));
    expect(onPreview).toHaveBeenCalledWith(booster);
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByText('15 phút')).toBeTruthy();
  });

  it.each(['STREAK_FREEZE', 'XP_BOOSTER'] as const)('detail sheet exposes the full description and requires an explicit buy action for %s', (type) => {
    const item: ShopItemDTO = { ...frame, type, config: {}, description: 'Full item details. '.repeat(30) };
    const onBuy = jest.fn();
    render(<ShopItemDetailModal item={item} onClose={jest.fn()} onBuy={onBuy} />);
    expect(screen.getByText(item.description!)).toBeTruthy();
    expect(onBuy).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText('300'));
    expect(onBuy).toHaveBeenCalledWith(item);
  });

  it('maxed booster shows status, not a buy button', () => {
    const booster: ShopItemDTO = { ...frame, type: 'XP_BOOSTER', config: { maxQuantity: 3 }, quantity: 3, blockReason: 'MAX_QUANTITY_REACHED' };
    render(<ShopItemCard item={booster} userCoins={1000} onPress={jest.fn()} />);
    expect(screen.getByText('Đã đạt tối đa')).toBeTruthy();
    expect(screen.getByText('×3/3')).toBeTruthy();
    expect(screen.queryByText('Mua ·')).toBeNull();
  });

  // streak_freeze.md §7: stackable like a booster, bought straight from the card, capped by maxQuantity.
  it('streak freeze card buys directly, shows held units and the cap', () => {
    const freeze: ShopItemDTO = { ...frame, type: 'STREAK_FREEZE', config: { maxQuantity: 2 }, quantity: 1 };
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
