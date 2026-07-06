import { View } from 'react-native';
import { Text } from '@/components/ui';
import { FlameIcon } from '@/components/ui/icons/flame';

export function StreakPill({ streak}: { streak: number }) {
  return (
    <View className="flex-row items-center gap-2 rounded-full border border-[#FED7AA] bg-[#FFEDD5] px-3 py-1.5">
      <View>
        <FlameIcon fill="#EA580C" />
      </View>

      <Text className="text-[14px] font-bold text-[#EA580C]">
        {streak}
      </Text>
    </View>
  );
}
