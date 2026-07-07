import { FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';

export function EditProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-neutral-200 dark:bg-neutral-900">
      <FocusAwareStatusBar />
      <View className="p-5">
        <Text className="text-xl font-bold">Edit Profile</Text>
        <Text className="mt-4 text-neutral-600">Profile form coming soon...</Text>
      </View>
    </SafeAreaView>
  );
}
