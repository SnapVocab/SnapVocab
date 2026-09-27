import type { ShopItemDTO } from '../types';
import { useState } from 'react';
import { generateIdempotencyKey } from '@/features/quiz/utils/idempotency';
import { parseShopError } from '../api';
import {
  useActivateBoosterMutation,
  useEquipMutation,
  usePurchaseMutation,
} from './use-shop-queries';

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
  const [outOfCoinItem, setOutOfCoinItem] = useState<ShopItemDTO | null>(null);
  const [previewThemeItem, setPreviewThemeItem] = useState<ShopItemDTO | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [purchaseIntent, setPurchaseIntent] = useState<{
    item: ShopItemDTO;
    idempotencyKey: string;
  } | null>(null);
  const [isPurchaseSuccess, setIsPurchaseSuccess] = useState(false);

  const purchaseMutation = usePurchaseMutation();
  const equipMutation = useEquipMutation();
  const activateBoosterMutation = useActivateBoosterMutation();

  const handleRefresh = async () => {
    await Promise.all([refetchCatalog(), refetchWallet(), refetchInventory()]);
  };

  const startPurchaseIntent = (item: ShopItemDTO) => {
    const idempotencyKey = generateIdempotencyKey();
    setPurchaseIntent({ item, idempotencyKey });
    setIsPurchaseSuccess(false);
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

    if (item.type === 'XP_BOOSTER' && item.blockReason === 'MAX_QUANTITY_REACHED') {
      return;
    }

    if (item.blockReason === 'INSUFFICIENT_COINS' || coinBalance < item.price) {
      setOutOfCoinItem(item);
      return;
    }

    if (item.type === 'THEME') {
      setPreviewThemeItem(item);
      return;
    }

    startPurchaseIntent(item);
  };

  const handleConfirmPurchase = async () => {
    if (!purchaseIntent || purchaseMutation.isPending) {
      return;
    }

    try {
      await purchaseMutation.mutateAsync({
        itemId: purchaseIntent.item.itemId,
        expectedPrice: purchaseIntent.item.price,
        idempotencyKey: purchaseIntent.idempotencyKey,
      });

      setIsPurchaseSuccess(true);
    }
    catch (err) {
      const parsed = parseShopError(err);

      if (parsed.code === 'PRICE_CHANGED') {
        const newPrice = parsed.details?.currentPrice as number | undefined;
        if (newPrice != null) {
          setPurchaseIntent(prev =>
            prev ? { ...prev, item: { ...prev.item, price: newPrice } } : null,
          );
        }
        setErrorMessage(parsed.message);
        refetchCatalog();
      }
      else if (parsed.code === 'INSUFFICIENT_COINS') {
        const item = purchaseIntent.item;
        setPurchaseIntent(null);
        setOutOfCoinItem(item);
      }
      else if (parsed.code === 'CONCURRENT_MODIFICATION') {
        setErrorMessage(parsed.message);
        await handleRefresh();
      }
      else if (parsed.code === 'ITEM_ALREADY_OWNED' || parsed.code === 'ALREADY_OWNED') {
        setErrorMessage('Bạn đã sở hữu vật phẩm này.');
        setPurchaseIntent(null);
        await handleRefresh();
      }
      else if (parsed.code === 'MAX_QUANTITY_REACHED') {
        setErrorMessage('Đã đạt số lượng sở hữu tối đa.');
        setPurchaseIntent(null);
        await handleRefresh();
      }
      else {
        setErrorMessage(parsed.message);
      }
    }
  };

  const handleClosePurchaseModal = () => {
    if (purchaseMutation.isPending) {
      return;
    }
    setPurchaseIntent(null);
    setIsPurchaseSuccess(false);
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

  const handleActivateNow = (item: ShopItemDTO) => {
    if (item.type === 'XP_BOOSTER' && !hasActiveBooster) {
      const activationKey = generateIdempotencyKey();
      activateBoosterMutation.mutate({
        itemId: item.itemId,
        idempotencyKey: activationKey,
      });
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
    isPurchaseSuccess,
    isPurchasing: purchaseMutation.isPending,
    handleRefresh,
    handleItemPress,
    handleConfirmPurchase,
    handleClosePurchaseModal,
    handleEquipNow,
    handleActivateNow,
    startPurchaseIntent,
  };
}
