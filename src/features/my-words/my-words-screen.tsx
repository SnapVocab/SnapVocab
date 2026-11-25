import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { BackButton, Button, FocusAwareStatusBar, Mascot, Pressable, SafeAreaView, Text, View } from '@/components/ui';
import { ChevronRightIcon, SearchIcon, SparklesIcon } from '@/components/ui/icons';
import { useColorMode } from '@/components/ui/surface';
import { sanitizeWordList } from '@/features/story/utils';
import { translate } from '@/lib/i18n';
import { useMyWords } from './api';
import { PersonalWordRow } from './components/personal-word-row';

const screenStyle = { flex: 1 };

export function MyWordsScreen() {
  const router = useRouter();
  const dark = useColorMode() === 'dark';
  const { scanRequestId } = useLocalSearchParams<{ scanRequestId?: string }>();
  const query = useMyWords();
  const words = query.data?.pages.flatMap(page => page.data) ?? [];
  const total = query.data?.pages[0]?.meta.total;
  return (
    <SafeAreaView style={screenStyle} className="flex-1 bg-background" edges={['top', 'bottom']}>
      <FocusAwareStatusBar />
      <View className="flex-row items-center gap-3 border-b border-line bg-surface px-4 py-3">
        <BackButton onPress={() => router.back()} />
        <View className="flex-1">
          <Text className="font-nunito text-xl font-black text-mascot-navy dark:text-white" tx="my_words.title" />
          <Text className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-300">
            {total === undefined ? translate('my_words.library_hint') : translate('my_words.saved_count', { count: total })}
          </Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={translate('my_words.find_word')} onPress={() => router.push('/lookup')} className="min-h-12 flex-row items-center justify-center gap-2 rounded-xl bg-surface-raised px-3 active:bg-pressed">
          <SearchIcon width={20} height={20} color={dark ? '#B5D894' : '#4E7A25'} />
          <Text className="text-sm font-bold text-primary-700 dark:text-primary-200" tx="my_words.lookup_more" />
        </Pressable>
      </View>
      <FlatList
        data={words}
        keyExtractor={item => String(item.id)}
        contentContainerClassName="grow pb-6"
        refreshControl={<RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => void query.refetch()} />}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetching)
            void query.fetchNextPage();
        }}
        ListHeaderComponent={words.length > 0
          ? (
              <View className="gap-2.5 px-4 pt-3 pb-2">
                {words.length >= 3 && (
                  <Pressable
                    onPress={() => {
                      const picked = sanitizeWordList(words.map(w => w.word)).slice(0, 6);
                      if (picked.length >= 3) {
                        router.push({
                          pathname: '/story/[id]',
                          params: { id: 'new', source: 'MY_WORDS', words: picked.join(',') },
                        } as any);
                      }
                    }}
                    className="flex-row items-center justify-between rounded-2xl border-2 border-b-4 border-amber-300 border-b-amber-400 bg-amber-50 px-4 py-3 active:translate-y-px dark:border-amber-500/40 dark:border-b-amber-600/50 dark:bg-amber-500/15"
                  >
                    <View className="flex-1 flex-row items-center gap-2.5 pr-2">
                      <SparklesIcon width={18} height={18} color="#D97706" />
                      <View className="flex-1">
                        <Text className="font-nunito text-sm font-black text-amber-900 dark:text-amber-200">
                          {translate('story.my_words_1tap_title')}
                        </Text>
                        <Text className="font-inter text-xs text-amber-800/80 dark:text-amber-200/80" numberOfLines={1}>
                          {translate('story.my_words_1tap_subtitle')}
                        </Text>
                      </View>
                    </View>
                    <ChevronRightIcon width={18} height={18} color="#B45309" />
                  </Pressable>
                )}
                <Text className="text-sm/5 text-neutral-600 dark:text-neutral-300" tx="my_words.list_hint" />
              </View>
            )
          : null}
        ListEmptyComponent={query.isPending
          ? <ActivityIndicator className="mt-12" />
          : query.isError
            ? (
                <View className="gap-4 px-6 py-12">
                  <Text className="text-center text-base" tx="my_words.load_error" />
                  <Button tx="word_detail.retry" onPress={() => void query.refetch()} />
                </View>
              )
            : (
                <View className="flex-1 items-center justify-center gap-4 px-6 py-12">
                  <Mascot pose="read" className="size-28" />
                  <Text className="text-center font-nunito text-xl font-extrabold text-mascot-navy dark:text-white" tx="my_words.empty_title" />
                  <Text className="text-center text-base text-neutral-600 dark:text-neutral-300" tx="my_words.empty_body" />
                  <Button tx="my_words.find_word" onPress={() => router.push('/lookup')} />
                </View>
              )}
        renderItem={({ item }) => (
          <PersonalWordRow
            word={item}
            onOpen={() => router.push({ pathname: '/word-detail', params: { id: String(item.id), word: item.word } })}
            onAdd={() => router.push({ pathname: '/scan-save', params: { word: item.word, wordId: String(item.id), ...(scanRequestId ? { scanRequestId } : {}) } })}
          />
        )}
        ListFooterComponent={query.isFetchingNextPage
          ? <ActivityIndicator className="py-4" />
          : words.length > 0 && query.isError
            ? (
                <View className="gap-3 p-4">
                  <Text className="text-center text-sm" tx="my_words.load_error" />
                  <Button tx="word_detail.retry" variant="white" onPress={() => void (query.isFetchNextPageError ? query.fetchNextPage() : query.refetch())} />
                </View>
              )
            : null}
      />
    </SafeAreaView>
  );
}
