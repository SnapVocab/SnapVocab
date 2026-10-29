import type { CollectionWord } from '../../types';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { AccuracyIcon, FlameIcon, VolumeIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';

type Props = {
  item: CollectionWord;
  onPress?: () => void;
  onAudioPress?: () => void;
};

export default function CollectionWordCard({ item, onPress, onAudioPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl border border-line bg-surface p-4 active:opacity-80"
    >
      {/* Top row: Word + phonetic + sound icon + mastery badge */}
      <View className="flex-row items-start justify-between">
        <View className="flex-1 flex-row flex-wrap items-center gap-2">
          <Text className="font-nunito text-lg font-black text-mascot-navy dark:text-white">
            {item.word}
          </Text>

          {item.partOfSpeech
            ? (
                <View className="rounded-md border border-line bg-neutral-100 px-1.5 py-0.5 dark:bg-neutral-800">
                  <Text className="font-nunito text-[11px] font-bold text-neutral-600 dark:text-neutral-300">
                    {item.partOfSpeech}
                  </Text>
                </View>
              )
            : null}

          {item.phonetic
            ? (
                <Text className="font-inter text-xs text-neutral-400">
                  {item.phonetic}
                </Text>
              )
            : null}
        </View>

        <View className="flex-row items-center gap-2">
          {/* Audio Button */}
          <Pressable
            onPress={onAudioPress}
            hitSlop={8}
            className="size-8 items-center justify-center rounded-full bg-neutral-100 active:bg-pressed dark:bg-neutral-800"
          >
            <VolumeIcon width={14} height={14} color="#71717A" />
          </Pressable>

          {/* Status Badge */}
          {item.isMastered
            ? (
                <View className="flex-row items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 dark:border-emerald-900/60 dark:bg-emerald-950/40">
                  <AccuracyIcon width={12} height={12} color="#059669" />
                  <Text className="font-nunito text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                    {translate('learn.collection_detail.stat_mastered')}
                  </Text>
                </View>
              )
            : (
                <View className="flex-row items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 dark:border-amber-900/60 dark:bg-amber-950/40">
                  <FlameIcon width={12} height={12} color="#D97706" />
                  <Text className="font-nunito text-[11px] font-bold text-amber-700 dark:text-amber-400">
                    {translate('learn.collection_detail.stat_learning')}
                  </Text>
                </View>
              )}
        </View>
      </View>

      {/* Translation / Meaning */}
      <Text className="mt-1.5 font-inter text-sm font-semibold text-primary-600 dark:text-primary-400">
        {item.translation}
      </Text>

      {/* Example sentence if available */}
      {item.example
        ? (
            <View className="mt-2.5 rounded-xl bg-neutral-50 p-2.5 dark:bg-neutral-800/50">
              <Text className="font-inter text-xs text-neutral-600 italic dark:text-neutral-300">
                "
                {item.example}
                "
              </Text>
              {item.exampleTranslation
                ? (
                    <Text className="mt-0.5 font-inter text-xs text-neutral-400">
                      {item.exampleTranslation}
                    </Text>
                  )
                : null}
            </View>
          )
        : null}
    </Pressable>
  );
}

export { CollectionWordCard };
