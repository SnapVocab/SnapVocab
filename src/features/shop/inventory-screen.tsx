import type { ActiveBoosterDTO, InventoryItemDTO } from './types';
import type { ShopCategory } from '@/components/shop/shop-category-tabs';
import { router } from 'expo-router';
import {
  ClockIcon,
  PackageIcon,
  RefreshCwIcon,
  ZapIcon,
} from 'lucide-react-native';
import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { ShopCategoryTabs } from '@/components/shop/shop-category-tabs';
import { CardAction, ItemCard } from '@/components/shop/ShopItemCard';
import { Snapy } from '@/components/Snapy';
import { ScreenHeader, useSurface } from '@/components/ui';
import {
  useEquipMutation,
  useInventory,
  useUnequipMutation,
} from './hooks/use-shop-queries';
import { isThemeKnown, ShopSurface } from './theme/theme-context';
import { formatRemainingTime, getRemainingBoosterMs } from './utils/booster-timer';

/** Shop-area screen: it and its modals take the equipped theme's surfaces. */
export default function InventoryScreen() {
  return (
    <ShopSurface>
      <InventoryScreenContent />
    </ShopSurface>
  );
}

/**
 * Remaining ms of the cached activation on server time, re-rendering every second while it runs.
 * At 0 it stops ticking and asks the server once; a new response (new offset/activation) restarts it.
 * Offline, the failed refetch leaves it at 0 instead of retrying every second.
 */
