import { Link } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';

import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { FocusAwareStatusBar, SafeAreaView, Text } from '@/components/ui';

import { Mascot } from '@/components/ui/mascot';
import { translate } from '@/lib/i18n/utils';
import { LoginForm } from './components/login-form';

export function LoginScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
      >
        <Mascot float className="mt-2 size-48 self-center" />
        <View className="flex-1 px-6 pt-16">
          <View className="mb-8 items-center gap-1">
            <Text className="text-lg font-bold text-neutral-900 dark:text-white">
              {translate('login.title')}
            </Text>
            <Text className="text-base text-neutral-500 dark:text-neutral-400">
              {translate('login.subtitle')}
            </Text>
          </View>

          <LoginForm />

          <Text className="mt-6 text-center text-neutral-500 dark:text-neutral-400">
            {translate('login.no_account')}
            {' '}
            <Link href="/register" replace className="font-semibold text-[#5D5FEF]">
              {translate('login.register')}
            </Link>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
