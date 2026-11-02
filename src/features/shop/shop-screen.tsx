import type { ShopItemDTO } from './types';
import type { ShopCategory } from '@/components/shop/shop-category-tabs';
import { router, useSegments } from 'expo-router';
import { PackageIcon, RefreshCwIcon } from 'lucide-react-native';
import * as React from 'react';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BoosterActivateModal } from '@/components/shop/booster-activate-modal';
import { FramePreviewModal } from '@/components/shop/item-preview-modal';
import { OutOfCoinModal } from '@/components/shop/OutOfCoinModal';
import { PurchaseSuccessModal } from '@/components/shop/PurchaseSuccessModal';
import { ShopCategoryTabs } from '@/components/shop/shop-category-tabs';
import { ShopItemDetailModal } from '@/components/shop/shop-item-detail-modal';
import { ShopItemCard } from '@/components/shop/ShopItemCard';
import { Coin3D } from '@/components/snapvocab';
import { Snapy } from '@/components/Snapy';
import { FocusAwareStatusBar, ScreenHeader, useSurface } from '@/components/ui';
import { ShopCatalogSkeleton } from './components/shop-catalog-skeleton';
import { useShopActions } from './hooks/use-shop-actions';
import {
  useCoinBalance,
  useInventory,
  useShopCatalog,
} from './hooks/use-shop-queries';
import { isKnownItemType } from './types';
import { isBoosterLive } from './utils/booster-timer';
import { shopItemTitle } from './utils/item-presentation';

const ITEM_ORDER = { XP_BOOSTER: 0, STREAK_FREEZE: 1, AVATAR_FRAME: 2 };

