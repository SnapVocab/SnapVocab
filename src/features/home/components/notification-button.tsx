import type { PressableProps } from 'react-native';
import { Pressable } from 'react-native';
import { NotificationBell } from '@/components/ui/icons';

type Props = { unread?: boolean; size?: number } & Pick<PressableProps, 'onPress'>;

export function NotificationButton({ unread, size, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className="size-13 items-center justify-center rounded-full bg-[#F7F9FBE5]"
    >
      <NotificationBell unread={unread} size={size} />
    </Pressable>
  );
}
