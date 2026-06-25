import { useForm } from '@tanstack/react-form';
import { Link, useRouter } from 'expo-router';
import * as React from 'react';
import * as z from 'zod';

import { Button, Input, showErrorMessage, TouchableOpacity, View } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { Eye, EyeSlash, Lock, Mail } from '@/components/ui/icons';
import { translate } from '@/lib/i18n/utils';
import { useLogin } from '../api';
import { useAuthStore } from '../use-auth-store';

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
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
            placeholder={translate('login.email_placeholder')}
            autoCapitalize="none"
            keyboardType="email-address"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            error={getFieldError(field)}
            icon={<Mail color="#737373" />}
            className="rounded-3xl"
          />
        )}
      />

      <View className="h-4" />

      <form.Field
        name="password"
        children={field => (
          <Input
            placeholder={translate('login.password_placeholder')}
            secureTextEntry={!showPassword}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            error={getFieldError(field)}
            icon={<Lock color="#737373" />}
            className="rounded-3xl"
            rightIcon={(
              <TouchableOpacity
                onPress={() => setShowPassword(prev => !prev)}
                hitSlop={8}
              >
                {showPassword ? <EyeSlash color="#737373" /> : <Eye color="#737373" />}
              </TouchableOpacity>
            )}
          />
        )}
      />

      <View className="flex-row justify-end">
        <Link href="/(auth)/forgot-password" className="mt-2 font-semibold text-[#5D5FEF]">
          {translate('login.forgot_password')}
        </Link>
      </View>

      <form.Subscribe
        selector={state => [state.isSubmitting]}
        children={([isSubmitting]) => (
          <Button
            label={translate('login.sign_in')}
            variant="brand"
            loading={isPending || isSubmitting}
            onPress={form.handleSubmit}
            className="mt-6 w-full rounded-3xl"
            size="lg"
          />
        )}
      />
    </View>
  );
}
