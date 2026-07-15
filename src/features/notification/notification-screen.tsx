import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { FocusAwareStatusBar, SafeAreaView, Text } from '@/components/ui';
import { BackButton } from '@/components/ui/back-button';
import { NotificationList } from './components/notification-list';
import { useNotificationStore } from './use-notification-store';

export function NotificationScreen() {
  const notifications = useNotificationStore.use.notifications();
  const markAsRead = useNotificationStore.use.markAsRead();

  return (
    <View className="flex-1 bg-white dark:bg-neutral-900">
      <SafeAreaView className="flex-1">
        <FocusAwareStatusBar />

        <View className="flex-row gap-3 border-b border-gray-200 bg-white px-5 py-3 dark:border-neutral-700 dark:bg-neutral-900">
          <BackButton onPress={() => router.back()} />
          <View className="flex-1 flex-row items-center justify-between">
            <Text className="text-2xl font-black">Notifications</Text>
          </View>
        </View>

        <ScrollView className="bg-gray-100" contentContainerStyle={{ paddingBottom: 100 }}>
          <View className="min-h-175 gap-5 px-5 pt-5">
            <NotificationList
              notifications={notifications}
              onPressItem={markAsRead}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
