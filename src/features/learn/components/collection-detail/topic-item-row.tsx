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
      android_ripple={{ color: 'transparent' }}
      className="flex-row items-center justify-between rounded-2xl border border-neutral-200/80 bg-white px-4 py-3.5 shadow-xs active:opacity-75 dark:border-neutral-800 dark:bg-neutral-900"
    >
      {/* Left Column: Word, Phonetic, POS & Translation */}
      <View className="flex-1 pr-3">
        {/* Top line: Word + POS + Phonetic */}
        <View className="flex-row flex-wrap items-center gap-2">
          <Text className="font-nunito text-base font-black text-mascot-navy dark:text-white">
            {word}
          </Text>

          {partOfSpeech ? (
            <View className="rounded-md bg-lime-100/70 px-1.5 py-0.5 dark:bg-lime-950/50">
              <Text className="font-inter text-[11px] font-bold text-lime-700 dark:text-lime-400">
                {partOfSpeech}
              </Text>
            </View>
          ) : null}

          {phonetic ? (
            <Text className="font-inter text-xs text-neutral-400 dark:text-neutral-500">
              {phonetic}
            </Text>
          ) : null}
        </View>

        {/* Translation line (1 line truncated) */}
        {translation ? (
          <Text
            numberOfLines={1}
            className="mt-1 font-inter text-sm font-semibold text-slate-600 dark:text-neutral-300"
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
          android_ripple={{ color: 'transparent' }}
          className={`size-8 items-center justify-center rounded-full ${
            isPlaying
              ? 'bg-lime-500 text-white'
              : 'bg-neutral-100 active:bg-neutral-200 dark:bg-neutral-800 dark:active:bg-neutral-700'
          }`}
        >
          <VolumeIcon
            width={15}
            height={15}
            color={isPlaying ? '#FFFFFF' : '#64748B'}
          />
        </Pressable>

        <ChevronRightIcon width={16} height={16} color="#CBD5E1" />
      </View>
    </Pressable>
  );
}

export default TopicItemRow;
