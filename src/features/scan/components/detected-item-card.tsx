import type { ScanItem } from '../types';
import { Pressable } from 'react-native';
import { Button, Text, View } from '@/components/ui';
import { primaryIpa, RELIABILITY_COLORS, RELIABILITY_KEYS, translationFor } from '../display';

type Props = {
  item: ScanItem;
  selected: boolean;
  onPress: () => void;
};

export function DetectedItemCard({ item, selected, onPress }: Props) {
  const color = RELIABILITY_COLORS[item.reliability];
  const word = item.word;
  const ipa = primaryIpa(word);
  const meaning = translationFor(word);

  return (
    <Pressable
      onPress={onPress}
      testID={`scan-item-${item.label}`}
      style={selected ? { borderColor: color } : undefined}
      className="rounded-[28px] border-2 border-b-[5px] border-neutral-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <View className="mb-3 flex-row items-center">
        <View
          style={{ borderColor: `${color}66`, backgroundColor: `${color}1A` }}
          className="flex-row items-center gap-2 rounded-xl border px-3 py-1.5"
        >
          <View style={{ backgroundColor: color }} className="size-2.5 rounded-full" />
          <Text className="text-[11px] font-extrabold tracking-wider text-neutral-700 uppercase dark:text-neutral-200" tx={RELIABILITY_KEYS[item.reliability]} />
        </View>
      </View>

      <Text className="font-nunito text-[26px] font-extrabold text-mascot-navy dark:text-white">
        {word?.word ?? item.label}
      </Text>
      {word && word.word.toLowerCase() !== item.label.toLowerCase() && (
        <Text className="text-xs text-neutral-400">{item.label}</Text>
      )}

      {word
        ? (
            <View className="mt-0.5 flex-row flex-wrap items-center gap-2">
              {ipa && <Text className="text-[15px] text-neutral-500">{ipa}</Text>}
              {ipa && meaning && <Text className="text-neutral-300">•</Text>}
              {meaning && <Text className="text-[15px] font-bold text-neutral-800 dark:text-neutral-100">{meaning}</Text>}
            </View>
          )
        : <Text className="text-[13px] font-medium text-danger-500" tx="scan.result.not_in_dictionary" />}

      {word && (
        // Saving to a Topic needs the Topic API, which is not built yet.
        <Button tx="scan.result.save_word" disabled fullWidth className="mt-4" />
      )}
    </Pressable>
  );
}
