import { useRouter } from 'expo-router';

import { Button, Text, View } from '@/components/ui';
import { BackButton } from '@/components/ui/back-button';
import { translate } from '@/lib/i18n';

type EditProfileHeaderProps = {
  isSubmitting: boolean;
  onSubmit: () => void;
};

export function EditProfileHeader({ isSubmitting, onSubmit }: EditProfileHeaderProps) {
  const router = useRouter();

  return (
    <View className="flex-row items-center bg-white px-5 py-3 dark:bg-neutral-900">
      <BackButton onPress={() => router.back()} />
      <Text className="ml-3 text-[20px] font-bold">{translate('edit_profile.title')}</Text>
      <Button
        label={translate('edit_profile.save')}
        className="ml-auto rounded-3xl bg-primary-600 px-4 py-2 text-white dark:bg-neutral-800 dark:text-primary-300"
        loading={isSubmitting}
        onPress={onSubmit}
      />
    </View>
  );
}
