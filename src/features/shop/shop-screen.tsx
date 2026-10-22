import type { ShopItemDTO } from './types';
import type { ShopCategory } from '@/components/shop/shop-category-tabs';
import { router } from 'expo-router';
import { PackageIcon, RefreshCwIcon } from 'lucide-react-native';
import * as React from 'react';
import { useMemo, useState } from 'react';
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
import { translate } from '@/lib/i18n';
import { useShopActions } from './hooks/use-shop-actions';
import {
  useCoinBalance,
  useInventory,
  useShopCatalog,
} from './hooks/use-shop-queries';
import { isThemeKnown, ShopSurface } from './theme/theme-context';
import { isKnownItemType } from './types';
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
      if (!isKnownItemType(item.type)) {
        return false;
      }
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
        title={translate('shop.title')}
        onBack={() => router.back()}
        right={(
          <View className="flex-row items-center gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={translate('shop.wallet.a11y_balance', { balance: coinBalance.toLocaleString('vi-VN') })}
              onPress={() => router.push('/profile/wallet' as any)}
              className="flex-row items-center gap-1.5 rounded-full border border-reward-200 bg-reward-50 px-3 py-1.5 active:scale-95"
            >
              <Coin3D size="xs" />
              <Text className="font-nunito text-[14px] font-extrabold text-reward-700 tabular-nums">
                {coinBalance.toLocaleString('vi-VN')}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={translate('shop.inventory.title')}
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
            <Text className="font-nunito text-[13px] font-bold text-white">{translate('shop.close')}</Text>
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
              {translate('shop.loading')}
            </Text>
          </View>
        ) : isCatalogError ? (
          <View style={{ backgroundColor: s.surface, borderColor: s.border }} className="items-center justify-center rounded-3xl border p-8">
            <Snapy pose="suy_nghi" animation="idle" className="mb-4 size-24 opacity-80" />
            <Text style={{ color: s.text }} className="mb-2 font-nunito text-[18px] font-extrabold">
              {translate('shop.error_title')}
            </Text>
            <Text style={{ color: s.textMuted }} className="mb-5 text-center font-inter text-[13px]">
              {translate('shop.error_description')}
            </Text>
            <Pressable
              onPress={() => refetchCatalog()}
              className="flex-row items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 active:bg-primary-600"
            >
              <RefreshCwIcon size={16} color="white" />
              <Text className="font-nunito text-[14px] font-extrabold text-white uppercase">
                {translate('shop.retry')}
              </Text>
            </Pressable>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={{ backgroundColor: s.surface, borderColor: s.border }} className="items-center justify-center rounded-3xl border p-8">
            <Snapy pose="suy_nghi" animation="idle" className="mb-4 size-24 opacity-80" />
            <Text style={{ color: s.text }} className="mb-2 font-nunito text-[18px] font-extrabold">
              {translate('shop.empty_title')}
            </Text>
            <Text style={{ color: s.textMuted }} className="text-center font-inter text-[13px]">
              {translate('shop.empty_description')}
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
