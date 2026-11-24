import { View } from 'react-native';
import { useUniwind } from 'uniwind';
import { Pressable, Text } from '@/components/ui';
import { ChevronRightIcon, FolderIcon, MoreVerticalIcon } from '@/components/ui/icons';
import { StudyCountLabels } from '@/features/study/study-count-labels';
import { translate } from '@/lib/i18n';

type Props = {
  isSystemCollection?: boolean;
  name: string;
  onPress?: () => void;
  onOptionsPress?: () => void;
  showOption?: boolean;
  translation: string;
  counts?: { newCount: number; dueCount: number };
};

export default function CollectionCard({
  name,
  onPress,
  onOptionsPress,
  translation,
  isSystemCollection,
  showOption = true,
  counts,
}: Props) {
  const canShowOption = showOption && !!onOptionsPress;
  const { theme } = useUniwind();
  const cardSurfaceClasses = theme === 'dark'
    ? 'border-line border-b-edge bg-surface'
    : 'border-neutral-200/90 border-b-neutral-300 bg-white';

  return (
    <View
      className={`flex-row items-center justify-between overflow-hidden rounded-2xl border-2 border-b-4 ${cardSurfaceClasses}`}
    >
      {/* Left section: Folder Icon + Title / Translation (sibling Pressable, never nested with 3-dot) */}
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        className="flex-1 flex-row items-center gap-3.5 py-3.5 pr-3 pl-3.5 active:opacity-80"
      >
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
          <StudyCountLabels counts={counts} className="mt-2" />
        </View>
      </Pressable>

      {/* Right section: 3-dots action button or Chevron (sibling Pressable so touches never collide) */}
      <View className="pr-3.5">
        {canShowOption
          ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={translate('learn.library.options', { name })}
                onPress={onOptionsPress}
                hitSlop={12}
                className="size-12 items-center justify-center overflow-hidden rounded-xl border-2 border-b-[3px] border-line border-b-edge bg-surface-raised active:translate-y-px"
              >
                <MoreVerticalIcon width={20} height={20} color="#71717A" />
              </Pressable>
            )
          : (
              <Pressable
                onPress={onPress}
                accessibilityRole="button"
                className="size-12 items-center justify-center overflow-hidden rounded-xl border-2 border-b-[3px] border-line border-b-edge bg-surface-raised"
              >
                <ChevronRightIcon width={16} height={16} color="#71717A" />
              </Pressable>
            )}
      </View>
    </View>
  );
}

export { CollectionCard };
