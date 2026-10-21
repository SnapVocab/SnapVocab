import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, View } from 'react-native';
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
    <Pressable
      onPress={handlePress}
      className="mb-4 flex-row items-center justify-between rounded-2xl border-2 border-b-4 border-neutral-200/90 border-b-neutral-300 bg-white p-3.5 active:translate-y-[2px] active:border-b-2 dark:border-[#46505C] dark:border-b-[#667382] dark:bg-[#22252B]"
    >
      {/* Left: Guided hint / Heading */}
      <View className="flex-1 pr-3">
        <Text className="font-nunito text-[16px] font-black text-mascot-navy dark:text-white">
          {translate('home.search_hint')}
        </Text>
        <Text className="mt-0.5 font-inter text-xs font-medium text-neutral-400 dark:text-neutral-500">
          {translate('home.search_placeholder')}
        </Text>
      </View>

      {/* Right: 3D Chunky Search Action Button */}
      <View className="size-11 items-center justify-center rounded-xl border-2 border-b-[3px] border-primary-400 border-b-primary-600 bg-primary-500 dark:border-[#77945C] dark:border-b-[#9BCB72] dark:bg-[#4E7040]">
        <SearchIcon color="#FFFFFF" width={20} height={20} />
      </View>
    </Pressable>
  );
}

export default HomeSearchBar;
