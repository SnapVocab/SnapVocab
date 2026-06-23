import * as React from 'react';
import { ScrollView, View } from 'react-native';

import { FocusAwareStatusBar, SafeAreaView, Text } from '@/components/ui';
import { translate } from '@/lib/i18n/utils';
import { LoginForm } from './components/login-form';

export function LoginScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <ScrollView
        contentContainerClassName="flex-1 px-6 pt-16"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-8">
          <Text className="text-3xl font-bold text-neutral-900 dark:text-white">
            {translate('login.title')}
          </Text>
          <Text className="mt-2 text-base text-neutral-500 dark:text-neutral-400">
            {translate('login.subtitle')}
          </Text>
        </View>

        <LoginForm />
      </ScrollView>
    </SafeAreaView>
  );
}
