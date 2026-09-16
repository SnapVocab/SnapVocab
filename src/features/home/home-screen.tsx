import { FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';

export function HomeScreen() {
  const user = useAuthStore(s => s.user);

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-2xl font-black text-mascot-navy dark:text-white">
          Home Screen
        </Text>
        <Text className="mt-2 text-center text-sm font-medium text-neutral-400">
          Welcome back,
          {' '}
          {user?.firstName ?? user?.email ?? 'Learner'}
          !
        </Text>
      </View>
    </SafeAreaView>
  );
}
