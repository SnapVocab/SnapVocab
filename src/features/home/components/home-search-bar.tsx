import { useRouter } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';
import { useUniwind } from 'uniwind';
import { Pressable, Text } from '@/components/ui';
import { SearchIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n/utils';

export type HomeSearchBarProps = {
  onPress?: () => void;
};

export function HomeSearchBar({ onPress }: HomeSearchBarProps) {
  const { theme } = useUniwind();
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
    else {
      router.push('/lookup');
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={translate('home.search_action')}
      accessibilityHint={translate('home.search_action_hint')}
      className="mb-3 flex-row items-center justify-between overflow-hidden rounded-2xl border-2 border-b-4 border-line border-b-edge bg-surface px-3.5 py-2.5 active:translate-y-[2px] active:bg-pressed"
    >
      {/* Left: Guided hint / Heading */}
      <View className="flex-1 pr-3">
        <Text className="font-nunito text-[15px] font-black text-mascot-navy dark:text-white">
          {translate('home.search_action')}
        </Text>
        <Text className="mt-0.5 font-inter text-sm font-medium text-neutral-500 dark:text-neutral-300">
          {translate('home.search_action_hint')}
        </Text>
      </View>

      {/* Right: 3D Chunky Search Action Button */}
      <View className="size-10 items-center justify-center rounded-xl border-2 border-b-[3px] border-primary-200 border-b-primary-300 bg-primary-50 dark:border-line dark:border-b-edge dark:bg-surface-raised">
        <SearchIcon color={theme === 'dark' ? '#A3CF7C' : '#4E9B1C'} width={20} height={20} />
      </View>
    </Pressable>
  );
}

export default HomeSearchBar;
