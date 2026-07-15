import type { ComponentType } from 'react';
import type { PressableProps } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import { Pressable, View } from 'react-native';
import { twMerge } from 'tailwind-merge';
import { Text } from '@/components/ui';

type NotificationItemProps = {
  icon: ComponentType<SvgProps>;
  header: string;
  content: string;
  timestamp: string;
  isRead?: boolean;
} & Pick<PressableProps, 'onPress'>;

export function NotificationItem({
  icon: Icon,
  header,
  content,
  timestamp,
  isRead = true,
  onPress,
}: NotificationItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className={twMerge(
        'flex-row items-start gap-3 rounded-4xl bg-white p-4 dark:bg-neutral-800',
        isRead ? 'border border-gray-200 dark:border-neutral-700' : 'border border-primary-500',
      )}
    >
      <View className="mt-0.5 rounded-full bg-primary-50 p-2.5 dark:bg-primary-900">
        <Icon width={22} height={22} color="#635BFF" />
      </View>
      <View className="flex-1 gap-1">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-black dark:text-white" numberOfLines={1}>
            {header}
          </Text>
          {!isRead && <View className="ml-2 size-2 rounded-full bg-primary-500" />}
        </View>
        <Text className="text-sm text-neutral-400" numberOfLines={2}>
          {content}
        </Text>
        <Text className="text-xs text-neutral-300">{timestamp}</Text>
      </View>
    </Pressable>
  );
}
