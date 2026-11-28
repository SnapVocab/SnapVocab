import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button, OtpInput, showErrorMessage, showSuccessMessage, Text } from '@/components/ui';
import { translate } from '@/lib/i18n/utils';
import { useResendCode, useVerifyCode } from '../api';
import { useAuthStore } from '../use-auth-store';

type Props = {
  email: string;
};

export function VerifyForm({ email }: Props) {
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const setAuth = useAuthStore(s => s.login);
  const { mutate: verifyCode, isPending } = useVerifyCode();
  const { mutate: resendCode, isPending: isResending } = useResendCode();

  useEffect(() => {
    if (cooldown <= 0)
      return;
    const id = setInterval(() => setCooldown(prev => Math.max(prev - 1, 0)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

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
        },
        onError: () => {
          showErrorMessage(translate('verify.error'));
        },
      },
    );
  };

  const handleResend = () => {
    setCooldown(60);
    resendCode(
      { email },
      {
        onSuccess: () => {
          showSuccessMessage(translate('verify.code_resent'));
        },
        onError: () => {
          showErrorMessage(translate('verify.resend_error'));
        },
      },
    );
  };

  return (
    <>
      <View className="my-2 items-center">
        <OtpInput
          value={code}
          onChange={setCode}
          disabled={isPending}
        />
      </View>

      <Button
        label={translate('verify.verify')}
        variant="brand"
        loading={isPending}
        disabled={code.length !== 6}
        onPress={handleVerify}
        className="mt-6 w-full rounded-2xl"
        size="lg"
      />

      <View className="mt-6 flex-row items-center justify-center">
        <Text className="text-neutral-500 dark:text-neutral-400">
          {translate('verify.no_code')}
          {' '}
        </Text>
        <Button
          label={cooldown > 0 ? `${translate('verify.resend')} (${cooldown}s)` : translate('verify.resend')}
          variant="brand"
          loading={isResending}
          disabled={cooldown > 0}
          onPress={handleResend}
          size="sm"
          fullWidth={false}
          className="h-auto px-2 py-1"
        />
      </View>
    </>
  );
}
