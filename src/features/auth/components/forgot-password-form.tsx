import { useForm } from '@tanstack/react-form';
import { useRouter } from 'expo-router';
import z from 'zod';

import { Button, showErrorMessage, showSuccessMessage, View } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { Mail } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { translate } from '@/lib/i18n';
import { useForgotPassword } from '../api';

export function ForgotPasswordForm() {
  const router = useRouter();
  const { mutate: forgotPassword, isPending } = useForgotPassword();

  const form = useForm({
    defaultValues: {
      email: '',
    },
    validators: {
      onChange: z.object({
        email: z.string().min(1, translate('validation.email_required')).email(translate('validation.email_invalid')),
      }),
    },
    onSubmit: async ({ value }) => {
      forgotPassword(value, {
        onSuccess: () => {
          showSuccessMessage(translate('forgot_password.success'));
          router.push(`/(auth)/verify-reset-code?email=${encodeURIComponent(value.email)}`);
        },
        onError: () => {
          showErrorMessage(translate('forgot_password.error'));
        },
      });
    },
  });

  return (
    <View className="w-full">
      <form.Field
        name="email"
        children={field => (
          <Input
            placeholder={translate('forgot_password.email')}
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

      <form.Subscribe
        selector={state => [state.isSubmitting]}
        children={([isSubmitting]) => (
          <View className="flex-row items-center justify-center">
            <Button
              label={translate('forgot_password.send_code')}
              variant="brand"
              loading={isPending || isSubmitting}
              onPress={form.handleSubmit}
              className="mt-5 rounded-3xl"
            />
          </View>

        )}
      />
    </View>
  );
}
