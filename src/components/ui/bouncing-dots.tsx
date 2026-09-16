import * as React from 'react';
import { Animated, View } from 'react-native';

export type BouncingDotsProps = {
  color?: string;
  size?: number;
  gap?: number;
  bounceHeight?: number;
};

export function BouncingDots({
  color = '#FFFFFF',
  size = 8,
  gap = 6,
  bounceHeight = 7,
}: BouncingDotsProps) {
  const anim1 = React.useRef(new Animated.Value(0)).current;
  const anim2 = React.useRef(new Animated.Value(0)).current;
  const anim3 = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const createBounceAnimation = (anim: Animated.Value, delay: number) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: -bounceHeight,
              duration: 220,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 220,
              useNativeDriver: true,
            }),
            Animated.delay(260),
          ]),
        ),
      ]);
    };

    const animation1 = createBounceAnimation(anim1, 0);
    const animation2 = createBounceAnimation(anim2, 140);
    const animation3 = createBounceAnimation(anim3, 280);

    animation1.start();
    animation2.start();
    animation3.start();

    return () => {
      animation1.stop();
      animation2.stop();
      animation3.stop();
    };
  }, [anim1, anim2, anim3, bounceHeight]);

  const dotStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap, height: size + bounceHeight }}>
      <Animated.View
        style={[
          dotStyle,
          { transform: [{ translateY: anim1 }] },
        ]}
      />
      <Animated.View
        style={[
          dotStyle,
          { transform: [{ translateY: anim2 }] },
        ]}
      />
      <Animated.View
        style={[
          dotStyle,
          { transform: [{ translateY: anim3 }] },
        ]}
      />
    </View>
  );
}
