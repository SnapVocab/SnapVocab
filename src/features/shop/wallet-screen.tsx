import type { CoinSourceType, WalletTransactionDTO } from './types';
import { router } from 'expo-router';
import {
  ArrowLeftIcon,
  CoinsIcon,
  GiftIcon,
  RefreshCwIcon,
  ShieldAlertIcon,
  ShoppingCartIcon,
  StarIcon,
  TargetIcon,
} from 'lucide-react-native';
import * as React from 'react';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Coin3D } from '@/components/snapvocab';
import { Snapy } from '@/components/Snapy';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { cn } from '@/lib/utils';
import { useCoinBalance, useInfiniteWallet } from './hooks/use-shop-queries';
import { useShopTheme } from './theme/theme-context';

function getSourceInfo(sourceType: CoinSourceType) {
  switch (sourceType) {
    case 'SHOP_PURCHASE':
      return {
        label: 'Mua vật phẩm',
        icon: <ShoppingCartIcon size={20} color="#64748B" />,
      };
    case 'MISSION_REWARD':
      return {
        label: 'Phần thưởng nhiệm vụ',
        icon: <TargetIcon size={20} color="#EAB308" />,
      };
    case 'DAILY_CHEST':
      return {
        label: 'Rương hàng ngày',
        icon: <GiftIcon size={20} color="#F59E0B" />,
      };
    case 'WEEKLY_CHEST':
      return {
        label: 'Rương hàng tuần',
        icon: <GiftIcon size={20} color="#8B5CF6" />,
      };
    case 'ADMIN_ADJUSTMENT':
      return {
        label: 'Điều chỉnh hệ thống',
        icon: <ShieldAlertIcon size={20} color="#3B82F6" />,
      };
    default:
      return {
        label: 'Giao dịch Coin',
        icon: <CoinsIcon size={20} color="#64748B" />,
      };
  }
}

function formatRelativeDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1)
      return 'Vừa xong';
    if (diffMins < 60)
      return `${diffMins} phút trước`;
    if (diffHours < 24)
      return `${diffHours} giờ trước`;
    if (diffDays === 1)
      return 'Hôm qua';
    if (diffDays < 7)
      return `${diffDays} ngày trước`;

    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
  catch {
    return '';
  }
}

