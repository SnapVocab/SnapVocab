import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import {
  Button,
  FocusAwareStatusBar,
  OtpInput,
  SafeAreaView,
  showErrorMessage,
  showSuccessMessage,
  Text,
} from '@/components/ui';
import { Mascot } from '@/components/ui/mascot';
import { translate } from '@/lib/i18n';
import { useForgotPassword, useVerifyResetCode } from './api';

const RESEND_COOLDOWN_S = 60;

function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain)
    return email;
  if (localPart.length <= 2)
    return `${localPart[0]}***@${domain}`;
  return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`;
}

/**
 * The code is checked here, before the new password is typed: a wrong or expired code used to surface only after
 * the password, sending the learner back a screen (UX audit #10). A new code can be asked for here too.
 */
export function VerifyResetCodeScreen() {
  const router = useRouter();
  const { email = '' } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  // The forgot-password screen has just sent one.
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S);
  const verify = useVerifyResetCode();
  const resend = useForgotPassword();

  useEffect(() => {
    if (cooldown <= 0)
      return;
    const id = setInterval(() => setCooldown(previous => Math.max(previous - 1, 0)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleNext = () => {
    if (code.length !== 6) {
      showErrorMessage(translate('verify_reset_code.invalid_code'));
      return;
    }
    verify.mutate({ email, code }, {
      onSuccess: () => router.push({ pathname: '/(auth)/reset-password', params: { email, code } }),
      onError: (error) => {
        setCode('');
        showErrorMessage(translate(error.response?.status === 400
          ? 'verify_reset_code.wrong_or_expired'
          : 'verify_reset_code.network_error'));
      },
    });
  };

  const handleResend = () => {
    setCooldown(RESEND_COOLDOWN_S);
    resend.mutate({ email }, {
      onSuccess: () => showSuccessMessage(translate('verify_reset_code.resent')),
      onError: () => showErrorMessage(translate('forgot_password.error')),
    });
  };

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
              {translate('verify_reset_code.title')}
            </Text>
            <Text className="text-center text-base text-neutral-500 dark:text-neutral-400">
              {translate('verify_reset_code.subtitle', { email: maskEmail(email) })}
            </Text>
          </View>

          <OtpInput
            value={code}
            onChange={setCode}
            disabled={verify.isPending}
          />
          <Button
            label={translate('verify_reset_code.verify')}
            variant="brand"
            loading={verify.isPending}
            disabled={code.length !== 6}
            onPress={handleNext}
            className="mt-6 w-full rounded-2xl"
            size="lg"
            testID="verify-reset-code-submit"
          />
          <View className="mt-6 flex-row items-center justify-center">
            <Text className="text-neutral-500 dark:text-neutral-400">
              {translate('verify.no_code')}
              {' '}
            </Text>
            <Button
              label={cooldown > 0 ? `${translate('verify.resend')} (${cooldown}s)` : translate('verify.resend')}
              variant="brand"
              loading={resend.isPending}
              disabled={cooldown > 0}
              onPress={handleResend}
              size="sm"
              fullWidth={false}
              className="h-auto px-2 py-1"
              testID="verify-reset-code-resend"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
