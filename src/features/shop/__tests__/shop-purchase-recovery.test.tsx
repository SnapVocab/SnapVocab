import type { ShopItemDTO } from '../types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import * as React from 'react';
import { client } from '@/lib/api';
import { useShopActions } from '../hooks/use-shop-actions';
import { shopKeys } from '../hooks/use-shop-queries';
import { isBoosterLive } from '../utils/booster-timer';

const mockUpdateUser = jest.fn();
jest.mock('@/lib/api', () => ({ client: jest.fn() }));
jest.mock('@/lib/i18n', () => require('./vi-translate'));
jest.mock('@/features/auth/use-auth-store', () => ({ useAuthStore: { getState: () => ({ updateUser: mockUpdateUser }) } }));
jest.mock('@/components/ui', () => ({ showErrorMessage: jest.fn(), showSuccessMessage: jest.fn() }));
jest.mock('../theme/theme-context', () => ({ useShopTheme: () => ({ setEquippedTheme: jest.fn() }) }));
let mockKeySeq = 0;
jest.mock('@/features/quiz/utils/idempotency', () => ({ generateIdempotencyKey: () => `key-${++mockKeySeq}` }));
const request = client as unknown as jest.Mock;

const booster: ShopItemDTO = {
  itemId: 9,
  code: 'xp2',
  type: 'XP_BOOSTER',
  name: 'Thẻ ×2',
  description: null,
  iconUrl: null,
  price: 100,
  availableUntil: null,
  config: { maxQuantity: 5, durationMinutes: 30 },
  owned: true,
  quantity: 1,
  equipped: false,
  canPurchase: true,
  blockReason: null,
};

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  clients.push(queryClient);
  queryClient.setQueryData(['me'], { coin: 500, exp: 10 });
  const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
  const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  const noop = () => Promise.resolve();
  const view = renderHook(() => useShopActions({
    coinBalance: 500,
    hasActiveBooster: false,
    refetchCatalog: noop,
    refetchWallet: noop,
    refetchInventory: noop,
  }), { wrapper });
  return { queryClient, invalidate, view };
}

function sentKeys() {
  return request.mock.calls
    .filter(args => args[0].method === 'POST')
    .map(args => args[0].headers['Idempotency-Key']);
}

const clients: QueryClient[] = [];
afterEach(() => clients.splice(0).forEach(c => c.clear()));

describe('purchase recovery uses the server result and keeps the key of an unknown outcome', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockKeySeq = 0;
  });

  it('timeout → close → reopen retries with the same key; the replay is shown, not a fresh +1', async () => {
    const { queryClient, invalidate, view } = setup();

    act(() => view.result.current.handleItemPress(booster));
    request.mockRejectedValueOnce(new Error('timeout of 10000ms exceeded'));
    await act(() => view.result.current.handleConfirmPurchase());
    expect(view.result.current.errorMessage).toContain('Chưa xác nhận được kết quả mua');
    act(() => view.result.current.handleClosePurchaseModal());

    // Reopen: same key; the server replays the committed purchase (booster since spent → quantity 0).
    act(() => view.result.current.handleItemPress(booster));
    request.mockResolvedValueOnce({ data: { data: { transactionId: 1, itemId: 9, quantity: 0, owned: true, coinBalance: 400, replayed: true } } });
    await act(() => view.result.current.handleConfirmPurchase());

    expect(sentKeys()).toEqual(['key-1', 'key-1']);
    expect(view.result.current.purchaseResult).toMatchObject({ replayed: true, quantity: 0 });
    // Server balance reaches the auth store, the Shop coin cache and the Profile me cache.
    expect(mockUpdateUser).toHaveBeenCalledWith({ coin: 400 });
    expect(queryClient.getQueryData<{ balance: number }>(shopKeys.coinBalance())?.balance).toBe(400);
    expect(queryClient.getQueryData<{ coin: number }>(['me'])?.coin).toBe(400);
    // Every catalog category, not only "all".
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['shop', 'catalog'] });
    // quantity 0 → no "activate now" card built from a stale snapshot + 1.
    act(() => view.result.current.handleActivateNow(booster));
    expect(view.result.current.boosterItem).toBeNull();

    // Resolved: the next, intentional purchase gets a new key.
    act(() => view.result.current.handleClosePurchaseModal());
    act(() => view.result.current.handleItemPress(booster));
    expect(view.result.current.purchaseIntent?.idempotencyKey).toBe('key-2');
    view.unmount();
  });

  it('a definitive 4xx drops the key', async () => {
    const { view } = setup();
    const other = { ...booster, itemId: 10 };
    act(() => view.result.current.handleItemPress(other));
    request.mockRejectedValueOnce({ response: { status: 409, data: { error: 'MAX_QUANTITY_REACHED' } } });
    await act(() => view.result.current.handleConfirmPurchase());
    act(() => view.result.current.handleItemPress(other));
    expect(view.result.current.purchaseIntent?.idempotencyKey).toBe('key-2');
    view.unmount();
  });

  it('a cached activation past its server-time expiry is not live', () => {
    const now = Date.now();
    expect(isBoosterLive({ expiresAt: new Date(now + 60_000).toISOString() }, 0)).toBe(true);
    expect(isBoosterLive({ expiresAt: new Date(now - 1).toISOString() }, 0)).toBe(false);
    // Device clock 2 min behind the server: 1 min left on the device clock is already over.
    expect(isBoosterLive({ expiresAt: new Date(now + 60_000).toISOString() }, 120_000)).toBe(false);
    expect(isBoosterLive(null, 0)).toBe(false);
  });
});