export default function WalletScreen() {
  const { theme } = useShopTheme();
  const currentUser = useAuthStore(s => s.user);

  // Single source of truth shared with the coin pill (purchase writes it synchronously).
  const { balance: displayedBalance, refetch: refetchBalance } = useCoinBalance();

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteWallet(20);

  // Flatten all transactions from cursor pages
  const transactions = useMemo(() => {
    if (!data?.pages)
      return [];
    return data.pages.flatMap(page => page.transactions);
  }, [data]);

  // XP level calculation helper (using user exp)
  const userExp = currentUser?.exp ?? 0;
  const currentLevel = Math.max(1, Math.floor(userExp / 500) + 1);
  const currentLevelExp = userExp % 500;
  const maxLevelExp = 500;

  const renderTransaction = (tx: WalletTransactionDTO) => {
    const isEarn = tx.amount > 0;
    const info = getSourceInfo(tx.sourceType);

    return (
      <View
        key={tx.id}
        className="flex-row items-center border-b border-neutral-100 bg-white p-4"
      >
        {/* Icon */}
        <View
          className={cn(
            'mr-4 size-12 items-center justify-center rounded-2xl border',
            isEarn ? 'border-reward-100 bg-reward-50' : 'border-neutral-100 bg-neutral-50',
          )}
        >
          {info.icon}
        </View>

        {/* Content */}
        <View className="flex-1">
          <Text className="mb-0.5 font-inter text-[15px] font-bold text-mascot-navy">
            {tx.description || info.label}
          </Text>
          <Text className="font-inter text-[13px] font-medium text-neutral-400">
            {info.label}
          </Text>
          <Text className="mt-1 font-inter text-[11px] font-medium text-neutral-400">
            {formatRelativeDate(tx.createdAt)}
          </Text>
        </View>

        {/* Amount */}
        <View className="ml-2 items-end">
          <Text
            className={cn(
              'font-nunito text-[16px] font-extrabold tabular-nums',
              isEarn ? 'text-success-600' : 'text-neutral-600',
            )}
          >
            {isEarn ? `+${tx.amount}` : tx.amount}
          </Text>
          <Text className="mt-0.5 font-inter text-[10px] font-bold text-neutral-400 uppercase">
            Coin
          </Text>
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
          Ví của bạn
        </Text>

        <Pressable
          onPress={() => router.push('/(tabs)/shop' as any)}
          className="rounded-full border border-reward-200 bg-reward-50 px-3 py-1 active:scale-95"
        >
          <Text className="font-nunito text-[12px] font-extrabold text-reward-700">Cửa hàng</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={isFetching && !isFetchingNextPage}
            onRefresh={() => {
              refetch();
              refetchBalance();
            }}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        )}
      >
        {/* ========================================= */}
        {/* 2. COIN BALANCE CARD (Authoritative Balance) */}
        {/* ========================================= */}
        <View className="mb-6 items-center justify-center rounded-[32px] border-2 border-b-[6px] border-reward-200 bg-white p-6 shadow-sm shadow-reward-500/10">
          <Text className="mb-3 font-nunito text-[13px] font-extrabold tracking-widest text-neutral-400 uppercase">
            SỐ DƯ HIỆN TẠI
          </Text>

          <View className="flex-row items-center justify-center gap-3">
            <Coin3D size="lg" />
            <Text className="font-nunito text-[48px] leading-tight font-extrabold text-mascot-navy tabular-nums">
              {displayedBalance.toLocaleString()}
            </Text>
          </View>
          <Text className="mt-1 font-inter text-[15px] font-bold tracking-wider text-reward-600 uppercase">
            Coin
          </Text>
        </View>

        {/* ========================================= */}
        {/* 3. XP SUMMARY CARD */}
        {/* ========================================= */}
        <View className="mb-8 rounded-[24px] border border-primary-200 bg-primary-50 p-5">
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <StarIcon size={20} fill="#3B82F6" color="#2563EB" />
              <Text className="font-inter text-[15px] font-extrabold text-primary-800">
                Kinh nghiệm
              </Text>
            </View>
            <View className="rounded-lg border border-primary-100 bg-white px-3 py-1">
              <Text className="font-nunito text-[13px] font-extrabold text-primary-600 uppercase">
                Cấp
                {' '}
                {currentLevel}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3">
            <View className="h-3 flex-1 overflow-hidden rounded-full border border-primary-100 bg-white">
              <View
                className="h-full rounded-full bg-primary-500"
                style={{ width: `${Math.min(100, (currentLevelExp / maxLevelExp) * 100)}%` }}
              />
            </View>
            <Text className="font-nunito text-[14px] font-extrabold text-primary-800 tabular-nums">
              {currentLevelExp}
              {' '}
              /
              {maxLevelExp}
              {' '}
              XP
            </Text>
          </View>
        </View>

        {/* ========================================= */}
        {/* 4. TRANSACTION HISTORY */}
        {/* ========================================= */}
        <Text className="mb-4 ml-1 font-nunito text-[16px] font-extrabold tracking-widest text-mascot-navy uppercase">
          Lịch sử giao dịch
        </Text>

        {isLoading ? (
          <View className="items-center justify-center py-10">
            <ActivityIndicator size="large" color="#2563EB" />
            <Text className="mt-3 font-inter text-[13px] text-neutral-400">
              Đang tải lịch sử giao dịch...
            </Text>
          </View>
        ) : isError ? (
          <View className="items-center justify-center rounded-3xl border border-neutral-100 bg-white p-8">
            <Snapy pose="suy_nghi" animation="idle" className="mb-3 size-20 opacity-80" />
            <Text className="mb-2 font-nunito text-[16px] font-extrabold text-mascot-navy">
              Không thể tải lịch sử giao dịch
            </Text>
            <Pressable
              onPress={() => refetch()}
              className="flex-row items-center gap-2 rounded-xl bg-primary-500 px-4 py-2"
            >
              <RefreshCwIcon size={14} color="white" />
              <Text className="font-nunito text-[12px] font-bold text-white">Thử lại</Text>
            </Pressable>
          </View>
        ) : transactions.length === 0 ? (
          /* EMPTY STATE */
          <View className="items-center justify-center rounded-3xl border border-neutral-100 bg-white p-8">
            <Snapy pose="suy_nghi" animation="idle" className="mb-4 size-24 opacity-80" />
            <Text className="mb-2 font-nunito text-[18px] font-extrabold text-mascot-navy">
              Chưa có giao dịch nào
            </Text>
            <Text className="px-4 text-center font-inter text-[14px] font-medium text-neutral-500">
              Hãy hoàn thành bài học và nhiệm vụ để kiếm thêm Coin nhé!
            </Text>
          </View>
        ) : (
          /* TRANSACTION LIST */
          <View className="overflow-hidden rounded-[24px] border border-neutral-100 bg-white shadow-sm shadow-black/5">
            {transactions.map(renderTransaction)}

            {/* Load More Button / Indicator */}
            {hasNextPage && (
              <Pressable
                onPress={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="items-center justify-center border-t border-neutral-100 p-3.5 active:bg-neutral-50"
              >
                {isFetchingNextPage ? (
                  <ActivityIndicator size="small" color="#2563EB" />
                ) : (
                  <Text className="font-nunito text-[13px] font-extrabold text-primary-600">
                    Tải thêm giao dịch cũ hơn
                  </Text>
                )}
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
