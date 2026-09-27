import type { ShopItemType } from './types';
import { router } from 'expo-router';
import {
  ArrowLeftIcon,
  PackageIcon,
  RefreshCwIcon,
} from 'lucide-react-native';
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
import { AvatarFrameShowcaseModal } from '@/components/shop/AvatarFrameShowcaseModal';
import { OutOfCoinModal } from '@/components/shop/OutOfCoinModal';
import { PurchaseSuccessModal } from '@/components/shop/PurchaseSuccessModal';
import { ShopItemCard } from '@/components/shop/ShopItemCard';
import { ThemePreviewModal } from '@/components/shop/ThemePreviewModal';
import { Coin3D } from '@/components/snapvocab';
import { Snapy } from '@/components/Snapy';
import { cn } from '@/lib/utils';
import { useShopActions } from './hooks/use-shop-actions';
import {
  useCoinBalance,
  useInventory,
  useShopCatalog,
} from './hooks/use-shop-queries';
import { isThemeKnown, useShopTheme } from './theme/theme-context';

type CategoryFilter = 'all' | ShopItemType;

const CATEGORIES: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'XP_BOOSTER', label: 'Bổ trợ' },
  { id: 'AVATAR_FRAME', label: 'Khung Avatar' },
  { id: 'THEME', label: 'Chủ đề' },
];

