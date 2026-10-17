import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { BackButton, FocusAwareStatusBar, SafeAreaView, Text } from '@/components/ui';
import { translate } from '@/lib/i18n/utils';
import { useWordById, useWordLookup } from './api';
import {
  WordExamples,
  WordHeader,
  WordLinks,
  WordMeanings,
  WordRelations,
} from './components';

export function WordDetailScreen() {
  const router = useRouter();
  const { id, word: paramWord } = useLocalSearchParams<{
    id?: string;
    word?: string;
  }>();

  // 1. Fetch word detail by ID or English word query
  const byIdQuery = useWordById(id);
  const byWordQuery = useWordLookup(id ? undefined : paramWord);

  const activeQuery = id ? byIdQuery : byWordQuery;
  const { data: wordData, isLoading, isError, refetch } = activeQuery;

  const displayWord = wordData?.word ?? paramWord ?? '';

  const handleRelatedWordPress = React.useCallback(
    (relWord: string) => {
      router.push({
        pathname: '/word-detail',
        params: { word: relWord },
      });
    },
    [router],
  );

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }} className="flex-1 bg-white dark:bg-neutral-900">
      <FocusAwareStatusBar />

      {/* Screen Header */}
      <View className="flex-row items-center justify-between border-b border-neutral-100 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
        <BackButton onPress={() => router.back()} hitSlop={12} />

        <Text className="font-nunito text-lg font-black text-mascot-navy dark:text-white">
          {translate('word_detail.title')}
        </Text>

        <View className="size-10" />
      </View>

      {/* Content Body */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center p-6">
          <ActivityIndicator size="large" color="#65A30D" />
        </View>
      ) : isError || !wordData ? (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="font-inter text-sm font-medium text-neutral-400 dark:text-neutral-500">
            {translate('word_detail.not_found')}
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            activeOpacity={0.7}
            className="mt-4 rounded-2xl bg-lime-500 px-5 py-2.5 active:bg-lime-600"
          >
            <Text className="font-inter text-sm font-bold text-white">Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5 pt-5"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-12"
        >
          {/* Word Header (Title, IPA, Audio TTS) */}
          <WordHeader
            word={displayWord}
            pronunciations={wordData.pronunciations}
          />

          {/* Meanings by Part of Speech */}
          <WordMeanings meanings={wordData.meanings} />

          {/* Example Sentences */}
          <WordExamples meanings={wordData.meanings} />

          {/* Related Words (Synonyms, Antonyms, Word Family) */}
          <WordRelations
            relations={wordData.relations}
            onSelectRelation={handleRelatedWordPress}
          />

          {/* External Links / References */}
          <WordLinks meanings={wordData.meanings} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

export default WordDetailScreen;
