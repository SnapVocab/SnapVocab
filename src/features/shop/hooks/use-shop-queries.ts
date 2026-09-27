import type { QueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type {
  ActivationResultDTO,
  EquipmentDTO,
  InventoryDTO,
  PurchaseResultDTO,
  ShopItemDTO,
  ShopItemType,
  WalletDTO,
} from '../types';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { showErrorMessage } from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';
import {
  activateItem,
  equipItem,
  getInventory,
  getShopItems,
  getWallet,
  parseShopError,
  purchaseShopItem,
  unequipItem,
} from '../api';
import { useShopTheme } from '../theme/theme-context';
import { calculateServerOffset } from '../utils/booster-timer';

export const shopKeys = {
  all: ['shop'] as const,
  catalog: (type?: ShopItemType) => ['shop', 'catalog', type ?? 'all'] as const,
  inventory: () => ['shop', 'inventory'] as const,
  wallet: (cursor?: number | null, size?: number) => ['shop', 'wallet', cursor ?? 'first', size ?? 20] as const,
  infiniteWallet: (size?: number) => ['shop', 'wallet', 'infinite', size ?? 20] as const,
  coinBalance: () => ['shop', 'coinBalance'] as const,
};

/**
 * Hook to fetch shop catalog with optional category filtering
 */
export function useShopCatalog(type?: ShopItemType) {
  return useQuery<ShopItemDTO[], AxiosError>({
    queryKey: shopKeys.catalog(type),
    queryFn: () => getShopItems(type),
  });
}

/**
 * Hook to fetch user inventory, equipment, active booster and server time.
 * Calculates serverOffset accurately at the time response is received.
 */
export function useInventory() {
  const { setEquippedTheme } = useShopTheme();
  const serverOffsetRef = useRef<number>(0);

  const query = useQuery<InventoryDTO, AxiosError>({
    queryKey: shopKeys.inventory(),
    queryFn: async () => {
      const deviceNow = Date.now();
      const data = await getInventory();
      serverOffsetRef.current = calculateServerOffset(data.serverNow, deviceNow);

      // Auto-sync equipped theme with ThemeProvider
      const equippedTheme = data.items.find(
        item => item.type === 'THEME' && item.equipped,
      );
      if (equippedTheme?.config?.themeKey) {
        setEquippedTheme(equippedTheme.config.themeKey as string);
      }
      else {
        setEquippedTheme('DEFAULT');
      }

      return data;
    },
  });

  return {
    ...query,
    serverOffset: serverOffsetRef.current,
  };
}

/**
 * Hook to fetch wallet balance and initial transactions
 */
export function useWallet(cursor?: number | null, size: number = 20) {
  return useQuery<WalletDTO, AxiosError>({
    queryKey: shopKeys.wallet(cursor, size),
    queryFn: async () => {
      const data = await getWallet(cursor, size);
      // Synchronize with auth user coin
      useAuthStore.getState().updateUser({ coin: data.balance });
      return data;
    },
  });
}

/**
 * Infinite query for wallet transactions history
 */
export function useInfiniteWallet(pageSize: number = 20) {
  return useInfiniteQuery<WalletDTO, AxiosError>({
    queryKey: shopKeys.infiniteWallet(pageSize),
    queryFn: async ({ pageParam }) => {
      const data = await getWallet(pageParam as number | null, pageSize);
      useAuthStore.getState().updateUser({ coin: data.balance });
      return data;
    },
    initialPageParam: null as number | null,
    getNextPageParam: lastPage => (lastPage.nextCursor != null ? lastPage.nextCursor : undefined),
  });
}

/**
 * Unified coin balance hook - single source of truth across Shop, Wallet, Header
 */
export function useCoinBalance() {
  const user = useAuthStore(s => s.user);
  const queryClient = useQueryClient();

  const query = useQuery<WalletDTO, AxiosError>({
    queryKey: shopKeys.coinBalance(),
    queryFn: async () => {
      const data = await getWallet(null, 1);
      useAuthStore.getState().updateUser({ coin: data.balance });
      return data;
    },
    // Stale time 10s to minimize unnecessary requests while maintaining freshness
    staleTime: 10000,
  });

  const balance = query.data?.balance ?? user?.coin ?? 0;

  const setLocalCoin = (newCoin: number) => {
    useAuthStore.getState().updateUser({ coin: newCoin });
    queryClient.setQueryData(shopKeys.coinBalance(), (old: WalletDTO | undefined) => {
      if (!old)
        return { balance: newCoin, transactions: [], nextCursor: null };
      return { ...old, balance: newCoin };
    });
  };

  return {
    balance,
    isLoading: query.isLoading,
    refetch: query.refetch,
    setLocalCoin,
  };
}

/**
 * Purchase Shop Item Mutation with correct cache invalidation and coin sync
 */
export function usePurchaseMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    PurchaseResultDTO,
    unknown,
    { itemId: number; expectedPrice: number; idempotencyKey: string }
  >({
    mutationFn: ({ itemId, expectedPrice, idempotencyKey }) =>
      purchaseShopItem(itemId, expectedPrice, idempotencyKey),
    onSuccess: (data) => {
      // 1. Synchronize coin balance everywhere immediately
      useAuthStore.getState().updateUser({ coin: data.coinBalance });
      queryClient.setQueryData(shopKeys.coinBalance(), (old: WalletDTO | undefined) => {
        if (!old)
          return { balance: data.coinBalance, transactions: [], nextCursor: null };
        return { ...old, balance: data.coinBalance };
      });

      // 2. Invalidate catalog, inventory, and wallet queries
      queryClient.invalidateQueries({ queryKey: shopKeys.catalog() });
      queryClient.invalidateQueries({ queryKey: shopKeys.inventory() });
      queryClient.invalidateQueries({ queryKey: ['shop', 'wallet'] });
      queryClient.invalidateQueries({ queryKey: shopKeys.coinBalance() });
    },
  });
}

