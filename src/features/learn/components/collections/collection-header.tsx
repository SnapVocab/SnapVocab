import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { ChevronLeftIcon } from '@/components/ui/icons';
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
    <View className="flex-row items-center border-b border-neutral-100 px-3 py-4 dark:border-neutral-800">
      <Pressable
        onPress={handleBack}
        hitSlop={12}
        android_ripple={{ color: 'transparent' }}
        className="mr-3 size-10 items-center justify-center rounded-xl bg-neutral-100 active:opacity-60 dark:bg-neutral-800"
      >
        <ChevronLeftIcon width={20} height={20} color="#757793" />
      </Pressable>

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
