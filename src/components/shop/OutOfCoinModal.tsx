import type { ShopItemDTO } from '@/features/shop/types';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import { BookOpenIcon, TargetIcon, XIcon } from 'lucide-react-native';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Coin3D } from '@/components/snapvocab';
import { useSurface } from '@/components/ui';
import { translate } from '@/lib/i18n';

type OutOfCoinModalProps = {
  visible: boolean;
  item: ShopItemDTO | null;
  userCoins: number;
  onClose: () => void;
};

export function OutOfCoinModal({
  visible,
  item,
  userCoins,
  onClose,
}: OutOfCoinModalProps) {
  const s = useSurface();
  const { t, i18n } = useTranslation();
  const scaleValue = useSharedValue(0.85);
  const opacityValue = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      scaleValue.value = withSpring(1, { damping: 14, stiffness: 120 });
      opacityValue.value = withTiming(1, { duration: 200 });
    }
    else {
      scaleValue.value = 0.85;
      opacityValue.value = 0;
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
    opacity: opacityValue.value,
  }));

  if (!item)
    return null;

  const missingCoins = Math.max(0, item.price - userCoins);

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
              borderColor: '#FED7AA',
              borderBottomWidth: 6,
              borderBottomColor: '#FDBA74',
              maxWidth: 350,
              width: '100%',
              overflow: 'hidden',
            },
          ]}
          className="relative items-center p-6 shadow-2xl"
        >
          {/* Close button */}
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('shopUi.close')}
            hitSlop={8}
            style={{ borderRadius: 20, backgroundColor: s.surfaceMuted }}
            className="absolute top-4 right-4 z-10 size-8 items-center justify-center active:opacity-70"
          >
            <XIcon size={16} color="#757793" />
          </Pressable>

          {/* Snapy Mascot in soft circular badge */}
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: '#FFF7ED',
              borderWidth: 2,
              borderColor: '#FFEDD5',
            }}
            className="mb-3 items-center justify-center shadow-sm"
          >
            <ExpoImage
              source={require('../../assets/images/snapy-curious.png')}
              style={{ width: 80, height: 80 }}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
          </View>

          {/* Title & Guidance */}
          <Text style={{ color: s.text }} className="mb-1 text-center font-nunito text-[22px] font-extrabold">
            {t('shopUi.outOfCoinsTitle')}
          </Text>
          <Text style={{ color: s.textMuted }} className="mb-4 px-2 text-center font-inter text-[13px] leading-relaxed font-medium">
            {/* The server said "not enough" but the local balance disagrees: it is stale, so no number. */}
            {missingCoins > 0
              ? t('shopUi.outOfCoinsNeed', { count: missingCoins, name: item.name })
              : t('shopUi.outOfCoinsNeedUnknown', { name: item.name })}
          </Text>

          {/* Price & Balance Pill */}
          <View
            style={{ borderRadius: 18, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FEF3C7' }}
            className="mb-5 w-full flex-row items-center justify-around py-3"
          >
            <View className="items-center">
              <Text className="mb-1 font-inter text-[11px] font-bold text-amber-800 uppercase">{t('shopUi.itemPrice')}</Text>
              <View className="flex-row items-center gap-1.5">
                <Coin3D size="xs" />
                <Text className="font-nunito text-[16px] font-extrabold text-amber-900 tabular-nums">
                  {item.price.toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={{ width: 1, height: 28, backgroundColor: '#FDE68A' }} />

            <View className="items-center">
              <Text className="mb-1 font-inter text-[11px] font-bold text-neutral-400 uppercase">{t('shopUi.youHave')}</Text>
              <View className="flex-row items-center gap-1.5">
                <Coin3D size="xs" />
                <Text className="font-nunito text-[16px] font-extrabold text-neutral-700 tabular-nums">
                  {userCoins.toLocaleString(i18n.language)}
                </Text>
              </View>
            </View>
          </View>

          {/* Earn Coin CTAs */}
          <View className="w-full gap-2.5">
            <Pressable
              onPress={() => {
                onClose();
                router.push('/missions' as any);
              }}
              style={{
                borderRadius: 18,
                borderBottomWidth: 4,
                borderBottomColor: '#B45309',
              }}
              className="h-12 w-full flex-row items-center justify-center gap-2 bg-reward-500 active:translate-y-[2px] active:border-b-2"
            >
              <TargetIcon size={18} color="white" />
              <Text className="font-nunito text-[14px] font-extrabold tracking-wide text-white uppercase">
                {t('shopUi.earnCoinsMissions')}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                onClose();
                router.dismissTo('/learn');
              }}
              style={{ borderRadius: 16, backgroundColor: s.surfaceMuted }}
              className="h-11 w-full flex-row items-center justify-center gap-2 active:opacity-70"
            >
              <BookOpenIcon size={16} color={s.textMuted} />
              <Text style={{ color: s.text }} className="font-inter text-[14px] font-bold">
                {t('shopUi.continueLearning')}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