export default function ShopScreen() {
  const { theme } = useShopTheme();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [previewFrameId, setPreviewFrameId] = useState<string | null>(null);

  // Queries
  const {
    data: catalogItems,
    isLoading: isLoadingCatalog,
    isError: isCatalogError,
    refetch: refetchCatalog,
    isFetching: isFetchingCatalog,
  } = useShopCatalog(activeCategory === 'all' ? undefined : activeCategory);

  const { balance: coinBalance, refetch: refetchWallet } = useCoinBalance();
  const { data: inventoryData, refetch: refetchInventory } = useInventory();

  const hasActiveBooster = Boolean(inventoryData?.activeBooster);

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
    isPurchaseSuccess,
    isPurchasing,
    handleRefresh,
    handleItemPress,
    handleConfirmPurchase,
    handleClosePurchaseModal,
    handleEquipNow,
    handleActivateNow,
    startPurchaseIntent,
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
      style={{ backgroundColor: theme.surfaceTokens.background }}
      edges={['top']}
    >
      {/* 1. TOP APP BAR */}
      <View
        style={{
          backgroundColor: theme.surfaceTokens.headerBg,
          borderColor: theme.surfaceTokens.border,
        }}
        className="z-10 flex-row items-center justify-between border-b px-4 py-3 shadow-sm shadow-black/5"
      >
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => router.back()}
            className="-ml-1 size-9 items-center justify-center rounded-full active:bg-neutral-100"
          >
            <ArrowLeftIcon size={22} color={theme.surfaceTokens.text} />
          </Pressable>
          <Text
            style={{ color: theme.surfaceTokens.text }}
            className="font-nunito text-[18px] font-extrabold"
          >
            Cửa hàng
          </Text>
        </View>

        <View className="flex-row items-center gap-2.5">
          {/* Coin Balance Pill */}
          <Pressable
            onPress={() => router.push('/profile/wallet' as any)}
            className="flex-row items-center gap-1.5 rounded-full border border-reward-200 bg-reward-50 px-3 py-1 shadow-sm active:scale-95"
          >
            <Coin3D size="xs" />
            <Text className="font-nunito text-[14px] font-extrabold text-reward-700 tabular-nums">
              {coinBalance.toLocaleString()}
            </Text>
          </Pressable>

          {/* Inventory Shortcut Pill */}
          <Pressable
            onPress={() => router.push('/profile/inventory' as any)}
            className="flex-row items-center gap-1 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 active:scale-95"
          >
            <PackageIcon size={14} color="#2563EB" />
            <Text className="font-nunito text-[12px] font-extrabold text-primary-700">
              Kho đồ
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Error alert banner if any */}
      {errorMessage && (
        <View className="flex-row items-center justify-between bg-amber-500 px-4 py-2">
          <Text className="flex-1 font-inter text-[12px] font-bold text-white">
            {errorMessage}
          </Text>
          <Pressable onPress={() => setErrorMessage(null)} className="ml-2 px-2 py-0.5">
            <Text className="font-nunito text-[12px] font-bold text-white">Đóng</Text>
          </Pressable>
        </View>
      )}

      {/* 2. CATEGORY FILTER TABS */}
      <View
        style={{
          backgroundColor: theme.surfaceTokens.surface,
          borderColor: theme.surfaceTokens.border,
        }}
        className="border-b px-4 py-1.5"
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6 }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setActiveCategory(cat.id)}
                className={cn(
                  'rounded-full px-3.5 py-1 transition-all',
                  isActive
                    ? 'border-b-2 border-primary-700 bg-primary-500'
                    : 'border border-neutral-200/80 bg-neutral-100 active:bg-neutral-200',
                )}
              >
                <Text
                  className={cn(
                    'font-nunito text-[12.5px] font-extrabold',
                    isActive ? 'text-white' : 'text-neutral-600',
                  )}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. MAIN CATALOG CONTENT */}
      <ScrollView
        contentContainerStyle={{ padding: 14, paddingBottom: 110 }}
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
            <Text className="mt-3 font-inter text-[14px] font-medium text-neutral-400">
              Đang tải danh mục...
            </Text>
          </View>
        ) : isCatalogError ? (
          <View className="items-center justify-center rounded-3xl border border-neutral-200 bg-white p-8">
            <Snapy pose="suy_nghi" animation="idle" className="mb-4 size-24 opacity-80" />
            <Text className="mb-2 font-nunito text-[18px] font-extrabold text-mascot-navy">
              Không thể tải Cửa hàng
            </Text>
            <Text className="mb-5 text-center font-inter text-[13px] text-neutral-500">
              Vui lòng kiểm tra lại kết nối mạng và thử lại.
            </Text>
            <Pressable
              onPress={() => refetchCatalog()}
              className="flex-row items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 active:bg-primary-600"
            >
              <RefreshCwIcon size={16} color="white" />
              <Text className="font-nunito text-[14px] font-extrabold text-white uppercase">
                Thử lại
              </Text>
            </Pressable>
          </View>
        ) : filteredItems.length === 0 ? (
          <View className="items-center justify-center rounded-3xl border border-neutral-200 bg-white p-8">
            <Snapy pose="suy_nghi" animation="idle" className="mb-4 size-24 opacity-80" />
            <Text className="mb-2 font-nunito text-[18px] font-extrabold text-mascot-navy">
              Chưa có vật phẩm trong mục này
            </Text>
            <Text className="text-center font-inter text-[13px] text-neutral-500">
              Các vật phẩm mới sẽ sớm được cập nhật trong Cửa hàng!
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
                    setPreviewFrameId(i.code);
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
      {/* 4.1. Purchase Confirmation & Success Modal */}
      <PurchaseSuccessModal
        visible={Boolean(purchaseIntent)}
        item={purchaseIntent?.item ?? null}
        userCoins={coinBalance}
        isPurchasing={isPurchasing}
        purchaseSuccess={isPurchaseSuccess}
        hasActiveBooster={hasActiveBooster}
        onClose={handleClosePurchaseModal}
        onConfirm={handleConfirmPurchase}
        onEquipNow={handleEquipNow}
        onActivateNow={handleActivateNow}
      />

      {/* 4.2. Out Of Coin Modal */}
      <OutOfCoinModal
        visible={Boolean(outOfCoinItem)}
        item={outOfCoinItem}
        userCoins={coinBalance}
        onClose={() => setOutOfCoinItem(null)}
      />

      {/* 4.3. Avatar Frame Showcase / Preview Modal */}
      <AvatarFrameShowcaseModal
        visible={Boolean(previewFrameId)}
        equippedFrameId={previewFrameId}
        onClose={() => setPreviewFrameId(null)}
      />

      {/* 4.4. Theme Preview Modal */}
      <ThemePreviewModal
        item={previewThemeItem}
        onClose={() => setPreviewThemeItem(null)}
        onPurchase={(item) => {
          setPreviewThemeItem(null);
          startPurchaseIntent(item);
        }}
      />
    </SafeAreaView>
  );
}
