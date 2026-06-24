import * as React from 'react';

import { Button, FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { translate } from '@/lib/i18n/utils';
import { useAuthStore } from '../auth/use-auth-store';

export function HomeScreen() {
  const logout = useAuthStore.use.logout();

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <View className="flex-1 items-center justify-center">
        <Text tx="home.welcome" className="text-2xl font-bold text-neutral-900 dark:text-white" />
        <Button onPress={logout} label={translate('home.sign_out')} />
      </View>
    </SafeAreaView>
  );
}
