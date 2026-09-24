import type { ImageStyle, StyleProp } from 'react-native';
import * as React from 'react';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,

  Platform,

  StyleSheet,
  Text,
  View,
} from 'react-native';
import { twMerge } from 'tailwind-merge';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

const POSES = {
  // Main
  main: require('@assets/images/mascot/snapy-main.png'),
  snap: require('@assets/images/mascot/snapy-main.png'),
  welcome: require('@assets/images/mascot/actions/snapy-chao-mung.png'),
  idle: require('@assets/images/mascot/actions/snapy-chao-mung.png'),

  // Actions
  chao_mung: require('@assets/images/mascot/actions/snapy-chao-mung.png'),
  reading: require('@assets/images/mascot/actions/snapy-doc-sach.png'),
  doc_sach: require('@assets/images/mascot/actions/snapy-doc-sach.png'),
  jumping: require('@assets/images/mascot/actions/snapy-nhay-len.png'),
  nhay_len: require('@assets/images/mascot/actions/snapy-nhay-len.png'),
  celebrating: require('@assets/images/mascot/actions/snapy-an-mung.png'),
  an_mung: require('@assets/images/mascot/actions/snapy-an-mung.png'),
  thinking: require('@assets/images/mascot/actions/snapy-suy-nghi.png'),
  suy_nghi: require('@assets/images/mascot/actions/snapy-suy-nghi.png'),
  exploring: require('@assets/images/mascot/actions/snapy-kham-pha.png'),
  kham_pha: require('@assets/images/mascot/actions/snapy-kham-pha.png'),

  // Expressions
  happy: require('@assets/images/mascot/expressions/snapy-vui-ve.png'),
  vui_ve: require('@assets/images/mascot/expressions/snapy-vui-ve.png'),
  winking: require('@assets/images/mascot/expressions/snapy-nhay-mat.png'),
  nhay_mat: require('@assets/images/mascot/expressions/snapy-nhay-mat.png'),
  curious: require('@assets/images/mascot/expressions/snapy-to-mo.png'),
  to_mo: require('@assets/images/mascot/expressions/snapy-to-mo.png'),
  focused: require('@assets/images/mascot/expressions/snapy-tap-trung.png'),
  tap_trung: require('@assets/images/mascot/expressions/snapy-tap-trung.png'),
  surprised: require('@assets/images/mascot/expressions/snapy-bat-ngo.png'),
  bat_ngo: require('@assets/images/mascot/expressions/snapy-bat-ngo.png'),
  proud: require('@assets/images/mascot/expressions/snapy-tu-hao.png'),
  tu_hao: require('@assets/images/mascot/expressions/snapy-tu-hao.png'),
  sad: require('@assets/images/mascot/expressions/snapy-to-mo.png'),

  // Applications
  app_icon: require('@assets/images/mascot/applications/snapy-app-icon.png'),
  sticker: require('@assets/images/mascot/applications/snapy-sticker-goodjob.png'),
  loading: require('@assets/images/mascot/applications/snapy-loading-rocket.png'),
  notification: require('@assets/images/mascot/applications/snapy-thong-bao.png'),
} as const;

export type SnapyPose = keyof typeof POSES;

export type SnapyAnimation
  = | 'idle'
    | 'bounce'
    | 'bounce_in'
    | 'wave'
    | 'shake'
    | 'celebrate'
    | 'float'
    | 'none';

