import type { Href } from 'expo-router';
import type { StoryDTO, StoryGenre, StoryLevel, StoryMode, StorySource } from './types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, ScrollView, TextInput, View } from 'react-native';
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
import { ChevronRightIcon } from '@/components/ui/icons';
import { useCollections } from '@/features/learn/api';
import { useMyWords } from '@/features/my-words/api';
import { translate } from '@/lib/i18n';
import { useGenerateStory, useStories } from './api';

const MIN_WORDS = 3;
const MAX_WORDS = 20;
const WORD_REGEX = /^[a-z][a-z\s'-]{0,39}$/i;
const LEVELS: StoryLevel[] = ['A1', 'A2', 'B1', 'B2'];
const GENRES: { id: StoryGenre; labelKey: string }[] = [
  { id: 'DAILY', labelKey: 'story.genre_daily' },
  { id: 'FUNNY', labelKey: 'story.genre_funny' },
  { id: 'OFFICE', labelKey: 'story.genre_office' },
  { id: 'TRAVEL', labelKey: 'story.genre_travel' },
];

const CARD_3D = 'overflow-hidden rounded-2xl border-2 border-b-4 border-line border-b-edge bg-surface';

function StoryLevelGenrePicker({
  level,
  genre,
  onSelectLevel,
  onSelectGenre,
}: {
  level: StoryLevel;
  genre: StoryGenre;
  onSelectLevel: (lv: StoryLevel) => void;
  onSelectGenre: (g: StoryGenre) => void;
}) {
  return (
    <>
      <Text className="mb-2 font-nunito text-xs font-extrabold tracking-wider text-neutral-500 uppercase dark:text-neutral-300">
        {translate('story.level_genre_label')}
      </Text>
      <View className="mb-2.5 flex-row gap-2">
        {LEVELS.map((lv) => {
          const active = level === lv;
          return (
            <Pressable
              key={lv}
              onPress={() => onSelectLevel(lv)}
              className={`min-h-10 flex-1 items-center justify-center overflow-hidden rounded-xl border-2 ${
                active
                  ? 'border-primary-500 bg-primary-50 dark:border-[#7FA35E] dark:bg-primary-500/20'
                  : 'border-line bg-surface'
              }`}
            >
              <Text className={`font-nunito text-xs font-black ${active ? 'text-primary-700 dark:text-primary-300' : 'text-mascot-navy dark:text-white'}`}>
                {lv}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mb-5 flex-row flex-wrap gap-2">
        {GENRES.map((g) => {
          const active = genre === g.id;
          return (
            <Pressable
              key={g.id}
              onPress={() => onSelectGenre(g.id)}
              className={`min-h-10 items-center justify-center overflow-hidden rounded-xl border-2 px-3.5 ${
                active
                  ? 'border-amber-500 bg-amber-50 dark:border-amber-400 dark:bg-amber-500/20'
                  : 'border-line bg-surface'
              }`}
            >
              <Text className={`font-nunito text-xs font-extrabold ${active ? 'text-amber-700 dark:text-amber-300' : 'text-mascot-navy dark:text-white'}`}>
                {translate(g.labelKey as any)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

function StoryHistoryItem({ story, onPress }: { story: StoryDTO; onPress: () => void }) {
  const surface = useSurface();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={`${CARD_3D} mb-2.5 flex-row items-center justify-between px-4 py-3.5 active:bg-pressed`}
    >
      <View className="mr-3 min-w-0 flex-1">
        <Text className="font-nunito text-[15px] font-black text-mascot-navy dark:text-white" numberOfLines={1}>
          {story.title}
        </Text>
        <Text className="mt-0.5 font-inter text-xs text-neutral-500 dark:text-neutral-300" numberOfLines={1}>
          {`${story.mode === 'BLENDED' ? translate('story.mode_blended') : translate('story.mode_english')} · ${story.level} · ${story.targetWords.length} ${translate('story.words_unit')}${story.bestScore != null ? ` · ${story.bestScore}/${story.totalBlanks}` : ''}`}
        </Text>
      </View>
      <ChevronRightIcon color={surface.action} width={18} height={18} />
    </Pressable>
  );
}

function StoryModePicker({
  mode,
  onSelect,
}: {
  mode: StoryMode;
  onSelect: (m: StoryMode) => void;
}) {
  return (
    <>
      <Text className="mb-2 font-nunito text-xs font-extrabold tracking-wider text-neutral-500 uppercase dark:text-neutral-300">
        {translate('story.mode_label')}
      </Text>
      <View className="mb-4 flex-row gap-2.5">
        {(['BLENDED', 'ENGLISH'] as const).map((m) => {
          const active = mode === m;
          return (
            <Pressable
              key={m}
              onPress={() => onSelect(m)}
              className={`min-h-14 flex-1 overflow-hidden rounded-2xl border-2 border-b-4 p-3 ${
                active
                  ? 'border-primary-500 border-b-primary-700 bg-primary-50 dark:border-[#7FA35E] dark:bg-primary-500/15'
                  : 'border-line border-b-edge bg-surface'
              }`}
            >
              <Text className={`font-nunito text-sm font-black ${active ? 'text-primary-700 dark:text-primary-300' : 'text-mascot-navy dark:text-white'}`}>
                {translate(m === 'BLENDED' ? 'story.mode_blended' : 'story.mode_english')}
              </Text>
              <Text className="mt-0.5 font-inter text-xs text-neutral-500 dark:text-neutral-300">
                {translate(m === 'BLENDED' ? 'story.mode_blended_desc' : 'story.mode_english_desc')}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

export function StoryHubScreen() {
  const router = useRouter();
  const surface = useSurface();
  const params = useLocalSearchParams<{ source?: string; topicId?: string; words?: string }>();

  const initialSource: StorySource
    = params.source === 'TOPIC' || params.source === 'SCAN' || params.source === 'CUSTOM'
      ? params.source
      : 'MY_WORDS';
  const initialWords = React.useMemo(() => {
    if (!params.words)
      return [];
    return params.words
      .split(',')
      .map(w => w.trim())
      .filter(w => WORD_REGEX.test(w))
      .slice(0, MAX_WORDS);
  }, [params.words]);

  const [mode, setMode] = React.useState<StoryMode>('BLENDED');
  const [source, setSource] = React.useState<StorySource>(initialSource);
  const [selectedWords, setSelectedWords] = React.useState<string[]>(initialWords);
  const [customInput, setCustomInput] = React.useState('');
  const [level, setLevel] = React.useState<StoryLevel>('A2');
  const [genre, setGenre] = React.useState<StoryGenre>('DAILY');
  const [topicId] = React.useState<number | undefined>(params.topicId ? Number(params.topicId) : undefined);

  const storiesQuery = useStories();
  const myWordsQuery = useMyWords();
  const collectionsQuery = useCollections({ type: 'USER' });
  const generateMutation = useGenerateStory();

  const myWordPool = React.useMemo(
    () => (myWordsQuery.data?.pages.flatMap(p => p.data).map(w => w.word) ?? []).slice(0, 30),
    [myWordsQuery.data],
  );

  // Auto-select up to 5 saved words when opening fresh on MY_WORDS with nothing preselected.
  React.useEffect(() => {
    if (source === 'MY_WORDS' && selectedWords.length === 0 && myWordPool.length > 0) {
      setSelectedWords(myWordPool.slice(0, Math.min(5, myWordPool.length)));
    }
  }, [source, myWordPool, selectedWords.length]);

  const toggleWord = (word: string) => {
    const key = word.toLowerCase();
    const exists = selectedWords.some(w => w.toLowerCase() === key);
    if (exists) {
      setSelectedWords(prev => prev.filter(w => w.toLowerCase() !== key));
      return;
    }
    if (selectedWords.length >= MAX_WORDS) {
      showErrorMessage(translate('story.max_words_error', { max: MAX_WORDS }));
      return;
    }
    setSelectedWords(prev => [...prev, word]);
  };

  const handleAddCustom = () => {
    const parts = customInput.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length === 0)
      return;
    const next = [...selectedWords];
    for (const part of parts) {
      if (!WORD_REGEX.test(part)) {
        showErrorMessage(translate('story.invalid_word_error'));
        continue;
      }
      if (next.length >= MAX_WORDS) {
        showErrorMessage(translate('story.max_words_error', { max: MAX_WORDS }));
        break;
      }
      if (!next.some(w => w.toLowerCase() === part.toLowerCase())) {
        next.push(part);
      }
    }
    setSelectedWords(next);
    setCustomInput('');
  };

  const canGenerate = (source === 'TOPIC' && !!topicId) || selectedWords.length >= MIN_WORDS;
  const quota = storiesQuery.data?.quota;

  const handleGenerate = async () => {
    if (!canGenerate) {
      showErrorMessage(translate('story.min_words_error', { min: MIN_WORDS }));
      return;
    }
    try {
      const created = await generateMutation.mutateAsync({
        source,
        topicId: source === 'TOPIC' ? topicId : undefined,
        words: selectedWords.length > 0 ? selectedWords : undefined,
        mode,
        level,
        genre,
      });
      router.push(`/story/${created.id}` as Href);
    }
    catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || translate('story.generate_error');
      showErrorMessage(msg);
    }
  };

  const wordPool = source === 'MY_WORDS'
    ? Array.from(new Set([...myWordPool, ...selectedWords]))
    : selectedWords;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: surface.headerBg }} edges={['top']}>
      <FocusAwareStatusBar />
      <ScreenHeader
        title={translate('story.lab_title')}
        onBack={() => router.back()}
        right={quota ? (
          <View className="rounded-full bg-amber-100 px-2.5 py-1 dark:bg-amber-500/20">
            <Text className="font-nunito text-xs font-extrabold text-amber-800 tabular-nums dark:text-amber-300">
              {`${quota.remaining}/${quota.dailyLimit}`}
            </Text>
          </View>
        ) : undefined}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: surface.background }}
        contentContainerClassName="px-4 pt-4 pb-10"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. Mode Selector */}
        <StoryModePicker mode={mode} onSelect={setMode} />

        {/* 2. Word Sources (3-20 words) */}
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="font-nunito text-xs font-extrabold tracking-wider text-neutral-500 uppercase dark:text-neutral-300">
            {translate('story.words_label', { min: MIN_WORDS, max: MAX_WORDS })}
          </Text>
          <Text className={`font-nunito text-xs font-black tabular-nums ${selectedWords.length < MIN_WORDS ? 'text-danger-600 dark:text-danger-400' : 'text-primary-700 dark:text-primary-300'}`}>
            {`${selectedWords.length} / ${MAX_WORDS}`}
          </Text>
        </View>

        <View className="mb-2.5 flex-row gap-1.5 rounded-2xl border border-line bg-surface p-1">
          {([
            { id: 'MY_WORDS', label: translate('story.src_my_words') },
            { id: 'TOPIC', label: translate('story.src_topic') },
            { id: 'SCAN', label: translate('story.src_scan') },
            { id: 'CUSTOM', label: translate('story.src_custom') },
          ] as const).map((tab) => {
            const active = source === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setSource(tab.id)}
                className={`min-h-9 flex-1 items-center justify-center overflow-hidden rounded-xl px-1 ${
                  active ? 'bg-brand' : 'bg-transparent'
                }`}
              >
                <Text className={`font-nunito text-xs font-extrabold ${active ? 'text-on-brand' : 'text-neutral-500 dark:text-neutral-300'}`} numberOfLines={1}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className={`${CARD_3D} mb-4 p-3.5`}>
          {source === 'CUSTOM' && (
            <View className="mb-3 flex-row gap-2">
              <TextInput
                value={customInput}
                onChangeText={setCustomInput}
                onSubmitEditing={handleAddCustom}
                placeholder={translate('story.custom_placeholder')}
                placeholderTextColor={surface.textMuted}
                returnKeyType="done"
                style={{ color: surface.text, borderColor: surface.border, backgroundColor: surface.background }}
                className="h-11 flex-1 rounded-xl border px-3 font-inter text-sm"
              />
              <Button label={translate('story.add_word')} size="sm" fullWidth={false} onPress={handleAddCustom} className="h-11" />
            </View>
          )}

          {source === 'TOPIC' && !topicId && (
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="flex-1 font-inter text-xs text-neutral-500 dark:text-neutral-300">
                {collectionsQuery.data?.length
                  ? translate('story.topic_open_hint')
                  : translate('story.topic_empty_hint')}
              </Text>
              <Pressable onPress={() => router.push('/collections')} className="ml-2 px-2 py-1">
                <Text className="font-nunito text-xs font-extrabold text-primary-700 dark:text-primary-300">
                  {translate('learn.open_collections')}
                </Text>
              </Pressable>
            </View>
          )}

          {source === 'SCAN' && selectedWords.length === 0 && (
            <View className="flex-row items-center justify-between">
              <Text className="flex-1 font-inter text-xs text-neutral-500 dark:text-neutral-300">
                {translate('story.scan_empty_hint')}
              </Text>
              <Pressable onPress={() => router.push('/(tabs)/camera' as Href)} className="ml-2 px-2 py-1">
                <Text className="font-nunito text-xs font-extrabold text-primary-700 dark:text-primary-300">
                  {translate('home.scan_camera')}
                </Text>
              </Pressable>
            </View>
          )}

          {wordPool.length > 0 && (
            <View className="flex-row flex-wrap gap-2">
              {wordPool.map((w) => {
                const on = selectedWords.some(s => s.toLowerCase() === w.toLowerCase());
                return (
                  <Pressable
                    key={w}
                    onPress={() => toggleWord(w)}
                    className={`min-h-9 items-center justify-center overflow-hidden rounded-xl border px-3 ${
                      on
                        ? 'border-primary-500 bg-primary-50 dark:border-[#7FA35E] dark:bg-primary-500/20'
                        : 'border-line bg-surface-raised'
                    }`}
                  >
                    <Text className={`font-nunito text-xs font-extrabold ${on ? 'text-primary-700 dark:text-primary-300' : 'text-neutral-600 dark:text-neutral-300'}`}>
                      {`${on ? '✓ ' : '+ '}${w}`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* 3. Level & Genre */}
        <StoryLevelGenrePicker
          level={level}
          genre={genre}
          onSelectLevel={setLevel}
          onSelectGenre={setGenre}
        />

        <Button
          label={selectedWords.length >= MIN_WORDS
            ? translate('story.generate_cta', { count: selectedWords.length })
            : translate('story.min_words_cta', { min: MIN_WORDS })}
          loading={generateMutation.isPending}
          disabled={!canGenerate}
          onPress={() => void handleGenerate()}
          className="mb-6"
        />

        {/* 4. History */}
        <Text className="mb-2.5 font-nunito text-xs font-extrabold tracking-wider text-neutral-500 uppercase dark:text-neutral-300">
          {translate('story.history_title')}
        </Text>
        {storiesQuery.isLoading ? (
          <ActivityIndicator className="my-6" />
        ) : (storiesQuery.data?.items ?? []).length === 0 ? (
          <View className={`${CARD_3D} items-center p-6`}>
            <Text className="text-center font-inter text-sm text-neutral-500 dark:text-neutral-300">
              {translate('story.history_empty')}
            </Text>
          </View>
        ) : (
          storiesQuery.data!.items.map(story => (
            <StoryHistoryItem
              key={story.id}
              story={story}
              onPress={() => router.push(`/story/${story.id}` as Href)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default StoryHubScreen;