/**
 * Equip Item Mutation (THEME or AVATAR_FRAME)
 */
export function useEquipMutation() {
  const queryClient = useQueryClient();
  const { setEquippedTheme } = useShopTheme();

  return useMutation<
    EquipmentDTO,
    unknown,
    { slot: 'THEME' | 'AVATAR_FRAME'; itemId: number }
  >({
    mutationFn: ({ slot, itemId }) => equipItem(slot, itemId),
    onSuccess: (data) => {
      if (data.slot === 'THEME') {
        const themeKey = data.item?.config?.themeKey as string;
        setEquippedTheme(themeKey || 'DEFAULT');
      }
      queryClient.invalidateQueries({ queryKey: shopKeys.inventory() });
      queryClient.invalidateQueries({ queryKey: shopKeys.catalog() });
    },
    onError: error => onItemActionError(queryClient, error),
  });
}

/**
 * Unequip Item Mutation (THEME or AVATAR_FRAME)
 */
export function useUnequipMutation() {
  const queryClient = useQueryClient();
  const { setEquippedTheme } = useShopTheme();

  return useMutation<
    EquipmentDTO,
    unknown,
    { slot: 'THEME' | 'AVATAR_FRAME' }
  >({
    mutationFn: ({ slot }) => unequipItem(slot),
    onSuccess: (data) => {
      if (data.slot === 'THEME') {
        setEquippedTheme('DEFAULT');
      }
      queryClient.invalidateQueries({ queryKey: shopKeys.inventory() });
      queryClient.invalidateQueries({ queryKey: shopKeys.catalog() });
    },
    onError: error => onItemActionError(queryClient, error),
  });
}

/**
 * Activate XP Booster Mutation
 */
export function useActivateBoosterMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    ActivationResultDTO,
    unknown,
    { itemId: number; idempotencyKey: string }
  >({
    mutationFn: ({ itemId, idempotencyKey }) =>
      activateItem(itemId, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shopKeys.inventory() });
    },
    onError: error => onItemActionError(queryClient, error),
  });
}

/** Equip / unequip / activate rejected: tell the user why, then resync since local state was stale. */
function onItemActionError(queryClient: QueryClient, error: unknown) {
  showErrorMessage(parseShopError(error).message);
  queryClient.invalidateQueries({ queryKey: shopKeys.inventory() });
  queryClient.invalidateQueries({ queryKey: shopKeys.catalog() });
}
