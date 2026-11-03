import type { ReactNode } from 'react';
import type { StudyCollection } from '@/features/study/api';
import { Pressable, Text, View } from '@/components/ui';
import { ChevronRightIcon, MoreVerticalIcon } from '@/components/ui/icons';
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

/** Name on the left; on the right what the learner acts on: due cards, else size. */
export function LibraryRow({ collection, onPress, onOptionsPress }: RowProps) {
  const { name, translation, wordCount, dueCount } = collection;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="min-h-16 flex-row items-center border-b border-neutral-50 py-3 pr-2 pl-4 dark:border-neutral-800"
    >
      <View className="mr-3 flex-1">
        <Text className="font-nunito text-base font-black text-mascot-navy dark:text-white" numberOfLines={1}>{name}</Text>
        {!!translation && (
          <Text className="mt-0.5 font-inter text-xs text-neutral-500 dark:text-neutral-400" numberOfLines={1}>{translation}</Text>
        )}
      </View>
      {dueCount > 0
        ? (
            // design.md §9.2 "Đến hạn" chip: warning-500 @ 12%, #92400E.
            <View className="rounded-full bg-amber-500/10 px-2.5 py-1">
              <Text className="font-inter text-xs font-bold text-warning-800 dark:text-amber-300">
                {translate('learn.library.due', { count: dueCount > 99 ? '99+' : dueCount })}
              </Text>
            </View>
          )
        : (
            <Text className="font-inter text-xs font-semibold text-neutral-400">
              {wordCount ? translate('learn.library.words', { count: wordCount }) : translate('learn.library.no_words')}
            </Text>
          )}
      {onOptionsPress
        ? (
            <Pressable
              onPress={onOptionsPress}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={translate('learn.library.options', { name })}
              className="ml-1 size-10 items-center justify-center"
            >
              <MoreVerticalIcon width={16} height={16} color="#9CA3AF" />
            </Pressable>
          )
        : <View className="ml-1 size-10" />}
    </Pressable>
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
