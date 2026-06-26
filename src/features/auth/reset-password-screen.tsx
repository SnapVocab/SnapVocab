import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { ScrollView } from 'react-native-gesture-handler';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { FocusAwareStatusBar, SafeAreaView, Text } from '@/components/ui';
import { Mascot } from '@/components/ui/mascot';
import { translate } from '@/lib/i18n';
import { ResetPasswordForm } from './components/reset-password-form';

export function ResetPasswordScreen() {
  const { email, code } = useLocalSearchParams<{ email: string; code: string }>();

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
      >
        <ScrollView
          contentContainerClassName="px-6 pt-16"
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 items-center px-6 pt-16">
            <Mascot float pose="read" className="size-48" />
            <View className="mt-6 mb-8 items-center gap-1">
              <Text className="text-lg font-bold text-neutral-900 dark:text-white">
                {translate('reset_password.title')}
              </Text>
              <Text className="text-center text-base text-neutral-500 dark:text-neutral-400">
                {translate('reset_password.subtitle')}
              </Text>
            </View>

            <ResetPasswordForm email={email || ''} code={code || ''} />
          </View>
        </ScrollView>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
