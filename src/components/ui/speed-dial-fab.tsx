import type { ReactNode } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { cn } from '@/lib/utils';
import { PlusIcon } from './icons';
import { Text } from './text';

/** Cấu hình cho từng nút lựa chọn con (Sub-action) */
export type SpeedDialAction = {
  id: string;
  label: string; // Nhãn hiển thị bên cạnh nút
  icon: ReactNode; // Icon hiển thị trong nút tròn
  bgColorClass?: string; // Màu nền Tailwind (mặc định bg-neutral-800)
  textColorClass?: string;
  onPress: () => void; // Hàm kích hoạt khi bấm vào action
};

export type SpeedDialFABProps = {
  actions: SpeedDialAction[]; // Danh sách các action con
  mainIcon?: ReactNode; // Icon của nút chính (mặc định là dấu +)
  className?: string; // Tùy chỉnh vị trí/spacing (ví dụ: bottom-10)
  testID?: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Component SpeedDialFAB:
 * Nút Floating Action Button dạng menu mở rộng với hiệu ứng Spring Animation mượt mà.
 */
export function SpeedDialFAB({
  actions,
  mainIcon,
  className = '',
  testID = 'speed-dial-fab',
}: SpeedDialFABProps) {
  // 1. Trạng thái đóng/mở menu
  const [isOpen, setIsOpen] = useState(false);

  // 2. Giá trị animation từ 0 (đóng) -> 1 (mở hoàn toàn)
  const animation = useSharedValue(0);

  // Khi isOpen thay đổi, kích hoạt hiệu ứng lò xo (Spring) chuyển đổi từ 0 <-> 1
  useEffect(() => {
    animation.value = withSpring(isOpen ? 1 : 0, {
      damping: 18,
      mass: 0.8,
      stiffness: 180,
    });
  }, [isOpen, animation]);

  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // 3. Hiệu ứng xoay icon dấu + thành dấu × (0 độ -> 45 độ)
  const mainIconAnimatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(animation.value, [0, 1], [0, 45]);
    return {
      transform: [{ rotate: `${rotate}deg` }],
    };
  });

  // 4. Hiệu ứng co giãn nhẹ của nút chính khi bấm
  const mainButtonAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(animation.value, [0, 1], [1, 0.95]);
    return {
      transform: [{ scale }],
    };
  });

  // 5. Hiệu ứng làm mờ màn hình (Backdrop) khi mở menu
  const backdropAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(animation.value * 0.45, { duration: 180 }),
    };
  });

  return (
    <>
      {/* Lớp nền mờ khi mở menu (bấm ra ngoài sẽ đóng menu) */}
      {isOpen && (
        <Animated.View
          style={[StyleSheet.absoluteFillObject, backdropAnimatedStyle]}
          className="z-30 bg-neutral-950"
          pointerEvents="auto"
        >
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Close menu"
          />
        </Animated.View>
      )}

      {/* Khung chứa các nút FAB (cố định ở góc dưới phải) */}
      <View
        testID={testID}
        className={cn('absolute right-5 bottom-8 z-40 items-end gap-3.5', className)}
        pointerEvents="box-none"
      >
        {/* Danh sách các nút con (render từ trên xuống dưới) */}
        {actions.map((action, index) => {
          const totalActions = actions.length;
          // Thứ tự xuất hiện: nút gần FAB nhất sẽ bay lên trước
          const distanceOrder = totalActions - index;

          return (
            <SpeedDialItem
              key={action.id}
              action={action}
              isOpen={isOpen}
              animation={animation}
              order={distanceOrder}
              onPress={() => {
                close();
                action.onPress();
              }}
            />
          );
        })}

        {/* Nút chính hình tròn nổi (Main Trigger Button) */}
        <AnimatedPressable
          style={mainButtonAnimatedStyle}
          onPress={toggleOpen}
          accessibilityRole="button"
          accessibilityLabel={isOpen ? 'Close speed dial menu' : 'Open speed dial menu'}
          className="size-14 items-center justify-center rounded-full bg-primary-600 shadow-xl shadow-primary-900/30 active:scale-95 active:opacity-90 dark:bg-primary-500"
        >
          <Animated.View style={mainIconAnimatedStyle}>
            {mainIcon ?? <PlusIcon width={26} height={26} color="#FFFFFF" />}
          </Animated.View>
        </AnimatedPressable>
      </View>
    </>
  );
}

type SpeedDialItemProps = {
  action: SpeedDialAction;
  isOpen: boolean;
  animation: SharedValue<number>;
  order: number;
  onPress: () => void;
};

/**
 * Từng hàng action con (gồm nhãn văn bản + nút icon tròn)
 */
function SpeedDialItem({
  action,
  isOpen,
  animation,
  order,
  onPress,
}: SpeedDialItemProps) {
  // Hiệu ứng bay lên (translateY) + phóng to dần (scale) + hiện rõ (opacity)
  const animatedItemStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      animation.value,
      [0, 1],
      [order * 16 + 10, 0],
    );
    const scale = interpolate(
      animation.value,
      [0, 0.2, 1],
      [0.4, 0.6, 1],
    );
    const opacity = interpolate(
      animation.value,
      [0, 0.3, 1],
      [0, 0.2, 1],
    );

    return {
      opacity,
      transform: [{ translateY }, { scale }],
    };
  });

  return (
    <Animated.View
      style={animatedItemStyle}
      pointerEvents={isOpen ? 'auto' : 'none'}
      className="flex-row items-center justify-end gap-3"
    >
      {/* Nhãn văn bản (Text Badge) */}
      <Pressable
        onPress={onPress}
        className="rounded-2xl border border-neutral-200/80 bg-white px-3.5 py-2 shadow-lg shadow-black/10 active:opacity-80 dark:border-neutral-700 dark:bg-neutral-800"
      >
        <Text
          className={`font-nunito text-xs font-black tracking-wide text-mascot-navy dark:text-white ${
            action.textColorClass ?? ''
          }`}
        >
          {action.label}
        </Text>
      </Pressable>

      {/* Nút icon tròn (Circle Icon Button) */}
      <Pressable
        onPress={onPress}
        className={`size-12 items-center justify-center rounded-full shadow-lg shadow-black/15 active:scale-95 active:opacity-90 ${
          action.bgColorClass ?? 'bg-neutral-800 dark:bg-neutral-700'
        }`}
      >
        {action.icon}
      </Pressable>
    </Animated.View>
  );
}

export default SpeedDialFAB;
