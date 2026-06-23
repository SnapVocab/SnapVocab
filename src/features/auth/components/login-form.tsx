import { useForm } from '@tanstack/react-form';
import { Link, useRouter } from 'expo-router';
import * as React from 'react';
import * as z from 'zod';

import { Button, Input, showErrorMessage, Text, View } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { translate } from '@/lib/i18n/utils';
import { useLogin } from '../api';
import { useAuthStore } from '../use-auth-store';

export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore.use.login();
  const { mutate: login, isPending } = useLogin();

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onChange: z.object({
        email: z.string().min(1, translate('validation.email_required')).email(translate('validation.email_invalid')),
        password: z.string().min(1, translate('validation.password_required')),
      }),
    },
    onSubmit: async ({ value }) => {
      login(value, {
        onSuccess: (data) => {
          setAuth(data);
          router.replace('/');
        },
        onError: () => {
          showErrorMessage(translate('login.error'));
        },
      });
    },
  });

  return (
    <View className="mt-4">
      <form.Field
        name="email"
        children={field => (
          <Input
            label={translate('login.email')}
            placeholder={translate('login.email_placeholder')}
            autoCapitalize="none"
            keyboardType="email-address"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            error={getFieldError(field)}
          />
        )}
      />

      <form.Field
        name="password"
        children={field => (
          <Input
            label={translate('login.password')}
            placeholder={translate('login.password_placeholder')}
            secureTextEntry
            value={field.state.value}
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            error={getFieldError(field)}
          />
        )}
      />

      <form.Subscribe
        selector={state => [state.isSubmitting]}
        children={([isSubmitting]) => (
          <Button
            label={translate('login.sign_in')}
            variant="brand"
            loading={isPending || isSubmitting}
            onPress={form.handleSubmit}
            className="mt-6 w-full rounded-2xl"
            size="lg"
          />
        )}
      />

      <View className="mt-6 flex-row justify-center">
        <Text className="text-neutral-500 dark:text-neutral-400">
          {translate('login.no_account')}
          {' '}
        </Text>
        <Link href="/register" asChild>
          <Text className="font-semibold text-primary-600 dark:text-primary-400">
            {translate('login.register')}
          </Text>
        </Link>
      </View>
    </View>
  );
}
