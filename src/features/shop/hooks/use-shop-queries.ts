import type { QueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type {
  ActivationResultDTO,
  EquipmentDTO,
  EquipmentSlot,
  InventoryDTO,
  PurchaseResultDTO,
  ShopItemDTO,
  ShopItemType,
  WalletDTO,
} from '../types';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { showErrorMessage, showSuccessMessage } from '@/components/ui';
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
  /** Prefix of every catalog key (all + each category): invalidate with this. */
  catalogs: () => ['shop', 'catalog'] as const,
  inventory: () => ['shop', 'inventory'] as const,
  wallet: (cursor?: number | null, size?: number) => ['shop', 'wallet', cursor ?? 'first', size ?? 20] as const,
  infiniteWallet: (size?: number) => ['shop', 'wallet', 'infinite', size ?? 20] as const,
  coinBalance: () => ['shop', 'coinBalance'] as const,
};

/**
 * The server balance is the only truth: mirror it everywhere Coin is shown
 * (auth store → Home, coin cache → Shop/Wallet, me cache → Profile). Never add/subtract locally.
 */
function syncCoinBalance(queryClient: QueryClient, balance: number) {
  useAuthStore.getState().updateUser({ coin: balance });
  queryClient.setQueryData<WalletDTO>(shopKeys.coinBalance(), old =>
    old ? { ...old, balance } : { balance, transactions: [], nextCursor: null });
  queryClient.setQueryData<{ coin?: number }>(['me'], old => old && { ...old, coin: balance });
}

/**
 * Hook to fetch shop catalog with optional category filtering
 */
export function useShopCatalog(type?: ShopItemType) {
  return useQuery<ShopItemDTO[], AxiosError>({
    queryKey: shopKeys.catalog(type),
    queryFn: () => getShopItems(type),
    // Read-only, so safe to refresh on resume (price, sale window, signed icon URLs go stale).
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch user inventory, equipment, active booster and server time.
 * The receive time travels with the cached data, so every observer derives the same server offset.
 */
export function useInventory() {
  const { setEquippedTheme } = useShopTheme();

  const query = useQuery<InventoryDTO & { receivedAt: number }, AxiosError>({
    queryKey: shopKeys.inventory(),
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const data = await getInventory();

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

      return { ...data, receivedAt: Date.now() };
    },
  });

  return {
    ...query,
    serverOffset: query.data ? calculateServerOffset(query.data.serverNow, query.data.receivedAt) : 0,
  };
}

/**
 * Hook to fetch wallet balance and initial transactions
 */
export function useWallet(cursor?: number | null, size: number = 20) {
  const queryClient = useQueryClient();
  return useQuery<WalletDTO, AxiosError>({
    queryKey: shopKeys.wallet(cursor, size),
    queryFn: async () => {
      const data = await getWallet(cursor, size);
      syncCoinBalance(queryClient, data.balance);
      return data;
    },
  });
}

/**
 * Infinite query for wallet transactions history
 */
export function useInfiniteWallet(pageSize: number = 20) {
  const queryClient = useQueryClient();
  return useInfiniteQuery<WalletDTO, AxiosError>({
    queryKey: shopKeys.infiniteWallet(pageSize),
    queryFn: async ({ pageParam }) => {
      const data = await getWallet(pageParam as number | null, pageSize);
      syncCoinBalance(queryClient, data.balance);
      return data;
    },
    initialPageParam: null as number | null,
    getNextPageParam: lastPage => (lastPage.nextCursor != null ? lastPage.nextCursor : undefined),
  });
}

/**
 * Coin balance for Shop/Wallet. Every response carrying a balance goes through syncCoinBalance,
 * so this cache, the auth store and the me cache agree.
 */
export function useCoinBalance() {
  const user = useAuthStore(s => s.user);
  const queryClient = useQueryClient();

  const query = useQuery<WalletDTO, AxiosError>({
    queryKey: shopKeys.coinBalance(),
    queryFn: async () => {
      const data = await getWallet(null, 1);
      syncCoinBalance(queryClient, data.balance);
      return data;
    },
    // Stale time 10s to minimize unnecessary requests while maintaining freshness
    staleTime: 10000,
    refetchOnWindowFocus: true,
  });

  return {
    balance: query.data?.balance ?? user?.coin ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
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
      void queryClient.invalidateQueries({ queryKey: ['daily-missions'] });
      syncCoinBalance(queryClient, data.coinBalance);
      queryClient.invalidateQueries({ queryKey: shopKeys.catalogs() });
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
  const { t } = useTranslation();

  return useMutation<
    EquipmentDTO,
    unknown,
    { slot: EquipmentSlot; itemId: number }
  >({
    mutationFn: ({ slot, itemId }) => equipItem(slot, itemId),
    onSuccess: (data) => {
      if (data.slot === 'THEME') {
        const themeKey = data.item?.config?.themeKey as string;
        setEquippedTheme(themeKey || 'DEFAULT');
      }
      showSuccessMessage(data.slot === 'THEME' ? t('shopUi.toastThemeEquipped') : t('shopUi.toastFrameEquipped'));
      queryClient.invalidateQueries({ queryKey: shopKeys.inventory() });
      queryClient.invalidateQueries({ queryKey: shopKeys.catalogs() });
    },
    onError: error => onItemActionError(queryClient, error, t),
  });
}

/**
 * Unequip Item Mutation (THEME or AVATAR_FRAME)
 */
export function useUnequipMutation() {
  const queryClient = useQueryClient();
  const { setEquippedTheme } = useShopTheme();
  const { t } = useTranslation();

  return useMutation<
    EquipmentDTO,
    unknown,
    { slot: EquipmentSlot }
  >({
    mutationFn: ({ slot }) => unequipItem(slot),
    onSuccess: (data) => {
      if (data.slot === 'THEME') {
        setEquippedTheme('DEFAULT');
      }
      showSuccessMessage(data.slot === 'THEME' ? t('shopUi.toastThemeReset') : t('shopUi.toastFrameRemoved'));
      queryClient.invalidateQueries({ queryKey: shopKeys.inventory() });
      queryClient.invalidateQueries({ queryKey: shopKeys.catalogs() });
    },
    onError: error => onItemActionError(queryClient, error, t),
  });
}

/**
 * Activate XP Booster Mutation
 */
export function useActivateBoosterMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<
    ActivationResultDTO,
    unknown,
    { itemId: number; idempotencyKey: string }
  >({
    mutationFn: ({ itemId, idempotencyKey }) =>
      activateItem(itemId, idempotencyKey),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['daily-missions'] });
      queryClient.invalidateQueries({ queryKey: shopKeys.inventory() });
      // Spending a card changes quantity, hence the Booster's max-quantity block in the catalog.
      queryClient.invalidateQueries({ queryKey: shopKeys.catalogs() });
    },
    onError: error => onItemActionError(queryClient, error, t),
  });
}

/** Equip / unequip / activate rejected: tell the user why, then resync since local state was stale. */
function onItemActionError(queryClient: QueryClient, error: unknown, t: (key: string, options?: Record<string, unknown>) => string) {
  const parsed = parseShopError(error);
  showErrorMessage(t(`shopUi.errors.${parsed.code}` as any, { defaultValue: t('shopUi.errors.UNKNOWN_ERROR') }));
  queryClient.invalidateQueries({ queryKey: shopKeys.inventory() });
  queryClient.invalidateQueries({ queryKey: shopKeys.catalogs() });
}
