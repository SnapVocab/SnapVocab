import type { SpeedDialItemProps } from './types';
import * as React from 'react';
import { Pressable } from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { Text } from '../text';

/**
 * Component SpeedDialItem:
 * Từng hàng action con (gồm nhãn văn bản + nút icon tròn) với hiệu ứng trượt/phóng to mượt mà.
 */
export function SpeedDialItem({
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

export default SpeedDialItem;
