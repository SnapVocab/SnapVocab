import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/features/auth/use-auth-store';

export default function AppLayout() {
  const status = useAuthStore(s => s.status);

  if (status !== 'signIn') {
    return <Redirect href="/welcome" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
