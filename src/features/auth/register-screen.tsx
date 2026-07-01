import * as React from 'react';
import { ScrollView, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { FocusAwareStatusBar, SafeAreaView, Text, ThemedLink } from '@/components/ui';
import { translate } from '@/lib/i18n/utils';

import { RegisterForm } from './components/register-form';

export function RegisterScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
      >
        <ScrollView
          contentContainerClassName="px-6 pt-16 pb-8"
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-8">
            <Text className="text-3xl font-bold text-neutral-900 dark:text-white">
              {translate('register.title')}
            </Text>
            <Text className="mt-2 text-base text-neutral-500 dark:text-neutral-400">
              {translate('register.subtitle')}
            </Text>
          </View>

          <RegisterForm />

          <Text className="mt-6 text-center text-neutral-500 dark:text-neutral-400">
            {translate('register.have_account')}
            {' '}
            <ThemedLink href="/(auth)/login" className="mt-2">
              {translate('register.login')}
            </ThemedLink>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
