import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import {
  Button,
  FocusAwareStatusBar,
  Input,
  SafeAreaView,
  showErrorMessage,
  Text,
} from '@/components/ui';
import { translate } from '@/lib/i18n/utils';
import { useResendCode, useVerifyCode } from './api';
import { useAuthStore } from './use-auth-store';

export function VerifyScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email: string }>();
  const email = emailParam || '';
  const [code, setCode] = React.useState('');
  const setAuth = useAuthStore.use.login();
  const { mutate: verifyCode, isPending } = useVerifyCode();
  const { mutate: resendCode, isPending: isResending } = useResendCode();

  const handleVerify = () => {
    if (code.length !== 6) {
      showErrorMessage(translate('verify.invalid_code'));
      return;
    }
    verifyCode(
      { email, code },
      {
        onSuccess: (data) => {
          setAuth(data);
          router.replace('/');
        },
        onError: () => {
          showErrorMessage(translate('verify.error'));
        },
      },
    );
  };

  const handleResend = () => {
    resendCode(
      { email },
      {
        onSuccess: () => {
          showMessage({
            message: translate('verify.code_resent'),
            type: 'success',
            duration: 3000,
          });
        },
        onError: () => {
          showErrorMessage(translate('verify.resend_error'));
        },
      },
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
      >
        <View className="flex-1 px-6 pt-16">
          <View className="mb-8">
            <Text className="text-3xl font-bold text-neutral-900 dark:text-white">
              {translate('verify.title')}
            </Text>
            <Text className="mt-2 text-base text-neutral-500 dark:text-neutral-400">
              {translate('verify.subtitle', { email })}
            </Text>
          </View>

          <Input
            label={translate('verify.code')}
            placeholder={translate('verify.code_placeholder')}
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={setCode}
          />

          <Button
            label={translate('verify.verify')}
            variant="brand"
            loading={isPending}
            disabled={code.length !== 6}
            onPress={handleVerify}
            className="mt-6 w-full rounded-2xl"
            size="lg"
          />

          <View className="mt-6 flex-row justify-center">
            <Text className="text-neutral-500 dark:text-neutral-400">
              {translate('verify.no_code')}
              {' '}
            </Text>
            <Button
              label={translate('verify.resend')}
              variant="link"
              loading={isResending}
              onPress={handleResend}
              size="sm"
              className="p-0"
              textClassName="text-primary-600 dark:text-primary-400 font-semibold"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
