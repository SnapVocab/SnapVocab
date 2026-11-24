import type { StoryDTO, StorySentenceDTO, SubmitStoryClozeResponse, TargetWordDTO } from './types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  FocusAwareStatusBar,
  Pressable,
  ScreenHeader,
  showErrorMessage,
  Text,
  useSurface,
} from '@/components/ui';
import { VolumeIcon } from '@/components/ui/icons';
import { useTts } from '@/lib/hooks/use-tts';
import { translate } from '@/lib/i18n';
import { useStory, useSubmitStoryCloze } from './api';

type ReaderTab = 'READ' | 'CLOZE';

function splitHighlightedText(text: string): { text: string; highlighted: boolean }[] {
  const parts: { text: string; highlighted: boolean }[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null = regex.exec(text);
  while (match !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), highlighted: false });
    }
    parts.push({ text: match[1], highlighted: true });
    lastIndex = match.index + match[0].length;
    match = regex.exec(text);
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), highlighted: false });
  }
  return parts;
}

function ReadStoryPanel({
  story,
  onStartCloze,
}: {
  story: StoryDTO;
  onStartCloze: () => void;
}) {
  const { speak } = useTts();
  const [selectedWord, setSelectedWord] = React.useState<TargetWordDTO | null>(null);
  const [revealMeaning, setRevealMeaning] = React.useState(false);
  const [showTranslations, setShowTranslations] = React.useState(false);

  const findWordMeta = (raw: string): TargetWordDTO => {
    const clean = raw.trim().toLowerCase();
    return story.targetWords.find(w => w.word.toLowerCase() === clean) ?? {
      word: raw,
      meaning: '',
      phonetic: '',
      partOfSpeech: '',
    };
  };

  const handleTapWord = (raw: string) => {
    const meta = findWordMeta(raw);
    setSelectedWord(meta);
    setRevealMeaning(false);
    speak(meta.word);
  };

  return (
    <View className="gap-4">
      {story.mode === 'ENGLISH' && (
        <View className="flex-row justify-end">
          <Pressable
            onPress={() => setShowTranslations(v => !v)}
            className="min-h-9 items-center justify-center rounded-xl border border-line bg-surface px-3"
          >
            <Text className="font-nunito text-xs font-extrabold text-primary-700 dark:text-primary-300">
              {showTranslations ? translate('story.hide_translation') : translate('story.show_translation')}
            </Text>
          </Pressable>
        </View>
      )}

      <View className="gap-3.5 rounded-2xl border-2 border-b-4 border-line border-b-edge bg-surface p-5">
        {story.sentences.map((s: StorySentenceDTO) => {
          const segments = splitHighlightedText(s.text);
          return (
            <View key={s.index} className="gap-1">
              <Text className="font-inter text-[15px]/7 text-mascot-navy dark:text-neutral-100">
                {segments.map((seg, i) =>
                  seg.highlighted ? (
                    <Text
                      key={`${s.index}-${i}`}
                      onPress={() => handleTapWord(seg.text)}
                      className="rounded-md bg-amber-100 font-nunito font-black text-amber-800 dark:bg-amber-500/25 dark:text-amber-300"
                    >
                      {` ${seg.text} `}
                    </Text>
                  ) : (
                    <Text key={`${s.index}-${i}`}>{seg.text}</Text>
                  ),
                )}
              </Text>
              {story.mode === 'ENGLISH' && showTranslations && !!s.translation && (
                <Text className="font-inter text-xs/5 text-neutral-500 dark:text-neutral-400">
                  {s.translation}
                </Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Word Inspector — meaning stays hidden until user explicitly taps reveal */}
      <View className="rounded-2xl border-2 border-amber-300/70 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/10">
        {selectedWord ? (
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-2">
                <Text className="font-nunito text-base font-black text-amber-800 dark:text-amber-300">
                  {selectedWord.word}
                </Text>
                {(!!selectedWord.phonetic || !!selectedWord.partOfSpeech) && (
                  <Text className="font-inter text-xs text-neutral-600 dark:text-neutral-300">
                    {[selectedWord.phonetic, selectedWord.partOfSpeech].filter(Boolean).join(' · ')}
                  </Text>
                )}
              </View>
              <Pressable
                onPress={() => speak(selectedWord.word)}
                className="min-h-10 flex-row items-center gap-1.5 rounded-xl bg-amber-500 px-3"
              >
                <VolumeIcon width={16} height={16} color="#FFFFFF" />
                <Text className="font-nunito text-xs font-extrabold text-white">
                  {translate('story.listen')}
                </Text>
              </Pressable>
            </View>

            {!!selectedWord.meaning && (
              revealMeaning ? (
                <Text className="font-inter text-sm font-bold text-primary-700 dark:text-primary-300">
                  {selectedWord.meaning}
                </Text>
              ) : (
                <Pressable onPress={() => setRevealMeaning(true)} className="self-start py-1">
                  <Text className="font-inter text-xs font-bold text-neutral-500 underline dark:text-neutral-300">
                    {translate('story.reveal_meaning')}
                  </Text>
                </Pressable>
              )
            )}
          </View>
        ) : (
          <Text className="font-inter text-xs/5 text-amber-800 dark:text-amber-200">
            {translate('story.tap_word_hint')}
          </Text>
        )}
      </View>

      {story.totalBlanks > 0 && (
        <Button label={translate('story.start_cloze')} onPress={onStartCloze} />
      )}
    </View>
  );
}

function ClozeStoryPanel({ story }: { story: StoryDTO }) {
  const submitMutation = useSubmitStoryCloze();
  const allBlanks = React.useMemo(
    () => story.sentences.flatMap(s => s.blanks ?? []),
    [story.sentences],
  );
  const wordBank = React.useMemo(() => {
    const unique = Array.from(new Set(allBlanks.map(b => b.displayWord || b.answer)));
    return [...unique].sort((a, b) => a.localeCompare(b));
  }, [allBlanks]);

  const [answers, setAnswers] = React.useState<Record<number, string>>({});
  const [activeBlank, setActiveBlank] = React.useState<number>(allBlanks[0]?.blankIndex ?? 0);
  const [result, setResult] = React.useState<SubmitStoryClozeResponse | null>(null);

  const pickWord = (word: string) => {
    setResult(null);
    const next = { ...answers, [activeBlank]: word };
    setAnswers(next);
    const nextEmpty = allBlanks.find(b => !next[b.blankIndex]);
    if (nextEmpty) {
      setActiveBlank(nextEmpty.blankIndex);
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = allBlanks.map(b => ({
        blankIndex: b.blankIndex,
        value: answers[b.blankIndex] ?? '',
      }));
      const res = await submitMutation.mutateAsync({
        storyId: story.id,
        data: { answers: payload },
      });
      setResult(res);
    }
    catch (err: any) {
      showErrorMessage(err?.response?.data?.message || translate('story.submit_error'));
    }
  };

  const resultMap = React.useMemo(() => {
    const map = new Map<number, { correct: boolean; expected: string }>();
    for (const r of result?.results ?? []) {
      map.set(r.blankIndex, { correct: r.correct, expected: r.expected });
    }
    return map;
  }, [result]);

  return (
    <View className="gap-4">
      <View className="gap-3.5 rounded-2xl border-2 border-b-4 border-line border-b-edge bg-surface p-5">
        {story.sentences.map((s) => {
          const segments = splitHighlightedText(s.text);
          let localBlankCursor = 0;
          return (
            <Text key={s.index} className="font-inter text-[15px]/8 text-mascot-navy dark:text-neutral-100">
              {segments.map((seg, i) => {
                if (!seg.highlighted) {
                  return <Text key={`${s.index}-${i}`}>{seg.text}</Text>;
                }
                const blank = s.blanks?.[localBlankCursor++];
                if (!blank) {
                  return <Text key={`${s.index}-${i}`}>{seg.text}</Text>;
                }
                const filled = answers[blank.blankIndex];
                const graded = resultMap.get(blank.blankIndex);
                const isActive = activeBlank === blank.blankIndex && !graded;
                const tone = graded
                  ? graded.correct
                    ? 'bg-primary-100 text-primary-800 dark:bg-primary-500/30 dark:text-primary-200'
                    : 'bg-danger-100 text-danger-700 dark:bg-danger-500/30 dark:text-danger-200'
                  : isActive
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/30 dark:text-amber-200'
                    : 'bg-surface-raised text-mascot-navy dark:text-white';
                return (
                  <Text
                    key={`${s.index}-${i}`}
                    onPress={() => setActiveBlank(blank.blankIndex)}
                    className={`rounded-md font-nunito font-black ${tone}`}
                  >
                    {` [${filled || `${blank.blankIndex + 1}. ____`}${graded && !graded.correct ? ` → ${graded.expected}` : ''}] `}
                  </Text>
                );
              })}
            </Text>
          );
        })}
      </View>

      <View className="gap-2">
        <Text className="font-nunito text-xs font-extrabold tracking-wider text-neutral-500 uppercase dark:text-neutral-300">
          {translate('story.word_bank')}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {wordBank.map(word => (
            <Pressable
              key={word}
              onPress={() => pickWord(word)}
              className="min-h-10 items-center justify-center overflow-hidden rounded-xl border-2 border-b-4 border-line border-b-edge bg-surface px-3.5 active:translate-y-px"
            >
              <Text className="font-nunito text-xs font-black text-mascot-navy dark:text-white">
                {word}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {result && (
        <View className={`rounded-2xl border-2 p-4 ${result.accuracyPercent >= 70 ? 'border-primary-400 bg-primary-50 dark:bg-primary-500/15' : 'border-amber-400 bg-amber-50 dark:bg-amber-500/15'}`}>
          <Text className="font-nunito text-base font-black text-mascot-navy dark:text-white">
            {translate('story.score_summary', {
              correct: result.correctCount,
              total: result.totalBlanks,
              percent: result.accuracyPercent,
            })}
          </Text>
          {result.xpAwardedNow > 0 && (
            <Text className="mt-1 font-nunito text-sm font-extrabold text-primary-700 dark:text-primary-300">
              {translate('story.xp_earned', { xp: result.xpAwardedNow })}
            </Text>
          )}
        </View>
      )}

      <Button
        label={translate('story.check_answers')}
        loading={submitMutation.isPending}
        onPress={() => void handleSubmit()}
      />
    </View>
  );
}

export function StoryReaderScreen() {
  const router = useRouter();
  const surface = useSurface();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const storyId = id ? Number(id) : undefined;
  const query = useStory(storyId);
  const [tab, setTab] = React.useState<ReaderTab>('READ');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: surface.headerBg }} edges={['top']}>
      <FocusAwareStatusBar />
      <ScreenHeader
        title={query.data?.title ?? translate('story.lab_title')}
        onBack={() => router.back()}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: surface.background }}
        contentContainerClassName="px-4 pt-4 pb-10"
        showsVerticalScrollIndicator={false}
      >
        {query.isLoading ? (
          <ActivityIndicator className="my-12" />
        ) : !query.data ? (
          <View className="items-center gap-3 py-12">
            <Text className="font-inter text-sm text-neutral-500">{translate('story.load_error')}</Text>
            <Button label={translate('word_detail.retry')} fullWidth={false} onPress={() => void query.refetch()} />
          </View>
        ) : (
          <>
            <View className="mb-4 flex-row gap-1.5 rounded-2xl border border-line bg-surface p-1">
              {([
                { id: 'READ', label: translate('story.tab_read') },
                { id: 'CLOZE', label: translate('story.tab_cloze') },
              ] as const).map((item) => {
                const active = tab === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setTab(item.id)}
                    className={`min-h-10 flex-1 items-center justify-center overflow-hidden rounded-xl ${
                      active ? 'bg-brand' : 'bg-transparent'
                    }`}
                  >
                    <Text className={`font-nunito text-xs font-black ${active ? 'text-on-brand' : 'text-neutral-500 dark:text-neutral-300'}`}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {tab === 'READ' ? (
              <ReadStoryPanel story={query.data} onStartCloze={() => setTab('CLOZE')} />
            ) : (
              <ClozeStoryPanel story={query.data} />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default StoryReaderScreen;
