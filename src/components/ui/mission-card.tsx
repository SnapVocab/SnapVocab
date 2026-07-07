import type { ComponentType } from 'react';
import type { SvgProps } from 'react-native-svg';
import { View } from 'react-native';
import { Pill, Text } from '@/components/ui';
import { ProgressBar } from '@/features/home/components/progress-bar';
import { StarIcon } from './icons/star';

type MissionCardProps = {
  icon: ComponentType<SvgProps>;
  label: string;
  currentProgress: number;
  totalProgress: number;
  xpReward: number;
  barColor?: string;
  trackColor?: string;
};

export function MissionCard({
  icon: Icon,
  label,
  currentProgress,
  totalProgress,
  xpReward,
  barColor,
  trackColor,
}: MissionCardProps) {
  return (
    <View className="mx-5 flex-row items-center rounded-3xl bg-white p-4 shadow-md shadow-gray-300 dark:bg-neutral-800" style={{ elevation: 5 }}>
      <Icon width={32} height={32} />
      <View className="ml-3 flex-1">
        <View className="mb-2">
          <Text className="text-[16px] font-bold text-black dark:text-white" numberOfLines={1}>
            {label}
          </Text>
        </View>

        <View className="mt-2 flex-row items-center">
          <ProgressBar
            currentValue={currentProgress}
            maxValue={totalProgress}
            barColor={barColor}
            trackColor={trackColor}
            height={12}
            width="w-40"
          />
          <Text className="ml-2 text-[13px] font-bold text-[#464555]">
            {currentProgress}
            /
            {totalProgress}
          </Text>
        </View>
      </View>
      <View>
        <Pill icon={StarIcon} iconFill="#F97316" label={String(xpReward)} className="bg-[#FFF7ED]" textClassName="text-[#C2410C]" />
      </View>
    </View>
  );
}
