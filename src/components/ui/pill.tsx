import type { ComponentType } from 'react';
import type { SvgProps } from 'react-native-svg';

import { View } from 'react-native';

import { Text } from '@/components/ui';

type PillProps = {
  icon?: ComponentType<SvgProps>;
  iconFill?: string;
  label: string;
  className?: string;
  textClassName?: string;
};

export function Pill({
  icon: Icon,
  iconFill,
  label,
  className,
  textClassName,
}: PillProps) {
  return (
    <View
      className={`flex-row items-center gap-2 rounded-full px-3 py-1.5 ${className ?? ''}`}
    >
      {Icon && <Icon fill={iconFill} />}
      <Text className={`text-[14px] font-bold ${textClassName ?? ''}`}>
        {label}
      </Text>
    </View>
  );
}
