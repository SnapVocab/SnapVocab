import { Stack } from 'expo-router';

import { BadgeUnlockHost } from '@/features/badges';

export default function AppLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="lookup" />
        <Stack.Screen name="word-detail" />
        <Stack.Screen name="my-words" />
        <Stack.Screen name="collections" />
        <Stack.Screen name="collections/[id]" />
        <Stack.Screen name="collections/create-topic" />
        <Stack.Screen name="study/select" />
        <Stack.Screen name="study/session" />
        <Stack.Screen name="scan-result" />
        <Stack.Screen name="scan-save" />
        <Stack.Screen name="template-builder" />
        <Stack.Screen name="shop" />
        <Stack.Screen name="profile/inventory" />
        <Stack.Screen name="profile/wallet" />
        <Stack.Screen name="profile/achievements" />
        <Stack.Screen name="stats" />
        <Stack.Screen name="level-progress" />
      </Stack>
      {/* Badge sync on open/foreground and the unlock modal (achievements_ui.md §7, §9). */}
      <BadgeUnlockHost />
    </>
  );
}
