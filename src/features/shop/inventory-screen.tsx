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
import { ShopCategoryTabs } from '@/components/shop/shop-category-tabs';
import { CardAction, ItemCard } from '@/components/shop/ShopItemCard';
import { Snapy } from '@/components/Snapy';
import { ScreenHeader, useSurface } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { ShopCatalogSkeleton } from './components/shop-catalog-skeleton';
import {
  useEquipMutation,
  useInventory,
  useUnequipMutation,
} from './hooks/use-shop-queries';
import { isEquippable, isKnownItemType } from './types';
import { formatRemainingTime, getRemainingBoosterMs } from './utils/booster-timer';

/**
 * Watches only the expiry boundary of an active booster so the entire InventoryScreen
 * does not re-render every 1 second; the countdown pill ticks independently below.
 */
function useActiveBooster(active: ActiveBoosterDTO | null | undefined, serverOffset: number, refetch: () => unknown) {
  const [, setExpiredEpoch] = useState(0);
  const remainingMs = active ? getRemainingBoosterMs(active.expiresAt, serverOffset) : 0;
  const running = remainingMs > 0;

  useEffect(() => {
    if (!active)
      return;
    if (!running) {
      void refetch();
      return;
    }
    const timer = setTimeout(() => setExpiredEpoch(e => e + 1), Math.max(250, remainingMs));
    return () => clearTimeout(timer);
  }, [active, serverOffset, running, remainingMs, refetch]);

  return running ? active : null;
}

