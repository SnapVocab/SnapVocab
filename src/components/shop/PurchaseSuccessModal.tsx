import type { ShopItemDTO } from '@/features/shop/types';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import { PackageIcon, ShoppingBagIcon, SparklesIcon, XIcon, ZapIcon } from 'lucide-react-native';
import * as React from 'react';
import { useEffect } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AvatarFrame, Coin3D } from '@/components/snapvocab';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { cn } from '@/lib/utils';

type PurchaseSuccessModalProps = {
  visible: boolean;
  item: ShopItemDTO | null;
  onClose: () => void;
  onConfirm: () => void;
  onEquipNow?: (item: ShopItemDTO) => void;
  onActivateNow?: (item: ShopItemDTO) => void;
  isPurchasing: boolean;
  purchaseSuccess: boolean;
  userCoins: number;
  hasActiveBooster?: boolean;
};

export function PurchaseSuccessModal({
  visible,
  item,
  onClose,
  onConfirm,
  onEquipNow,
  onActivateNow,
  isPurchasing,
  purchaseSuccess,
  userCoins,
  hasActiveBooster = false,
}: PurchaseSuccessModalProps) {
  const currentUser = useAuthStore(s => s.user);
  const scaleValue = useSharedValue(0.85);
  const opacityValue = useSharedValue(0);

  useEffect(() => {
    if (visible && !purchaseSuccess) {
      scaleValue.value = withSpring(1, { damping: 14, stiffness: 120 });
      opacityValue.value = withTiming(1, { duration: 200 });
    }
    else if (purchaseSuccess) {
      scaleValue.value = withSequence(
        withTiming(1.05, { duration: 150 }),
        withSpring(1, { damping: 12 }),
      );
    }
    else {
      scaleValue.value = 0.85;
      opacityValue.value = 0;
    }
  }, [visible, purchaseSuccess]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
    opacity: opacityValue.value,
  }));

  if (!item)
    return null;

  const remainingCoins = Math.max(0, userCoins - item.price);
  const isTheme = item.type === 'THEME';
  const isFrame = item.type === 'AVATAR_FRAME';
  const isBooster = item.type === 'XP_BOOSTER';

  const categoryLabel = isTheme
    ? 'Chủ đề'
    : isFrame
      ? 'Khung Avatar'
      : 'Bổ trợ';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/60 p-5">
        <Animated.View
          style={[
            animatedStyle,
            {
              backgroundColor: '#FFFFFF',
              borderRadius: 36,
              borderWidth: 2,
              borderColor: '#E2E8F0',
              borderBottomWidth: 6,
              borderBottomColor: '#CBD5E1',
              maxWidth: 350,
              width: '100%',
              overflow: 'hidden',
            },
          ]}
          className="relative items-center p-6 shadow-2xl"
        >
          {purchaseSuccess ? (
            /* ================= SUCCESS STATE ================= */
            <View className="w-full items-center py-2">
              {/* Confetti Animation */}
              <View className="pointer-events-none absolute -top-12 z-0 size-full items-center opacity-85">
                <LottieView
                  autoPlay
                  loop={false}
                  style={{ width: 270, height: 270 }}
                  source={require('../../assets/animations/confetti.json')}
                />
              </View>

              {/* Snapy Celebrating Mascot */}
              <View
                style={{
                  width: 92,
                  height: 92,
                  borderRadius: 46,
                  backgroundColor: '#FEF3C7',
                  borderWidth: 2,
                  borderColor: '#FDE68A',
                }}
                className="z-10 mb-2 items-center justify-center shadow-sm"
              >
                <Image
                  source={require('../../assets/images/mascot/actions/snapy-an-mung-trimmed.png')}
                  style={{ width: 78, height: 78 }}
                  resizeMode="contain"
                />
              </View>

              <Text className="z-10 mb-1 text-center font-nunito text-[22px] font-extrabold text-mascot-navy">
                Mở khóa thành công!
              </Text>
              <Text className="z-10 mb-5 px-3 text-center font-inter text-[13px] leading-relaxed font-medium text-neutral-500">
                Đã gửi
                {' '}
                <Text className="font-bold text-mascot-navy">{item.name}</Text>
                {' '}
                vào kho đồ cá nhân của bạn.
              </Text>

              {/* Action CTAs according to spec */}
              <View className="z-10 w-full gap-2.5">
                {/* Instant Equip or Activate CTA */}
                {isTheme && onEquipNow && (
                  <Pressable
                    onPress={() => {
                      onClose();
                      onEquipNow(item);
                    }}
                    style={{ borderRadius: 18, borderBottomWidth: 4, borderBottomColor: '#15803D' }}
                    className="h-12 w-full flex-row items-center justify-center gap-2 bg-primary-500 active:translate-y-[2px] active:border-b-2"
                  >
                    <SparklesIcon size={18} color="white" />
                    <Text className="font-nunito text-[14px] font-extrabold tracking-wide text-white uppercase">
                      Dùng ngay
                    </Text>
                  </Pressable>
                )}

                {isFrame && onEquipNow && (
                  <Pressable
                    onPress={() => {
                      onClose();
                      onEquipNow(item);
                    }}
                    style={{ borderRadius: 18, borderBottomWidth: 4, borderBottomColor: '#15803D' }}
                    className="h-12 w-full flex-row items-center justify-center gap-2 bg-primary-500 active:translate-y-[2px] active:border-b-2"
                  >
                    <SparklesIcon size={18} color="white" />
                    <Text className="font-nunito text-[14px] font-extrabold tracking-wide text-white uppercase">
                      Trang bị ngay
                    </Text>
                  </Pressable>
                )}

                {isBooster && !hasActiveBooster && onActivateNow && (
                  <Pressable
                    onPress={() => {
                      onClose();
                      onActivateNow(item);
                    }}
                    style={{ borderRadius: 18, borderBottomWidth: 4, borderBottomColor: '#B45309' }}
                    className="h-12 w-full flex-row items-center justify-center gap-2 bg-amber-500 active:translate-y-[2px] active:border-b-2"
                  >
                    <ZapIcon size={18} color="white" />
                    <Text className="font-nunito text-[14px] font-extrabold tracking-wide text-white uppercase">
                      Kích hoạt ngay
                    </Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={() => {
                    onClose();
                    router.push('/profile/inventory' as any);
                  }}
                  style={{
                    borderRadius: 18,
                    borderBottomWidth: 4,
                    borderBottomColor: '#15803D',
                  }}
                  className="h-12 w-full flex-row items-center justify-center gap-2 bg-primary-500 active:translate-y-[2px] active:border-b-2"
                >
                  <PackageIcon size={18} color="white" />
                  <Text className="font-nunito text-[14px] font-extrabold tracking-wide text-white uppercase">
                    Đến Kho đồ
                  </Text>
                </Pressable>

                <Pressable
                  onPress={onClose}
                  style={{ borderRadius: 16 }}
                  className="h-11 w-full flex-row items-center justify-center gap-2 bg-neutral-100 active:bg-neutral-200"
                >
                  <ShoppingBagIcon size={16} color="#757793" />
                  <Text className="font-inter text-[14px] font-bold text-neutral-600">
                    Tiếp tục dạo Shop
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            /* ================= CONFIRMATION STATE ================= */
            <View className="w-full items-center pt-1">
              {/* Header Pill */}
              <View
                style={{ borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' }}
                className="mb-3.5 flex-row items-center gap-1.5 px-3.5 py-1"
              >
                <SparklesIcon size={13} color="#FF8A00" />
                <Text className="font-nunito text-[12px] font-extrabold tracking-wider text-mascot-navy uppercase">
                  Xác nhận mở khóa
                </Text>
              </View>

              {/* Artwork Box */}
              <View className="mb-4 items-center">
                <View
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 30,
                    borderWidth: 2,
                    borderColor: '#FFFFFF',
                  }}
                  className="mb-2.5 items-center justify-center bg-amber-50 shadow-sm"
                >
                  {isFrame ? (
                    <AvatarFrame
                      frameId={item.code}
                      frameUrl={item.config?.frameUrl}
                      avatarUri={currentUser?.avatarUrl}
                      avatarSource={require('../../assets/images/snapy-happy.png')}
                      size="sm"
                      animated
                      showGlow={false}
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

                <Text className="mb-0.5 text-center font-nunito text-[18px] font-extrabold text-mascot-navy">
                  {item.name}
                </Text>
                <Text className="font-inter text-[11px] font-bold tracking-wider text-neutral-400 uppercase">
                  {categoryLabel}
                </Text>
              </View>

              {/* Price Breakdown Card */}
              <View
                style={{
                  borderRadius: 20,
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1.5,
                  borderColor: '#F1F5F9',
                }}
                className="mb-5 w-full p-3.5"
              >
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="font-inter text-[13px] font-medium text-neutral-500">Giá mở khóa:</Text>
                  <View className="flex-row items-center gap-1.5">
                    <Coin3D size="xs" />
                    <Text className="font-nunito text-[15px] font-extrabold text-mascot-navy tabular-nums">
                      {item.price}
                    </Text>
                  </View>
                </View>

                <View className="mb-2.5 flex-row items-center justify-between">
                  <Text className="font-inter text-[13px] font-medium text-neutral-500">Số dư hiện tại:</Text>
                  <View className="flex-row items-center gap-1.5">
                    <Coin3D size="xs" />
                    <Text className="font-nunito text-[15px] font-extrabold text-neutral-600 tabular-nums">
                      {userCoins.toLocaleString()}
                    </Text>
                  </View>
                </View>

                <View style={{ height: 1, backgroundColor: '#E2E8F0' }} className="my-1 w-full" />

                <View className="mt-2 flex-row items-center justify-between">
                  <Text className="font-inter text-[13px] font-bold text-mascot-navy">Số dư sau mua:</Text>
                  <View className="flex-row items-center gap-1.5">
                    <Coin3D size="xs" />
                    <Text className="font-nunito text-[16px] font-extrabold text-reward-600 tabular-nums">
                      {remainingCoins.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="w-full flex-row gap-3">
                <Pressable
                  onPress={onClose}
                  disabled={isPurchasing}
                  style={{ borderRadius: 16 }}
                  className="h-12 flex-1 items-center justify-center bg-neutral-100 active:bg-neutral-200"
                >
                  <Text className="font-nunito text-[14px] font-bold text-neutral-600">
                    Hủy
                  </Text>
                </Pressable>

                <Pressable
                  onPress={onConfirm}
                  disabled={isPurchasing}
                  style={{
                    borderRadius: 16,
                    borderBottomWidth: 4,
                    borderBottomColor: '#15803D',
                  }}
                  className={cn(
                    'h-12 flex-1 flex-row items-center justify-center gap-2 bg-primary-500 active:translate-y-[2px] active:border-b-2',
                    isPurchasing && 'opacity-70',
                  )}
                >
                  {isPurchasing ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Coin3D size="xs" />
                      <Text className="font-nunito text-[14px] font-extrabold tracking-wide text-white uppercase">
                        Xác nhận
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          )}

          {/* Close button in confirmation state */}
          {!purchaseSuccess && !isPurchasing && (
            <Pressable
              onPress={onClose}
              style={{ borderRadius: 20 }}
              className="absolute top-4 right-4 size-8 items-center justify-center bg-neutral-100 active:bg-neutral-200"
            >
              <XIcon size={16} color="#757793" />
            </Pressable>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}
