import { useForm } from '@tanstack/react-form';
import { useRouter } from 'expo-router';
import * as React from 'react';
import * as z from 'zod';

import { Button, Input, showErrorMessage, TouchableOpacity, View } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { Eye, EyeSlash, Lock, Mail, User } from '@/components/ui/icons';
import { translate } from '@/lib/i18n/utils';
import { useRegister } from '../api';

const registerSchema = z.object({
  firstName: z.string().min(1, translate('validation.first_name_required')),
  lastName: z.string().min(1, translate('validation.last_name_required')),
  email: z.string().min(1, translate('validation.email_required')).email(translate('validation.email_invalid')),
  password: z.string().min(5, translate('validation.password_min')),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

function PasswordField({ field, show, onToggle, placeholder }: {
  field: any;
  show: boolean;
  onToggle: () => void;
  placeholder?: string;
}) {
  return (
    <Input
      placeholder={placeholder ?? translate('register.password_placeholder')}
      secureTextEntry={!show}
      value={field.state.value}
      onBlur={field.handleBlur}
      onChangeText={field.handleChange}
      error={getFieldError(field)}
      icon={<Lock color="#737373" />}
      className="rounded-3xl"
      rightIcon={(
        <TouchableOpacity onPress={onToggle} hitSlop={8}>
          {show ? <EyeSlash color="#737373" /> : <Eye color="#737373" />}
        </TouchableOpacity>
      )}
    />
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showRepassword, setShowRepassword] = React.useState(false);
  const { mutate: register, isPending } = useRegister();

  const form = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validators: { onChange: registerSchema },
    onSubmit: async ({ value }) => {
      register(value, {
        onSuccess: (data) => {
          router.push({ pathname: '/(auth)/verify', params: { email: data.email } });
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
            placeholder={translate('register.first_name_placeholder')}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            error={getFieldError(field)}
            icon={<User color="#737373" />}
            className="rounded-3xl"
          />
        )}
      />

      <form.Field
        name="lastName"
        children={field => (
          <Input
            placeholder={translate('register.last_name_placeholder')}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            error={getFieldError(field)}
            icon={<User color="#737373" />}
            className="rounded-3xl"
          />
        )}
      />

      <form.Field
        name="email"
        children={field => (
          <Input
            placeholder={translate('register.email_placeholder')}
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

      <form.Field
        name="password"
        children={field => (
          <PasswordField field={field} show={showPassword} onToggle={() => setShowPassword(prev => !prev)} />
        )}
      />

      <form.Field
        name="confirmPassword"
        children={field => (
          <PasswordField field={field} show={showRepassword} onToggle={() => setShowRepassword(prev => !prev)} placeholder={translate('register.confirm_password_placeholder')} />
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
            className="mt-3 w-full rounded-3xl"
            size="lg"
          />
        )}
      />
    </View>
  );
}
