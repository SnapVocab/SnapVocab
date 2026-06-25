import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { twMerge } from 'tailwind-merge';
import { Image } from '@/components/ui/image';

export type FoxPose = 'wave' | 'celebrate' | 'sad' | 'read';

const poses: Record<FoxPose, number> = {
  wave: require('@assets/fox-wave.png'),
  celebrate: require('@assets/fox-celebrate.png'),
  sad: require('@assets/fox-sad.png'),
  read: require('@assets/fox-read.png'),
};

type MascotProps = {
  pose?: FoxPose;
  className?: string;
  float?: boolean;
  alt?: string;
};

export function Mascot({ pose = 'wave', className, float: shouldFloat, alt }: MascotProps) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!shouldFloat)
      return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();

    return () => animation.stop();
  }, [shouldFloat, floatAnim]);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <Animated.View style={shouldFloat ? { transform: [{ translateY }] } : undefined}>
      <Image
        source={poses[pose]}
        alt={alt ?? 'Vivi the fox mascot'}
        className={twMerge('object-contain', className)}
        contentFit="contain"
      />
    </Animated.View>
  );
}
