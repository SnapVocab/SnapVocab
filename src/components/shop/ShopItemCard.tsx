import type { ShopItemDTO } from '@/features/shop/types';
import { CheckIcon } from 'lucide-react-native';
import * as React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { AvatarFrame, Coin3D } from '@/components/snapvocab';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { cn } from '@/lib/utils';

export type ShopItemCardProps = {
  item: ShopItemDTO;
  onPress: (item: ShopItemDTO) => void;
  onPreview?: (item: ShopItemDTO) => void;
  userCoins: number;
};

export function ShopItemCard({
  item,
  onPress,
  onPreview,
  userCoins,
}: ShopItemCardProps) {
  const currentUser = useAuthStore(s => s.user);
  const isTheme = item.type === 'THEME';
  const isFrame = item.type === 'AVATAR_FRAME';
  const isBooster = item.type === 'XP_BOOSTER';

  const isEquipped = item.equipped;
  const isOwnedCosmetic = (isTheme || isFrame) && item.owned;
  const isMaxBooster = isBooster && item.blockReason === 'MAX_QUANTITY_REACHED';
  const isOutOfCoin = item.blockReason === 'INSUFFICIENT_COINS' || userCoins < item.price;

  // Background styling based on type
  const bgClass = isTheme
    ? 'bg-purple-50'
    : isFrame
      ? 'bg-amber-50'
      : 'bg-emerald-50';

  // Category label
  const categoryLabel = isTheme
    ? 'Chủ đề'
    : isFrame
      ? 'Khung Avatar'
      : 'Bổ trợ';

  const handleCardPress = () => {
    if ((isTheme || isFrame) && onPreview) {
      onPreview(item);
    }
    else {
      onPress(item);
    }
  };

  return (
    <Pressable
      onPress={handleCardPress}
      style={{ overflow: 'hidden' }}
      className="mb-3.5 w-[48%] flex-col justify-between rounded-[22px] border border-b-[3px] border-neutral-200/90 bg-white shadow-sm active:opacity-95"
    >
      {/* 1. Artwork Area (Compact ~100px height, 25% larger asset) */}
      <View
        style={{ height: 100, overflow: 'hidden' }}
        className={cn('relative items-center justify-center p-2', bgClass)}
      >
        {/* Quantity Owned for XP Booster */}
        {isBooster && item.quantity > 0 && (
          <View className="absolute top-2 right-2 z-10 rounded-full bg-mascot-navy px-2 py-0.5 shadow-sm">
            <Text className="font-nunito text-[10px] font-extrabold text-white tabular-nums">
              x
              {item.quantity}
              {item.config?.maxQuantity ? `/${item.config.maxQuantity}` : ''}
            </Text>
          </View>
        )}

        {/* Artwork Display - Frame scaled up to 88px, uses learner avatar with Snapy fallback */}
        {isFrame ? (
          <View className="items-center justify-center">
            <AvatarFrame
              frameId={item.code}
              frameUrl={item.config?.frameUrl}
              avatarUri={currentUser?.avatarUrl}
              avatarSource={require('../../assets/images/snapy-happy.png')}
              size={88}
              animated
              showGlow={false}
            />
          </View>
        ) : item.iconUrl ? (
          <Image
            source={{ uri: item.iconUrl }}
            style={{ width: 76, height: 76 }}
            resizeMode="contain"
          />
        ) : (
          <Image
            source={
              isTheme
                ? require('../../assets/images/shop/icon8_clean.png')
                : require('../../assets/images/shop/icon1_clean.png')
            }
            style={{ width: 76, height: 76 }}
            resizeMode="contain"
          />
        )}
      </View>

      {/* 2. Info Area (Full 2-line title, compact 2-line description) */}
      <View className="flex-1 justify-between bg-white p-2.5 pt-2">
        <View>
          <Text className="mb-0.5 font-nunito text-[9.5px] font-extrabold tracking-wider text-neutral-400 uppercase">
            {categoryLabel}
          </Text>
          <Text
            className="mb-1 font-nunito text-[14px] leading-tight font-extrabold text-mascot-navy"
            numberOfLines={2}
            style={{ minHeight: 34 }}
          >
            {item.name}
          </Text>
          <Text
            className="mb-2.5 font-nunito text-[11px] leading-snug font-semibold text-neutral-500"
            numberOfLines={2}
            style={{ minHeight: 28 }}
          >
            {item.description}
          </Text>
        </View>

        {/* 3. Action CTA Button (Tactile 3D, Positive Economy) */}
        {isEquipped ? (
          <View className="h-9 flex-row items-center justify-center gap-1 rounded-xl border-b-2 border-primary-200 bg-primary-50">
            <CheckIcon size={14} color="#15803D" />
            <Text className="font-nunito text-[11.5px] font-extrabold tracking-wide text-primary-700 uppercase">
              ĐANG DÙNG
            </Text>
          </View>
        ) : isOwnedCosmetic ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onPress(item);
            }}
            className="h-9 flex-row items-center justify-center gap-1 rounded-xl border-b-[3px] border-primary-700 bg-primary-500 active:translate-y-[2px] active:border-b"
          >
            <Text className="font-nunito text-[11.5px] font-extrabold tracking-wide text-white uppercase">
              {isTheme ? 'SỬ DÙNG' : 'TRANG BỊ'}
            </Text>
          </Pressable>
        ) : isMaxBooster ? (
          <View className="h-9 flex-row items-center justify-center rounded-xl border-b-2 border-neutral-200 bg-neutral-100">
            <Text className="font-nunito text-[11px] font-extrabold tracking-wide text-neutral-400 uppercase">
              ĐÃ ĐẠT TỐI ĐA
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onPress(item);
            }}
            className={cn(
              'h-9 flex-row items-center justify-center rounded-xl border-b-[3px] transition-all',
              isOutOfCoin
                ? 'border-amber-300 bg-amber-50 active:translate-y-[2px] active:border-b active:bg-amber-100'
                : 'border-primary-700 bg-primary-500 active:translate-y-[2px] active:border-b active:bg-primary-600',
            )}
          >
            {isOutOfCoin ? (
              <View className="flex-row items-center gap-1">
                <Coin3D size="xs" />
                <Text className="font-nunito text-[12.5px] font-extrabold text-amber-800 tabular-nums">
                  {item.price}
                </Text>
                <Text className="font-nunito text-[10.5px] font-bold text-amber-700">
                  · Cần thêm
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center gap-1">
                <Text className="font-nunito text-[12px] font-extrabold text-white">
                  Mua ·
                </Text>
                <Coin3D size="xs" />
                <Text className="font-nunito text-[13px] font-extrabold text-white tabular-nums">
                  {item.price}
                </Text>
              </View>
            )}
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}
