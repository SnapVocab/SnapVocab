import type { TopicDTO } from '../../types';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { BookIcon, ChevronRightIcon, FolderIcon } from '@/components/ui/icons';

type Props = {
  item: TopicDTO;
  onPress?: () => void;
};

export default function TopicCard({ item, onPress }: Props) {
  const isFolder = item.hasChildren;

  return (
    <Pressable
      onPress={onPress}
      className="dark:border-neutral-750 dark:border-b-neutral-850 flex-row items-center justify-between rounded-2xl border-2 border-b-4 border-neutral-200/90 border-b-neutral-300 bg-white p-3.5 active:translate-y-[2px] active:border-b-2 dark:bg-neutral-900"
    >
      {/* Left icon + Topic Info */}
      <View className="mr-3 flex-1 flex-row items-center gap-3.5">
        {/* Icon with 3D bevel */}
        <View
          className={`size-12 items-center justify-center rounded-2xl border-2 border-b-[3px] ${
            isFolder
              ? 'border-amber-300 border-b-amber-400 bg-amber-50 dark:border-amber-800 dark:border-b-amber-900 dark:bg-amber-950/40'
              : 'border-lime-300 border-b-lime-400 bg-lime-50 dark:border-lime-800 dark:border-b-lime-900 dark:bg-lime-950/40'
          }`}
        >
          {isFolder
            ? (
                <FolderIcon width={22} height={22} color="#D97706" />
              )
            : (
                <BookIcon width={22} height={22} color="#65A30D" />
              )}
        </View>

        {/* Name & Translation */}
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text
              className="font-nunito text-[16px] font-black text-mascot-navy dark:text-white"
              numberOfLines={1}
            >
              {item.name}
            </Text>
          </View>

          {item.translation
            ? (
                <Text
                  className="mt-0.5 font-inter text-[13px] font-medium text-neutral-500 dark:text-neutral-400"
                  numberOfLines={1}
                >
                  {item.translation}
                </Text>
              )
            : null}
        </View>
      </View>

      {/* Right chevron */}
      <View className="size-9 items-center justify-center rounded-xl border border-neutral-200/60 bg-neutral-100/60 dark:border-neutral-700 dark:bg-neutral-800">
        <ChevronRightIcon width={16} height={16} color="#71717A" />
      </View>
    </Pressable>
  );
}

export { TopicCard };
