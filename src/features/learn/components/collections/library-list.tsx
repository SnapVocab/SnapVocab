import type { ReactNode } from 'react';
import type { StudyCollection } from '@/features/study/api';
import { Pressable, Text, View } from '@/components/ui';
import { ChevronRightIcon, MoreVerticalIcon } from '@/components/ui/icons';
import { StudyCountLabels } from '@/features/study/study-count-labels';
import { translate } from '@/lib/i18n';

/** One container, flat rows with dividers: the Settings grammar, not a card per collection (learn_ui.md §8.3). */
export function LibraryGroup({ children }: { children: ReactNode }) {
  return (
    <View className="overflow-hidden rounded-3xl border border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      {children}
    </View>
  );
}

type RowProps = {
  collection: StudyCollection;
  onPress: () => void;
  onOptionsPress?: () => void;
};

/** Daily counts stay together beneath the name; the total size remains secondary. */
export function LibraryRow({ collection, onPress, onOptionsPress }: RowProps) {
  const { name, translation, wordCount, dueCount } = collection;
  return (
    <View className="min-h-16 flex-row items-center border-b border-neutral-50 pr-2 dark:border-neutral-800">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        className="flex-1 flex-row items-center py-3 pl-4"
      >
        <View className="mr-3 flex-1">
          <Text className="font-nunito text-base font-black text-mascot-navy dark:text-white" numberOfLines={1}>{name}</Text>
          {!!translation && (
            <Text className="mt-0.5 font-inter text-xs text-neutral-500 dark:text-neutral-400" numberOfLines={1}>{translation}</Text>
          )}
          <StudyCountLabels counts={{ newCount: collection.newCount ?? 0, dueCount }} className="mt-2" />
        </View>
        <Text className="font-inter text-xs font-semibold text-neutral-500 dark:text-neutral-400">
          {wordCount ? translate('learn.library.words', { count: wordCount }) : translate('learn.library.no_words')}
        </Text>
      </Pressable>
      {onOptionsPress
        ? (
            <Pressable
              onPress={onOptionsPress}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={translate('learn.library.options', { name })}
              className="ml-1 size-10 items-center justify-center overflow-hidden rounded-full"
            >
              <MoreVerticalIcon width={16} height={16} color="#9CA3AF" />
            </Pressable>
          )
        : <View className="ml-1 size-10" />}
    </View>
  );
}

/** A plain navigation row ("Xem tất cả", "Khám phá bộ từ có sẵn", "Luyện quiz"). */
export function LibraryLinkRow({ label, onPress, last }: { label: string; onPress: () => void; last?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={`min-h-14 flex-row items-center px-4 ${last ? '' : 'border-b border-neutral-50 dark:border-neutral-800'}`}
    >
      <Text className="flex-1 font-nunito text-base font-bold text-mascot-navy dark:text-white">{label}</Text>
      <ChevronRightIcon width={18} height={18} color="#9CA3AF" />
    </Pressable>
  );
}
