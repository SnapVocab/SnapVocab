import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import z from 'zod';

import {
  Button,
  Input,
  showErrorMessage,
  showSuccessMessage,
  View,
} from '@/components/ui';
import { Lock } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';
import { useResetPassword } from '../api';

const resetPasswordSchema = z.object({
  newPassword: z.string().min(5, translate('validation.password_min')),
  confirmPassword: z.string().min(1, translate('validation.password_required')),
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

type ResetPasswordFormProps = {
  email: string;
  code: string;
};

export function ResetPasswordForm({ email, code }: ResetPasswordFormProps) {
  const router = useRouter();
  const { mutate: resetPassword, isPending } = useResetPassword();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (value: ResetPasswordFormValues) => {
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
  };

  return (
    <View className="w-full gap-2">
      <Controller
        control={control}
        name="newPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            placeholder={translate('reset_password.new_password_placeholder')}
            isPassword
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={errors.newPassword?.message}
            icon={<Lock color="#737373" />}
          />
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            placeholder={translate('reset_password.confirm_password_placeholder')}
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
        label={translate('reset_password.reset')}
        variant="brand"
        loading={isPending || isSubmitting}
        onPress={handleSubmit(onSubmit)}
        className="mt-4 w-full rounded-2xl"
        size="lg"
      />
    </View>
  );
}