/** Isolated 1s timer so only the small time pill re-renders while a booster is running. */
function BoosterCountdownText({ expiresAt, serverOffset }: { expiresAt: string; serverOffset: number }) {
  const [, setTick] = useState(0);
  const remainingMs = getRemainingBoosterMs(expiresAt, serverOffset);
  const running = remainingMs > 0;

  useEffect(() => {
    if (!running)
      return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [expiresAt, serverOffset, running]);

  return (
    <Text className="font-nunito text-[14px] font-extrabold text-amber-700 tabular-nums">
      {formatRemainingTime(remainingMs)}
    </Text>
  );
}

export default function InventoryScreen() {
  const s = useSurface();
  const { t } = useTranslation();

  const [activeCategory, setActiveCategory] = useState<ShopCategory>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshEpoch = useRef(0);
  const catalogRef = useRef<ScrollView>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [previewFrameItem, setPreviewFrameItem] = useState<InventoryItemDTO | null>(null);
  const [boosterItem, setBoosterItem] = useState<InventoryItemDTO | null>(null);

  // Queries & Mutations
  const {
    data: inventoryData,
    isLoading,
    isError,
    refetch,
    serverOffset,
  } = useInventory();

  const refreshFromGesture = async () => {
    if (isRefreshing)
      return;
    const epoch = ++refreshEpoch.current;
    setIsRefreshing(true);
    try {
      await refetch();
    }
    catch {
      setFeedbackMessage(t('shopUi.refreshError'));
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

  const equipMutation = useEquipMutation();
  const unequipMutation = useUnequipMutation();

  const items = inventoryData?.items ?? [];
  // Past its server-time expiry the cached activation is over, even before the refetch lands.
  const activeBooster = useActiveBooster(inventoryData?.activeBooster, serverOffset, refetch);

  // A failed frame image (expired signed URL) refreshes the inventory once per visit, not in a loop.
  const frameRefetched = useRef(false);
  const onFrameError = () => {
    if (!frameRefetched.current) {
      frameRefetched.current = true;
      void refetch();
    }
  };

  // Hide types this app version cannot run, and used-up boosters except the one currently running (shop.md §11.2).
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (!isKnownItemType(item.type)) {
        return false;
      }
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

    if (!isEquippable(item.type)) {
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
    // Passive: it works on its own when a study day is missed (streak_freeze.md §7), so there is nothing to press.
    const isFreeze = item.type === 'STREAK_FREEZE';
    const isActionPending =
      (equipMutation.isPending && equipMutation.variables?.itemId === item.itemId)
      || (unequipMutation.isPending && unequipMutation.variables?.slot === item.type);

    const preview = () => {
      if (isEquippable(item.type)) {
        setPreviewFrameItem(item);
      }
    };

    return (
      <ItemCard
        key={item.itemId}
        item={item}
        maxQuantity={item.config?.maxQuantity}
        onPress={isBooster || isFreeze ? undefined : preview}
        onFrameError={onFrameError}
      >
        {isFreeze ? (
          <CardAction tone="done" label={translate('shop.freeze.ready')} />
        ) : isBooster ? (
          activeBooster
            ? <CardAction tone="disabled" label={activeBooster.itemId === item.itemId ? t('shopUi.actionActive') : t('shopUi.actionWaitBooster')} />
            : <CardAction tone="primary" label={t('shopUi.actionActivate')} onPress={() => setBoosterItem(item)} />
        ) : item.equipped ? (
          <CardAction tone="secondary" label={t('shopUi.actionUnequip')} loading={isActionPending} onPress={() => handleToggleEquip(item)} />
        ) : (
          <CardAction
            tone="primary"
            label={t('shopUi.actionEquip')}
            loading={isActionPending}
            onPress={() => handleToggleEquip(item)}
          />
        )}
      </ItemCard>
    );
  };

  // Inventory items are owned by definition; previews then offer equip or "Đang dùng".
  const toPreview = (item: InventoryItemDTO | null) => (item ? { ...item, owned: true } : null);

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: s.background }}
      edges={['top']}
    >
      <ScreenHeader
        title={t('shopUi.inventory')}
        onBack={() => router.back()}
      />

      {feedbackMessage && (
        <View accessibilityRole="alert" className="flex-row items-center justify-between bg-amber-500 px-4 py-2">
          <Text className="flex-1 font-inter text-[13px] font-bold text-white">
            {feedbackMessage}
          </Text>
          <Pressable onPress={() => setFeedbackMessage(null)} className="ml-2 px-2 py-0.5">
            <Text className="font-nunito text-[13px] font-bold text-white">{t('shopUi.close')}</Text>
          </Pressable>
        </View>
      )}

      <ShopCategoryTabs value={activeCategory} onChange={changeCategory} />

      {/* 3. CONTENT AREA */}
      <ScrollView
        ref={catalogRef}
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
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
        {/* ACTIVE BOOSTER BANNER (if active) */}
        {activeBooster && (
          <View className="mb-5 flex-row items-center justify-between rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 shadow-sm">
            <View className="flex-row items-center gap-3">
              <View className="size-11 items-center justify-center rounded-xl bg-amber-400">
                <ZapIcon size={24} color="white" />
              </View>
              <View>
                <Text className="font-nunito text-[16px] font-extrabold text-amber-950">
                  {t('shopUi.boosterActiveTitle', { multiplier: activeBooster.multiplier })}
                </Text>
                <Text className="font-inter text-[12px] font-medium text-amber-800">
                  {t('shopUi.boosterActiveBody')}
                </Text>
              </View>
            </View>

            <View style={{ backgroundColor: s.surface }} className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5 shadow-sm">
              <ClockIcon size={14} color="#D97706" />
              <BoosterCountdownText expiresAt={activeBooster.expiresAt} serverOffset={serverOffset} />
            </View>
          </View>
        )}

        {isLoading ? (
          <ShopCatalogSkeleton label={t('shopUi.inventoryLoading')} />
        ) : isError ? (
          <View style={{ backgroundColor: s.surface, borderColor: s.border }} className="items-center justify-center rounded-3xl border p-8">
            <Snapy pose="suy_nghi" animation="idle" className="mb-4 size-24 opacity-80" />
            <Text style={{ color: s.text }} className="mb-2 font-nunito text-[18px] font-extrabold">
              {t('shopUi.inventoryErrorTitle')}
            </Text>
            <Text style={{ color: s.textMuted }} className="mb-5 text-center font-inter text-[13px]">
              {t('shopUi.inventoryErrorBody')}
            </Text>
            <Pressable
              onPress={() => refetch()}
              className="flex-row items-center gap-2 rounded-xl bg-brand px-5 py-2.5 active:bg-brand-pressed"
            >
              <RefreshCwIcon size={16} color="white" />
              <Text className="font-nunito text-[14px] font-extrabold text-on-brand uppercase">
                {t('shopUi.retry')}
              </Text>
            </Pressable>
          </View>
        ) : filteredItems.length === 0 ? (
          /* EMPTY STATE */
          <View style={{ backgroundColor: s.surface, borderColor: s.border }} className="items-center justify-center rounded-3xl border p-8">
            <Snapy pose="suy_nghi" animation="idle" className="mb-4 size-28 opacity-90" />
            <Text style={{ color: s.text }} className="mb-1 font-nunito text-[20px] font-extrabold">
              {t('shopUi.inventoryEmptyTitle')}
            </Text>
            <Text style={{ color: s.textMuted }} className="mb-6 px-4 text-center font-inter text-[14px] leading-relaxed">
              {t('shopUi.inventoryEmptyBody')}
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/shop' as any)}
              className="flex-row items-center gap-2 rounded-2xl border-b-4 border-brand-edge bg-brand px-6 py-3 active:border-b-2"
            >
              <PackageIcon size={18} color="white" />
              <Text className="font-nunito text-[14px] font-extrabold tracking-wide text-on-brand uppercase">
                {t('shopUi.goToShop')}
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
      <BoosterActivateModal item={boosterItem} onClose={() => setBoosterItem(null)} />
    </SafeAreaView>
  );
}
