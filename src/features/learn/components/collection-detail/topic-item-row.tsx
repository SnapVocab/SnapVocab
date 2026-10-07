import type { TopicItemData } from '../../types';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { ChevronRightIcon, VolumeIcon } from '@/components/ui/icons';
import { useTts } from '@/lib/hooks/use-tts';
import { extractTopicItemDisplay } from './topic-item-utils';

type Props = {
  item: TopicItemData;
  onPress?: () => void;
};

export function TopicItemRow({ item, onPress }: Props) {
  const { word, phonetic, partOfSpeech, translation } = React.useMemo(
    () => extractTopicItemDisplay(item),
    [item],
  );
  const { speak, isPlaying } = useTts();

  const formattedPhonetic = React.useMemo(() => {
    if (!phonetic) {
      return null;
    }
    if (phonetic.startsWith('/') || phonetic.startsWith('[')) {
      return phonetic;
    }
    return `/${phonetic}/`;
  }, [phonetic]);

  const handleAudioPress = React.useCallback(
    (e: { stopPropagation?: () => void }) => {
      e.stopPropagation?.();
      if (word && word !== '—') {
        speak(word);
      }
    },
    [speak, word],
  );

  return (
    <Pressable
      onPress={onPress}
      className="dark:border-neutral-750 dark:border-b-neutral-850 flex-row items-center justify-between rounded-2xl border-2 border-b-4 border-neutral-200/90 border-b-neutral-300 bg-white px-4 py-3.5 shadow-2xs active:translate-y-[2px] active:border-b-2 dark:bg-neutral-900"
    >
      {/* Left Column: Word, Phonetic, POS & Translation */}
      <View className="flex-1 pr-3">
        {/* Top line: Word + POS + Phonetic */}
        <View className="flex-row flex-wrap items-center gap-2">
          <Text className="font-nunito text-base font-black text-mascot-navy dark:text-white">
            {word}
          </Text>

          {partOfSpeech ? (
            <View className="rounded-md border border-lime-300 bg-lime-100/90 px-1.5 py-0.5 dark:border-lime-800 dark:bg-lime-950/60">
              <Text className="font-nunito text-[11px] font-black text-lime-800 uppercase dark:text-lime-300">
                {partOfSpeech}
              </Text>
            </View>
          ) : null}

          {formattedPhonetic ? (
            <Text className="font-inter text-xs font-semibold text-sky-600 dark:text-sky-400">
              {formattedPhonetic}
            </Text>
          ) : null}
        </View>

        {/* Translation line */}
        {translation ? (
          <Text
            numberOfLines={1}
            className="mt-1 font-inter text-sm font-semibold text-neutral-600 dark:text-neutral-300"
          >
            {translation}
          </Text>
        ) : null}
      </View>

      {/* Right Column: Quick Audio Button + Chevron */}
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={handleAudioPress}
          hitSlop={8}
          className={`size-9 items-center justify-center rounded-xl border-2 border-b-[3px] active:translate-y-px active:border-b-2 ${
            isPlaying
              ? 'border-lime-600 border-b-lime-700 bg-lime-500'
              : 'border-lime-300 border-b-lime-400 bg-lime-50 active:bg-lime-100 dark:border-lime-800 dark:border-b-lime-900 dark:bg-lime-950/40'
          }`}
        >
          <VolumeIcon
            width={16}
            height={16}
            color={isPlaying ? '#FFFFFF' : '#65A30D'}
          />
        </Pressable>

        <View className="size-8 items-center justify-center rounded-lg bg-neutral-100/60 dark:bg-neutral-800">
          <ChevronRightIcon width={14} height={14} color="#94A3B8" />
        </View>
      </View>
    </Pressable>
  );
}

export default TopicItemRow;
