import { useForm } from '@tanstack/react-form';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import z from 'zod';

import {
  Button,
  showErrorMessage,
  showSuccessMessage,
  TouchableOpacity,
  View,
} from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { Eye, EyeSlash, Lock } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { translate } from '@/lib/i18n';
import { useResetPassword } from '../api';

type ResetPasswordFormProps = {
  email: string;
  code: string;
};

export function ResetPasswordForm({ email, code }: ResetPasswordFormProps) {
  const router = useRouter();
  const { mutate: resetPassword, isPending } = useResetPassword();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm({
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
    validators: {
      onChange: z.object({
        newPassword: z.string().min(5, translate('validation.password_min')),
        confirmPassword: z.string().min(1, translate('validation.password_required')),
      }),
    },
    onSubmit: async ({ value }) => {
      if (value.newPassword !== value.confirmPassword) {
        showErrorMessage(translate('reset_password.password_mismatch'));
        return;
      }
      resetPassword(
        { email, code, newPassword: value.newPassword },
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
    },
  });

  return (
    <View className="w-full gap-2">
      <form.Field
        name="newPassword"
        children={field => (
          <Input
            placeholder={translate('reset_password.new_password_placeholder')}
            secureTextEntry={!showNewPassword}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            error={getFieldError(field)}
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
        )}
      />

      <form.Field
        name="confirmPassword"
        children={field => (
          <Input
            placeholder={translate('reset_password.confirm_password_placeholder')}
            secureTextEntry={!showConfirmPassword}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            error={getFieldError(field)}
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
        )}
      />

      <form.Subscribe
        selector={state => [state.isSubmitting]}
        children={([isSubmitting]) => (
          <Button
            label={translate('reset_password.reset')}
            variant="brand"
            loading={isPending || isSubmitting}
            onPress={form.handleSubmit}
            className="mt-4 w-full rounded-3xl"
            size="lg"
          />
        )}
      />
    </View>
  );
}
