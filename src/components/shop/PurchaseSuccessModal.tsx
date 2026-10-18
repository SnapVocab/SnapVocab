import type { PurchaseResultDTO, ShopItemDTO } from '@/features/shop/types';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import { SparklesIcon, XIcon } from 'lucide-react-native';
import * as React from 'react';
import { useEffect } from 'react';
import { Image, Modal, Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AvatarFrame, Coin3D } from '@/components/snapvocab';
import { Button, useSurface } from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { translate } from '@/lib/i18n';
import { shopTypeLabel } from './shop-category-tabs';

type PurchaseSuccessModalProps = {
  visible: boolean;
  item: ShopItemDTO | null;
  onClose: () => void;
  onConfirm: () => void;
  onEquipNow?: (item: ShopItemDTO) => void;
  onActivateNow?: (item: ShopItemDTO) => void;
  isPurchasing: boolean;
  /** Server result once the purchase is confirmed; null while confirming. */
  result: PurchaseResultDTO | null;
  userCoins: number;
  hasActiveBooster?: boolean;
  /** Purchase failure shown inside the modal, where the user is looking. */
  errorMessage?: string | null;
};

export function PurchaseSuccessModal({
  visible,
  item,
  onClose,
  onConfirm,
  onEquipNow,
  onActivateNow,
  isPurchasing,
  result,
  userCoins,
  hasActiveBooster = false,
  errorMessage,
}: PurchaseSuccessModalProps) {
  const s = useSurface();
  const currentUser = useAuthStore(state => state.user);
  const purchaseSuccess = Boolean(result);
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

  const effect = isBooster
    ? translate('shop.purchase.booster_effect', { multiplier: item.config?.multiplier ?? 2, minutes: item.config?.durationMinutes ?? 30 })
    : null;

  // One primary next step (use the item), one quiet secondary.
  const closeThen = (next: () => void) => () => {
    onClose();
    next();
  };
  const goInventory = closeThen(() => router.push('/profile/inventory' as any));
  const primary = (isTheme || isFrame) && onEquipNow
    ? { label: translate(isTheme ? 'shop.actions.apply_theme' : 'shop.actions.equip_frame'), onPress: closeThen(() => onEquipNow(item)) }
    : isBooster && !hasActiveBooster && onActivateNow && (result?.quantity ?? 0) > 0
      ? { label: translate('shop.actions.activate_booster'), onPress: closeThen(() => onActivateNow(item)) }
      : { label: translate('shop.purchase.view_inventory'), onPress: goInventory };
  const secondary = primary.onPress === goInventory
    ? { label: translate('shop.purchase.keep_shopping'), onPress: onClose }
    : { label: translate('shop.purchase.view_inventory'), onPress: goInventory };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/60 p-5">
        <Animated.View
          style={[
            animatedStyle,
            {
              backgroundColor: s.surface,
              borderRadius: 36,
              borderWidth: 2,
              borderColor: s.border,
              borderBottomWidth: 6,
              borderBottomColor: s.border,
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

              <Text style={{ color: s.text }} className="z-10 mb-1 text-center font-nunito text-[22px] font-extrabold">
                {translate(result?.replayed ? 'shop.purchase.replayed_title' : 'shop.purchase.success_title')}
              </Text>
              <Text style={{ color: s.textMuted }} className="z-10 mb-5 px-3 text-center font-inter text-[14px] leading-relaxed font-medium">
                {translate(result?.replayed ? 'shop.purchase.replayed_prefix' : 'shop.purchase.success_prefix')}
                {' '}
                <Text style={{ color: s.text }} className="font-bold">{item.name}</Text>
                {' '}
                {translate(result?.replayed ? 'shop.purchase.replayed_suffix' : 'shop.purchase.success_suffix')}
                {isBooster && result ? ` ${translate('shop.purchase.quantity', { quantity: result.quantity })}` : ''}
                {result ? ` ${translate('shop.purchase.new_balance', { balance: result.coinBalance.toLocaleString('vi-VN') })}` : ''}
              </Text>

              <View className="z-10 w-full gap-2">
                <Button variant="primary" label={primary.label} textClassName="font-nunito" onPress={primary.onPress} />
                <Button variant="ghost" label={secondary.label} textClassName="font-nunito" onPress={secondary.onPress} />
              </View>
            </View>
          ) : (
            /* ================= CONFIRMATION STATE ================= */
            <View className="w-full items-center pt-1">
              {/* Header Pill */}
              <View
                style={{ borderRadius: 20, backgroundColor: s.surfaceMuted, borderWidth: 1, borderColor: s.border }}
                className="mb-3.5 flex-row items-center gap-1.5 px-3.5 py-1"
              >
                <SparklesIcon size={13} color="#FF8A00" />
                <Text style={{ color: s.text }} className="font-nunito text-[12px] font-extrabold tracking-wider uppercase">
                  {translate('shop.purchase.confirm_title')}
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
                    borderColor: s.surface,
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

                <Text style={{ color: s.text }} className="mb-0.5 text-center font-nunito text-[18px] font-extrabold">
                  {item.name}
                </Text>
                <Text style={{ color: s.textMuted }} className="font-inter text-[12px] font-bold tracking-wider uppercase">
                  {shopTypeLabel(item.type)}
                </Text>
                {item.description ? (
                  <Text style={{ color: s.textMuted }} className="mt-2 px-2 text-center font-inter text-[13px] leading-relaxed">
                    {item.description}
                  </Text>
                ) : null}
                {isTheme && (
                  <Text style={{ color: s.text }} className="mt-1.5 px-2 text-center font-inter text-[13px] font-semibold">
                    {translate('shop.theme.scope')}
                  </Text>
                )}
                {effect && (
                  <Text className="mt-1.5 px-2 text-center font-inter text-[13px] leading-relaxed font-semibold text-amber-700">
                    {effect}
                  </Text>
                )}
              </View>

              {/* Price Breakdown Card */}
              <View
                style={{
                  borderRadius: 20,
                  backgroundColor: s.surfaceMuted,
                  borderWidth: 1.5,
                  borderColor: s.border,
                }}
                className="mb-5 w-full p-3.5"
              >
                <View className="mb-2 flex-row items-center justify-between">
                  <Text style={{ color: s.textMuted }} className="font-inter text-[13px] font-medium">{translate('shop.purchase.price')}</Text>
                  <View className="flex-row items-center gap-1.5">
                    <Coin3D size="xs" />
                    <Text style={{ color: s.text }} className="font-nunito text-[15px] font-extrabold tabular-nums">
                      {item.price}
                    </Text>
                  </View>
                </View>

                <View className="mb-2.5 flex-row items-center justify-between">
                  <Text style={{ color: s.textMuted }} className="font-inter text-[13px] font-medium">{translate('shop.purchase.balance_now')}</Text>
                  <View className="flex-row items-center gap-1.5">
                    <Coin3D size="xs" />
                    <Text style={{ color: s.textMuted }} className="font-nunito text-[15px] font-extrabold tabular-nums">
                      {userCoins.toLocaleString()}
                    </Text>
                  </View>
                </View>

                <View style={{ height: 1, backgroundColor: s.border }} className="my-1 w-full" />

                <View className="mt-2 flex-row items-center justify-between">
                  <Text style={{ color: s.text }} className="font-inter text-[13px] font-bold">{translate('shop.purchase.balance_after')}</Text>
                  <View className="flex-row items-center gap-1.5">
                    <Coin3D size="xs" />
                    <Text className="font-nunito text-[16px] font-extrabold text-reward-600 tabular-nums">
                      {remainingCoins.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>

              {errorMessage && (
                <View accessibilityRole="alert" className="mb-3 w-full rounded-2xl border border-amber-200 bg-amber-50 p-3">
                  <Text className="font-inter text-[13px] font-semibold text-amber-800">{errorMessage}</Text>
                </View>
              )}

              <View className="w-full flex-row gap-3">
                <Button variant="secondary" label={translate('shop.purchase.cancel')} textClassName="font-nunito" className="flex-1" fullWidth={false} disabled={isPurchasing} onPress={onClose} />
                <Button variant="primary" label={translate('shop.actions.buy')} textClassName="font-nunito" className="flex-1" fullWidth={false} loading={isPurchasing} onPress={onConfirm} />
              </View>
            </View>
          )}

          {!isPurchasing && (
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={translate('shop.close')}
              hitSlop={8}
              style={{ borderRadius: 20, backgroundColor: s.surfaceMuted }}
              className="absolute top-4 right-4 z-20 size-8 items-center justify-center active:opacity-70"
            >
              <XIcon size={16} color="#757793" />
            </Pressable>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}
