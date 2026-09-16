import { useRouter } from 'expo-router';

import { Button, FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';

export function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);

  const handleLogout = () => {
    logout();
    router.replace('/welcome');
  };

  const initial = (user?.firstName?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase();
  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ''}`.trim()
    : 'SnapVocab Learner';

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <View className="flex-1 items-center justify-center p-6">
        <View className="mb-8 items-center">
          <View className="size-20 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
            <Text className="text-3xl font-black text-primary-600">
              {initial}
            </Text>
          </View>
          <Text className="mt-4 text-xl font-bold text-mascot-navy dark:text-white">
            {displayName}
          </Text>
          <Text className="mt-1 text-sm font-medium text-neutral-400">
            {user?.email ?? ''}
          </Text>
        </View>

        <Button
          label="Sign Out"
          variant="danger"
          size="default"
          onPress={handleLogout}
          className="w-48"
        />
      </View>
    </SafeAreaView>
  );
}
