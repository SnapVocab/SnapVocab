import type { ScanItem } from '../api';
import { Pressable } from 'react-native';

import { Pill, Text, View } from '@/components/ui';
import { CheckCircleIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';

type DetectedItemCardProps = {
  item: ScanItem;
  selected: boolean;
  isDuplicate: boolean;
  onToggle: () => void;
};

export function DetectedItemCard({ item, selected, isDuplicate, onToggle }: DetectedItemCardProps) {
  const confidence = Math.round(item.score * 100);
  const meaning = item.word?.meanings[0];
  const translation = item.word?.translations[0];

  return (
    <Pressable onPress={onToggle} testID={`detected-word-${item.label}-toggle`}>
      <View
        className={`flex-row items-center gap-3 rounded-3xl border p-3 ${
          selected
            ? 'border-primary-300 bg-primary-50 dark:border-primary-700 dark:bg-neutral-800'
            : 'border-gray-100 bg-white dark:border-neutral-800 dark:bg-neutral-900'
        }`}
      >
        <View
          className={`size-11 items-center justify-center rounded-2xl ${
            selected ? 'bg-primary-600' : 'bg-gray-100 dark:bg-neutral-800'
          }`}
        >
          <CheckCircleIcon color={selected ? '#FFFFFF' : '#9597AD'} />
        </View>

        <View style={{ flex: 1 }} className="flex-1 gap-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="text-lg font-bold capitalize">{item.label}</Text>
            {isDuplicate && (
              <Pill
                label={translate('scan.duplicate')}
                className="bg-warning-100 dark:bg-neutral-800"
                textClassName="text-warning-700 dark:text-warning-300 text-[11px]"
              />
            )}
          </View>

          <Text className="text-xs text-neutral-500 dark:text-neutral-400">
            {translate('scan.confidence', { value: confidence })}
          </Text>

          {item.word
            ? (
                <>
                  {meaning && (
                    <Text className="text-xs text-neutral-600 dark:text-neutral-300" numberOfLines={2}>
                      {meaning.pos ? `${meaning.pos} · ` : ''}
                      {meaning.definition}
                    </Text>
                  )}
                  {translation && (
                    <Text className="text-xs font-semibold text-neutral-900 dark:text-white">
                      {translation.translation}
                    </Text>
                  )}
                </>
              )
            : (
                <Text className="text-xs text-neutral-400" tx="scan.not_in_dictionary" />
              )}
        </View>
      </View>
    </Pressable>
  );
}
