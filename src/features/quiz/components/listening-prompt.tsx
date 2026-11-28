import * as React from 'react';
import { Easing, Pressable, Animated as RNAnimated, Text, View } from 'react-native';
import { VolumeIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export type ListeningPromptProps = {
  word: string;
  /** Answered (or the learner gave up on the sound): the word is shown, with its meaning once known. */
  revealed: boolean;
  meaning?: string | null;
  playing: boolean;
  failed: boolean;
  onPlay: () => void;
  onPlaySlow: () => void;
  onShowWord: () => void;
};

/** The question of a listening quiz: a sound to play, and the word itself only after answering. */
export function ListeningPrompt({ word, revealed, meaning, playing, failed, onPlay, onPlaySlow, onShowWord }: ListeningPromptProps) {
  const pulse = React.useRef(new RNAnimated.Value(1)).current;

  React.useEffect(() => {
    if (!playing) {
      pulse.setValue(1);
      return;
    }
    const loop = RNAnimated.loop(RNAnimated.sequence([
      RNAnimated.timing(pulse, { toValue: 1.08, duration: 380, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      RNAnimated.timing(pulse, { toValue: 1, duration: 380, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [playing, pulse]);

  return (
    <View className="mb-1.5 items-center rounded-2xl border-2 border-line bg-surface px-4 py-5" testID="listening-prompt">
      <RNAnimated.View style={{ transform: [{ scale: pulse }] }}>
        <Pressable
          onPress={onPlay}
          testID="listening-play"
          accessibilityRole="button"
          accessibilityLabel={translate('quiz.play_word_a11y')}
          accessibilityState={{ busy: playing }}
          hitSlop={8}
          className={cn(
            'size-24 items-center justify-center rounded-full border-b-4 active:translate-y-px active:border-b-2',
            playing
              ? 'border-primary-700 bg-primary-500 dark:border-[#557044] dark:bg-[#7FA35E]'
              : 'border-info-700 bg-info-500 dark:border-[#3B6C89] dark:bg-[#6DB4DE]',
          )}
        >
          <VolumeIcon size={44} color="#FFFFFF" />
        </Pressable>
      </RNAnimated.View>

      <Pressable
        onPress={onPlaySlow}
        testID="listening-play-slow"
        accessibilityRole="button"
        accessibilityLabel={translate('quiz.listen_slow')}
        hitSlop={6}
        className="mt-4 h-10 flex-row items-center gap-1.5 rounded-full border-2 border-b-[3px] border-line bg-surface px-4 active:translate-y-px active:border-b-2 active:bg-pressed"
      >
        <Text className="text-[16px]">🐢</Text>
        <Text className="font-nunito text-[14px] font-extrabold text-mascot-navy dark:text-neutral-100">
          {translate('quiz.listen_slow')}
        </Text>
      </Pressable>

      {revealed
        ? (
            <View className="mt-4 items-center" accessibilityLiveRegion="polite">
              <Text className="font-inter text-[12px] font-bold tracking-wide text-neutral-400 uppercase">
                {translate('quiz.you_heard')}
              </Text>
              <Text testID="listening-word" className="mt-0.5 text-center font-nunito text-[28px] leading-tight font-extrabold text-mascot-navy dark:text-neutral-50">
                {word}
              </Text>
              {!!meaning && (
                <Text className="mt-1 text-center font-inter text-[14px] font-medium text-neutral-500 dark:text-neutral-400">
                  {meaning}
                </Text>
              )}
            </View>
          )
        : failed
          ? (
              <View className="mt-4 w-full items-center" accessibilityLiveRegion="polite">
                <Text className="text-center font-inter text-[13px] font-semibold text-error-700 dark:text-error-300">
                  {translate('quiz.audio_failed')}
                </Text>
                <View className="mt-3 flex-row gap-2">
                  <Pressable
                    onPress={onPlay}
                    accessibilityRole="button"
                    className="h-10 items-center justify-center rounded-xl border-2 border-b-[3px] border-line bg-surface px-4 active:bg-pressed"
                  >
                    <Text className="font-nunito text-[14px] font-extrabold text-mascot-navy dark:text-neutral-100">{translate('quiz.retry_audio')}</Text>
                  </Pressable>
                  <Pressable
                    onPress={onShowWord}
                    testID="listening-show-word"
                    accessibilityRole="button"
                    className="h-10 items-center justify-center rounded-xl bg-muted px-4 active:bg-pressed"
                  >
                    <Text className="font-nunito text-[14px] font-extrabold text-neutral-600 dark:text-neutral-300">{translate('quiz.show_word')}</Text>
                  </Pressable>
                </View>
              </View>
            )
          : (
              <Text className="mt-3 text-center font-inter text-[12px] font-medium text-neutral-400 dark:text-neutral-500">
                {translate('quiz.listening_volume_hint')}
              </Text>
            )}
    </View>
  );
}
