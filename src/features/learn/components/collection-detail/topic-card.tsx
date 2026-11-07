import type { TopicDTO } from '../../types';
import { Pressable, View } from 'react-native';
import { useUniwind } from 'uniwind';
import { Text } from '@/components/ui';
import { BookIcon, ChevronRightIcon, FolderIcon, PlayIcon } from '@/components/ui/icons';
import { StudyCountLabels } from '@/features/study/study-count-labels';
import { translate } from '@/lib/i18n';

type Props = {
  item: TopicDTO;
  onPress?: () => void;
  onStudyPress?: () => void;
  counts?: { newCount: number; dueCount: number };
};

export default function TopicCard({ item, onPress, onStudyPress, counts }: Props) {
  const isFolder = item.hasChildren;
  const { theme } = useUniwind();
  const cardSurfaceClasses = theme === 'dark'
    ? 'border-line border-b-edge bg-surface'
    : 'border-neutral-200/90 border-b-neutral-300 bg-white';

  return (
    <View
      className={`flex-row items-center rounded-2xl border-2 border-b-4 p-3.5 ${cardSurfaceClasses}`}
    >
      {/* Left icon + Topic Info */}
      <Pressable onPress={onPress} className="mr-2 flex-1 flex-row items-center gap-3.5 active:opacity-70">
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
          <StudyCountLabels counts={counts} className="mt-2" />
        </View>
      </Pressable>

      <View className="flex-row items-center gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={translate('learn.topic.study_topic', { name: item.name })}
          onPress={onStudyPress}
          className="min-h-12 flex-row items-center gap-1.5 rounded-xl border-2 border-b-[3px] border-emerald-200 border-b-emerald-300 bg-emerald-50 px-2.5 py-2 active:translate-y-px dark:border-emerald-800 dark:border-b-emerald-900 dark:bg-emerald-950/50"
        >
          <PlayIcon width={13} height={13} fill="#16A34A" />
          <Text className="font-nunito text-xs font-black text-emerald-700 dark:text-white">
            {translate('learn.topic.study_short')}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={translate('learn.topic.open_topic')}
          onPress={onPress}
          className="size-12 items-center justify-center rounded-xl border-2 border-b-[3px] border-line border-b-edge bg-surface-raised"
        >
          <ChevronRightIcon width={16} height={16} color="#71717A" />
        </Pressable>
      </View>
    </View>
  );
}

export { TopicCard };
