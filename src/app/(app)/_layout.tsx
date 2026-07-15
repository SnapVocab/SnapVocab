import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/features/auth/use-auth-store';

export default function AppLayout() {
  const status = useAuthStore.use.status();

  if (status !== 'signIn') {
    return <Redirect href="/welcome" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="edit-profile" options={{ presentation: 'modal' }} />
      <Stack.Screen name="notification" />
    </Stack>
  );
}
