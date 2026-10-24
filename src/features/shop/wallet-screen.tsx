import type { CoinSourceType, WalletTransactionDTO } from './types';
import { router } from 'expo-router';
import {
  CoinsIcon,
  GiftIcon,
  RefreshCwIcon,
  ShieldAlertIcon,
  ShoppingCartIcon,
  TargetIcon,
} from 'lucide-react-native';
import * as React from 'react';
import { useMemo } from 'react';
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
import { Coin3D } from '@/components/snapvocab';
import { Snapy } from '@/components/Snapy';
import { ScreenHeader, useSurface } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useCoinBalance, useInfiniteWallet } from './hooks/use-shop-queries';
import { ShopSurface } from './theme/theme-context';

function getSourceInfo(sourceType: CoinSourceType, t: (key: string) => string) {
  switch (sourceType) {
    case 'SHOP_PURCHASE':
      return {
        label: t('shopUi.sourcePurchase'),
        icon: <ShoppingCartIcon size={20} color="#64748B" />,
      };
    case 'MISSION_REWARD':
      return {
        label: t('shopUi.sourceMission'),
        icon: <TargetIcon size={20} color="#EAB308" />,
      };
    case 'DAILY_CHEST':
      return {
        label: t('shopUi.sourceDailyChest'),
        icon: <GiftIcon size={20} color="#F59E0B" />,
      };
    case 'WEEKLY_CHEST':
      return {
        label: t('shopUi.sourceWeeklyChest'),
        icon: <GiftIcon size={20} color="#8B5CF6" />,
      };
    case 'ADMIN_ADJUSTMENT':
      return {
        label: t('shopUi.sourceAdmin'),
        icon: <ShieldAlertIcon size={20} color="#3B82F6" />,
      };
    default:
      return {
        label: t('shopUi.sourceGeneric'),
        icon: <CoinsIcon size={20} color="#64748B" />,
      };
  }
}

function formatRelativeDate(isoString: string, t: (key: string, options?: Record<string, unknown>) => string): string {
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime()))
      return '';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    // Calendar days, not 24h blocks: 25h before 01:00 is the day before yesterday, not "Hôm qua".
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);

    if (diffMins < 1)
      return t('shopUi.justNow');
    if (diffMins < 60)
      return t('shopUi.minutesAgo', { count: diffMins });
    if (diffHours < 24)
      return t('shopUi.hoursAgo', { count: diffHours });
    if (diffDays === 1)
      return t('shopUi.yesterday');
    if (diffDays < 7)
      return t('shopUi.daysAgo', { count: diffDays });

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

/** Shop-area screen: it and its modals take the equipped theme's surfaces. */
export default function WalletScreen() {
  return (
    <ShopSurface>
      <WalletScreenContent />
    </ShopSurface>
  );
}

