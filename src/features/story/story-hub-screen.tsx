import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { Href } from 'expo-router';
import type { StoryWordPickerTab } from './components/story-word-picker-sheet';
import type { StoryDTO, StoryGenre } from './types';
import type { QuizAvailableTopic } from '@/features/quiz/api/quiz-api';
import { Image as ExpoImage } from 'expo-image';
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
import {
  CheckCircleIcon,
  ChevronRightIcon,
  EditIcon,
  FolderIcon,
  RepeatIcon,
  TrashIcon,
} from '@/components/ui/icons';
import { useMyWords } from '@/features/my-words/api';
import { TopicSelectBottomSheet } from '@/features/quiz/components/topic-select-bottom-sheet';
import { translate } from '@/lib/i18n';
import { useDeleteStory, useStories, useStoryTopics, useStoryTopicWords } from './api';
import { StoryWordPickerSheet } from './components/story-word-picker-sheet';
import {
  DEFAULT_SMART_PICK_COUNT,
  MAX_STORY_WORDS,
  MIN_STORY_WORDS,
  pickRandomFromPool,
  sanitizeWordList,
} from './utils';

const GENRES: { id: StoryGenre; labelKey: string }[] = [
  { id: 'DAILY', labelKey: 'story.genre_daily' },
  { id: 'FUNNY', labelKey: 'story.genre_funny' },
  { id: 'OFFICE', labelKey: 'story.genre_office' },
  { id: 'TRAVEL', labelKey: 'story.genre_travel' },
];

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
  const genreLabel = translate((GENRE_LABELS[story.genre] ?? 'story.genre_daily') as any);

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
            {`${genreLabel}${previewWords ? ` · ${previewWords}${restCount > 0 ? ` +${restCount}` : ''}` : ''}`}
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
  genre,
  onChangeGenre,
  sourceBadgeLabel,
  selectedTopic,
  selectedWords,
  translationMap,
  topicPoolTotal,
  isLoadingWords,
  canShuffle,
  onSwitchTopic,
  onShuffle,
  onOpenWords,
  onStart,
}: {
  genre: StoryGenre;
  onChangeGenre: (g: StoryGenre) => void;
  sourceBadgeLabel: string;
  selectedTopic: { id: number; name: string; translation?: string | null } | null;
  selectedWords: string[];
  translationMap: Map<string, string>;
  topicPoolTotal: number;
  isLoadingWords: boolean;
  canShuffle: boolean;
  onSwitchTopic: () => void;
  onShuffle: () => void;
  onOpenWords: () => void;
  onStart: () => void;
}) {
  const canStart = selectedWords.length >= MIN_STORY_WORDS && !isLoadingWords;

  return (
    <View className="mb-4 overflow-hidden rounded-3xl border-2 border-b-4 border-amber-300/90 border-b-amber-400 bg-amber-50/85 p-5 dark:border-amber-500/35 dark:border-b-amber-600/50 dark:bg-amber-500/10">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
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
          style={{ width: 70, height: 70 }}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      </View>

      {/* 1-tap Story Setting (Genre) Pills — Zero extra modal */}
      <View className="mt-3 flex-row flex-wrap gap-1.5">
        {GENRES.map((g) => {
          const active = genre === g.id;
          return (
            <Pressable
              key={g.id}
              onPress={() => onChangeGenre(g.id)}
              className={`min-h-8 items-center justify-center rounded-full border px-3 py-1 ${
                active
                  ? 'border-amber-600 bg-amber-500 dark:border-amber-400 dark:bg-amber-500'
                  : 'border-amber-300/80 bg-white/80 dark:border-amber-500/30 dark:bg-neutral-900/70'
              }`}
            >
              <Text
                className={`font-nunito text-xs font-extrabold ${
                  active ? 'text-white' : 'text-amber-900 dark:text-amber-200'
                }`}
              >
                {translate(g.labelKey as any)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Active Source Bar */}
      <Pressable
        onPress={onSwitchTopic}
        className="mt-3 min-h-10 flex-row items-center justify-between rounded-2xl border border-amber-300/70 bg-white/85 px-3.5 py-2 dark:border-amber-500/30 dark:bg-neutral-900/70"
      >
        <View className="flex-1 flex-row items-center gap-2 pr-2">
          <FolderIcon width={15} height={15} color="#D97706" />
          <Text className="flex-1 font-nunito text-xs font-extrabold text-mascot-navy dark:text-white" numberOfLines={1}>
            {sourceBadgeLabel}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Text className="font-nunito text-xs font-extrabold text-amber-800 dark:text-amber-300">
            {translate('story.change_topic')}
          </Text>
          <ChevronRightIcon width={14} height={14} color="#B45309" />
        </View>
      </Pressable>

      {/* Visible Word Chips + Direct Pick / Shuffle Controls */}
      {isLoadingWords ? (
        <View className="mt-3.5 flex-row items-center gap-2.5 py-3">
          <ActivityIndicator size="small" color="#D97706" />
          <Text className="font-inter text-xs text-neutral-600 dark:text-neutral-300">
            {translate('story.topic_loading_words')}
          </Text>
        </View>
      ) : (
        <View className="mt-3 gap-2.5">
          {selectedWords.length > 0 && (
            <View className="flex-row flex-wrap gap-1.5">
              {selectedWords.map((w) => {
                const meaning = translationMap.get(w.toLowerCase());
                return (
                  <Pressable
                    key={w}
                    onPress={onOpenWords}
                    className="flex-row items-center gap-1 rounded-xl border border-amber-300/80 bg-white/95 px-2.5 py-1.5 dark:border-amber-500/35 dark:bg-neutral-900/85"
                  >
                    <Text className="font-nunito text-xs font-black text-mascot-navy dark:text-amber-200">
                      {w}
                    </Text>
                    {Boolean(meaning) && (
                      <Text
                        className="max-w-28 font-inter text-[11px] text-neutral-500 dark:text-neutral-400"
                        numberOfLines={1}
                      >
                        {`· ${meaning}`}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}

          <View className="flex-row flex-wrap items-center gap-2">
            <Pressable
              onPress={onOpenWords}
              className="min-h-10 flex-row items-center gap-1.5 rounded-xl border border-amber-400/80 bg-white px-3.5 py-2 dark:border-amber-500/40 dark:bg-neutral-900"
            >
              <EditIcon width={13} height={13} color="#B45309" />
              <Text className="font-nunito text-xs font-black text-amber-950 dark:text-amber-200">
                {selectedTopic && topicPoolTotal > 0
                  ? translate('story.customize_in_topic', {
                      selected: selectedWords.length,
                      total: topicPoolTotal,
                    })
                  : translate('story.customize_words', { count: selectedWords.length })}
              </Text>
            </Pressable>

            {canShuffle && (
              <Pressable
                onPress={onShuffle}
                className="min-h-10 flex-row items-center gap-1.5 rounded-xl bg-white/75 px-3 py-2 dark:bg-neutral-900/70"
              >
                <RepeatIcon width={13} height={13} color="#B45309" />
                <Text className="font-nunito text-xs font-extrabold text-amber-900 dark:text-amber-200">
                  {translate('story.shuffle_words')}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      <Button
        label={
          canStart
            ? translate('story.read_now_cta', { count: selectedWords.length })
            : translate('story.min_words_cta', { min: MIN_STORY_WORDS })
        }
        disabled={!canStart}
        onPress={onStart}
        className="mt-4"
      />
    </View>
  );
}

function StorySourceActions({
  onOpenTopicSheet,
  onOpenWordSheet,
}: {
  onOpenTopicSheet: () => void;
  onOpenWordSheet: () => void;
}) {
  const surface = useSurface();
  return (
    <View className="mb-6 gap-2.5">
      <Pressable
        onPress={onOpenTopicSheet}
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
        onPress={onOpenWordSheet}
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
  );
}

type HubParams = {
  source?: string;
  topicId?: string;
  topicName?: string;
  words?: string;
};

export function StoryHubScreen() {
  const params = useLocalSearchParams<HubParams>();
  const entryKey = `${params.source ?? ''}-${params.topicId ?? ''}-${params.words ?? ''}`;
  return <StoryHubContent key={entryKey} params={params} />;
}

function StoryHubContent({ params }: { params: HubParams }) {
  const router = useRouter();
  const surface = useSurface();

  const topicSheetRef = React.useRef<BottomSheetModal>(null);
  const wordSheetRef = React.useRef<BottomSheetModal>(null);

  const initialWords = React.useMemo(
    () => (params.words ? sanitizeWordList(params.words.split(',')) : []),
    [params.words],
  );
  const isFromMyWords = params.source === 'MY_WORDS';
  const [isScanOrigin, setIsScanOrigin] = React.useState(
    () => params.source === 'SCAN' && initialWords.length > 0,
  );

  const [genre, setGenre] = React.useState<StoryGenre>('DAILY');
  const [pickerTab, setPickerTab] = React.useState<StoryWordPickerTab>(() =>
    isFromMyWords || initialWords.length > 0 ? 'MY_WORDS' : 'TOPIC',
  );
  const [explicitTopic, setExplicitTopic] = React.useState<
    { id: number; name: string; translation?: string | null } | 'NONE' | undefined
  >(() => {
    if (params.topicId) {
      return { id: Number(params.topicId), name: params.topicName || 'Topic' };
    }
    if (isFromMyWords || initialWords.length > 0) {
      return 'NONE';
    }
    return undefined;
  });
  const [explicitWords, setExplicitWords] = React.useState<string[] | null>(() =>
    initialWords.length > 0
      ? initialWords.slice(0, DEFAULT_SMART_PICK_COUNT)
      : null,
  );

  const storiesQuery = useStories();
  const deleteMutation = useDeleteStory();
  const myWordsQuery = useMyWords();
  const systemTopicsQuery = useStoryTopics();

  const savedWords = React.useMemo(
    () => sanitizeWordList(myWordsQuery.data?.pages.flatMap(p => p.data.map(w => w.word)) ?? []),
    [myWordsQuery.data],
  );

  const selectedTopic = React.useMemo(() => {
    if (explicitTopic === 'NONE')
      return null;
    if (explicitTopic !== undefined)
      return explicitTopic;
    const first = systemTopicsQuery.data?.[0];
    if (first) {
      return { id: first.id, name: first.name, translation: first.translation };
    }
    return null;
  }, [explicitTopic, systemTopicsQuery.data]);

  const topicWordsQuery = useStoryTopicWords(selectedTopic?.id);
  const topicWords = React.useMemo(() => topicWordsQuery.data?.words ?? [], [topicWordsQuery.data]);

  const resolvedSelectedTopic = React.useMemo(() => {
    if (!selectedTopic)
      return null;
    if (topicWordsQuery.data && topicWordsQuery.data.topicId === selectedTopic.id) {
      return {
        id: selectedTopic.id,
        name: topicWordsQuery.data.topicName,
        translation: topicWordsQuery.data.topicTranslation,
      };
    }
    return selectedTopic;
  }, [selectedTopic, topicWordsQuery.data]);

  const selectedWords = React.useMemo(() => {
    if (explicitWords !== null)
      return explicitWords;
    if (selectedTopic) {
      return topicWords.slice(0, DEFAULT_SMART_PICK_COUNT).map(w => w.word);
    }
    return savedWords.slice(0, DEFAULT_SMART_PICK_COUNT);
  }, [explicitWords, savedWords, selectedTopic, topicWords]);

  const availableTopicsForSheet = React.useMemo<QuizAvailableTopic[]>(() => {
    const list = systemTopicsQuery.data ?? [];
    const unit = translate('story.words_unit');
    return list.map((t) => {
      const prefix = t.parentName ? `${t.collectionName} › ${t.parentName}` : t.collectionName;
      return {
        id: t.id,
        name: t.name,
        translation: t.translation ?? '',
        parentId: t.parentId ?? null,
        hasChildren: false,
        createdAt: '',
        updatedAt: '',
        collectionName: `${prefix} · ${t.wordCount} ${unit}`,
      };
    });
  }, [systemTopicsQuery.data]);

  const translationMap = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const item of topicWords) {
      if (item.translation) {
        map.set(item.word.toLowerCase(), item.translation);
      }
    }
    return map;
  }, [topicWords]);

  const activeShufflePool = React.useMemo(() => {
    if (resolvedSelectedTopic)
      return topicWords.map(w => w.word);
    if (isScanOrigin && initialWords.length > 0)
      return initialWords;
    return savedWords;
  }, [initialWords, isScanOrigin, resolvedSelectedTopic, savedWords, topicWords]);

  const pickerSavedPool = React.useMemo(() => {
    if (!isScanOrigin || initialWords.length === 0)
      return savedWords;
    return sanitizeWordList([...initialWords, ...savedWords]);
  }, [initialWords, isScanOrigin, savedWords]);

  const sourceBadgeLabel = resolvedSelectedTopic
    ? translate('story.using_topic_badge', { name: resolvedSelectedTopic.name })
    : isScanOrigin
      ? translate('story.using_scan_badge')
      : translate('story.using_my_words_badge');

  const handleSelectTopic = (topic: QuizAvailableTopic) => {
    setIsScanOrigin(false);
    setExplicitTopic({ id: topic.id, name: topic.name, translation: topic.translation });
    setExplicitWords(null);
    setPickerTab('TOPIC');
  };

  const handleShuffleWords = () => {
    if (activeShufflePool.length < MIN_STORY_WORDS)
      return;
    const next = pickRandomFromPool(
      activeShufflePool,
      DEFAULT_SMART_PICK_COUNT,
      selectedWords,
    );
    setExplicitWords(next);
  };

  const handleStartStory = () => {
    if (selectedWords.length < MIN_STORY_WORDS) {
      showErrorMessage(translate('story.min_words_error', { min: MIN_STORY_WORDS }));
      return;
    }
    const topicParams = resolvedSelectedTopic
      ? { topicId: String(resolvedSelectedTopic.id), topicName: resolvedSelectedTopic.name }
      : {};
    const source = resolvedSelectedTopic ? 'TOPIC' : isScanOrigin ? 'SCAN' : 'MY_WORDS';
    router.push({
      pathname: '/story/[id]',
      params: {
        id: 'new',
        source,
        ...topicParams,
        words: selectedWords.join(','),
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
          genre={genre}
          onChangeGenre={setGenre}
          sourceBadgeLabel={sourceBadgeLabel}
          selectedTopic={resolvedSelectedTopic}
          selectedWords={selectedWords}
          translationMap={translationMap}
          topicPoolTotal={topicWords.length}
          isLoadingWords={Boolean(resolvedSelectedTopic && topicWordsQuery.isLoading)}
          canShuffle={activeShufflePool.length > DEFAULT_SMART_PICK_COUNT}
          onSwitchTopic={() => requestAnimationFrame(() => topicSheetRef.current?.present())}
          onShuffle={handleShuffleWords}
          onOpenWords={() => requestAnimationFrame(() => wordSheetRef.current?.present())}
          onStart={handleStartStory}
        />

        <StorySourceActions
          onOpenTopicSheet={() => requestAnimationFrame(() => topicSheetRef.current?.present())}
          onOpenWordSheet={() => requestAnimationFrame(() => wordSheetRef.current?.present())}
        />

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
        selectedTopicId={resolvedSelectedTopic?.id}
        topics={availableTopicsForSheet}
        isLoading={systemTopicsQuery.isLoading}
        onSelectTopic={handleSelectTopic}
      />

      <StoryWordPickerSheet
        bottomSheetRef={wordSheetRef}
        activeTab={pickerTab}
        onChangeTab={(tab) => {
          setPickerTab(tab);
          if (tab === 'MY_WORDS') {
            setExplicitTopic('NONE');
            setExplicitWords(null);
          }
        }}
        selectedTopic={resolvedSelectedTopic}
        topicWords={topicWords}
        isLoadingTopicWords={topicWordsQuery.isLoading}
        savedWords={pickerSavedPool}
        selectedWords={selectedWords}
        onChangeWords={setExplicitWords}
        onRequestSwitchTopic={() => {
          wordSheetRef.current?.dismiss();
          setTimeout(() => topicSheetRef.current?.present(), 180);
        }}
      />
    </SafeAreaView>
  );
}

export default StoryHubScreen;