export default function ShopScreen() {
  const s = useSurface();
  const isShopTab = (useSegments() as string[]).includes('(tabs)');
  const { t, i18n } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<ShopCategory>('all');
  const [previewFrameItem, setPreviewFrameItem] = useState<ShopItemDTO | null>(null);
  const [detailItem, setDetailItem] = useState<ShopItemDTO | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const catalogRef = useRef<ScrollView>(null);
  const refreshEpoch = useRef(0);

  // Queries
  const {
    data: catalogItems,
    isLoading: isLoadingCatalog,
    isError: isCatalogError,
    refetch: refetchCatalog,
  } = useShopCatalog(activeCategory === 'all' ? undefined : activeCategory);

  const { balance: coinBalance, refetch: refetchWallet, isLoading: isWalletLoading, isError: isWalletError } = useCoinBalance();
  const purchaseDisabled = isWalletLoading || isWalletError;
  const { data: inventoryData, refetch: refetchInventory, serverOffset } = useInventory();

  const hasActiveBooster = isBoosterLive(inventoryData?.activeBooster, serverOffset);

  // Filter catalog items according to spec (hide item types this app version does not know)
  const filteredItems = useMemo(() => {
    if (!catalogItems) {
      return [];
    }
    const visible = catalogItems.filter((item) => {
      if (!isKnownItemType(item.type)) {
        return false;
      }
      return true;
    }).map(item => ({ ...item, name: shopItemTitle(item, t) }));
    visible.sort((a, b) => ITEM_ORDER[a.type] - ITEM_ORDER[b.type]
      || (a.type === 'XP_BOOSTER' && b.type === 'XP_BOOSTER'
        ? (a.config?.durationMinutes ?? 30) - (b.config?.durationMinutes ?? 30) : 0));
    return visible;
  }, [catalogItems, t]);

  // Actions & Mutations Hook
  const {
    outOfCoinItem,
    setOutOfCoinItem,
    errorMessage,
    setErrorMessage,
    purchaseIntent,
    purchaseResult,
    isPurchasing,
    handleRefresh,
    handleItemPress,
    handleConfirmPurchase,
    handleClosePurchaseModal,
    handleEquipNow,
    handleActivateNow,
    boosterItem,
    setBoosterItem,
  } = useShopActions({
    coinBalance,
    hasActiveBooster,
    refetchCatalog,
    refetchWallet,
    refetchInventory,
  });

  const refreshFromGesture = async () => {
    if (isRefreshing)
      return;
    setIsRefreshing(true);
    const epoch = ++refreshEpoch.current;
    try {
      await handleRefresh();
    }
    catch {
      setErrorMessage(t('shopUi.refreshError'));
    }
    finally {
      if (epoch === refreshEpoch.current)
        setIsRefreshing(false);
    }
  };

  const changeCategory = (category: ShopCategory) => {
    refreshEpoch.current++;
    setIsRefreshing(false);
    setActiveCategory(category);
    catalogRef.current?.scrollTo({ y: 0, animated: false });
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ flex: 1, backgroundColor: s.headerBg }}
      edges={['top']}
    >
      <FocusAwareStatusBar />
      <ScreenHeader
        title={t('shop.title')}
        // As the Shop tab it is a root destination: no back. Pushed from elsewhere it keeps one.
        onBack={isShopTab ? undefined : () => router.back()}
        right={(
          <View className="flex-row items-center gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={purchaseDisabled ? t('shopUi.walletUnavailable') : t('shopUi.walletBalance', { count: coinBalance })}
              onPress={() => router.push('/profile/wallet' as any)}
              className="flex-row items-center gap-1.5 rounded-full border border-reward-200 bg-reward-50 px-3 py-1.5 active:scale-95 dark:border-amber-400/25 dark:bg-amber-400/10"
            >
              <Coin3D size="xs" />
              <Text className="font-nunito text-[14px] font-extrabold text-reward-700 tabular-nums dark:text-amber-300">
                {purchaseDisabled ? '–' : coinBalance.toLocaleString(i18n.language)}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('shopUi.inventory')}
              onPress={() => router.push('/profile/inventory' as any)}
              style={{ backgroundColor: s.surfaceMuted, borderColor: s.border }}
              className="size-10 items-center justify-center rounded-full border active:scale-95"
            >
              <PackageIcon size={18} color={s.text} />
            </Pressable>
          </View>
        )}
      />

      {/* Errors that outlive the purchase modal; while it is open they show inside it. */}
      {errorMessage && !purchaseIntent && (
        <View accessibilityRole="alert" className="flex-row items-center justify-between bg-amber-500 px-4 py-2">
          <Text className="flex-1 font-inter text-[13px] font-bold text-white">
            {errorMessage}
          </Text>
          <Pressable onPress={() => setErrorMessage(null)} className="ml-2 px-2 py-0.5">
            <Text className="font-nunito text-[13px] font-bold text-white">{t('shopUi.close')}</Text>
          </Pressable>
        </View>
      )}

      <View style={{ backgroundColor: s.headerBg }} className="flex-row items-center gap-3 px-4 pb-3">
        <View className="flex-1 gap-1">
          <Text style={{ color: s.text }} className="font-nunito text-lg font-black">{t('shopUi.rewardHeading')}</Text>
          <Text style={{ color: s.textMuted }} className="font-inter text-[13px]">{t('shopUi.rewardSubtitle')}</Text>
        </View>
        <Snapy pose="proud" animation="none" className="size-16" />
      </View>
      <ShopCategoryTabs value={activeCategory} onChange={changeCategory} />
      {isWalletError && (
        <View className="flex-row items-center gap-3 px-4 py-2">
          <Text style={{ color: s.textMuted }} className="flex-1 font-inter text-xs">{t('shopUi.walletLoadError')}</Text>
          <Pressable accessibilityRole="button" onPress={() => refetchWallet()} className="min-h-11 justify-center px-2">
            <Text style={{ color: s.text }} className="font-nunito text-sm font-bold">{t('shopUi.retry')}</Text>
          </Pressable>
        </View>
      )}

      {/* 3. MAIN CATALOG CONTENT */}
      <ScrollView
        ref={catalogRef}
        style={{ backgroundColor: s.background }}
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshFromGesture}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        )}
      >
        {isLoadingCatalog ? (
          <ShopCatalogSkeleton label={t('shopUi.loadingCatalog')} />
        ) : isCatalogError ? (
          <View style={{ backgroundColor: s.surface, borderColor: s.border }} className="items-center justify-center rounded-3xl border p-8">
            <Snapy pose="suy_nghi" animation="idle" className="mb-4 size-24 opacity-80" />
            <Text style={{ color: s.text }} className="mb-2 font-nunito text-[18px] font-extrabold">
              {t('shopUi.catalogErrorTitle')}
            </Text>
            <Text style={{ color: s.textMuted }} className="mb-5 text-center font-inter text-[13px]">
              {t('shopUi.networkRetry')}
            </Text>
            <Pressable
              onPress={() => refetchCatalog()}
              className="flex-row items-center gap-2 rounded-xl bg-brand px-5 py-2.5 active:bg-brand-pressed"
            >
              <RefreshCwIcon size={16} color="white" />
              <Text className="font-nunito text-[14px] font-extrabold text-on-brand uppercase">
                {t('shopUi.retry')}
              </Text>
            </Pressable>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={{ backgroundColor: s.surface, borderColor: s.border }} className="items-center justify-center rounded-3xl border p-8">
            <Snapy pose="suy_nghi" animation="idle" className="mb-4 size-24 opacity-80" />
            <Text style={{ color: s.text }} className="mb-2 font-nunito text-[18px] font-extrabold">
              {t('shopUi.emptyCatalogTitle')}
            </Text>
            <Text style={{ color: s.textMuted }} className="text-center font-inter text-[13px]">
              {t('shopUi.emptyCatalogBody')}
            </Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between">
            {filteredItems.map(item => (
              <ShopItemCard
                key={item.itemId}
                item={item}
                userCoins={coinBalance}
                showType={activeCategory === 'all'}
                purchaseDisabled={purchaseDisabled}
                onPress={handleItemPress}
                onPreview={(i) => {
                  if (i.type === 'AVATAR_FRAME') {
                    setPreviewFrameItem(i);
                  }
                  else {
                    setDetailItem(i);
                  }
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* 4. MODALS */}
      <ShopItemDetailModal
        item={detailItem}
        purchaseDisabled={purchaseDisabled}
        onClose={() => setDetailItem(null)}
        onBuy={(item) => {
          setDetailItem(null);
          handleItemPress(item);
        }}
      />
      <PurchaseSuccessModal
        visible={Boolean(purchaseIntent)}
        item={purchaseIntent?.item ?? null}
        userCoins={coinBalance}
        isPurchasing={isPurchasing}
        result={purchaseResult}
        hasActiveBooster={hasActiveBooster}
        errorMessage={errorMessage}
        onClose={handleClosePurchaseModal}
        onConfirm={handleConfirmPurchase}
        onEquipNow={handleEquipNow}
        onActivateNow={handleActivateNow}
      />

      <OutOfCoinModal
        visible={Boolean(outOfCoinItem)}
        item={outOfCoinItem}
        userCoins={coinBalance}
        onClose={() => setOutOfCoinItem(null)}
      />

      {/* Previews act on the real item: buy, equip/apply, or show it is in use. */}
      <FramePreviewModal
        item={previewFrameItem}
        onClose={() => setPreviewFrameItem(null)}
        onAction={() => {
          const item = previewFrameItem;
          setPreviewFrameItem(null);
          if (item) {
            handleItemPress(item);
          }
        }}
      />

      <BoosterActivateModal item={boosterItem} onClose={() => setBoosterItem(null)} />
    </SafeAreaView>
  );
}
