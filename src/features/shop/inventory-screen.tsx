import type { InventoryItemDTO, ShopItemType } from './types';
import { router } from 'expo-router';
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CheckIcon,
  ClockIcon,
  PackageIcon,
  RefreshCwIcon,
  SparklesIcon,
  ZapIcon,
} from 'lucide-react-native';
import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AvatarFrameShowcaseModal } from '@/components/shop/AvatarFrameShowcaseModal';
import { AvatarFrame } from '@/components/snapvocab';
import { Snapy } from '@/components/Snapy';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { generateIdempotencyKey } from '@/features/quiz/utils/idempotency';
import { cn } from '@/lib/utils';
import {
  useActivateBoosterMutation,
  useEquipMutation,
  useInventory,
  useUnequipMutation,
} from './hooks/use-shop-queries';
import { isThemeKnown, useShopTheme } from './theme/theme-context';
import { formatRemainingTime, getRemainingBoosterMs } from './utils/booster-timer';

type InventoryCategoryFilter = 'all' | ShopItemType;

const CATEGORIES: { id: InventoryCategoryFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'AVATAR_FRAME', label: 'Khung Avatar' },
  { id: 'THEME', label: 'Chủ đề' },
  { id: 'XP_BOOSTER', label: 'Bổ trợ' },
];

