import type { SpeedDialFABProps } from './types';
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
import { PlusIcon } from '../icons';
import { SpeedDialItem } from './speed-dial-item';

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

export default SpeedDialFAB;
