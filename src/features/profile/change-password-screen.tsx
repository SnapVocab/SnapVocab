import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView } from 'react-native';
import * as z from 'zod';

import {
  Button,
  FocusAwareStatusBar,
  Input,
  Pressable,
  SafeAreaView,
  showErrorMessage,
  showSuccessMessage,
  Text,
  View,
} from '@/components/ui';
import { ChevronLeftIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';
import { useChangePassword } from './api';

const schema = z
  .object({
    currentPassword: z.string().min(1, translate('change_password.min_length')),
    newPassword: z.string().min(5, translate('change_password.min_length')),
    confirmPassword: z.string(),
  })
  .refine(values => values.newPassword === values.confirmPassword, {
    message: translate('change_password.mismatch'),
    path: ['confirmPassword'],
  })
  .refine(values => values.newPassword !== values.currentPassword, {
    message: translate('change_password.same_as_current'),
    path: ['newPassword'],
  });

type FormValues = z.infer<typeof schema>;

/** Settings → Account. Signing out other devices happens on the server. */
export function ChangePasswordScreen() {
  const router = useRouter();
  const changePassword = useChangePassword();

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = ({ currentPassword, newPassword }: FormValues) => {
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          showSuccessMessage(translate('change_password.success'));
          router.back();
        },
        onError: () => showErrorMessage(translate('change_password.error')),
      },
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background" edges={['top']}>
      <FocusAwareStatusBar />

      <View className="h-14 flex-row items-center border-b border-neutral-100 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-900">
        <Pressable
          onPress={() => router.back()}
          testID="change-password-back"
          className="-ml-1 size-10 items-center justify-center rounded-full active:bg-neutral-100"
        >
          <ChevronLeftIcon color="#1E2A44" />
        </Pressable>
        <Text
          className="mr-9 flex-1 text-center font-nunito text-lg font-extrabold text-mascot-navy dark:text-white"
          tx="change_password.title"
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Text className="mb-4 text-sm text-neutral-500" tx="change_password.subtitle" />

        <View className="gap-4">
          <Controller
            control={control}
            name="currentPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                isPassword
                label={translate('change_password.current')}
                placeholder={translate('change_password.current_placeholder')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.currentPassword?.message}
                testID="change-password-current"
              />
            )}
          />
          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                isPassword
                label={translate('change_password.new')}
                placeholder={translate('change_password.new_placeholder')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.newPassword?.message}
                testID="change-password-new"
              />
            )}
          />
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                isPassword
                label={translate('change_password.confirm')}
                placeholder={translate('change_password.confirm_placeholder')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
                testID="change-password-confirm"
              />
            )}
          />
        </View>

        <Button
          tx="change_password.submit"
          fullWidth
          loading={changePassword.isPending}
          onPress={handleSubmit(onSubmit)}
          testID="change-password-submit"
          className="mt-6"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
