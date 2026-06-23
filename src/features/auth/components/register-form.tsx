import { useForm } from '@tanstack/react-form';
import { useRouter } from 'expo-router';
import * as React from 'react';
import * as z from 'zod';

import { Button, Input, showErrorMessage, View } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { translate } from '@/lib/i18n/utils';
import { useRegister } from '../api';

export function RegisterForm() {
  const router = useRouter();
  const { mutate: register, isPending } = useRegister();

  const form = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    },
    validators: {
      onChange: z.object({
        firstName: z.string().min(1, translate('validation.first_name_required')),
        lastName: z.string().min(1, translate('validation.last_name_required')),
        email: z.string().min(1, translate('validation.email_required')).email(translate('validation.email_invalid')),
        password: z.string().min(5, translate('validation.password_min')),
      }),
    },
    onSubmit: async ({ value }) => {
      register(value, {
        onSuccess: (data) => {
          router.replace({ pathname: '/verify', params: { email: data.email } });
        },
        onError: () => {
          showErrorMessage(translate('register.error'));
        },
      });
    },
  });

  return (
    <View className="mt-4">
      <form.Field
        name="firstName"
        children={field => (
          <Input
            label={translate('register.first_name')}
            placeholder={translate('register.first_name_placeholder')}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            error={getFieldError(field)}
          />
        )}
      />

      <form.Field
        name="lastName"
        children={field => (
          <Input
            label={translate('register.last_name')}
            placeholder={translate('register.last_name_placeholder')}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            error={getFieldError(field)}
          />
        )}
      />

      <form.Field
        name="email"
        children={field => (
          <Input
            label={translate('register.email')}
            placeholder={translate('register.email_placeholder')}
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
            label={translate('register.password')}
            placeholder={translate('register.password_placeholder')}
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
            label={translate('register.sign_up')}
            variant="brand"
            loading={isPending || isSubmitting}
            onPress={form.handleSubmit}
            className="mt-6 w-full rounded-2xl"
            size="lg"
          />
        )}
      />
    </View>
  );
}
