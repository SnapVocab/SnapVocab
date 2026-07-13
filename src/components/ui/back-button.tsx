import type { PressableProps } from 'react-native';
import { Pressable, useColorScheme, View } from 'react-native';

import { ChevronLeftIcon } from '@/components/ui/icons';

export function BackButton({ onPress }: Pick<PressableProps, 'onPress'>) {
  const isDark = useColorScheme() === 'dark';

  return (
    <Pressable onPress={onPress}>
      <View className="size-10 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-700">
        <ChevronLeftIcon color={isDark ? '#FFF' : '#000'} />
      </View>
    </Pressable>
  );
}
