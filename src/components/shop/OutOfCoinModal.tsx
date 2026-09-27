import type { ShopItemDTO } from '@/features/shop/types';
import { router } from 'expo-router';
import { BookOpenIcon, SparklesIcon, TargetIcon, XIcon } from 'lucide-react-native';
import * as React from 'react';
import { Image, Modal, Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Coin3D } from '@/components/snapvocab';

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
              backgroundColor: '#FFFFFF',
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
            style={{ borderRadius: 20 }}
            className="absolute top-4 right-4 z-10 size-8 items-center justify-center bg-neutral-100 active:bg-neutral-200"
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
            <Image
              source={require('../../assets/images/snapy-curious.png')}
              style={{ width: 80, height: 80 }}
              resizeMode="contain"
            />
          </View>

          {/* Title & Guidance */}
          <Text className="mb-1 text-center font-nunito text-[22px] font-extrabold text-mascot-navy">
            Chưa đủ Coin rồi!
          </Text>
          <Text className="mb-4 px-2 text-center font-inter text-[13px] leading-relaxed font-medium text-neutral-500">
            Bạn cần thêm
            {' '}
            <Text className="font-extrabold text-amber-600">
              {missingCoins.toLocaleString()}
              {' '}
              Coin
            </Text>
            {' '}
            để có thể mở khóa
            {' '}
            <Text className="font-bold text-mascot-navy">{item.name}</Text>
            .
          </Text>

          {/* Price & Balance Pill */}
          <View
            style={{ borderRadius: 18, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FEF3C7' }}
            className="mb-5 w-full flex-row items-center justify-around py-3"
          >
            <View className="items-center">
              <Text className="mb-1 font-inter text-[11px] font-bold text-amber-800 uppercase">Giá vật phẩm</Text>
              <View className="flex-row items-center gap-1.5">
                <Coin3D size="xs" />
                <Text className="font-nunito text-[16px] font-extrabold text-amber-900 tabular-nums">
                  {item.price.toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={{ width: 1, height: 28, backgroundColor: '#FDE68A' }} />

            <View className="items-center">
              <Text className="mb-1 font-inter text-[11px] font-bold text-neutral-400 uppercase">Bạn đang có</Text>
              <View className="flex-row items-center gap-1.5">
                <Coin3D size="xs" />
                <Text className="font-nunito text-[16px] font-extrabold text-neutral-700 tabular-nums">
                  {userCoins.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Earn Coin CTAs */}
          <View className="w-full gap-2.5">
            <Pressable
              onPress={() => {
                onClose();
                router.push('/(tabs)/learn' as any);
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
                Làm nhiệm vụ kiếm Coin
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                onClose();
                router.push('/(tabs)/learn' as any);
              }}
              style={{ borderRadius: 16 }}
              className="h-11 w-full flex-row items-center justify-center gap-2 bg-neutral-100 active:bg-neutral-200"
            >
              <BookOpenIcon size={16} color="#757793" />
              <Text className="font-inter text-[14px] font-bold text-neutral-600">
                Tiếp tục bài học
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
