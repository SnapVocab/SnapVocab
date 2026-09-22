import { useRouter } from 'expo-router';
import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui';
import { SearchIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n/utils';

export type HomeSearchBarProps = {
  onPress?: () => void;
};

export function HomeSearchBar({ onPress }: HomeSearchBarProps) {
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
    <View className="mb-4 flex-row items-center justify-between">
      {/* Left: Guided hint / Heading */}
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        className="flex-1 pr-3"
      >
        <Text className="font-nunito text-base font-black text-mascot-navy dark:text-white">
          {translate('home.search_hint')}
        </Text>
        <Text className="mt-0.5 font-inter text-xs text-neutral-400 dark:text-neutral-500">
          {translate('home.search_placeholder')}
        </Text>
      </TouchableOpacity>

      {/* Right: Search Button (circular & larger, aligned straight below Notification Bell) */}
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        className="size-14 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-sm active:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
      >
        <SearchIcon color="#1E293B" width={26} height={26} />
      </TouchableOpacity>
    </View>
  );
}
