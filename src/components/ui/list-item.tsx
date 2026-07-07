import type { ComponentType } from 'react';
import type { PressableProps } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';

type ListItemProps = {
  icon: ComponentType<SvgProps>;
  label: string;
  iconColor?: string;
  bgColor?: string;
} & Pick<PressableProps, 'onPress'>;

export function ListItem({
  icon: Icon,
  label,
  iconColor,
  bgColor = '#FFF7ED',
  onPress,
}: ListItemProps) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center rounded-full bg-white p-4">
      <View className="rounded-full p-3" style={{ backgroundColor: bgColor }}>
        <Icon color={iconColor ?? '#EA580C'} width={22} height={22} />
      </View>
      <Text className="ml-3 flex-1 text-base font-semibold text-black dark:text-white">
        {label}
      </Text>
      <Text className="text-3xl text-neutral-400">›</Text>
    </Pressable>
  );
}
