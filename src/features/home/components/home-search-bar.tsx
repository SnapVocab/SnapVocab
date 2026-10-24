import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { useUniwind } from 'uniwind';
import { Text } from '@/components/ui';
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
      className="mb-3 flex-row items-center justify-between rounded-2xl border-2 border-b-4 border-neutral-200/90 border-b-neutral-300 bg-white px-3.5 py-2.5 active:translate-y-[2px] active:border-b-2 dark:border-[#46505C] dark:border-b-[#667382] dark:bg-[#22252B]"
    >
      {/* Left: Guided hint / Heading */}
      <View className="flex-1 pr-3">
        <Text className="font-nunito text-[15px] font-black text-mascot-navy dark:text-white" numberOfLines={1}>
          {translate('home.search_hint')}
        </Text>
        <Text className="mt-0.5 font-inter text-[11px] font-medium text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
          {translate('home.search_placeholder')}
        </Text>
      </View>

      {/* Right: 3D Chunky Search Action Button */}
      <View className="size-10 items-center justify-center rounded-xl border-2 border-b-[3px] border-[#B9E6A2] border-b-[#9DCE7C] bg-[#EEF9E6] dark:border-[#46505C] dark:border-b-[#667382] dark:bg-[#292E36]">
        <SearchIcon color={theme === 'dark' ? '#A3CF7C' : '#4E9B1C'} width={20} height={20} />
      </View>
    </Pressable>
  );
}

export default HomeSearchBar;
