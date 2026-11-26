import type { TopicItemData } from '../../types';
import * as React from 'react';
import { View } from 'react-native';
import { useUniwind } from 'uniwind';
import { Pressable, Text } from '@/components/ui';
import { ChevronRightIcon, MoreVerticalIcon, VolumeIcon } from '@/components/ui/icons';
import { useTts } from '@/lib/hooks/use-tts';
import { translate } from '@/lib/i18n';
import { extractTopicItemDisplay } from './topic-item-utils';

type Props = {
  item: TopicItemData;
  onPress?: () => void;
  onLongPress?: () => void;
  /** Edit / delete: a visible ⋮ instead of a long press only (UX audit #15). Absent on system collections. */
  onOptions?: () => void;
};

export function TopicItemRow({ item, onPress, onLongPress, onOptions }: Props) {
  const didLongPressRef = React.useRef(false);
  const resetLongPressTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const { theme } = useUniwind();
  const cardSurfaceClasses = theme === 'dark'
    ? 'border-line border-b-edge bg-surface'
    : 'border-neutral-200/90 border-b-neutral-300 bg-white';
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

  const handleAudioPress = React.useCallback(() => {
    if (word && word !== '—') {
      speak(word);
    }
  }, [speak, word]);

  const handlePress = React.useCallback(() => {
    if (didLongPressRef.current) {
      didLongPressRef.current = false;
      if (resetLongPressTimerRef.current) {
        clearTimeout(resetLongPressTimerRef.current);
      }
      return;
    }
    onPress?.();
  }, [onPress]);

  const handleLongPress = React.useCallback(() => {
    didLongPressRef.current = true;
    resetLongPressTimerRef.current = setTimeout(() => {
      didLongPressRef.current = false;
      resetLongPressTimerRef.current = null;
    }, 1000);
    onLongPress?.();
  }, [onLongPress]);

  React.useEffect(() => () => {
    if (resetLongPressTimerRef.current) {
      clearTimeout(resetLongPressTimerRef.current);
    }
  }, []);

  return (
    <View
      className={`flex-row items-center justify-between overflow-hidden rounded-2xl border-2 border-b-4 shadow-2xs ${cardSurfaceClasses}`}
    >
      {/* Left Column: Word, Phonetic, POS & Translation (sibling Pressable) */}
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={350}
        className="flex-1 py-3.5 pr-3 pl-4 active:opacity-80"
      >
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
      </Pressable>

      {/* Right Column: Quick Audio Button + Chevron (sibling Pressable) */}
      <View className="flex-row items-center gap-2 pr-4">
        <Pressable
          onPress={handleAudioPress}
          hitSlop={8}
          className={`size-9 items-center justify-center overflow-hidden rounded-xl border-2 border-b-[3px] active:translate-y-px ${
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

        {onOptions
          ? (
              <Pressable
                onPress={onOptions}
                accessibilityRole="button"
                accessibilityLabel={translate('learn.topic_item_options.open_a11y', { word })}
                hitSlop={8}
                testID={`topic-item-options-${item.topicItemId}`}
                className="size-9 items-center justify-center overflow-hidden rounded-xl border-2 border-b-[3px] border-line border-b-edge bg-surface-raised"
              >
                <MoreVerticalIcon width={16} height={16} color="#94A3B8" />
              </Pressable>
            )
          : (
              <Pressable
                onPress={handlePress}
                onLongPress={handleLongPress}
                delayLongPress={350}
                className="size-9 items-center justify-center overflow-hidden rounded-xl border-2 border-b-[3px] border-line border-b-edge bg-surface-raised"
              >
                <ChevronRightIcon width={14} height={14} color="#94A3B8" />
              </Pressable>
            )}
      </View>
    </View>
  );
}

export default TopicItemRow;
