import { View } from '@/components/ui';
import { NotificationBell } from '@/components/ui/icons';

type Props = { unread?: boolean; size?: number };

export function Notification({ unread, size }: Props) {
  return (
    <View className="size-13 items-center justify-center rounded-full bg-[#F7F9FBE5]">
      <NotificationBell unread={unread} size={size} />
    </View>
  );
}
