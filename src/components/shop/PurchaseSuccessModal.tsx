import type { PurchaseResultDTO, ShopItemDTO } from '@/features/shop/types';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import { SparklesIcon, XIcon } from 'lucide-react-native';
import * as React from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Modal, Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AvatarFrame, Coin3D } from '@/components/snapvocab';
import { useSurface } from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { translate } from '@/lib/i18n';
import { ShopButton as Button } from './shop-button';
import { SHOP_TYPE_LABEL } from './shop-category-tabs';

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
  const { t, i18n } = useTranslation();
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
  const isFrame = item.type === 'AVATAR_FRAME';
  const isBooster = item.type === 'XP_BOOSTER';
  const isFreeze = item.type === 'STREAK_FREEZE';

  const effect = isBooster
    ? t('shopUi.boosterPurchaseEffect', { multiplier: item.config?.multiplier ?? 2, minutes: item.config?.durationMinutes ?? 30 })
    : isFreeze
      ? translate('shop.freeze.effect')
      : null;

  // One primary next step (use the item), one quiet secondary.
  const closeThen = (next: () => void) => () => {
    onClose();
    next();
  };
  const goInventory = closeThen(() => router.push('/profile/inventory' as any));
  const primary = isFrame && onEquipNow
    ? { label: t('shopUi.actionEquip'), onPress: closeThen(() => onEquipNow(item)) }
    : isBooster && !hasActiveBooster && onActivateNow && (result?.quantity ?? 0) > 0
      ? { label: t('shopUi.actionActivate'), onPress: closeThen(() => onActivateNow(item)) }
      : { label: t('shopUi.goToInventory'), onPress: goInventory };
  const secondary = primary.onPress === goInventory
    ? { label: t('shopUi.continueShopping'), onPress: onClose }
    : { label: t('shopUi.goToInventory'), onPress: goInventory };

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
                {result?.replayed ? t('shopUi.purchaseReplayed') : t('shopUi.purchaseSuccess')}
              </Text>
              <Text style={{ color: s.textMuted }} className="z-10 mb-5 px-3 text-center font-inter text-[14px] leading-relaxed font-medium">
                {result?.replayed ? t('shopUi.purchaseReplayLead') : t('shopUi.purchaseSuccessLead')}
                {' '}
                <Text style={{ color: s.text }} className="font-bold">{item.name}</Text>
                {' '}
                {result?.replayed ? t('shopUi.purchaseReplayTail') : t('shopUi.purchaseSuccessTail')}
                {isBooster && result ? ` ${t('shopUi.boosterQuantity', { count: result.quantity })}` : ''}
                {isFreeze && result ? ` ${translate('shop.freeze.held', { quantity: result.quantity })}` : ''}
                {result ? ` ${t('shopUi.walletBalance', { count: result.coinBalance })}.` : ''}
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
                  {t('shopUi.confirmPurchase')}
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
                      source={require('../../assets/images/shop/icon1_clean.png')}
                      style={{ width: 72, height: 72 }}
                      resizeMode="contain"
                    />
                  )}
                </View>

                <Text style={{ color: s.text }} className="mb-0.5 text-center font-nunito text-[18px] font-extrabold">
                  {item.name}
                </Text>
                <Text style={{ color: s.textMuted }} className="font-inter text-[12px] font-bold tracking-wider uppercase">
                  {t(SHOP_TYPE_LABEL[item.type])}
                </Text>
                {item.description ? (
                  <Text style={{ color: s.textMuted }} className="mt-2 px-2 text-center font-inter text-[13px] leading-relaxed">
                    {item.description}
                  </Text>
                ) : null}
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
                  <Text style={{ color: s.textMuted }} className="font-inter text-[13px] font-medium">{t('shopUi.itemPrice')}</Text>
                  <View className="flex-row items-center gap-1.5">
                    <Coin3D size="xs" />
                    <Text style={{ color: s.text }} className="font-nunito text-[15px] font-extrabold tabular-nums">
                      {item.price}
                    </Text>
                  </View>
                </View>

                <View className="mb-2.5 flex-row items-center justify-between">
                  <Text style={{ color: s.textMuted }} className="font-inter text-[13px] font-medium">{t('shopUi.youHave')}</Text>
                  <View className="flex-row items-center gap-1.5">
                    <Coin3D size="xs" />
                    <Text style={{ color: s.textMuted }} className="font-nunito text-[15px] font-extrabold tabular-nums">
                      {userCoins.toLocaleString(i18n.language)}
                    </Text>
                  </View>
                </View>

                <View style={{ height: 1, backgroundColor: s.border }} className="my-1 w-full" />

                <View className="mt-2 flex-row items-center justify-between">
                  <Text style={{ color: s.text }} className="font-inter text-[13px] font-bold">{t('shopUi.balanceAfterPurchase')}</Text>
                  <View className="flex-row items-center gap-1.5">
                    <Coin3D size="xs" />
                    <Text className="font-nunito text-[16px] font-extrabold text-reward-600 tabular-nums">
                      {remainingCoins.toLocaleString(i18n.language)}
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
                <Button variant="secondary" label={t('shopUi.cancel')} textClassName="font-nunito" className="flex-1" fullWidth={false} disabled={isPurchasing} onPress={onClose} />
                <Button variant="primary" label={t('shopUi.buy')} textClassName="font-nunito" className="flex-1" fullWidth={false} loading={isPurchasing} onPress={onConfirm} />
              </View>
            </View>
          )}

          {!isPurchasing && (
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('shopUi.close')}
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
