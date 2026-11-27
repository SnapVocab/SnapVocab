import type { Href } from 'expo-router';
import type {
  StoryDTO,
  StoryGenre,
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
import { apiErrorMessage } from '@/lib/api/error-message';
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
      = params.source === 'TOPIC' || params.source === 'SCAN'
        ? params.source
        : 'MY_WORDS';
    const genre: StoryGenre
      = params.genre === 'FUNNY' || params.genre === 'OFFICE' || params.genre === 'TRAVEL'
        ? params.genre
        : 'DAILY';

    try {
      const created = await generateMutation.mutateAsync({
        source,
        topicId: params.topicId ? Number(params.topicId) : undefined,
        words: parsedWords.length > 0 ? parsedWords : undefined,
        genre,
      });
      setGeneratedStory(created);
    }
    catch (err: any) {
      setGenError(apiErrorMessage(err, 'story.generate_error'));
    }
  }, [generateMutation, params.genre, params.source, params.topicId, parsedWords]);

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
        keyboardShouldPersistTaps="handled"
      >
        {isInstantNew && !activeStory ? (
          <StoryGeneratingView
            topicName={params.topicName}
            words={parsedWords}
            error={genError}
            onRetry={() => void runInstantGeneration()}
            onCancel={() => (router.canGoBack() ? router.back() : router.replace('/story' as Href))}
          />
        ) : storyQuery.isLoading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#58CC02" />
          </View>
        ) : !activeStory ? (
          <View className="items-center justify-center gap-4 py-20">
            <Text className="font-inter text-sm text-neutral-500 dark:text-neutral-400">
              {translate('story.load_error')}
            </Text>
            <Button
              variant="outline"
              label={translate('my_words.cancel')}
              onPress={() => router.replace('/story' as Href)}
            />
          </View>
        ) : (
          <View className="gap-4">
            <View className="flex-row gap-2 rounded-2xl border-2 border-line bg-surface p-1.5">
              <Pressable
                onPress={() => setTab('READ')}
                className={`min-h-11 flex-1 items-center justify-center rounded-xl ${
                  tab === 'READ' ? 'bg-primary-500' : 'bg-transparent'
                }`}
              >
                <Text
                  className={`font-nunito text-sm font-black ${
                    tab === 'READ' ? 'text-white' : 'text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {translate('story.tab_read')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setTab('CLOZE')}
                className={`min-h-11 flex-1 items-center justify-center rounded-xl ${
                  tab === 'CLOZE' ? 'bg-primary-500' : 'bg-transparent'
                }`}
              >
                <Text
                  className={`font-nunito text-sm font-black ${
                    tab === 'CLOZE' ? 'text-white' : 'text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {`${translate('story.tab_cloze')} (${activeStory.totalBlanks})`}
                </Text>
              </Pressable>
            </View>

            {tab === 'READ' ? (
              <StoryReadPanel
                story={activeStory}
                onStartCloze={() => setTab('CLOZE')}
              />
            ) : (
              <StoryClozePanel
                story={activeStory}
                onBackToRead={() => setTab('READ')}
              />
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default StoryReaderScreen;
