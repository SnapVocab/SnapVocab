import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button, Input, showErrorMessage, ThemedLink, View } from '@/components/ui';
import { Lock, Mail } from '@/components/ui/icons';
import { translate } from '@/lib/i18n/utils';
import { useLogin } from '../api';
import { useAuthStore } from '../use-auth-store';

const loginSchema = z.object({
  email: z.string().min(1, translate('validation.email_required')).email(translate('validation.email_invalid')),
  password: z.string().min(1, translate('validation.password_required')),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore(s => s.login);
  const { mutate: login, isPending } = useLogin();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (value: LoginFormValues) => {
    login(value, {
      onSuccess: (data) => {
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

      <Button
        label={translate('login.sign_in')}
        variant="brand"
        loading={isPending || isSubmitting}
        onPress={handleSubmit(onSubmit)}
        className="mt-6 w-full rounded-2xl"
        size="lg"
      />
    </View>
  );
}