function WalletScreenContent() {
  const s = useSurface();
  const { t, i18n } = useTranslation();

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

  const renderTransaction = (tx: WalletTransactionDTO) => {
    const isEarn = tx.amount > 0;
    const info = getSourceInfo(tx.sourceType, t);

    return (
      <View
        key={tx.id}
        style={{ backgroundColor: s.surface, borderColor: s.border }}
        className="flex-row items-center border-b p-4"
      >
        {/* Icon */}
        <View
          style={isEarn ? undefined : { backgroundColor: s.surfaceMuted }}
          className={cn(
            'mr-4 size-12 items-center justify-center rounded-2xl border',
            isEarn ? 'border-reward-100 bg-reward-50' : 'border-transparent',
          )}
        >
          {info.icon}
        </View>

        {/* Content */}
        <View className="flex-1">
          <Text style={{ color: s.text }} className="mb-0.5 font-inter text-[15px] font-bold">
            {tx.description || info.label}
          </Text>
          <Text style={{ color: s.textMuted }} className="font-inter text-[13px] font-medium">
            {info.label}
          </Text>
          <Text style={{ color: s.textMuted }} className="mt-1 font-inter text-[12px] font-medium">
            {formatRelativeDate(tx.createdAt, t)}
          </Text>
        </View>

        {/* Amount */}
        <View className="ml-2 items-end">
          <Text
            style={isEarn ? undefined : { color: s.text }}
            className={cn('font-nunito text-[16px] font-extrabold tabular-nums', isEarn && 'text-success-600')}
          >
            {isEarn ? `+${tx.amount.toLocaleString('vi-VN')}` : tx.amount.toLocaleString('vi-VN')}
          </Text>
          <Text style={{ color: s.textMuted }} className="mt-0.5 font-inter text-[11px] font-bold uppercase">
            Coin
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: s.background }}
      edges={['top']}
    >
      {/* Coin only: level/XP lives in Progress, from the backend's level table. */}
      <ScreenHeader
        title={t('shopUi.walletTitle')}
        onBack={() => router.back()}
        right={(
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(tabs)/shop' as any)}
            className="rounded-full border border-reward-200 bg-reward-50 px-3 py-1.5 active:scale-95"
          >
            <Text className="font-nunito text-[13px] font-extrabold text-reward-700">{t('shop.title')}</Text>
          </Pressable>
        )}
      />

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
        <View style={{ backgroundColor: s.surface }} className="mb-8 items-center justify-center rounded-[32px] border-2 border-b-[6px] border-reward-200 p-6 shadow-sm shadow-reward-500/10">
          <Text style={{ color: s.textMuted }} className="mb-3 font-nunito text-[13px] font-extrabold tracking-widest uppercase">
            {t('shopUi.inventoryBalanceTitle')}
          </Text>

          <View className="flex-row items-center justify-center gap-3">
            <Coin3D size="lg" />
            <Text style={{ color: s.text }} className="font-nunito text-[48px] leading-tight font-extrabold tabular-nums">
              {displayedBalance.toLocaleString(i18n.language)}
            </Text>
          </View>
          <Text className="mt-1 font-inter text-[15px] font-bold tracking-wider text-reward-600 uppercase">
            Coin
          </Text>
        </View>

        {/* ========================================= */}
        {/* 4. TRANSACTION HISTORY */}
        {/* ========================================= */}
        <Text style={{ color: s.text }} className="mb-4 ml-1 font-nunito text-[16px] font-extrabold">
          {t('shopUi.transactionHistory')}
        </Text>

        {isLoading ? (
          <View className="items-center justify-center py-10">
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={{ color: s.textMuted }} className="mt-3 font-inter text-[13px]">
              {t('shopUi.walletLoading')}
            </Text>
          </View>
        ) : isError ? (
          <View style={{ backgroundColor: s.surface, borderColor: s.border }} className="items-center justify-center rounded-3xl border p-8">
            <Snapy pose="suy_nghi" animation="idle" className="mb-3 size-20 opacity-80" />
            <Text style={{ color: s.text }} className="mb-2 font-nunito text-[16px] font-extrabold">
              {t('shopUi.walletErrorTitle')}
            </Text>
            <Pressable
              onPress={() => refetch()}
              className="flex-row items-center gap-2 rounded-xl bg-primary-500 px-4 py-2"
            >
              <RefreshCwIcon size={14} color="white" />
              <Text className="font-nunito text-[12px] font-bold text-white">{t('shopUi.retry')}</Text>
            </Pressable>
          </View>
        ) : transactions.length === 0 ? (
          /* EMPTY STATE */
          <View style={{ backgroundColor: s.surface, borderColor: s.border }} className="items-center justify-center rounded-3xl border p-8">
            <Snapy pose="suy_nghi" animation="idle" className="mb-4 size-24 opacity-80" />
            <Text style={{ color: s.text }} className="mb-2 font-nunito text-[18px] font-extrabold">
              {t('shopUi.walletEmptyTitle')}
            </Text>
            <Text style={{ color: s.textMuted }} className="px-4 text-center font-inter text-[14px] font-medium">
              {t('shopUi.walletEmptyBody')}
            </Text>
          </View>
        ) : (
          /* TRANSACTION LIST */
          <View style={{ backgroundColor: s.surface, borderColor: s.border }} className="overflow-hidden rounded-[24px] border shadow-sm shadow-black/5">
            {transactions.map(renderTransaction)}

            {/* Load More Button / Indicator */}
            {hasNextPage && (
              <Pressable
                onPress={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                style={{ borderColor: s.border }}
                className="items-center justify-center border-t p-3.5 active:opacity-70"
              >
                {isFetchingNextPage ? (
                  <ActivityIndicator size="small" color="#2563EB" />
                ) : (
                  <Text className="font-nunito text-[13px] font-extrabold text-primary-600">
                    {t('shopUi.loadOlderTransactions')}
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
