import type { StoryDTO, TargetWordDTO } from '../types';
import * as React from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Pressable, Text } from '@/components/ui';
import { EyeIcon, SparklesIcon, VolumeIcon } from '@/components/ui/icons';
import { useTts } from '@/lib/hooks/use-tts';
import { translate } from '@/lib/i18n';
import { buildStoryParagraphs } from '../utils';

type Props = {
  story: StoryDTO;
  onStartCloze: () => void;
};

export function StoryReadPanel({ story, onStartCloze }: Props) {
  const { speak } = useTts();
  const { paragraphs, allBlanks } = React.useMemo(
    () => buildStoryParagraphs(story.sentences),
    [story.sentences],
  );

  const [selectedWord, setSelectedWord] = React.useState<TargetWordDTO | null>(null);
  const [revealMeaning, setRevealMeaning] = React.useState(false);

  const findWordMeta = React.useCallback(
    (raw: string): TargetWordDTO => {
      const clean = raw.trim().toLowerCase();
      const exact = story.targetWords.find(w => w.word.toLowerCase() === clean);
      if (exact)
        return exact;
      const prefix = story.targetWords.find(
        w => clean.startsWith(w.word.toLowerCase()) || w.word.toLowerCase().startsWith(clean),
      );
      return prefix ?? { word: raw.trim(), meaning: '', phonetic: '', partOfSpeech: '' };
    },
    [story.targetWords],
  );

  const handleTapWord = React.useCallback(
    (raw: string) => {
      const meta = findWordMeta(raw);
      setSelectedWord(meta);
      setRevealMeaning(false);
      speak(meta.word);
    },
    [findWordMeta, speak],
  );

  return (
    <View className="gap-4">
      {/* Editorial Blended Story Page */}
      <View className="gap-5 rounded-3xl border-2 border-b-4 border-line border-b-edge bg-surface p-5">
        {paragraphs.map(para => (
          <View key={para.paragraph}>
            <Text className="font-inter text-[16.5px]/8 text-mascot-navy dark:text-neutral-100">
              {para.sentences.map(({ sentence, segments }, sIdx) => (
                <React.Fragment key={sentence.index}>
                  {sIdx > 0 ? ' ' : ''}
                  {segments.map((seg) => {
                    if (seg.type === 'text') {
                      return <Text key={seg.id}>{seg.text}</Text>;
                    }
                    const isFocused = selectedWord?.word.toLowerCase() === seg.text.toLowerCase();
                    return (
                      <Text
                        key={seg.id}
                        onPress={() => handleTapWord(seg.text)}
                        className={
                          isFocused
                            ? 'rounded-md bg-primary-100 font-nunito font-black text-primary-800 underline decoration-primary-500 dark:bg-primary-500/30 dark:text-primary-200'
                            : 'rounded-md bg-amber-100/90 font-nunito font-black text-amber-900 underline decoration-amber-400 dark:bg-amber-500/25 dark:text-amber-200'
                        }
                      >
                        {`\u00A0${seg.text}\u00A0`}
                      </Text>
                    );
                  })}
                </React.Fragment>
              ))}
            </Text>
          </View>
        ))}
      </View>

      {/* Interactive Word Inspector */}
      <View className="rounded-2xl border-2 border-amber-300/80 bg-amber-50/90 p-4 dark:border-amber-500/40 dark:bg-amber-500/10">
        {selectedWord ? (
          <View className="gap-2.5">
            <View className="flex-row items-center justify-between gap-2">
              <View className="flex-1">
                <Text className="font-nunito text-lg font-black text-mascot-navy dark:text-amber-200">
                  {selectedWord.word}
                </Text>
                {(!!selectedWord.phonetic || !!selectedWord.partOfSpeech) && (
                  <Text className="font-inter text-xs font-medium text-neutral-600 dark:text-neutral-300">
                    {[selectedWord.phonetic, selectedWord.partOfSpeech].filter(Boolean).join(' · ')}
                  </Text>
                )}
              </View>
              <Pressable
                onPress={() => speak(selectedWord.word)}
                className="min-h-11 flex-row items-center gap-1.5 rounded-xl border-b-2 border-amber-700 bg-amber-500 px-3.5"
              >
                <VolumeIcon width={16} height={16} color="#FFFFFF" />
                <Text className="font-nunito text-xs font-black text-white">
                  {translate('story.listen')}
                </Text>
              </Pressable>
            </View>

            {!!selectedWord.meaning && (
              revealMeaning ? (
                <View className="rounded-xl bg-white/80 px-3 py-2 dark:bg-neutral-900/70">
                  <Text className="font-inter text-sm font-bold text-primary-700 dark:text-primary-300">
                    {selectedWord.meaning}
                  </Text>
                </View>
              ) : (
                <Pressable
                  onPress={() => setRevealMeaning(true)}
                  className="min-h-9 flex-row items-center gap-1.5 self-start rounded-lg bg-white/70 px-3 py-1.5 dark:bg-neutral-900/60"
                >
                  <EyeIcon width={14} height={14} color="#92400E" />
                  <Text className="font-nunito text-xs font-extrabold text-amber-900 dark:text-amber-200">
                    {translate('story.reveal_meaning')}
                  </Text>
                </Pressable>
              )
            )}
          </View>
        ) : (
          <View className="flex-row items-center gap-2.5">
            <SparklesIcon width={18} height={18} color="#D97706" />
            <Text className="flex-1 font-inter text-xs/5 font-medium text-amber-900 dark:text-amber-200">
              {translate('story.tap_word_hint')}
            </Text>
          </View>
        )}
      </View>

      {/* Quick Target Word Strip */}
      {story.targetWords.length > 0 && (
        <View className="gap-2">
          <Text className="font-nunito text-xs font-extrabold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
            {`${translate('story.words_in_story')} (${story.targetWords.length})`}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pr-2">
            {story.targetWords.map((tw) => {
              const active = selectedWord?.word.toLowerCase() === tw.word.toLowerCase();
              return (
                <Pressable
                  key={tw.word}
                  onPress={() => handleTapWord(tw.word)}
                  className={`min-h-10 flex-row items-center gap-1.5 rounded-xl border px-3 ${
                    active
                      ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-500/20'
                      : 'border-line bg-surface'
                  }`}
                >
                  <VolumeIcon width={13} height={13} color={active ? '#4E7A25' : '#9CA3AF'} />
                  <Text className={`font-nunito text-xs font-black ${active ? 'text-primary-700 dark:text-primary-300' : 'text-mascot-navy dark:text-white'}`}>
                    {tw.word}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {allBlanks.length > 0 && (
        <Button
          label={translate('story.start_cloze')}
          onPress={onStartCloze}
          className="mt-1"
        />
      )}
    </View>
  );
}