export function Snapy({
  pose,
  animation = 'idle',
  className = '',
  style,
}: {
  pose: SnapyPose;
  animation?: SnapyAnimation | string;
  className?: string;
  style?: StyleProp<ImageStyle>;
  onPress?: () => void;
}) {
  const animValue = useRef(new Animated.Value(0)).current;
  const animLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    animValue.setValue(0);
    if (animLoop.current) {
      animLoop.current.stop();
    }

    if (animation === 'none') {
      return;
    }

    if (animation === 'idle') {
      animLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ]),
      );
      animLoop.current.start();
    }
    else if (animation === 'bounce' || animation === 'bounce_in') {
      animLoop.current = Animated.loop(
        Animated.sequence([
          Animated.spring(animValue, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 250,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.delay(1000),
        ]),
      );
      animLoop.current.start();
    }
    else if (animation === 'wave') {
      animLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 350,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(animValue, {
            toValue: -1,
            duration: 700,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 350,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.delay(1200),
        ]),
      );
      animLoop.current.start();
    }
    else if (animation === 'shake') {
      animLoop.current = Animated.sequence([
        Animated.timing(animValue, { toValue: 1, duration: 60, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(animValue, { toValue: -1, duration: 100, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(animValue, { toValue: 1, duration: 100, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(animValue, { toValue: -0.5, duration: 80, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(animValue, { toValue: 0, duration: 60, useNativeDriver: USE_NATIVE_DRIVER }),
      ]);
      animLoop.current.start();
    }
    else if (animation === 'celebrate') {
      animLoop.current = Animated.sequence([
        Animated.timing(animValue, { toValue: -0.3, duration: 150, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(animValue, { toValue: 1.2, friction: 3, tension: 50, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.spring(animValue, { toValue: 0, friction: 4, tension: 40, useNativeDriver: USE_NATIVE_DRIVER }),
      ]);
      animLoop.current.start();
    }
    else if (animation === 'float') {
      animLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 1400,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(animValue, {
            toValue: -1,
            duration: 1400,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ]),
      );
      animLoop.current.start();
    }

    return () => {
      if (animLoop.current) {
        animLoop.current.stop();
      }
    };
  }, [animation, pose, animValue]);

  let animatedTransform = {};
  if (animation === 'idle') {
    animatedTransform = {
      transform: [
        {
          translateY: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -5],
          }),
        },
        {
          scale: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.02],
          }),
        },
      ],
    };
  }
  else if (animation === 'bounce' || animation === 'bounce_in') {
    animatedTransform = {
      transform: [
        {
          translateY: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -12],
          }),
        },
        {
          scale: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.05],
          }),
        },
      ],
    };
  }
  else if (animation === 'wave') {
    animatedTransform = {
      transform: [
        {
          rotate: animValue.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: ['-6deg', '0deg', '6deg'],
          }),
        },
      ],
    };
  }
  else if (animation === 'shake') {
    animatedTransform = {
      transform: [
        {
          translateX: animValue.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [-10, 0, 10],
          }),
        },
      ],
    };
  }
  else if (animation === 'celebrate') {
    animatedTransform = {
      transform: [
        {
          translateY: animValue.interpolate({
            inputRange: [-0.3, 0, 1.2],
            outputRange: [6, 0, -22],
          }),
        },
        {
          scale: animValue.interpolate({
            inputRange: [-0.3, 0, 1.2],
            outputRange: [0.95, 1, 1.15],
          }),
        },
      ],
    };
  }
  else if (animation === 'float') {
    animatedTransform = {
      transform: [
        {
          translateY: animValue.interpolate({
            inputRange: [-1, 1],
            outputRange: [-8, 8],
          }),
        },
      ],
    };
  }

  const flattenedStyle = StyleSheet.flatten(style) || {};
  const hasDimension = flattenedStyle.width !== undefined || flattenedStyle.height !== undefined;
  const hasClassDimension = className.includes('w-') || className.includes('h-');

  return (
    <Animated.Image
      source={POSES[pose] || POSES.main}
      resizeMode="contain"
      style={[
        animatedTransform,
        !hasDimension && !hasClassDimension && { width: 90, height: 90 },
        style,
      ]}
      className={twMerge('drop-shadow-md', className)}
    />
  );
}

export function SpeechBubble({
  children,
  className = '',
  direction = 'bottom',
  arrowClassName = '',
}: {
  children: React.ReactNode;
  className?: string;
  direction?: 'bottom' | 'left' | 'right' | 'top';
  arrowClassName?: string;
}) {
  return (
    <View
      className={twMerge(
        'relative rounded-2xl border-2 border-mascot-200/90 bg-[#FFFDF9] px-4 py-3 shadow-sm shadow-orange-950/5',
        className,
      )}
    >
      {direction === 'bottom' && (
        <View
          className={twMerge(
            'absolute -bottom-[9px] left-8 size-4 rotate-45 border-r-2 border-b-2 border-mascot-200/90 bg-[#FFFDF9]',
            arrowClassName,
          )}
        />
      )}
      {direction === 'left' && (
        <View
          className={twMerge(
            'absolute top-4 -left-[9px] size-4 rotate-45 border-b-2 border-l-2 border-mascot-200/90 bg-[#FFFDF9]',
            arrowClassName,
          )}
        />
      )}
      {direction === 'top' && (
        <View
          className={twMerge(
            'absolute -top-[9px] left-8 size-4 rotate-45 border-t-2 border-l-2 border-mascot-200/90 bg-[#FFFDF9]',
            arrowClassName,
          )}
        />
      )}
      {direction === 'right' && (
        <View
          className={twMerge(
            'absolute top-4 -right-[9px] size-4 rotate-45 border-t-2 border-r-2 border-mascot-200/90 bg-[#FFFDF9]',
            arrowClassName,
          )}
        />
      )}
      <Text className="font-nunito text-[15px] leading-snug font-bold text-mascot-navy">
        {children}
      </Text>
    </View>
  );
}
