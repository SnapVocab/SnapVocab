import * as React from 'react';

import { FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';

export function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <View className="flex-1 items-center justify-center">
        <Text tx="home.welcome" className="text-2xl font-bold text-neutral-900 dark:text-white" />
      </View>
    </SafeAreaView>
  );
}
