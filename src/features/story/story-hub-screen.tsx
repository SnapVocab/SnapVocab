import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { Href } from 'expo-router';
import type { StoryDTO, StoryGenre, StoryLevel, StoryMode } from './types';
import type { QuizAvailableTopic } from '@/features/quiz/api/quiz-api';
import { Image as ExpoImage } from 'expo-image';
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
import {
  CheckCircleIcon,
  ChevronRightIcon,
  CloseIcon,
  EditIcon,
  FolderIcon,
  PlusIcon,
  RepeatIcon,
  SlidersHorizontalIcon,
  TrashIcon,
} from '@/components/ui/icons';
import { useMyWords } from '@/features/my-words/api';
import { useQuizAvailableTopics } from '@/features/quiz/api/quiz-api';
import { TopicSelectBottomSheet } from '@/features/quiz/components/topic-select-bottom-sheet';
import { translate } from '@/lib/i18n';
import { useDeleteStory, useStories } from './api';
import { StoryStyleSheet } from './components/story-style-sheet';
import { StoryWordPickerSheet } from './components/story-word-picker-sheet';
import {
  DEFAULT_SMART_PICK_COUNT,
  MAX_STORY_WORDS,
  MIN_STORY_WORDS,
  sanitizeWordList,
  WORD_TOKEN_REGEX,
} from './utils';

const GENRE_LABELS: Record<StoryGenre, string> = {
  DAILY: 'story.genre_daily',
  FUNNY: 'story.genre_funny',
  OFFICE: 'story.genre_office',
  TRAVEL: 'story.genre_travel',
};

