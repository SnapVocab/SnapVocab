import type { ShopItemDTO } from './types';
import type { ShopCategory } from '@/components/shop/shop-category-tabs';
import { router } from 'expo-router';
import { PackageIcon, RefreshCwIcon } from 'lucide-react-native';
import * as React from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BoosterActivateModal } from '@/components/shop/booster-activate-modal';
import { FramePreviewModal, ThemePreviewModal } from '@/components/shop/item-preview-modal';
import { OutOfCoinModal } from '@/components/shop/OutOfCoinModal';
import { PurchaseSuccessModal } from '@/components/shop/PurchaseSuccessModal';
import { ShopCategoryTabs } from '@/components/shop/shop-category-tabs';
import { ShopItemCard } from '@/components/shop/ShopItemCard';
import { Coin3D } from '@/components/snapvocab';
import { Snapy } from '@/components/Snapy';
import { ScreenHeader, useSurface } from '@/components/ui';
import { useShopActions } from './hooks/use-shop-actions';
import {
  useCoinBalance,
  useInventory,
  useShopCatalog,
} from './hooks/use-shop-queries';
import { isThemeKnown, ShopSurface } from './theme/theme-context';
import { isBoosterLive } from './utils/booster-timer';

/** Shop-area screen: it and its modals take the equipped theme's surfaces. */
export default function ShopScreen() {
  return (
    <ShopSurface>
      <ShopScreenContent />
    </ShopSurface>
  );
}

function ShopScreenContent() {
  const s = useSurface();
  const { t, i18n } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<ShopCategory>('all');
  const [previewFrameItem, setPreviewFrameItem] = useState<ShopItemDTO | null>(null);

  // Queries
  const {
    data: catalogItems,
    isLoading: isLoadingCatalog,
    isError: isCatalogError,
    refetch: refetchCatalog,
    isFetching: isFetchingCatalog,
  } = useShopCatalog(activeCategory === 'all' ? undefined : activeCategory);

  const { balance: coinBalance, refetch: refetchWallet } = useCoinBalance();
  const { data: inventoryData, refetch: refetchInventory, serverOffset } = useInventory();

  const hasActiveBooster = isBoosterLive(inventoryData?.activeBooster, serverOffset);

  // Filter catalog items according to spec (hide themes with unknown themeKey)
  const filteredItems = useMemo(() => {
    if (!catalogItems) {
      return [];
    }
    return catalogItems.filter((item) => {
      if (item.type === 'THEME' && !isThemeKnown(item.config?.themeKey)) {
        return false;
      }
      return true;
    });
  }, [catalogItems]);

  // Actions & Mutations Hook
  const {
    outOfCoinItem,
    setOutOfCoinItem,
    previewThemeItem,
    setPreviewThemeItem,
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

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: s.background }}
      edges={['top']}
    >
      <ScreenHeader
        title={t('shop.title')}
        onBack={() => router.back()}
        right={(
          <View className="flex-row items-center gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('shopUi.walletBalance', { count: coinBalance })}
              onPress={() => router.push('/profile/wallet' as any)}
              className="flex-row items-center gap-1.5 rounded-full border border-reward-200 bg-reward-50 px-3 py-1.5 active:scale-95"
            >
              <Coin3D size="xs" />
              <Text className="font-nunito text-[14px] font-extrabold text-reward-700 tabular-nums">
                {coinBalance.toLocaleString(i18n.language)}
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

      <ShopCategoryTabs value={activeCategory} onChange={setActiveCategory} />

      {/* 3. MAIN CATALOG CONTENT */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={isFetchingCatalog}
            onRefresh={handleRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        )}
      >
        {isLoadingCatalog ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={{ color: s.textMuted }} className="mt-3 font-inter text-[14px] font-medium">
              {t('shopUi.loadingCatalog')}
            </Text>
          </View>
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
              className="flex-row items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 active:bg-primary-600"
            >
              <RefreshCwIcon size={16} color="white" />
              <Text className="font-nunito text-[14px] font-extrabold text-white uppercase">
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
                onPress={handleItemPress}
                onPreview={(i) => {
                  if (i.type === 'AVATAR_FRAME') {
                    setPreviewFrameItem(i);
                  }
                  else if (i.type === 'THEME') {
                    setPreviewThemeItem(i);
                  }
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* 4. MODALS */}
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

      <ThemePreviewModal
        item={previewThemeItem}
        onClose={() => setPreviewThemeItem(null)}
        onAction={() => {
          const item = previewThemeItem;
          setPreviewThemeItem(null);
          if (item) {
            handleItemPress(item);
          }
        }}
      />

      <BoosterActivateModal item={boosterItem} onClose={() => setBoosterItem(null)} />
    </SafeAreaView>
  );
}
