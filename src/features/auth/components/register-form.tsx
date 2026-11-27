import type { Control, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button, Input, showErrorMessage, View } from '@/components/ui';
import { Lock, Mail, User } from '@/components/ui/icons';
import { translate } from '@/lib/i18n/utils';
import { useRegister } from '../api';

const registerSchema = z.object({
  firstName: z.string().min(1, translate('validation.first_name_required')),
  lastName: z.string().min(1, translate('validation.last_name_required')),
  email: z.string().min(1, translate('validation.email_required')).email(translate('validation.email_invalid')),
  password: z.string().min(5, translate('validation.password_min')),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: translate('validation.password_mismatch'),
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

function NameFields({
  control,
  errors,
}: {
  control: Control<RegisterFormValues>;
  errors: FieldErrors<RegisterFormValues>;
}) {
  return (
    <>
      <Controller
        control={control}
        name="firstName"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            placeholder={translate('register.first_name_placeholder')}
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.firstName?.message}
            icon={<User color="#737373" />}
          />
        )}
      />

      <Controller
        control={control}
        name="lastName"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            placeholder={translate('register.last_name_placeholder')}
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.lastName?.message}
            icon={<User color="#737373" />}
          />
        )}
      />
    </>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const { mutate: register, isPending } = useRegister();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (value: RegisterFormValues) => {
    register(value, {
      onSuccess: (data) => {
        router.push({ pathname: '/(auth)/verify', params: { email: data.email } });
      },
      onError: () => {
        showErrorMessage(translate('register.error'));
      },
    });
  };

  return (
    <View className="mt-4">
      <NameFields control={control} errors={errors} />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            placeholder={translate('register.email_placeholder')}
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
            placeholder={translate('register.password_placeholder')}
            isPassword
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.password?.message}
            icon={<Lock color="#737373" />}
          />
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            placeholder={translate('register.confirm_password_placeholder')}
            isPassword
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.confirmPassword?.message}
            icon={<Lock color="#737373" />}
          />
        )}
      />

      <Button
        label={translate('register.sign_up')}
        variant="brand"
        loading={isPending || isSubmitting}
        onPress={handleSubmit(onSubmit)}
        className="mt-3 w-full rounded-2xl"
        size="lg"
      />
    </View>
  );
}
