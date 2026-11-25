import type { Href } from 'expo-router';
import type {
  StoryDTO,
  StoryGenre,
  StoryLevel,
  StoryMode,
  StorySource,
} from './types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  FocusAwareStatusBar,
  Pressable,
  ScreenHeader,
  Text,
  useSurface,
} from '@/components/ui';
import { translate } from '@/lib/i18n';
import { useGenerateStory, useStory } from './api';
import { StoryClozePanel } from './components/story-cloze-panel';
import { StoryGeneratingView } from './components/story-generating-view';
import { StoryReadPanel } from './components/story-read-panel';
import { sanitizeWordList } from './utils';

type ReaderTab = 'READ' | 'CLOZE';

type Params = {
  id?: string;
  source?: string;
  topicId?: string;
  topicName?: string;
  words?: string;
  mode?: string;
  level?: string;
  genre?: string;
};

export function StoryReaderScreen() {
  const router = useRouter();
  const surface = useSurface();
  const params = useLocalSearchParams<Params>();

  const isInstantNew = params.id === 'new';
  const numericId = !isInstantNew && params.id ? Number(params.id) : undefined;

  const [generatedStory, setGeneratedStory] = React.useState<StoryDTO | null>(null);
  const [genError, setGenError] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<ReaderTab>('READ');
  const triggeredRef = React.useRef(false);

  const storyQuery = useStory(generatedStory?.id ?? numericId);
  const generateMutation = useGenerateStory();

  const parsedWords = React.useMemo(
    () => (params.words ? sanitizeWordList(params.words.split(',')) : []),
    [params.words],
  );

  const runInstantGeneration = React.useCallback(async () => {
    setGenError(null);
    const source: StorySource
      = params.source === 'TOPIC' || params.source === 'SCAN' || params.source === 'CUSTOM'
        ? params.source
        : 'MY_WORDS';
    const mode: StoryMode = params.mode === 'ENGLISH' ? 'ENGLISH' : 'BLENDED';
    const level: StoryLevel
      = params.level === 'A1' || params.level === 'B1' || params.level === 'B2'
        ? params.level
        : 'A2';
    const genre: StoryGenre
      = params.genre === 'FUNNY' || params.genre === 'OFFICE' || params.genre === 'TRAVEL'
        ? params.genre
        : 'DAILY';

    try {
      const created = await generateMutation.mutateAsync({
        source,
        topicId: params.topicId ? Number(params.topicId) : undefined,
        words: parsedWords.length > 0 ? parsedWords : undefined,
        mode,
        level,
        genre,
      });
      setGeneratedStory(created);
    }
    catch (err: any) {
      const msg
        = err?.response?.data?.message
          || err?.response?.data?.error
          || translate('story.generate_error');
      setGenError(msg);
    }
  }, [generateMutation, params.genre, params.level, params.mode, params.source, params.topicId, parsedWords]);

  React.useEffect(() => {
    if (isInstantNew && !triggeredRef.current) {
      triggeredRef.current = true;
      void runInstantGeneration();
    }
  }, [isInstantNew, runInstantGeneration]);

  const activeStory = generatedStory ?? storyQuery.data;

  const headerTitle = activeStory?.title
    ?? (isInstantNew ? translate('story.weaving_header') : translate('story.lab_title'));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: surface.headerBg }} edges={['top']}>
      <FocusAwareStatusBar />
      <ScreenHeader
        title={headerTitle}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/(app)/(tabs)/learn'))}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: surface.background }}
        contentContainerClassName="px-4 pt-4 pb-12"
        showsVerticalScrollIndicator={false}
      >
        {isInstantNew && !activeStory ? (
          <StoryGeneratingView
            words={parsedWords}
            topicName={params.topicName}
            error={genError}
            onRetry={() => void runInstantGeneration()}
            onCancel={() => (router.canGoBack() ? router.back() : router.replace('/story' as Href))}
          />
        ) : storyQuery.isLoading && !activeStory ? (
          <ActivityIndicator className="my-12" />
        ) : !activeStory ? (
          <View className="items-center gap-3 py-12">
            <Text className="font-inter text-sm text-neutral-500">{translate('story.load_error')}</Text>
            <Button label={translate('word_detail.retry')} fullWidth={false} onPress={() => void storyQuery.refetch()} />
          </View>
        ) : (
          <>
            {/* Mode & Meta Subtitle */}
            <View className="mb-3 flex-row flex-wrap items-center justify-between gap-2 px-1">
              <View className="flex-row items-center gap-2">
                <View className="rounded-lg bg-amber-100 px-2.5 py-1 dark:bg-amber-500/20">
                  <Text className="font-nunito text-xs font-black text-amber-800 dark:text-amber-300">
                    {activeStory.mode === 'BLENDED' ? translate('story.mode_blended') : translate('story.mode_english')}
                  </Text>
                </View>
                <View className="rounded-lg bg-surface px-2.5 py-1">
                  <Text className="font-nunito text-xs font-extrabold text-neutral-600 dark:text-neutral-300">
                    {`${activeStory.level} · ${activeStory.targetWords.length} ${translate('story.words_unit')}`}
                  </Text>
                </View>
              </View>
              {activeStory.bestScore != null && (
                <Text className="font-nunito text-xs font-black text-primary-700 dark:text-primary-300">
                  {`Cloze: ${activeStory.bestScore}%`}
                </Text>
              )}
            </View>

            {/* Segmented Read / Cloze Switcher */}
            <View className="mb-4 flex-row gap-1.5 rounded-2xl border border-line bg-surface p-1">
              {([
                { id: 'READ', label: translate('story.tab_read') },
                { id: 'CLOZE', label: `${translate('story.tab_cloze')} (${activeStory.totalBlanks})` },
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
              <StoryReadPanel story={activeStory} onStartCloze={() => setTab('CLOZE')} />
            ) : (
              <StoryClozePanel story={activeStory} onBackToRead={() => setTab('READ')} />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default StoryReaderScreen;
