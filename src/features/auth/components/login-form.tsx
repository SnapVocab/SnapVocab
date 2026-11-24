import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useUniwind } from 'uniwind';
import * as z from 'zod';

import { Button, Input, showErrorMessage, ThemedLink, View } from '@/components/ui';
import { FingerprintIcon, Lock, Mail } from '@/components/ui/icons';
import { translate } from '@/lib/i18n/utils';
import { useLogin } from '../api';
import {
  getLastLoginEmail,
  getStoredPasskeyBinding,
  isPasskeyCancelledError,
  setLastLoginEmail,
  useBiometricSupported,
  usePasskeyLogin,
} from '../passkey';
import { useAuthStore } from '../use-auth-store';

const loginSchema = z.object({
  email: z.string().min(1, translate('validation.email_required')).email(translate('validation.email_invalid')),
  password: z.string().min(1, translate('validation.password_required')),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { theme } = useUniwind();
  const setAuth = useAuthStore(s => s.login);
  const { mutate: login, isPending } = useLogin();
  const { mutate: loginWithPasskey, isPending: isPasskeyPending } = usePasskeyLogin();
  const biometricSupported = useBiometricSupported();
  const hasBiometricSetup = Boolean(getStoredPasskeyBinding());
  const showBiometricButton = biometricSupported && hasBiometricSetup;

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: getLastLoginEmail(),
      password: '',
    },
  });

  const onSubmit = (value: LoginFormValues) => {
    login(value, {
      onSuccess: (data) => {
        setLastLoginEmail(data.user?.email || value.email);
        setAuth(data);
      },
      onError: (error) => {
        const body = error.response?.data as any;
        if (body?.error === 'USER_NOT_ACTIVATED') {
          router.push({
            pathname: '/(auth)/verify',
            params: {
              email: value.email,
            },
          });
        }
        else if (body?.error === 'USER_BANNED') {
          showErrorMessage(translate('login.banned'));
        }
        else {
          showErrorMessage(translate('login.error'));
        }
      },
    });
  };

  const handleBiometricLogin = () => {
    const email = getValues('email')?.trim() || getLastLoginEmail() || undefined;
    loginWithPasskey(
      { email },
      {
        onSuccess: (data) => {
          setAuth(data);
        },
        onError: (error) => {
          if (isPasskeyCancelledError(error))
            return;
          const body = (error as { response?: { data?: { error?: string } } })?.response?.data;
          if (body?.error === 'USER_BANNED') {
            showErrorMessage(translate('login.banned'));
          }
          else {
            showErrorMessage(translate('login.biometric_error'));
          }
        },
      },
    );
  };

  const fingerprintColor = theme === 'dark' ? '#F3F4F6' : '#1E2A44';

  return (
    <View className="mt-4">
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            placeholder={translate('login.email_placeholder')}
            autoCapitalize="none"
            keyboardType="email-address"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.email?.message}
            icon={<Mail color="#737373" />}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            placeholder={translate('login.password_placeholder')}
            isPassword
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.password?.message}
            icon={<Lock color="#737373" />}
          />
        )}
      />

      <View className="flex-row justify-end">
        <ThemedLink href="/(auth)/forgot-password" className="mt-2">
          {translate('login.forgot_password')}
        </ThemedLink>
      </View>

      <View className="mt-6 flex-row items-center gap-3">
        <Button
          label={translate('login.sign_in')}
          variant="brand"
          loading={isPending || isSubmitting}
          disabled={isPasskeyPending}
          onPress={handleSubmit(onSubmit)}
          className="flex-1 rounded-2xl"
          size="lg"
        />
        {showBiometricButton && (
          <Button
            variant="secondary"
            size="lg"
            loading={isPasskeyPending}
            disabled={isPending || isSubmitting}
            onPress={handleBiometricLogin}
            accessibilityLabel={translate('login.biometric_a11y')}
            testID="login-biometric-button"
            icon={<FingerprintIcon color={fingerprintColor} size={24} />}
            className="w-14 rounded-2xl px-0"
          />
        )}
      </View>
    </View>
  );
}
