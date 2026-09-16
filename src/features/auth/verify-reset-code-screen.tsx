import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import {
  Button,
  FocusAwareStatusBar,
  OtpInput,
  SafeAreaView,
  showErrorMessage,
  Text,
} from '@/components/ui';
import { Mascot } from '@/components/ui/mascot';
import { translate } from '@/lib/i18n';

export function VerifyResetCodeScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');

  const getMaskedEmail = (email: string): string => {
    const [localPart, domain] = email.split('@');

    if (localPart.length <= 2) {
      return `${localPart[0]}***@${domain}`;
    }

    const maskedLocalPart = `${localPart[0]}***${localPart[localPart.length - 1]}`;
    return `${maskedLocalPart}@${domain}`;
  };

  const handleNext = () => {
    if (code.length !== 6) {
      showErrorMessage(translate('verify_reset_code.invalid_code'));
      return;
    }
    router.push(`/(auth)/reset-password?email=${encodeURIComponent(email || '')}&code=${encodeURIComponent(code)}`);
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
              {translate('verify_reset_code.subtitle', { email: getMaskedEmail(email || '') })}
            </Text>
          </View>

          <OtpInput
            value={code}
            onChange={setCode}
          />
          <Button
            label={translate('verify_reset_code.verify')}
            variant="brand"
            disabled={code.length !== 6}
            onPress={handleNext}
            className="mt-6 w-full rounded-2xl"
            size="lg"
          />

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
