import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { BackButton, Text } from '@/components/ui';

import { translate } from '@/lib/i18n';

type Props = {
  title?: string;
  subtitle?: string;
  onBackPress?: () => void;
};

export default function CollectionHeader({ title, subtitle, onBackPress }: Props) {
  const router = useRouter();

  const handleBack = onBackPress ?? (() => router.back());

  return (
    <View className="flex-row items-center border-b border-line px-3 py-4">
      <BackButton onPress={handleBack} hitSlop={12} className="mr-3" />

      <View className="pointer-events-none absolute inset-x-0 items-center">
        <Text className="font-nunito text-[19px] font-extrabold text-mascot-navy dark:text-white">
          {title ?? translate('learn.collections.title')}
        </Text>
        <Text className="font-inter text-[12.5px] font-medium text-neutral-500">
          {subtitle ?? translate('learn.collections.subtitle')}
        </Text>
      </View>
    </View>
  );
}

export { CollectionHeader };
