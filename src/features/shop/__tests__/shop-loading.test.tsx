import type { ShopItemDTO } from '../types';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { RefreshControl } from 'react-native';
import i18n from '@/lib/i18n';
import { useShopCatalog } from '../hooks/use-shop-queries';
import InventoryScreen from '../inventory-screen';
import ShopScreen from '../shop-screen';

const mockRefresh = jest.fn();
const mockInventoryRefresh = jest.fn();
let mockInventoryLoading = false;
let mockCatalog: {
  data: ShopItemDTO[] | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: jest.Mock;
};

jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() }, useSegments: () => ['(app)', '(tabs)', 'shop'] }));
jest.mock('lucide-react-native', () => ({ PackageIcon: () => null, RefreshCwIcon: () => null, ClockIcon: () => null, ZapIcon: () => null }));
jest.mock('@/components/Snapy', () => ({ Snapy: () => null }));
jest.mock('@/components/snapvocab', () => ({ Coin3D: () => null }));
jest.mock('@/components/ui', () => {
  const RN = require('react-native');
  return {
    useSurface: () => require('@/components/ui/surface').DEFAULT_SURFACE.light,
    FocusAwareStatusBar: () => null,
    ScreenHeader: ({ title, right }: { title: string; right: React.ReactNode }) => (
      <RN.View>
        <RN.Text>{title}</RN.Text>
        {right}
      </RN.View>
    ),
  };
});
jest.mock('../theme/theme-context', () => ({ ShopSurface: ({ children }: { children: React.ReactNode }) => children, isThemeKnown: () => true }));
jest.mock('@/components/shop/ShopItemCard', () => ({
  ShopItemCard: ({ item }: { item: ShopItemDTO }) => {
    const Text = require('react-native').Text;
    return <Text>{`item-${item.itemId}`}</Text>;
  },
}));
jest.mock('@/components/shop/booster-activate-modal', () => ({ BoosterActivateModal: () => null }));
jest.mock('@/components/shop/item-preview-modal', () => ({ FramePreviewModal: () => null, ThemePreviewModal: () => null }));
jest.mock('@/components/shop/shop-item-detail-modal', () => ({ ShopItemDetailModal: () => null }));
jest.mock('@/components/shop/OutOfCoinModal', () => ({ OutOfCoinModal: () => null }));
jest.mock('@/components/shop/PurchaseSuccessModal', () => ({ PurchaseSuccessModal: () => null }));
jest.mock('../hooks/use-shop-queries', () => ({
  useShopCatalog: jest.fn(() => mockCatalog),
  useCoinBalance: () => ({ balance: 500, refetch: jest.fn(), isLoading: false, isError: false }),
  useInventory: () => ({ data: mockInventoryLoading ? undefined : { items: [] }, isLoading: mockInventoryLoading, isFetching: true, refetch: mockInventoryRefresh, serverOffset: 0 }),
  useEquipMutation: () => ({ isPending: false }),
  useUnequipMutation: () => ({ isPending: false }),
}));
jest.mock('../hooks/use-shop-actions', () => ({
  useShopActions: () => ({ handleRefresh: mockRefresh, setErrorMessage: jest.fn() }),
}));

beforeAll(async () => {
  await i18n.changeLanguage('en');
});
beforeEach(() => {
  mockRefresh.mockReset();
  mockInventoryRefresh.mockReset();
  mockInventoryLoading = false;
  mockCatalog = { data: undefined, isLoading: true, isFetching: true, isError: false, refetch: jest.fn() };
});

it('uses skeletons for the initial inventory load without a refresh indicator', () => {
  mockInventoryLoading = true;
  render(<InventoryScreen />);
  expect(screen.getByTestId('shop-catalog-skeleton')).toBeTruthy();
  expect(screen.UNSAFE_getByType(RefreshControl).props.refreshing).toBe(false);
});

it('keeps inventory background fetches quiet and clears manual refresh on filtering', async () => {
  let completeRefresh!: () => void;
  mockInventoryRefresh.mockImplementationOnce(() => new Promise<void>((resolve) => {
    completeRefresh = resolve;
  }));
  render(<InventoryScreen />);
  expect(screen.queryByTestId('shop-catalog-skeleton')).toBeNull();
  expect(screen.UNSAFE_getByType(RefreshControl).props.refreshing).toBe(false);
  act(() => {
    void screen.UNSAFE_getByType(RefreshControl).props.onRefresh();
  });
  expect(screen.UNSAFE_getByType(RefreshControl).props.refreshing).toBe(true);
  fireEvent.press(screen.getByRole('tab', { name: 'Boosters' }));
  expect(screen.UNSAFE_getByType(RefreshControl).props.refreshing).toBe(false);
  await act(async () => {
    completeRefresh();
  });
  expect(screen.UNSAFE_getByType(RefreshControl).props.refreshing).toBe(false);
});

it('uses skeletons on entry and on an uncached filter without turning on pull-to-refresh', () => {
  render(<ShopScreen />);
  expect(screen.getByTestId('shop-catalog-skeleton')).toBeTruthy();
  expect(screen.UNSAFE_getByType(RefreshControl).props.refreshing).toBe(false);
  fireEvent.press(screen.getByRole('tab', { name: 'Boosters' }));
  expect(useShopCatalog).toHaveBeenLastCalledWith('XP_BOOSTER');
  expect(screen.getByTestId('shop-catalog-skeleton')).toBeTruthy();
  expect(screen.UNSAFE_getByType(RefreshControl).props.refreshing).toBe(false);
});

it('retains loaded cards during background fetches without a refresh indicator', () => {
  mockCatalog = {
    ...mockCatalog,
    isLoading: false,
    data: [{ itemId: 1, type: 'XP_BOOSTER', config: { multiplier: 2 }, name: 'Booster' } as ShopItemDTO],
  };
  render(<ShopScreen />);
  expect(screen.getByText('item-1')).toBeTruthy();
  expect(screen.queryByTestId('shop-catalog-skeleton')).toBeNull();
  expect(screen.UNSAFE_getByType(RefreshControl).props.refreshing).toBe(false);
});

it('shows the refresh indicator only for a user gesture and stops it on completion', async () => {
  let completeRefresh!: () => void;
  mockRefresh.mockImplementationOnce(() => new Promise<void>((resolve) => {
    completeRefresh = resolve;
  }));
  render(<ShopScreen />);
  act(() => {
    void screen.UNSAFE_getByType(RefreshControl).props.onRefresh();
  });
  expect(screen.UNSAFE_getByType(RefreshControl).props.refreshing).toBe(true);
  await act(async () => {
    completeRefresh();
  });
  expect(screen.UNSAFE_getByType(RefreshControl).props.refreshing).toBe(false);
});

it('orders boosters by duration even in the All catalog', () => {
  mockCatalog = {
    ...mockCatalog,
    isLoading: false,
    data: [30, 15, 60].map((durationMinutes, index) => ({
      itemId: index + 1,
      type: 'XP_BOOSTER',
      name: 'Booster',
      config: { multiplier: 2, durationMinutes },
    } as ShopItemDTO)),
  };
  render(<ShopScreen />);
  expect(screen.getAllByText(/^item-/).map(node => node.props.children)).toEqual(['item-2', 'item-1', 'item-3']);
});
