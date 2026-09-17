import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { ChevronLeftIcon, MoreVerticalIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';

type Props = {
  title?: string;
  subtitle?: string;
  onBackPress?: () => void;
  onOptionsPress?: () => void;
  showOptions?: boolean;
};

export default function CollectionDetailHeader({
  title,
  subtitle,
  onBackPress,
  onOptionsPress,
  showOptions = false,
}: Props) {
  const router = useRouter();
  const handleBack = onBackPress ?? (() => router.back());

  return (
    <View className="flex-row items-center justify-between border-b border-neutral-100 px-3 py-4 dark:border-neutral-800">
      <Pressable
        onPress={handleBack}
        hitSlop={12}
        android_ripple={{ color: 'transparent' }}
        className="size-10 items-center justify-center rounded-xl bg-neutral-100 active:opacity-60 dark:bg-neutral-800"
      >
        <ChevronLeftIcon width={20} height={20} color="#757793" />
      </Pressable>

      <View className="pointer-events-none absolute inset-x-14 items-center">
        <Text
          className="font-nunito text-[18px] font-extrabold text-mascot-navy dark:text-white"
          numberOfLines={1}
        >
          {title ?? translate('learn.collection_detail.title')}
        </Text>
        {subtitle && (
          <Text
            className="font-inter text-[12px] font-medium text-neutral-500"
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {showOptions
        ? (
            <Pressable
              onPress={onOptionsPress}
              hitSlop={12}
              android_ripple={{ color: 'transparent' }}
              className="size-10 items-center justify-center rounded-xl border border-neutral-200/80 bg-neutral-100/60 active:opacity-60 dark:border-neutral-700 dark:bg-neutral-800"
            >
              <MoreVerticalIcon width={16} height={16} color="#71717A" />
            </Pressable>
          )
        : (
            <View className="size-10" />
          )}
    </View>
  );
}

export { CollectionDetailHeader };
