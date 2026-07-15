import type { ComponentType } from 'react';
import type { SvgProps } from 'react-native-svg';
import type { Notification } from '../use-notification-store';
import { View } from 'react-native';
import { FlameIcon, TrophyIcon } from '@/components/ui/icons';
import { NotificationItem } from './notification-item';

const iconMap: Record<string, ComponentType<SvgProps>> = {
  flame: FlameIcon,
  trophy: TrophyIcon,
};

type NotificationListProps = {
  notifications: Notification[];
  onPressItem?: (id: string) => void;
};

export function NotificationList({ notifications, onPressItem }: NotificationListProps) {
  return (
    <View className="gap-3">
      {notifications.map(item => (
        <NotificationItem
          key={item.id}
          icon={iconMap[item.icon] ?? FlameIcon}
          header={item.header}
          content={item.content}
          timestamp={item.timestamp}
          isRead={item.isRead}
          onPress={onPressItem ? () => onPressItem(item.id) : undefined}
        />
      ))}
    </View>
  );
}
