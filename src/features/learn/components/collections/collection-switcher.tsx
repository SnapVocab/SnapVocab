import type { LayoutChangeEvent } from 'react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Text } from '@/components/ui';
import { translate } from '@/lib/i18n';

type CollectionSwitcherProps = {
  viewType: 'USER' | 'SYSTEM';
  onChange?: (viewType: 'USER' | 'SYSTEM') => void;
};

const SPRING_CONFIG = {
  damping: 22,
  mass: 0.6,
  stiffness: 240,
};

export default function CollectionSwitcher({ viewType, onChange }: CollectionSwitcherProps) {
  const [containerWidth, setContainerWidth] = React.useState(0);
  const isInitialRender = React.useRef(true);

  // Padding inside container is 4px (p-1), so total horizontal padding is 8px
  const tabWidth = containerWidth > 0 ? (containerWidth - 8) / 2 : 0;
  const translateX = useSharedValue(0);

  React.useEffect(() => {
    if (tabWidth <= 0) {
      return;
    }

    const targetX = viewType === 'USER' ? 0 : tabWidth;
    if (isInitialRender.current) {
      translateX.value = targetX;
      isInitialRender.current = false;
    }
    else {
      translateX.value = withSpring(targetX, SPRING_CONFIG);
    }
  }, [viewType, tabWidth, translateX]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      width: tabWidth,
    };
  });

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0 && Math.abs(width - containerWidth) > 0.5) {
      setContainerWidth(width);
    }
  };

  return (
    <View
      onLayout={handleLayout}
      className="relative flex-row rounded-2xl border border-neutral-200/80 bg-neutral-200/60 p-1 dark:border-neutral-700/60 dark:bg-neutral-800"
    >
      {tabWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              borderRadius: 12,
              bottom: 4,
              left: 4,
              position: 'absolute',
              top: 4,
            },
            animatedIndicatorStyle,
          ]}
          className="bg-white shadow-sm shadow-black/10 dark:bg-neutral-700"
        />
      )}

      <Pressable
        onPress={() => onChange?.('USER')}
        hitSlop={6}
        className="z-10 flex-1 items-center justify-center rounded-xl py-2"
      >
        <Text
          className={`font-nunito text-[14.5px] ${
            viewType === 'USER'
              ? 'font-extrabold text-mascot-navy dark:text-white'
              : 'font-bold text-neutral-500 dark:text-neutral-400'
          }`}
        >
          {translate('learn.collections.mine')}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => onChange?.('SYSTEM')}
        hitSlop={6}
        className="z-10 flex-1 items-center justify-center rounded-xl py-2"
      >
        <Text
          className={`font-nunito text-[14.5px] ${
            viewType === 'SYSTEM'
              ? 'font-extrabold text-mascot-navy dark:text-white'
              : 'font-bold text-neutral-500 dark:text-neutral-400'
          }`}
        >
          {translate('learn.collections.system')}
        </Text>
      </Pressable>
    </View>
  );
}

export { CollectionSwitcher };
