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

export type SpeedDialAction = {
  id: string;
  label: string;
  icon: ReactNode;
  bgColorClass?: string;
  textColorClass?: string;
  onPress: () => void;
};

export type SpeedDialFABProps = {
  actions: SpeedDialAction[];
  mainIcon?: ReactNode;
  className?: string;
  testID?: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SpeedDialFAB({
  actions,
  mainIcon,
  className = '',
  testID = 'speed-dial-fab',
}: SpeedDialFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const animation = useSharedValue(0);

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

  // Rotate main icon by 45deg on open
  const mainIconAnimatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(animation.value, [0, 1], [0, 45]);
    return {
      transform: [{ rotate: `${rotate}deg` }],
    };
  });

  // Main button background subtle scale
  const mainButtonAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(animation.value, [0, 1], [1, 0.95]);
    return {
      transform: [{ scale }],
    };
  });

  // Backdrop overlay fade
  const backdropAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(animation.value * 0.45, { duration: 180 }),
    };
  });

  return (
    <>
      {/* Backdrop overlay */}
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

      {/* Floating Speed Dial Container */}
      <View
        testID={testID}
        className={cn('absolute right-5 bottom-8 z-40 items-end gap-3.5', className)}
        pointerEvents="box-none"
      >
        {/* Sub-actions list (Rendered from top to bottom) */}
        {actions.map((action, index) => {
          const totalActions = actions.length;
          // Reverse index so bottom-most action appears closer to the FAB
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

        {/* Main Trigger Floating Action Button */}
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

function SpeedDialItem({
  action,
  isOpen,
  animation,
  order,
  onPress,
}: SpeedDialItemProps) {
  const animatedItemStyle = useAnimatedStyle(() => {
    // Stagger translation and scale based on order index
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
      {/* Label Badge */}
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

      {/* Action Icon Button */}
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
