import { Pressable } from 'react-native';

import { Text, View } from '@/components/ui';
import { SparklesIcon } from '@/components/ui/icons';

type ChooseWordsCardProps = {
  onSelectAll: () => void;
  onDeselectAll: () => void;
};

export function ChooseWordsCard({ onSelectAll, onDeselectAll }: ChooseWordsCardProps) {
  return (
    <View className="mx-5 rounded-3xl border border-gray-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <View className="flex-row items-start gap-3">
        <View className="size-11 items-center justify-center rounded-2xl bg-primary-50 dark:bg-neutral-800">
          <SparklesIcon color="#635BFF" width={22} height={22} />
        </View>
        <View style={{ flex: 1 }} className="flex-1">
          <Text className="font-bold" tx="scan.choose_words_title" />
          <Text
            className="mt-1 text-xs text-neutral-500 dark:text-neutral-400"
            tx="scan.choose_words_subtitle"
          />
        </View>
      </View>

      <View className="mt-4 flex-row gap-2">
        <Pressable
          onPress={onSelectAll}
          testID="scan-select-all-button"
          className="rounded-full bg-primary-50 px-4 py-2 dark:bg-neutral-800"
        >
          <Text
            className="text-xs font-bold text-primary-600 dark:text-primary-300"
            tx="scan.select_all"
          />
        </Pressable>
        <Pressable
          onPress={onDeselectAll}
          testID="scan-deselect-button"
          className="rounded-full bg-gray-100 px-4 py-2 dark:bg-neutral-800"
        >
          <Text className="text-xs font-bold" tx="scan.deselect" />
        </Pressable>
      </View>
    </View>
  );
}
