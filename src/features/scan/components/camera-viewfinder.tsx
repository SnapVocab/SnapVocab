import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { Text, View } from '@/components/ui';
import { SparklesIcon } from '@/components/ui/icons';

const FRAME = 280;
const CORNER = 38;
const GREEN = '#58CC02';

const corners = [
  { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 20 },
  { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 20 },
  { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 20 },
  { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 20 },
] as const;

/** Decorative framing guide: green corners, a sweeping laser and a pulsing centre dot. */
export function CameraViewfinder() {
  const laser = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const ease = Easing.inOut(Easing.ease);
    const sweep = (toValue: number) =>
      Animated.timing(laser, { toValue, duration: 2200, easing: ease, useNativeDriver: true });
    const breathe = (toValue: number) =>
      Animated.timing(pulse, { toValue, duration: 1200, easing: ease, useNativeDriver: true });

    const loops = [
      Animated.loop(Animated.sequence([sweep(FRAME - 40), sweep(0)])),
      Animated.loop(Animated.sequence([breathe(1.15), breathe(1)])),
    ];
    loops.forEach(loop => loop.start());
    return () => loops.forEach(loop => loop.stop());
  }, [laser, pulse]);

  return (
    <View pointerEvents="none" style={{ flex: 1 }} className="flex-1 items-center justify-center px-6">
      <View style={{ width: FRAME, height: FRAME }} className="items-center justify-center">
        {corners.map((corner, i) => (
          <View
            // eslint-disable-next-line react/no-array-index-key -- static, never reordered
            key={i}
            style={{ position: 'absolute', width: CORNER, height: CORNER, borderColor: GREEN, ...corner }}
          />
        ))}

        <Animated.View
          style={{ transform: [{ scale: pulse }] }}
          className="size-12 items-center justify-center rounded-full border border-white/40 bg-primary-500/10"
        >
          <View className="size-2 rounded-full bg-primary-400" />
        </Animated.View>

        <Animated.View
          style={{
            position: 'absolute',
            left: 8,
            right: 8,
            top: 10,
            height: 3,
            borderRadius: 2,
            backgroundColor: GREEN,
            transform: [{ translateY: laser }],
          }}
        />
      </View>

      <View className="mt-7 flex-row items-center gap-2 rounded-full border border-white/10 bg-black/60 px-5 py-2.5">
        <SparklesIcon color="#FBBF24" />
        <Text className="text-center text-[13px] font-semibold text-white" tx="scan.guidance" />
      </View>
    </View>
  );
}
