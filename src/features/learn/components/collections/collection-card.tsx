import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { ChevronRightIcon, FolderIcon, MoreVerticalIcon } from '@/components/ui/icons';

type Props = {
  isSystemCollection?: boolean;
  name: string;
  onPress?: () => void;
  onOptionsPress?: () => void;

  translation: string;
};

export default function CollectionCard({
  name,
  onPress,
  onOptionsPress,
  translation,
  isSystemCollection,
}: Props) {
  return (
    <View className="flex-row items-center justify-between rounded-2xl border border-neutral-200/80 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900">
      {/* Left section: Folder Icon + Title / Translation (Clickable) */}
      <Pressable
        onPress={onPress}
        android_ripple={{ color: 'transparent' }}
        className="mr-3 flex-1 flex-row items-center gap-3.5 active:opacity-75"
      >
        <View className="size-12 items-center justify-center rounded-2xl border border-lime-200 bg-lime-50 dark:border-lime-900/60 dark:bg-lime-950/40">
          <FolderIcon width={22} height={22} color="#65A30D" />
        </View>

        <View className="flex-1">
          <Text
            className="font-nunito text-[16px] font-extrabold text-mascot-navy dark:text-white"
            numberOfLines={1}
          >
            {name}
          </Text>
          <Text
            className="mt-0.5 font-inter text-[13px] font-medium text-neutral-500 dark:text-neutral-400"
            numberOfLines={1}
          >
            {translation}
          </Text>
        </View>
      </Pressable>

      {/* Right section: 3-dots action button */}
      {!isSystemCollection
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
            <Pressable
              onPress={onPress}
              hitSlop={12}
              android_ripple={{ color: 'transparent' }}
              className="size-10 items-center justify-center rounded-xl border border-neutral-200/80 bg-neutral-100/60 active:opacity-60 dark:border-neutral-700 dark:bg-neutral-800"
            >
              <ChevronRightIcon width={16} height={16} color="#71717A" />
            </Pressable>
          )}
    </View>
  );
}

export { CollectionCard };
