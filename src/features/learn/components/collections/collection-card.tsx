import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { ChevronRightIcon, FolderIcon, MoreVerticalIcon } from '@/components/ui/icons';

type Props = {
  isSystemCollection?: boolean;
  name: string;
  onPress?: () => void;
  onOptionsPress?: () => void;
  showOption?: boolean;
  translation: string;
};

export default function CollectionCard({
  name,
  onPress,
  onOptionsPress,
  translation,
  isSystemCollection,
  showOption = true,
}: Props) {
  const canShowOption = showOption && !isSystemCollection;

  return (
    <Pressable
      onPress={onPress}
      className="dark:border-neutral-750 dark:border-b-neutral-850 flex-row items-center justify-between rounded-2xl border-2 border-b-4 border-neutral-200/90 border-b-neutral-300 bg-white p-3.5 active:translate-y-[2px] active:border-b-2 dark:bg-neutral-900"
    >
      {/* Left section: Folder Icon + Title / Translation (Clickable) */}
      <View className="mr-3 flex-1 flex-row items-center gap-3.5">
        <View
          className={`size-12 items-center justify-center rounded-2xl border-2 border-b-[3px] ${
            isSystemCollection
              ? 'border-sky-300 border-b-sky-400 bg-sky-50 dark:border-sky-800 dark:border-b-sky-900 dark:bg-sky-950/40'
              : 'border-lime-300 border-b-lime-400 bg-lime-50 dark:border-lime-800 dark:border-b-lime-900 dark:bg-lime-950/40'
          }`}
        >
          <FolderIcon
            width={22}
            height={22}
            color={isSystemCollection ? '#0284C7' : '#65A30D'}
          />
        </View>

        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text
              className="font-nunito text-[16px] font-black text-mascot-navy dark:text-white"
              numberOfLines={1}
            >
              {name}
            </Text>
          </View>
          <Text
            className="mt-0.5 font-inter text-[13px] font-medium text-neutral-500 dark:text-neutral-400"
            numberOfLines={1}
          >
            {translation}
          </Text>
        </View>
      </View>

      {/* Right section: 3-dots action button or Chevron */}
      {canShowOption
        ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onOptionsPress?.();
              }}
              hitSlop={12}
              className="size-10 items-center justify-center rounded-xl border-2 border-b-[3px] border-neutral-200/80 border-b-neutral-300 bg-neutral-100/80 active:translate-y-px active:border-b-2 dark:border-neutral-700 dark:border-b-neutral-800 dark:bg-neutral-800"
            >
              <MoreVerticalIcon width={16} height={16} color="#71717A" />
            </Pressable>
          )
        : (
            <View className="size-10 items-center justify-center rounded-xl border border-neutral-200/60 bg-neutral-100/60 dark:border-neutral-700 dark:bg-neutral-800">
              <ChevronRightIcon width={16} height={16} color="#71717A" />
            </View>
          )}
    </Pressable>
  );
}

export { CollectionCard };
