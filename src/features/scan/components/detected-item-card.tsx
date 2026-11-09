import type { ScanItem } from '../types';
import { Pressable } from 'react-native';
import { Text, View } from '@/components/ui';
import { SaveWordButton } from '@/features/my-words/save-word-button';
import { primaryIpa, RELIABILITY_COLORS, RELIABILITY_KEYS, translationFor } from '../display';

type Props = {
  item: ScanItem;
  /** The colour of this item's box on the photo, so the two can be matched. */
  color: string;
  selected: boolean;
  onPress: () => void;
};

export function DetectedItemCard({ item, color, selected, onPress }: Props) {
  const reliabilityColor = RELIABILITY_COLORS[item.reliability];
  const word = item.word;
  const ipa = primaryIpa(word);
  const meaning = translationFor(word);
  const title = word?.word ?? item.label;

  return (
    <Pressable
      onPress={onPress}
      testID={`scan-item-${item.label}`}
      // Only override when selected: an explicit `undefined` border colour renders black.
      style={selected ? { borderColor: color } : undefined}
      className="flex-row overflow-hidden rounded-3xl border-2 border-b-4 border-line bg-surface"
    >
      {/* Same colour as the box on the photo. */}
      <View style={{ width: 6, backgroundColor: color }} />

      <View className="flex-1 p-4">
        <View className="flex-row items-start gap-3">
          <Text
            numberOfLines={2}
            className="flex-1 font-nunito text-2xl/8 font-extrabold text-mascot-navy dark:text-white"
          >
            {title}
          </Text>
          <View
            style={{ borderColor: `${reliabilityColor}66`, backgroundColor: `${reliabilityColor}1A` }}
            className="mt-1 flex-row items-center gap-1.5 rounded-full border px-2.5 py-1"
          >
            <View style={{ backgroundColor: reliabilityColor }} className="size-2 rounded-full" />
            <Text
              className="text-[10px] font-extrabold tracking-wide text-neutral-700 uppercase dark:text-neutral-200"
              tx={RELIABILITY_KEYS[item.reliability]}
            />
          </View>
        </View>

        {title.toLowerCase() !== item.label.toLowerCase() && (
          <Text className="text-xs text-neutral-400">{item.label}</Text>
        )}

        {word
          ? (
              <View className="mt-1 flex-row flex-wrap items-center">
                {ipa && <Text className="mr-2 text-[15px] text-neutral-500">{ipa}</Text>}
                {meaning && (
                  <Text className="text-[15px] font-bold text-neutral-800 dark:text-neutral-100">{meaning}</Text>
                )}
              </View>
            )
          : <Text className="mt-1 text-[13px] font-medium text-danger-500" tx="scan.result.not_in_dictionary" />}

        {word?.wordId && (
          <View className="mt-3">
            <SaveWordButton wordId={word.wordId} saved={word.inMyVocabulary} />
          </View>
        )}
      </View>
    </Pressable>
  );
}
