import { FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';

export function CommunityScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-2xl font-black text-mascot-navy dark:text-white">
          Community Screen
        </Text>
        <Text className="mt-2 text-center text-sm font-medium text-neutral-400">
          Leaderboards and community features coming soon
        </Text>
      </View>
    </SafeAreaView>
  );
}
