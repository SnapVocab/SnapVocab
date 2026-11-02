import type { PurchaseResultDTO, ShopItemDTO } from '../types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generateIdempotencyKey } from '@/features/quiz/utils/idempotency';
import { translate } from '@/lib/i18n';
import { isOutcomeUnknown, parseShopError } from '../api';
import { isStackable } from '../types';
import {
  useEquipMutation,
  usePurchaseMutation,
} from './use-shop-queries';

/**
 * Keys of purchases whose outcome is unknown (timeout / no response / 5xx), by item.
 * Module scope so closing the modal or leaving the Shop does not drop them: reopening the same
 * item retries with the same key, which replays a committed purchase instead of buying again.
 * Cleared on a definitive answer (2xx or 4xx). Lost on app restart; the wallet/inventory refetch covers that.
 */
const unresolvedPurchaseKeys = new Map<number, string>();

type UseShopActionsProps = {
  coinBalance: number;
  hasActiveBooster: boolean;
  refetchCatalog: () => Promise<unknown>;
  refetchWallet: () => Promise<unknown>;
  refetchInventory: () => Promise<unknown>;
};

export function useShopActions({
  coinBalance,
  hasActiveBooster,
  refetchCatalog,
  refetchWallet,
  refetchInventory,
}: UseShopActionsProps) {
  const { t } = useTranslation();
  const [outOfCoinItem, setOutOfCoinItem] = useState<ShopItemDTO | null>(null);
  const [previewThemeItem, setPreviewThemeItem] = useState<ShopItemDTO | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [boosterItem, setBoosterItem] = useState<ShopItemDTO | null>(null);

  const [purchaseIntent, setPurchaseIntent] = useState<{
    item: ShopItemDTO;
    idempotencyKey: string;
  } | null>(null);
  // The server's answer, not a flag: quantity/owned/replayed describe the account now.
  const [purchaseResult, setPurchaseResult] = useState<PurchaseResultDTO | null>(null);

  const purchaseMutation = usePurchaseMutation();
  const equipMutation = useEquipMutation();

  const handleRefresh = async () => {
    await Promise.all([refetchCatalog(), refetchWallet(), refetchInventory()]);
  };

  const startPurchaseIntent = (item: ShopItemDTO) => {
    const idempotencyKey = unresolvedPurchaseKeys.get(item.itemId) ?? generateIdempotencyKey();
    setPurchaseIntent({ item, idempotencyKey });
    setPurchaseResult(null);
    setErrorMessage(unresolvedPurchaseKeys.has(item.itemId)
      ? t('shopUi.purchaseOutcomeUnknown')
      : null);
  };

  const handleItemPress = (item: ShopItemDTO) => {
    setErrorMessage(null);

    if (item.equipped) {
      return;
    }

    if ((item.type === 'THEME' || item.type === 'AVATAR_FRAME') && item.owned) {
      equipMutation.mutate({
        slot: item.type,
        itemId: item.itemId,
      });
      return;
    }

    if (isStackable(item.type) && item.blockReason === 'MAX_QUANTITY_REACHED') {
      return;
    }

    // An unresolved purchase must be checked with its key, even if the balance now looks short.
    if (!unresolvedPurchaseKeys.has(item.itemId)
      && (item.blockReason === 'INSUFFICIENT_COINS' || coinBalance < item.price)) {
      setOutOfCoinItem(item);
      return;
    }

    startPurchaseIntent(item);
  };

  const handleConfirmPurchase = async () => {
    if (!purchaseIntent || purchaseMutation.isPending) {
      return;
    }
    const { item, idempotencyKey } = purchaseIntent;

    try {
      const result = await purchaseMutation.mutateAsync({
        itemId: item.itemId,
        expectedPrice: item.price,
        idempotencyKey,
      });
      unresolvedPurchaseKeys.delete(item.itemId);
      setErrorMessage(null);
      setPurchaseResult(result);
    }
    catch (err) {
      const parsed = parseShopError(err);

      if (isOutcomeUnknown(parsed)) {
        unresolvedPurchaseKeys.set(item.itemId, idempotencyKey);
        setErrorMessage(t('shopUi.purchaseOutcomeUnknown'));
        void handleRefresh().catch(() => {});
        return;
      }
      unresolvedPurchaseKeys.delete(item.itemId);

      if (parsed.code === 'PRICE_CHANGED') {
        const newPrice = parsed.details?.currentPrice as number | undefined;
        if (newPrice != null) {
          setPurchaseIntent(prev =>
            prev ? { ...prev, item: { ...prev.item, price: newPrice } } : null,
          );
        }
        setErrorMessage(localizedError(parsed.code, parsed.details));
        refetchCatalog();
      }
      else if (parsed.code === 'INSUFFICIENT_COINS') {
        setPurchaseIntent(null);
        setOutOfCoinItem(item);
        // The local balance said enough; show the server's instead.
        void refetchWallet();
      }
      else if (parsed.code === 'CONCURRENT_MODIFICATION') {
        setErrorMessage(localizedError(parsed.code, parsed.details));
        await handleRefresh();
      }
      else if (parsed.code === 'ITEM_ALREADY_OWNED') {
        setErrorMessage(localizedError(parsed.code, parsed.details));
        setPurchaseIntent(null);
        await handleRefresh();
      }
      else if (parsed.code === 'MAX_QUANTITY_REACHED') {
        setErrorMessage(localizedError(parsed.code, parsed.details));
        setPurchaseIntent(null);
        await handleRefresh();
      }
      else {
        setErrorMessage(localizedError(parsed.code, parsed.details));
      }
    }
  };

  const handleClosePurchaseModal = () => {
    if (purchaseMutation.isPending) {
      return;
    }
    setPurchaseIntent(null);
    setPurchaseResult(null);
    setErrorMessage(null);
  };

  const handleEquipNow = (item: ShopItemDTO) => {
    if (item.type === 'THEME' || item.type === 'AVATAR_FRAME') {
      equipMutation.mutate({
        slot: item.type,
        itemId: item.itemId,
      });
    }
  };

  // Opens the activation confirm with the quantity the server reported after the purchase.
  const handleActivateNow = (item: ShopItemDTO) => {
    if (item.type === 'XP_BOOSTER' && !hasActiveBooster && purchaseResult && purchaseResult.quantity > 0) {
      setBoosterItem({ ...item, quantity: purchaseResult.quantity });
    }
  };

  return {
    outOfCoinItem,
    setOutOfCoinItem,
    previewThemeItem,
    setPreviewThemeItem,
    errorMessage,
    setErrorMessage,
    purchaseIntent,
    purchaseResult,
    isPurchasing: purchaseMutation.isPending,
    handleRefresh,
    handleItemPress,
    handleConfirmPurchase,
    handleClosePurchaseModal,
    handleEquipNow,
    handleActivateNow,
    boosterItem,
    setBoosterItem,
    startPurchaseIntent,
  };

  function localizedError(code: string, details?: Record<string, unknown>) {
    const price = details?.currentPrice;
    return t(`shopUi.errors.${code}` as any, {
      price: price == null ? '' : ` (${String(price)} Coin)`,
      defaultValue: t('shopUi.errors.UNKNOWN_ERROR'),
    });
  }
}