function useBoosterCountdown(active: ActiveBoosterDTO | null | undefined, serverOffset: number, refetch: () => unknown) {
  const [, setTick] = useState(0);
  const remainingMs = active ? getRemainingBoosterMs(active.expiresAt, serverOffset) : 0;
  const running = remainingMs > 0;

  useEffect(() => {
    if (!active)
      return;
    if (!running) {
      void refetch();
      return;
    }
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [active, serverOffset, running, refetch]);

  return remainingMs;
}

function InventoryScreenContent() {
  const s = useSurface();

  const [activeCategory, setActiveCategory] = useState<ShopCategory>('all');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [previewFrameItem, setPreviewFrameItem] = useState<InventoryItemDTO | null>(null);
  const [previewThemeItem, setPreviewThemeItem] = useState<InventoryItemDTO | null>(null);
  const [boosterItem, setBoosterItem] = useState<InventoryItemDTO | null>(null);

  // Queries & Mutations
  const {
    data: inventoryData,
    isLoading,
    isError,
    refetch,
    isFetching,
    serverOffset,
  } = useInventory();

  const equipMutation = useEquipMutation();
  const unequipMutation = useUnequipMutation();

  const items = inventoryData?.items ?? [];
  const boosterCountdown = useBoosterCountdown(inventoryData?.activeBooster, serverOffset, refetch);
  // Past its server-time expiry the cached activation is over, even before the refetch lands.
  const activeBooster = boosterCountdown > 0 ? inventoryData?.activeBooster : null;

  // A failed frame image (expired signed URL) refreshes the inventory once per visit, not in a loop.
  const frameRefetched = useRef(false);
  const onFrameError = () => {
    if (!frameRefetched.current) {
      frameRefetched.current = true;
      void refetch();
    }
  };

  // Hide used-up boosters, except the one currently running (shop.md §11.2).
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (item.type === 'XP_BOOSTER' && item.quantity <= 0 && item.itemId !== activeBooster?.itemId) {
        return false;
      }
      if (activeCategory === 'all') {
        return true;
      }
      return item.type === activeCategory;
    });
  }, [items, activeCategory, activeBooster?.itemId]);

  // ==========================================
  // ACTION HANDLERS
  // ==========================================
  const handleToggleEquip = (item: InventoryItemDTO) => {
    setFeedbackMessage(null);

    if (item.type !== 'THEME' && item.type !== 'AVATAR_FRAME') {
      return;
    }

    // Check unknown theme
    if (item.type === 'THEME' && !isThemeKnown(item.config?.themeKey)) {
      setFeedbackMessage('Cần cập nhật ứng dụng để dùng giao diện này');
      return;
    }

    if (item.equipped) {
      unequipMutation.mutate({ slot: item.type });
    }
    else {
      equipMutation.mutate({ slot: item.type, itemId: item.itemId });
    }
  };

  // Same shell as the Shop card; Kho đồ only swaps the description and the action.
  const renderItemCard = (item: InventoryItemDTO) => {
    const isBooster = item.type === 'XP_BOOSTER';
    const isUnknownTheme = item.type === 'THEME' && !isThemeKnown(item.config?.themeKey);
    const isActionPending =
      (equipMutation.isPending && equipMutation.variables?.itemId === item.itemId)
      || (unequipMutation.isPending && unequipMutation.variables?.slot === item.type);

    const description = isUnknownTheme
      ? 'Cần cập nhật ứng dụng để dùng giao diện này'
      : isBooster
        ? `×${item.config?.multiplier ?? 2} XP trong ${item.config?.durationMinutes ?? 30} phút`
        : undefined;

    const preview = () => {
      if (item.type === 'AVATAR_FRAME') {
        setPreviewFrameItem(item);
      }
      else if (item.type === 'THEME' && !isUnknownTheme) {
        setPreviewThemeItem(item);
      }
    };

    return (
      <ItemCard
        key={item.itemId}
        item={item}
        description={description}
        maxQuantity={item.config?.maxQuantity}
        onPress={isBooster ? undefined : preview}
        onFrameError={onFrameError}
      >
        {isBooster ? (
          activeBooster
            ? <CardAction tone="disabled" label={activeBooster.itemId === item.itemId ? 'Đang chạy' : 'Chờ booster kết thúc'} />
            : <CardAction tone="primary" label="Kích hoạt" onPress={() => setBoosterItem(item)} />
        ) : isUnknownTheme ? (
          <CardAction tone="disabled" label="Chưa hỗ trợ" />
        ) : item.equipped ? (
          <CardAction tone="secondary" label="Tháo ra" loading={isActionPending} onPress={() => handleToggleEquip(item)} />
        ) : (
          <CardAction
            tone="primary"
            label={item.type === 'THEME' ? 'Áp dụng' : 'Trang bị'}
            loading={isActionPending}
            onPress={() => handleToggleEquip(item)}
          />
        )}
      </ItemCard>
    );
  };

  // Inventory items are owned by definition; previews then offer equip/apply or "Đang dùng".
  const toPreview = (item: InventoryItemDTO | null) => (item ? { ...item, owned: true } : null);

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: s.background }}
      edges={['top']}
    >
      <ScreenHeader
        title="Kho đồ"
        onBack={() => router.back()}
      />

      {feedbackMessage && (
        <View accessibilityRole="alert" className="flex-row items-center justify-between bg-amber-500 px-4 py-2">
          <Text className="flex-1 font-inter text-[13px] font-bold text-white">
            {feedbackMessage}
          </Text>
          <Pressable onPress={() => setFeedbackMessage(null)} className="ml-2 px-2 py-0.5">
            <Text className="font-nunito text-[13px] font-bold text-white">Đóng</Text>
          </Pressable>
        </View>
      )}

      <ShopCategoryTabs value={activeCategory} onChange={setActiveCategory} />

      {/* 3. CONTENT AREA */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        )}
      >
        {/* ACTIVE BOOSTER BANNER (if active) */}
        {activeBooster && (
          <View className="mb-5 flex-row items-center justify-between rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 shadow-sm">
            <View className="flex-row items-center gap-3">
              <View className="size-11 items-center justify-center rounded-xl bg-amber-400">
                <ZapIcon size={24} color="white" />
              </View>
              <View>
                <Text className="font-nunito text-[16px] font-extrabold text-amber-950">
                  {`Đang nhân ×${activeBooster.multiplier} XP`}
                </Text>
                <Text className="font-inter text-[12px] font-medium text-amber-800">
                  Làm Quiz trong thời gian này để nhận thêm XP
                </Text>
              </View>
            </View>

            <View style={{ backgroundColor: s.surface }} className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5 shadow-sm">
              <ClockIcon size={14} color="#D97706" />
              <Text className="font-nunito text-[14px] font-extrabold text-amber-700 tabular-nums">
                {formatRemainingTime(boosterCountdown)}
              </Text>
            </View>
          </View>
        )}

        {isLoading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={{ color: s.textMuted }} className="mt-3 font-inter text-[14px] font-medium">
              Đang tải kho đồ...
            </Text>
          </View>
        ) : isError ? (
          <View style={{ backgroundColor: s.surface, borderColor: s.border }} className="items-center justify-center rounded-3xl border p-8">
            <Snapy pose="suy_nghi" animation="idle" className="mb-4 size-24 opacity-80" />
            <Text style={{ color: s.text }} className="mb-2 font-nunito text-[18px] font-extrabold">
              Không thể tải Kho đồ
            </Text>
            <Text style={{ color: s.textMuted }} className="mb-5 text-center font-inter text-[13px]">
              Vui lòng thử lại sau ít giây.
            </Text>
            <Pressable
              onPress={() => refetch()}
              className="flex-row items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 active:bg-primary-600"
            >
              <RefreshCwIcon size={16} color="white" />
              <Text className="font-nunito text-[14px] font-extrabold text-white uppercase">
                Thử lại
              </Text>
            </Pressable>
          </View>
        ) : filteredItems.length === 0 ? (
          /* EMPTY STATE */
          <View style={{ backgroundColor: s.surface, borderColor: s.border }} className="items-center justify-center rounded-3xl border p-8">
            <Snapy pose="suy_nghi" animation="idle" className="mb-4 size-28 opacity-90" />
            <Text style={{ color: s.text }} className="mb-1 font-nunito text-[20px] font-extrabold">
              Kho đồ trống
            </Text>
            <Text style={{ color: s.textMuted }} className="mb-6 px-4 text-center font-inter text-[14px] leading-relaxed">
              Bạn chưa có vật phẩm nào trong mục này. Ghé Cửa hàng để chọn thêm nhé!
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/shop' as any)}
              className="flex-row items-center gap-2 rounded-2xl border-b-4 border-primary-700 bg-primary-500 px-6 py-3 active:border-b-2"
            >
              <PackageIcon size={18} color="white" />
              <Text className="font-nunito text-[14px] font-extrabold tracking-wide text-white uppercase">
                Đến Cửa hàng
              </Text>
            </Pressable>
          </View>
        ) : (
          /* ITEM GRID */
          <View className="flex-row flex-wrap justify-between">
            {filteredItems.map(renderItemCard)}
          </View>
        )}
      </ScrollView>

      <FramePreviewModal
        item={toPreview(previewFrameItem)}
        onClose={() => setPreviewFrameItem(null)}
        onAction={() => {
          if (previewFrameItem) {
            handleToggleEquip(previewFrameItem);
          }
          setPreviewFrameItem(null);
        }}
      />
      <ThemePreviewModal
        item={toPreview(previewThemeItem)}
        onClose={() => setPreviewThemeItem(null)}
        onAction={() => {
          if (previewThemeItem) {
            handleToggleEquip(previewThemeItem);
          }
          setPreviewThemeItem(null);
        }}
      />
      <BoosterActivateModal item={boosterItem} onClose={() => setBoosterItem(null)} />
    </SafeAreaView>
  );
}