function StoryShelfRow({
  story,
  onOpen,
  onDelete,
}: {
  story: StoryDTO;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const surface = useSurface();
  const previewWords = story.targetWords.slice(0, 4).map(w => w.word).join(', ');
  const restCount = Math.max(0, story.targetWords.length - 4);

  return (
    <View className="mb-2.5 flex-row items-center overflow-hidden rounded-2xl border-2 border-b-4 border-line border-b-edge bg-surface">
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        className="flex-1 flex-row items-center justify-between py-3.5 pr-2 pl-4 active:bg-pressed"
      >
        <View className="mr-2 min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <Text
              className="shrink font-nunito text-[15px] font-black text-mascot-navy dark:text-white"
              numberOfLines={1}
            >
              {story.title}
            </Text>
            {story.bestScore != null && (
              <View className="flex-row items-center gap-1 rounded-md bg-primary-50 px-1.5 py-0.5 dark:bg-primary-500/20">
                <CheckCircleIcon width={11} height={11} color="#58CC02" />
                <Text className="font-nunito text-[10px] font-black text-primary-700 dark:text-primary-300">
                  {`${story.bestScore}%`}
                </Text>
              </View>
            )}
          </View>
          <Text className="mt-0.5 font-inter text-xs text-neutral-500 dark:text-neutral-300" numberOfLines={1}>
            {`${story.mode === 'BLENDED' ? translate('story.mode_blended') : translate('story.mode_english')} · ${story.level}${previewWords ? ` · ${previewWords}${restCount > 0 ? ` +${restCount}` : ''}` : ''}`}
          </Text>
        </View>
        <ChevronRightIcon color={surface.action} width={18} height={18} />
      </Pressable>
      <Pressable
        onPress={onDelete}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={translate('my_words.remove')}
        className="h-12 w-11 items-center justify-center border-l border-line active:bg-pressed"
      >
        <TrashIcon width={15} height={15} color="#EF4444" />
      </Pressable>
    </View>
  );
}

function StoryHeroStage({
  mode,
  level,
  genre,
  selectedTopic,
  effectiveWords,
  canShuffle,
  quickInput,
  onQuickInputChange,
  onQuickAdd,
  onClearTopic,
  onShuffle,
  onOpenWords,
  onOpenStyle,
  onStart,
}: {
  mode: StoryMode;
  level: StoryLevel;
  genre: StoryGenre;
  selectedTopic: { id: number; name: string } | null;
  effectiveWords: string[];
  canShuffle: boolean;
  quickInput: string;
  onQuickInputChange: (v: string) => void;
  onQuickAdd: () => void;
  onClearTopic: () => void;
  onShuffle: () => void;
  onOpenWords: () => void;
  onOpenStyle: () => void;
  onStart: () => void;
}) {
  const surface = useSurface();
  const canStart = Boolean(selectedTopic) || effectiveWords.length >= MIN_STORY_WORDS;

  return (
    <View className="mb-4 overflow-hidden rounded-3xl border-2 border-b-4 border-amber-300/90 border-b-amber-400 bg-amber-50/85 p-5 dark:border-amber-500/35 dark:border-b-amber-600/50 dark:bg-amber-500/10">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Pressable
            onPress={onOpenStyle}
            className="mb-2.5 flex-row items-center gap-1.5 self-start rounded-full border border-amber-300 bg-white/90 px-3 py-1 dark:border-amber-500/40 dark:bg-neutral-900/80"
          >
            <SlidersHorizontalIcon width={12} height={12} color="#B45309" />
            <Text className="font-nunito text-xs font-black text-amber-900 dark:text-amber-200">
              {`${mode === 'BLENDED' ? translate('story.mode_blended') : translate('story.mode_english')} · ${level} · ${translate(GENRE_LABELS[genre] as any)}`}
            </Text>
          </Pressable>

          <Text className="font-nunito text-xl font-black text-mascot-navy dark:text-white">
            {selectedTopic ? selectedTopic.name : translate('story.hero_ready_title')}
          </Text>
          <Text className="mt-1 font-inter text-xs/5 text-neutral-600 dark:text-neutral-300">
            {selectedTopic
              ? translate('story.hero_topic_subtitle')
              : translate('story.hero_words_subtitle')}
          </Text>
        </View>

        <ExpoImage
          accessible={false}
          source={require('../../assets/images/snapy-reading.png')}
          style={{ width: 76, height: 76 }}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      </View>

      {selectedTopic ? (
        <View className="mt-3.5 flex-row items-center justify-between rounded-2xl border border-amber-300/70 bg-white/85 px-3.5 py-2.5 dark:border-amber-500/30 dark:bg-neutral-900/70">
          <View className="flex-1 flex-row items-center gap-2 pr-2">
            <FolderIcon width={16} height={16} color="#D97706" />
            <Text className="flex-1 font-nunito text-xs font-extrabold text-mascot-navy dark:text-white" numberOfLines={1}>
              {translate('story.using_topic_badge', { name: selectedTopic.name })}
            </Text>
          </View>
          <Pressable
            onPress={onClearTopic}
            hitSlop={8}
            className="size-7 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
          >
            <CloseIcon width={12} height={12} color={surface.textMuted} />
          </Pressable>
        </View>
      ) : effectiveWords.length > 0 ? (
        <View className="mt-3.5 gap-2.5">
          <View className="flex-row flex-wrap gap-1.5">
            {effectiveWords.map(w => (
              <View
                key={w}
                className="rounded-xl border border-amber-300/80 bg-white/90 px-2.5 py-1 dark:border-amber-500/35 dark:bg-neutral-900/80"
              >
                <Text className="font-nunito text-xs font-black text-mascot-navy dark:text-amber-200">
                  {w}
                </Text>
              </View>
            ))}
          </View>

          <View className="flex-row items-center gap-2">
            {canShuffle && (
              <Pressable
                onPress={onShuffle}
                className="min-h-9 flex-row items-center gap-1.5 rounded-xl bg-white/80 px-3 py-1.5 dark:bg-neutral-900/70"
              >
                <RepeatIcon width={13} height={13} color="#B45309" />
                <Text className="font-nunito text-xs font-extrabold text-amber-900 dark:text-amber-200">
                  {translate('story.shuffle_words')}
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={onOpenWords}
              className="min-h-9 flex-row items-center gap-1.5 rounded-xl bg-white/80 px-3 py-1.5 dark:bg-neutral-900/70"
            >
              <EditIcon width={13} height={13} color="#B45309" />
              <Text className="font-nunito text-xs font-extrabold text-amber-900 dark:text-amber-200">
                {translate('story.customize_words')}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View className="mt-3.5 flex-row gap-2">
          <TextInput
            value={quickInput}
            onChangeText={onQuickInputChange}
            onSubmitEditing={onQuickAdd}
            placeholder={translate('story.custom_placeholder')}
            placeholderTextColor={surface.textMuted}
            returnKeyType="done"
            style={{ color: surface.text }}
            className="h-11 flex-1 rounded-xl border border-amber-300 bg-white px-3 font-inter text-sm dark:border-amber-500/40 dark:bg-neutral-900"
          />
          <Pressable
            onPress={onQuickAdd}
            className="h-11 items-center justify-center rounded-xl bg-amber-500 px-3.5"
          >
            <PlusIcon width={18} height={18} color="#FFFFFF" />
          </Pressable>
        </View>
      )}

      <Button
        label={
          selectedTopic
            ? translate('story.read_topic_cta')
            : canStart
              ? translate('story.read_now_cta', { count: effectiveWords.length })
              : translate('story.min_words_cta', { min: MIN_STORY_WORDS })
        }
        disabled={!canStart}
        onPress={onStart}
        className="mt-4"
      />
    </View>
  );
}

export function StoryHubScreen() {
  const router = useRouter();
  const surface = useSurface();
  const params = useLocalSearchParams<{ topicId?: string; topicName?: string; words?: string }>();

  const topicSheetRef = React.useRef<BottomSheetModal>(null);
  const wordSheetRef = React.useRef<BottomSheetModal>(null);
  const styleSheetRef = React.useRef<BottomSheetModal>(null);

  const [mode, setMode] = React.useState<StoryMode>('BLENDED');
  const [level, setLevel] = React.useState<StoryLevel>('A2');
  const [genre, setGenre] = React.useState<StoryGenre>('DAILY');
  const [selectedTopic, setSelectedTopic] = React.useState<{ id: number; name: string } | null>(
    params.topicId ? { id: Number(params.topicId), name: params.topicName || 'Topic' } : null,
  );
  const [customWords, setCustomWords] = React.useState<string[] | null>(() =>
    params.words ? sanitizeWordList(params.words.split(',')) : null,
  );
  const [quickInput, setQuickInput] = React.useState('');
  const [shuffleCursor, setShuffleCursor] = React.useState(0);

  const storiesQuery = useStories();
  const deleteMutation = useDeleteStory();
  const myWordsQuery = useMyWords();
  const topicsQuery = useQuizAvailableTopics();

  const savedWords = React.useMemo(
    () => sanitizeWordList(myWordsQuery.data?.pages.flatMap(p => p.data.map(w => w.word)) ?? []),
    [myWordsQuery.data],
  );

  const effectiveWords = React.useMemo(() => {
    if (customWords !== null)
      return customWords;
    if (savedWords.length < MIN_STORY_WORDS)
      return [];
    const count = Math.min(DEFAULT_SMART_PICK_COUNT, savedWords.length);
    const picked: string[] = [];
    for (let i = 0; i < count; i += 1) {
      picked.push(savedWords[(shuffleCursor + i) % savedWords.length]);
    }
    return picked;
  }, [customWords, savedWords, shuffleCursor]);

  const handleShuffleWords = () => {
    if (savedWords.length <= DEFAULT_SMART_PICK_COUNT)
      return;
    setCustomWords(null);
    setSelectedTopic(null);
    setShuffleCursor(prev => (prev + DEFAULT_SMART_PICK_COUNT) % savedWords.length);
  };

  const handleQuickAddInline = () => {
    const parts = quickInput.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
    if (parts.length === 0)
      return;
    const next = [...effectiveWords];
    for (const p of parts) {
      if (!WORD_TOKEN_REGEX.test(p)) {
        showErrorMessage(translate('story.invalid_word_error'));
        continue;
      }
      if (next.length >= MAX_STORY_WORDS)
        break;
      if (!next.some(w => w.toLowerCase() === p.toLowerCase())) {
        next.push(p);
      }
    }
    setSelectedTopic(null);
    setCustomWords(next);
    setQuickInput('');
  };

  const handleSelectTopic = (topic: QuizAvailableTopic) => {
    setSelectedTopic({ id: topic.id, name: topic.name });
  };

  const handleStartStory = () => {
    const canStart = Boolean(selectedTopic) || effectiveWords.length >= MIN_STORY_WORDS;
    if (!canStart) {
      showErrorMessage(translate('story.min_words_error', { min: MIN_STORY_WORDS }));
      return;
    }
    router.push({
      pathname: '/story/[id]',
      params: {
        id: 'new',
        source: selectedTopic ? 'TOPIC' : 'CUSTOM',
        ...(selectedTopic
          ? { topicId: String(selectedTopic.id), topicName: selectedTopic.name }
          : { words: effectiveWords.join(',') }),
        mode,
        level,
        genre,
      },
    } as any);
  };

  const quota = storiesQuery.data?.quota;

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
        contentContainerClassName="px-4 pt-4 pb-12"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <StoryHeroStage
          mode={mode}
          level={level}
          genre={genre}
          selectedTopic={selectedTopic}
          effectiveWords={effectiveWords}
          canShuffle={savedWords.length > DEFAULT_SMART_PICK_COUNT}
          quickInput={quickInput}
          onQuickInputChange={setQuickInput}
          onQuickAdd={handleQuickAddInline}
          onClearTopic={() => setSelectedTopic(null)}
          onShuffle={handleShuffleWords}
          onOpenWords={() => requestAnimationFrame(() => wordSheetRef.current?.present())}
          onOpenStyle={() => requestAnimationFrame(() => styleSheetRef.current?.present())}
          onStart={handleStartStory}
        />

        {/* Source Pickers */}
        <View className="mb-6 gap-2.5">
          <Pressable
            onPress={() => requestAnimationFrame(() => topicSheetRef.current?.present())}
            className="flex-row items-center justify-between rounded-2xl border-2 border-b-4 border-line border-b-edge bg-surface px-4 py-3.5 active:bg-pressed"
          >
            <View className="flex-1 flex-row items-center gap-3 pr-2">
              <View className="size-10 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-500/20">
                <FolderIcon width={20} height={20} color="#0284C7" />
              </View>
              <View className="flex-1">
                <Text className="font-nunito text-sm font-black text-mascot-navy dark:text-white">
                  {translate('story.pick_from_topic_title')}
                </Text>
                <Text className="font-inter text-xs text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
                  {translate('story.pick_from_topic_desc')}
                </Text>
              </View>
            </View>
            <ChevronRightIcon width={18} height={18} color={surface.action} />
          </Pressable>

          <Pressable
            onPress={() => {
              setSelectedTopic(null);
              requestAnimationFrame(() => wordSheetRef.current?.present());
            }}
            className="flex-row items-center justify-between rounded-2xl border-2 border-b-4 border-line border-b-edge bg-surface px-4 py-3.5 active:bg-pressed"
          >
            <View className="flex-1 flex-row items-center gap-3 pr-2">
              <View className="size-10 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-500/20">
                <EditIcon width={18} height={18} color="#58CC02" />
              </View>
              <View className="flex-1">
                <Text className="font-nunito text-sm font-black text-mascot-navy dark:text-white">
                  {translate('story.pick_custom_words_title')}
                </Text>
                <Text className="font-inter text-xs text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
                  {translate('story.pick_custom_words_desc', { max: MAX_STORY_WORDS })}
                </Text>
              </View>
            </View>
            <ChevronRightIcon width={18} height={18} color={surface.action} />
          </Pressable>
        </View>

        {/* Story Shelf */}
        <Text className="mb-2.5 font-nunito text-xs font-extrabold tracking-wider text-neutral-500 uppercase dark:text-neutral-300">
          {translate('story.history_title')}
        </Text>
        {storiesQuery.isLoading ? (
          <ActivityIndicator className="my-6" />
        ) : (storiesQuery.data?.items ?? []).length === 0 ? (
          <View className="items-center rounded-2xl border-2 border-b-4 border-line border-b-edge bg-surface p-6">
            <Text className="text-center font-inter text-sm text-neutral-500 dark:text-neutral-300">
              {translate('story.history_empty')}
            </Text>
          </View>
        ) : (
          storiesQuery.data!.items.map(story => (
            <StoryShelfRow
              key={story.id}
              story={story}
              onOpen={() => router.push(`/story/${story.id}` as Href)}
              onDelete={() => deleteMutation.mutate(story.id)}
            />
          ))
        )}
      </ScrollView>

      <TopicSelectBottomSheet
        bottomSheetRef={topicSheetRef}
        selectedTopicId={selectedTopic?.id}
        topics={topicsQuery.data ?? []}
        isLoading={topicsQuery.isLoading}
        onSelectTopic={handleSelectTopic}
      />

      <StoryWordPickerSheet
        bottomSheetRef={wordSheetRef}
        selectedWords={effectiveWords}
        savedWords={savedWords}
        onChangeWords={(words) => {
          setSelectedTopic(null);
          setCustomWords(words);
        }}
      />

      <StoryStyleSheet
        bottomSheetRef={styleSheetRef}
        mode={mode}
        level={level}
        genre={genre}
        onChangeMode={setMode}
        onChangeLevel={setLevel}
        onChangeGenre={setGenre}
      />
    </SafeAreaView>
  );
}

export default StoryHubScreen;
