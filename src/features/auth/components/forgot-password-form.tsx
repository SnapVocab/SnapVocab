import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import z from 'zod';

import { Button, showErrorMessage, showSuccessMessage, View } from '@/components/ui';
import { Mail } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { translate } from '@/lib/i18n';
import { useForgotPassword } from '../api';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, translate('validation.email_required')).email(translate('validation.email_invalid')),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const router = useRouter();
  const { mutate: forgotPassword, isPending } = useForgotPassword();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (value: ForgotPasswordFormValues) => {
    forgotPassword(value, {
      onSuccess: () => {
        showSuccessMessage(translate('forgot_password.success'));
        router.push(`/(auth)/verify-reset-code?email=${encodeURIComponent(value.email)}`);
      },
      onError: () => {
        showErrorMessage(translate('forgot_password.error'));
      },
    });
  };

  return (
    <View className="w-full">
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            placeholder={translate('forgot_password.email')}
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

      <Button
        label={translate('forgot_password.send_code')}
        variant="brand"
        loading={isPending || isSubmitting}
        onPress={handleSubmit(onSubmit)}
        className="mt-5 w-full rounded-2xl"
        size="lg"
      />
    </View>
  );
}
