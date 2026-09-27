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
      <Stack.Screen name="lookup" />
      <Stack.Screen name="word-detail" />
      <Stack.Screen name="collections" />
      <Stack.Screen name="collections/[id]" />
      <Stack.Screen name="collections/create-topic" />
      <Stack.Screen name="scan-result" />
      <Stack.Screen name="template-builder" />
      <Stack.Screen name="shop" />
      <Stack.Screen name="profile/inventory" />
      <Stack.Screen name="profile/wallet" />
    </Stack>
  );
}
