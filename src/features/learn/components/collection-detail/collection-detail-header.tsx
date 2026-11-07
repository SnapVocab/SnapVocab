import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useUniwind } from 'uniwind';
import { BackButton, Text } from '@/components/ui';
import { MoreVerticalIcon, SettingsIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';

type Props = {
  title?: string;
  subtitle?: string;
  onBackPress?: () => void;
  onOptionsPress?: () => void;
  showOptions?: boolean;
  onStudySettingsPress?: () => void;
};

export default function CollectionDetailHeader({
  title,
  subtitle,
  onBackPress,
  onOptionsPress,
  showOptions = false,
  onStudySettingsPress,
}: Props) {
  const router = useRouter();
  const { theme } = useUniwind();
  const handleBack = onBackPress ?? (() => router.back());

  return (
    <View className="flex-row items-center justify-between border-b border-line px-3 py-4">
      <BackButton onPress={handleBack} hitSlop={12} />

      <View className="flex-1 items-center px-2">
        <Text
          className="font-nunito text-[18px] font-extrabold text-mascot-navy dark:text-white"
          numberOfLines={1}
        >
          {title ?? translate('learn.collection_detail.title')}
        </Text>
        {subtitle && (
          <Text
            className="font-inter text-[12px] font-medium text-neutral-500 dark:text-neutral-400"
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>

      <View className="flex-row items-center gap-1">
        {onStudySettingsPress && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={translate('study_limits.title')}
            onPress={onStudySettingsPress}
            className="size-12 items-center justify-center rounded-xl bg-surface-raised"
          >
            <SettingsIcon width={20} height={20} color={theme === 'dark' ? '#E5E7EB' : '#1C274C'} />
          </Pressable>
        )}
        {showOptions
          ? (
              <Pressable
                onPress={onOptionsPress}
                hitSlop={12}
                android_ripple={{ color: 'transparent' }}
                className="size-10 items-center justify-center rounded-xl border border-line bg-neutral-100/60 active:opacity-60 dark:bg-neutral-800"
              >
                <MoreVerticalIcon width={20} height={20} color="#71717A" />
              </Pressable>
            )
          : (
              <View className="size-10" />
            )}
      </View>
    </View>
  );
}

export { CollectionDetailHeader };
