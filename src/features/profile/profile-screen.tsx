import { useRouter } from 'expo-router';
import { CoinsIcon, PackageIcon, ShoppingBagIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AvatarFrame, Coin3D } from '@/components/snapvocab';
import { Button, FocusAwareStatusBar, SafeAreaView, Text, UserAvatar } from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useCoinBalance, useInventory } from '@/features/shop';

export function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);

  const { balance: coinBalance } = useCoinBalance();
  const { data: inventoryData, refetch: refetchInventory } = useInventory();

  // Find equipped avatar frame from backend inventory
  const equippedFrame = inventoryData?.items.find(
    i => i.type === 'AVATAR_FRAME' && i.equipped,
  );

  const handleLogout = () => {
    logout();
    router.replace('/welcome');
  };

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ''}`.trim()
    : 'SnapVocab Learner';

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <ScrollView
        contentContainerStyle={{ padding: 24, alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        {/* User Avatar with Equipped Avatar Frame */}
        <View className="mt-4 mb-6 items-center">
          <AvatarFrame
            frameId={equippedFrame?.code}
            frameUrl={equippedFrame?.config?.frameUrl}
            size="hero"
            animated
            showGlow
            onFrameError={() => refetchInventory()}
          >
            <UserAvatar
              url={user?.avatarUrl}
              name={user?.firstName ?? user?.email}
              size={96}
            />
          </AvatarFrame>

          <Text className="mt-4 text-2xl font-black text-mascot-navy dark:text-white">
            {displayName}
          </Text>
          <Text className="mt-1 text-sm font-medium text-neutral-400">
            {user?.email ?? ''}
          </Text>

          {/* Quick Balance Pill */}
          <Pressable
            onPress={() => router.push('/profile/wallet' as any)}
            className="mt-3 flex-row items-center gap-1.5 rounded-full border border-reward-200 bg-reward-50 px-4 py-1.5 active:scale-95"
          >
            <Coin3D size="xs" />
            <Text className="font-nunito text-[15px] font-extrabold text-reward-700 tabular-nums">
              {coinBalance.toLocaleString()}
              {' '}
              Coin
            </Text>
          </Pressable>
        </View>

        {/* Shortcuts Section */}
        <View className="mb-8 w-full gap-3">
          {/* Inventory Link */}
          <Pressable
            onPress={() => router.push('/profile/inventory' as any)}
            className="flex-row items-center justify-between rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm active:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <View className="flex-row items-center gap-3">
              <View className="size-10 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-950">
                <PackageIcon size={20} color="#2563EB" />
              </View>
              <View>
                <Text className="font-nunito text-[16px] font-extrabold text-mascot-navy dark:text-white">
                  Kho đồ cá nhân
                </Text>
                <Text className="font-inter text-[12px] text-neutral-400">
                  Quản lý khung avatar, chủ đề và booster
                </Text>
              </View>
            </View>
          </Pressable>

          {/* Wallet Link */}
          <Pressable
            onPress={() => router.push('/profile/wallet' as any)}
            className="flex-row items-center justify-between rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm active:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <View className="flex-row items-center gap-3">
              <View className="size-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950">
                <CoinsIcon size={20} color="#D97706" />
              </View>
              <View>
                <Text className="font-nunito text-[16px] font-extrabold text-mascot-navy dark:text-white">
                  Ví Coin
                </Text>
                <Text className="font-inter text-[12px] text-neutral-400">
                  Lịch sử nhận và chi tiêu Coin
                </Text>
              </View>
            </View>
          </Pressable>

          {/* Shop Link */}
          <Pressable
            onPress={() => router.push('/(tabs)/shop' as any)}
            className="flex-row items-center justify-between rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm active:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <View className="flex-row items-center gap-3">
              <View className="size-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950">
                <ShoppingBagIcon size={20} color="#9333EA" />
              </View>
              <View>
                <Text className="font-nunito text-[16px] font-extrabold text-mascot-navy dark:text-white">
                  Cửa hàng SnapVocab
                </Text>
                <Text className="font-inter text-[12px] text-neutral-400">
                  Khám phá vật phẩm và ưu đãi
                </Text>
              </View>
            </View>
          </Pressable>
        </View>

        {/* Sign Out */}
        <Button
          label="Đăng xuất"
          variant="danger"
          size="default"
          onPress={handleLogout}
          className="w-full max-w-xs"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
