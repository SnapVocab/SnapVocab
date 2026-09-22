import type { TopicDTO } from '../../types';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { BookIcon, ChevronRightIcon, FolderIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';

type Props = {
  item: TopicDTO;
  onPress?: () => void;
};

export default function TopicCard({ item, onPress }: Props) {
  const isFolder = item.hasChildren;

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'transparent' }}
      className="flex-row items-center justify-between rounded-2xl border border-neutral-200/80 bg-white p-3.5 active:opacity-75 dark:border-neutral-800 dark:bg-neutral-900"
    >
      {/* Left icon + Topic Info */}
      <View className="mr-3 flex-1 flex-row items-center gap-3.5">
        {/* Icon */}
        <View
          className={`size-12 items-center justify-center rounded-2xl border ${
            isFolder
              ? 'border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40'
              : 'border-lime-200 bg-lime-50 dark:border-lime-900/60 dark:bg-lime-950/40'
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
              className="font-nunito text-[16px] font-extrabold text-mascot-navy dark:text-white"
              numberOfLines={1}
            >
              {item.name}
            </Text>

            {isFolder && (
              <View className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 dark:border-amber-900/60 dark:bg-amber-950/40">
                <Text className="font-nunito text-[10px] font-bold text-amber-700 dark:text-amber-400">
                  {translate('learn.collection_detail.subtopics_badge')}
                </Text>
              </View>
            )}
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
      <View className="size-8 items-center justify-center rounded-lg bg-neutral-100/60 dark:bg-neutral-800">
        <ChevronRightIcon width={16} height={16} color="#71717A" />
      </View>
    </Pressable>
  );
}

export { TopicCard };