export default function InventoryScreen() {
  const { theme } = useShopTheme();
  const currentUser = useAuthStore(s => s.user);

  const [activeCategory, setActiveCategory] = useState<InventoryCategoryFilter>('all');
  const [showShowcase, setShowShowcase] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

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
  const activateMutation = useActivateBoosterMutation();

  const activeBooster = inventoryData?.activeBooster;
  const items = inventoryData?.items ?? [];

  // ==========================================
  // BOOSTER COUNTDOWN LOGIC
  // ==========================================
  const [boosterCountdown, setBoosterCountdown] = useState<number>(0);

  useEffect(() => {
    if (!activeBooster) {
      setBoosterCountdown(0);
      return;
    }

    const updateTimer = () => {
      const remainingMs = getRemainingBoosterMs(activeBooster.expiresAt, serverOffset);
      setBoosterCountdown(remainingMs);

      // When countdown reaches 0: invalidate/refetch inventory as server is authoritative
      if (remainingMs <= 0) {
        refetch();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeBooster, serverOffset, refetch]);

  // Filter items (hide consumables with quantity <= 0)
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (item.type === 'XP_BOOSTER' && item.quantity <= 0) {
        return false;
      }
      if (activeCategory === 'all') {
        return true;
      }
      return item.type === activeCategory;
    });
  }, [items, activeCategory]);

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
      setFeedbackMessage('Cần cập nhật ứng dụng để sử dụng chủ đề này');
      return;
    }

    if (item.equipped) {
      unequipMutation.mutate({ slot: item.type });
    }
    else {
      equipMutation.mutate({ slot: item.type, itemId: item.itemId });
    }
  };

  const handleActivateBooster = (item: InventoryItemDTO) => {
    setFeedbackMessage(null);

    if (activeBooster) {
      setFeedbackMessage('Chờ booster hiện tại kết thúc');
      return;
    }

    if (activateMutation.isPending) {
      return;
    }

    const idempotencyKey = generateIdempotencyKey();
    activateMutation.mutate({
      itemId: item.itemId,
      idempotencyKey,
    });
  };

  // ==========================================
  // RENDER ITEM CARD
  // ==========================================
  const renderItemCard = (item: InventoryItemDTO) => {
    const isEquipped = item.equipped;
    const isTheme = item.type === 'THEME';
    const isFrame = item.type === 'AVATAR_FRAME';
    const isBooster = item.type === 'XP_BOOSTER';

    const isUnknownTheme = isTheme && !isThemeKnown(item.config?.themeKey);
    const isActionPending =
      (equipMutation.isPending && equipMutation.variables?.itemId === item.itemId)
      || (unequipMutation.isPending && unequipMutation.variables?.slot === item.type)
      || (activateMutation.isPending && activateMutation.variables?.itemId === item.itemId);

    return (
      <View
        key={item.itemId}
        className={cn(
          'mb-4 w-[48%] overflow-hidden rounded-[24px] border-2 bg-white shadow-sm transition-all',
          isEquipped ? 'border-primary-400 shadow-primary-500/20' : 'border-neutral-100 shadow-black/5',
        )}
      >
        {/* Artwork Area */}
        <View
          className={cn(
            'relative h-32 items-center justify-center p-3',
            isEquipped ? 'bg-primary-50' : 'bg-[#F7F8FA]',
          )}
        >
          {/* Quantity Badge for Booster */}
          {isBooster && item.quantity > 0 && (
            <View className="absolute top-2 right-2 z-10 rounded-full bg-mascot-navy px-2 py-0.5">
              <Text className="font-nunito text-[12px] font-extrabold text-white tabular-nums">
                ×
                {item.quantity}
              </Text>
            </View>
          )}

          {/* Equipped Status Pill */}
          {isEquipped && (
            <View className="absolute top-2 left-2 z-10 flex-row items-center gap-1 rounded-full bg-primary-500 px-2 py-0.5 shadow-sm">
              <CheckIcon size={12} color="white" />
              <Text className="font-nunito text-[10px] font-extrabold text-white uppercase">
                ĐANG DÙNG
              </Text>
            </View>
          )}

          {/* Image Artwork Container */}
          {isFrame ? (
            <AvatarFrame
              frameId={item.code}
              frameUrl={item.config?.frameUrl}
              avatarUri={currentUser?.avatarUrl}
              avatarSource={require('../../assets/images/snapy-happy.png')}
              size="md"
              animated
              showGlow={false}
              onFrameError={() => refetch()}
            />
          ) : item.iconUrl ? (
            <Image
              source={{ uri: item.iconUrl }}
              style={{ width: 72, height: 72 }}
              resizeMode="contain"
            />
          ) : (
            <Image
              source={
                isTheme
                  ? require('../../assets/images/shop/icon8_clean.png')
                  : require('../../assets/images/shop/icon1_clean.png')
              }
              style={{ width: 72, height: 72 }}
              resizeMode="contain"
            />
          )}
        </View>

        {/* Info & Action Area */}
        <View className="p-3">
          <Text
            className="font-nunito text-[15px] font-extrabold text-mascot-navy"
            numberOfLines={1}
          >
            {item.name}
          </Text>

          {/* Unknown Theme Warning */}
          {isUnknownTheme ? (
            <View className="my-1.5 flex-row items-center gap-1 rounded-lg bg-amber-50 p-1.5">
              <AlertTriangleIcon size={12} color="#D97706" />
              <Text className="flex-1 font-inter text-[10px] font-medium text-amber-700">
                Cần cập nhật ứng dụng để sử dụng chủ đề này
              </Text>
            </View>
          ) : isBooster ? (
            <Text className="mt-0.5 mb-2 font-inter text-[12px] font-medium text-neutral-400">
              Nhân đôi kinh nghiệm trong
              {' '}
              {item.config?.durationMinutes ?? 30}
              {' '}
              phút
            </Text>
          ) : (
            <Text className="mt-0.5 mb-2 font-inter text-[12px] font-medium text-neutral-400">
              {isTheme ? 'Chủ đề giao diện' : 'Khung trang trí avatar'}
            </Text>
          )}

          {/* Action CTA */}
          {isBooster ? (
            <Pressable
              onPress={() => handleActivateBooster(item)}
              disabled={Boolean(activeBooster) || isActionPending}
              className={cn(
                'h-10 flex-row items-center justify-center rounded-xl border-b-[3px] transition-all',
                activeBooster
                  ? 'border-neutral-200 bg-neutral-100 opacity-60'
                  : 'border-amber-700 bg-amber-500 active:translate-y-[2px] active:border-b',
              )}
            >
              {isActionPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text
                  className={cn(
                    'font-nunito text-[12px] font-extrabold uppercase',
                    activeBooster ? 'text-neutral-500' : 'text-white',
                  )}
                >
                  {activeBooster ? 'Chờ booster kết thúc' : 'SỬ DỤNG'}
                </Text>
              )}
            </Pressable>
          ) : isUnknownTheme ? (
            <View className="h-10 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-100">
              <Text className="font-nunito text-[11px] font-bold text-neutral-400 uppercase">
                CHƯA HỖ TRỢ
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={() => handleToggleEquip(item)}
              disabled={isActionPending}
              className={cn(
                'h-10 flex-row items-center justify-center rounded-xl border-b-[3px] transition-all',
                isEquipped
                  ? 'border-neutral-300 bg-neutral-100 active:translate-y-[2px] active:border-b active:bg-neutral-200'
                  : 'border-primary-700 bg-primary-500 active:translate-y-[2px] active:border-b active:bg-primary-600',
              )}
            >
              {isActionPending ? (
                <ActivityIndicator size="small" color={isEquipped ? '#15803D' : 'white'} />
              ) : (
                <Text
                  className={cn(
                    'font-nunito text-[12px] font-extrabold uppercase',
                    isEquipped ? 'text-neutral-700' : 'text-white',
                  )}
                >
                  {isEquipped ? 'THÁO RA' : isTheme ? 'SỬ DÙNG' : 'TRANG BỊ'}
                </Text>
              )}
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.surfaceTokens.background }}
      edges={['top']}
    >
      {/* 1. HEADER */}
      <View
        style={{ backgroundColor: theme.surfaceTokens.headerBg, borderColor: theme.surfaceTokens.border }}
        className="z-10 flex-row items-center justify-between border-b px-4 py-3 shadow-sm shadow-black/5"
      >
        <Pressable
          onPress={() => router.back()}
          className="-ml-2 size-10 items-center justify-center rounded-full active:bg-neutral-100"
        >
          <ArrowLeftIcon size={24} color={theme.surfaceTokens.text} />
        </Pressable>

        <Text
          style={{ color: theme.surfaceTokens.text }}
          className="font-nunito text-[18px] font-extrabold"
        >
          Kho đồ của bạn
        </Text>

        <Pressable
          onPress={() => setShowShowcase(true)}
          className="flex-row items-center gap-1 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 active:scale-95"
        >
          <SparklesIcon size={14} color="#2563EB" />
          <Text className="font-nunito text-[12px] font-extrabold text-primary-700">Phòng thử</Text>
        </Pressable>
      </View>

      {/* Feedback banner */}
      {feedbackMessage && (
        <View className="flex-row items-center justify-between bg-amber-500 px-4 py-2">
          <Text className="flex-1 font-inter text-[12px] font-bold text-white">
            {feedbackMessage}
          </Text>
          <Pressable onPress={() => setFeedbackMessage(null)} className="ml-2 px-2 py-0.5">
            <Text className="font-nunito text-[12px] font-bold text-white">Đóng</Text>
          </Pressable>
        </View>
      )}

      {/* 2. CATEGORY TABS */}
      <View
        style={{ backgroundColor: theme.surfaceTokens.surface, borderColor: theme.surfaceTokens.border }}
        className="border-b px-4 py-2"
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setActiveCategory(cat.id)}
                className={cn(
                  'rounded-full px-4 py-1.5 transition-all',
                  isActive
                    ? 'border-b-2 border-primary-700 bg-primary-500'
                    : 'border border-neutral-200 bg-neutral-100 active:bg-neutral-200',
                )}
              >
                <Text
                  className={cn(
                    'font-nunito text-[13px] font-extrabold',
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
                  Thẻ ×
                  {activeBooster.multiplier}
                  {' '}
                  Kinh Nghiệm
                </Text>
                <Text className="font-inter text-[12px] font-medium text-amber-800">
                  Đang hoạt động trong các bài học
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm">
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
            <Text className="mt-3 font-inter text-[14px] font-medium text-neutral-400">
              Đang tải kho đồ...
            </Text>
          </View>
        ) : isError ? (
          <View className="items-center justify-center rounded-3xl border border-neutral-200 bg-white p-8">
            <Snapy pose="suy_nghi" animation="idle" className="mb-4 size-24 opacity-80" />
            <Text className="mb-2 font-nunito text-[18px] font-extrabold text-mascot-navy">
              Không thể tải Kho đồ
            </Text>
            <Text className="mb-5 text-center font-inter text-[13px] text-neutral-500">
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
          <View className="items-center justify-center rounded-3xl border border-neutral-100 bg-white p-8">
            <Snapy pose="suy_nghi" animation="idle" className="mb-4 size-28 opacity-90" />
            <Text className="mb-1 font-nunito text-[20px] font-extrabold text-mascot-navy">
              Kho đồ trống
            </Text>
            <Text className="mb-6 px-4 text-center font-inter text-[14px] leading-relaxed text-neutral-500">
              Bạn chưa sở hữu vật phẩm nào trong mục này. Hãy ghé Cửa hàng để trang bị thêm nhé!
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

      {/* SHOWCASE MODAL */}
      <AvatarFrameShowcaseModal
        visible={showShowcase}
        onClose={() => setShowShowcase(false)}
      />
    </SafeAreaView>
  );
}
