import type { Collection, TopicDTO } from '@/features/learn/types';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, FlatList, ScrollView } from 'react-native';
import { BackButton, Button, FocusAwareStatusBar, Pressable, SafeAreaView, Text, View } from '@/components/ui';
import { ChevronRightIcon } from '@/components/ui/icons';
import { useCollections, useInfiniteCollectionTopics } from '@/features/learn/api';
import { DestinationRow } from '@/features/my-words/components/destination-row';
import { translate } from '@/lib/i18n';

const screenStyle = { flex: 1 };

/** Browse destinations, select one, then review the schema-generated form. */
export function SaveWordScreen() {
  const router = useRouter();
  const { word, wordId, scanRequestId } = useLocalSearchParams<{ word: string; wordId?: string; scanRequestId?: string }>();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [parents, setParents] = useState<TopicDTO[]>([]);
  const [selected, setSelected] = useState<TopicDTO | null>(null);
  const breadcrumb = useRef<ScrollView>(null);
  const parent = parents.at(-1);
  const collections = useCollections({ type: 'USER' });
  const topics = useInfiniteCollectionTopics(collection?.id ?? '', { parentId: parent?.id, size: 30 });
  const items = topics.data?.pages.flatMap(page => page.data) ?? [];
  const selectedPath = collection && selected
    ? [collection.name, ...parents.map(topic => topic.name), ...(parent?.id === selected.id ? [] : [selected.name])].join(' / ')
    : null;
  const goUp = useCallback(() => {
    setSelected(null);
    if (parents.length)
      setParents(value => value.slice(0, -1));
    else if (collection)
      setCollection(null);
    else
      router.back();
  }, [parents.length, collection, router]);
  useFocusEffect(useCallback(() => {
    if (!collection)
      return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      goUp();
      return true;
    });
    return () => subscription.remove();
  }, [collection, goUp]));
  const confirm = () => {
    if (!collection || !selected)
      return;
    router.replace({
      pathname: '/collections/add-word',
      params: {
        topicId: String(selected.id),
        topicName: selected.name,
        collectionId: String(collection.id),
        word,
        ...(wordId ? { wordId } : {}),
        ...(selected.activeTemplateId ? { activeTemplateId: String(selected.activeTemplateId) } : {}),
        ...(scanRequestId ? { scanRequestId } : {}),
      },
    });
  };
  const pending = collection ? topics.isPending : collections.isPending;
  const failed = collection ? topics.isError : collections.isError;
  const retry = () => collection ? topics.refetch() : collections.refetch();
  return (
    <SafeAreaView style={screenStyle} className="flex-1 bg-background" edges={['top', 'bottom']}>
      <FocusAwareStatusBar />
      <View className="flex-row items-center gap-3 border-b border-line bg-surface px-4 py-3">
        <BackButton onPress={goUp} />
        <View className="flex-1">
          <Text className="font-nunito text-xl font-black text-mascot-navy dark:text-white" tx={collection ? 'my_words.choose_topic' : 'my_words.choose_collection'} />
          <Text className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-300" tx="my_words.destination_hint" />
        </View>
      </View>
      <View className="gap-1 border-b border-line px-4 py-3">
        <Text className="text-sm text-neutral-600 dark:text-neutral-300" tx="my_words.adding_word" />
        <Text numberOfLines={2} className="font-nunito text-xl font-extrabold text-mascot-navy dark:text-white">{word}</Text>
      </View>
      {collection && (
        <ScrollView ref={breadcrumb} horizontal className="max-h-14 grow-0 border-b border-line bg-surface px-3" showsHorizontalScrollIndicator={false} onContentSizeChange={() => breadcrumb.current?.scrollToEnd({ animated: false })}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setCollection(null);
              setParents([]);
              setSelected(null);
            }}
            className="min-h-12 justify-center px-2"
          >
            <Text className="text-sm font-bold text-primary-700 dark:text-primary-200" tx="my_words.collections_short" />
          </Pressable>
          <View className="justify-center"><ChevronRightIcon width={15} height={15} color="#73758F" /></View>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setParents([]);
              setSelected(null);
            }}
            className="min-h-12 justify-center px-2"
          >
            <Text className="text-sm font-bold text-mascot-navy dark:text-white">{collection.name}</Text>
          </Pressable>
          {parents.map((topic, index) => (
            <View key={topic.id} className="flex-row items-center">
              <ChevronRightIcon width={15} height={15} color="#73758F" />
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setParents(value => value.slice(0, index + 1));
                  setSelected(null);
                }}
                className="min-h-12 justify-center px-2"
              >
                <Text className="text-sm font-bold text-mascot-navy dark:text-white">{topic.name}</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}
      {pending && <View className="flex-1 items-center justify-center"><ActivityIndicator /></View>}
      {failed && (
        <View className="gap-3 p-6">
          <Text className="text-center text-base" tx="scan.save.load_error" />
          <Button tx="word_detail.retry" variant="white" onPress={() => void retry()} />
        </View>
      )}
      {!collection && !pending && !failed && (
        <FlatList
          className="flex-1"
          data={collections.data}
          keyExtractor={item => String(item.id)}
          contentContainerClassName="grow pb-4"
          ListHeaderComponent={<Text className="p-4 font-nunito text-sm font-extrabold text-neutral-600 dark:text-neutral-300" tx="my_words.own_collections" />}
          ListEmptyComponent={(
            <View className="gap-4 p-6">
              <Text className="text-center text-base" tx="scan.save.empty" />
              <Button tx="scan.save.go_learn" onPress={() => router.push('/learn')} />
            </View>
          )}
          renderItem={({ item }) => (
            <DestinationRow
              title={item.name}
              description={item.translation}
              folder
              testID={`save-collection-${item.id}`}
              onPress={() => {
                setCollection(item);
                setParents([]);
                setSelected(null);
              }}
            />
          )}
        />
      )}
      {collection && !pending && (
        <FlatList
          className="flex-1"
          key={`${collection.id}:${parent?.id ?? 'root'}`}
          data={items}
          keyExtractor={item => String(item.id)}
          contentContainerClassName="grow pb-4"
          ListHeaderComponent={(
            <View>
              {parent && <DestinationRow title={parent.name} description={translate('my_words.current_topic')} folder selected={selected?.id === parent.id} testID={`save-current-topic-${parent.id}`} onPress={() => setSelected(parent)} />}
              <Text className="p-4 font-nunito text-sm font-extrabold text-neutral-600 dark:text-neutral-300" tx={parent ? 'my_words.subtopics' : 'my_words.topics'} />
            </View>
          )}
          onEndReached={() => {
            if (topics.hasNextPage && !topics.isFetching)
              void topics.fetchNextPage();
          }}
          ListEmptyComponent={!failed
            ? (
                <View className="gap-4 p-6">
                  <Text className="text-center text-base text-neutral-600 dark:text-neutral-300" tx={parent ? 'my_words.no_subtopics' : 'scan.save.no_topics'} />
                  {!parent && <Button tx="scan.save.go_learn" variant="white" onPress={() => router.push('/learn')} />}
                </View>
              )
            : null}
          ListFooterComponent={topics.isFetchingNextPage ? <ActivityIndicator className="py-4" /> : null}
          renderItem={({ item }) => (
            <DestinationRow
              title={item.name}
              description={item.translation}
              folder={item.hasChildren}
              selected={selected?.id === item.id}
              onPress={() => setSelected(item)}
              testID={`scan-save-topic-${item.id}`}
              browseTestID={`save-subtopics-${item.id}`}
              onBrowse={item.hasChildren ? () => {
                setParents(value => [...value, item]);
                setSelected(null);
              } : undefined}
            />
          )}
        />
      )}
      {collection && (
        <View className="gap-3 border-t border-line bg-surface px-4 pt-3 pb-4">
          <Text className="text-sm text-neutral-600 dark:text-neutral-300">
            {selectedPath ?? translate('my_words.select_destination_hint')}
          </Text>
          <Button tx="my_words.continue_to_form" testID="save-destination-confirm" disabled={!selected} className="h-auto min-h-14 py-3" textClassName="shrink" onPress={confirm} />
        </View>
      )}
    </SafeAreaView>
  );
}
