import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import {
  Button,
  FocusAwareStatusBar,
  Input,
  SafeAreaView,
  showErrorMessage,
  showSuccessMessage,
  Text,
  TouchableOpacity,
} from '@/components/ui';
import { Eye, EyeSlash, Lock } from '@/components/ui/icons';
import { Mascot } from '@/components/ui/mascot';
import { translate } from '@/lib/i18n';
import { useResetPassword } from './api';

export function ResetPasswordScreen() {
  const router = useRouter();
  const { email, code } = useLocalSearchParams<{ email: string; code: string }>();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { mutate: resetPassword, isPending } = useResetPassword();

  const handleReset = () => {
    if (newPassword.length < 5) {
      showErrorMessage(translate('validation.password_min'));
      return;
    }
    if (newPassword !== confirmPassword) {
      showErrorMessage(translate('reset_password.password_mismatch'));
      return;
    }

    resetPassword(
      { email: email || '', code: code || '', newPassword },
      {
        onSuccess: () => {
          showSuccessMessage(translate('reset_password.success'));
          router.push('/(auth)/login');
        },
        onError: () => {
          showErrorMessage(translate('reset_password.error'));
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

          <View className="w-full gap-2">
            <Input
              label={translate('reset_password.new_password')}
              placeholder={translate('reset_password.new_password_placeholder')}
              secureTextEntry={!showNewPassword}
              value={newPassword}
              onChangeText={setNewPassword}
              icon={<Lock color="#737373" />}
              className="rounded-3xl"
              rightIcon={(
                <TouchableOpacity
                  onPress={() => setShowNewPassword(prev => !prev)}
                  hitSlop={8}
                >
                  {showNewPassword ? <EyeSlash color="#737373" /> : <Eye color="#737373" />}
                </TouchableOpacity>
              )}
            />

            <Input
              label={translate('reset_password.confirm_password')}
              placeholder={translate('reset_password.confirm_password_placeholder')}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              icon={<Lock color="#737373" />}
              className="rounded-3xl"
              rightIcon={(
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(prev => !prev)}
                  hitSlop={8}
                >
                  {showConfirmPassword ? <EyeSlash color="#737373" /> : <Eye color="#737373" />}
                </TouchableOpacity>
              )}
            />
          </View>

          <Button
            label={translate('reset_password.reset')}
            variant="brand"
            loading={isPending}
            disabled={!newPassword || !confirmPassword}
            onPress={handleReset}
            className="mt-6 w-full rounded-3xl"
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
