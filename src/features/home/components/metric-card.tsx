import type { ComponentType } from 'react';
import type { SvgProps } from 'react-native-svg';

import { View } from 'react-native';

import { Text } from '@/components/ui';

type MetricCardProps = {
  icon: ComponentType<SvgProps>;
  value: string;
  label: string;
};

export function MetricCard({ icon: Icon, value, label }: MetricCardProps) {
  return (
    <View className="size-28 items-center justify-center rounded-[20px] bg-white shadow-md shadow-gray-300 dark:bg-neutral-800" style={{ elevation: 5 }}>
      <Icon width={32} height={32} />
      <View className="my-2">
        <Text className="text-[24px] font-bold text-black dark:text-white">
          {value}
        </Text>
      </View>

      <Text className="text-[10px] font-bold text-black dark:text-neutral-400">
        {label}
      </Text>
    </View>
  );
}
