import { Link } from 'expo-router';
import { View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { FocusAwareStatusBar, SafeAreaView, Text } from '@/components/ui';
import { Mascot } from '@/components/ui/mascot';
import { translate } from '@/lib/i18n';
import { ForgotPasswordForm } from './components/forgot-password-form';

export function ForgotPasswordScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
      >
        <View className="flex-1 items-center px-6 pt-16">
          <Mascot float pose="read" className="size-48" />
          <View className="mt-6 mb-8 items-center gap-1">
            <Text className="text-lg font-bold text-neutral-900 dark:text-white">
              {translate('forgot_password.title')}
            </Text>
            <Text className="text-center text-base text-neutral-500 dark:text-neutral-400">
              {translate('forgot_password.subtitle')}
            </Text>
          </View>

          <ForgotPasswordForm />

          <Text className="mt-6 text-center text-neutral-500 dark:text-neutral-400">
            <Link href="/(auth)/login" className="font-semibold text-[#5D5FEF]">
              {translate('forgot_password.back_to_login')}
            </Link>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
