import type { Collection, TopicDTO } from '@/features/learn/types';
import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, FlatList, ScrollView } from 'react-native';
import { BackButton, Button, FocusAwareStatusBar, Pressable, SafeAreaView, showErrorMessage, Text, View } from '@/components/ui';
import { ChevronRightIcon } from '@/components/ui/icons';
import { useCollections, useInfiniteCollectionTopics } from '@/features/learn/api';
import { fetchDefaultTopic, rememberSaveDestination } from '@/features/learn/save-destination';
import { DestinationRow } from '@/features/my-words/components/destination-row';
import { translate } from '@/lib/i18n';

const screenStyle = { flex: 1 };

/**
 * Browse destinations and select one. With a word: then review the schema-generated form.
 * With mode=pick (the scan result's "Đổi"): remember the topic as the save destination and go back.
 */
export function SaveWordScreen() {
  const router = useRouter();
  /** collectionId: open inside that collection (the collection screen's "Thêm từ" at its root, mode=add). */
  const { word, wordId, scanRequestId, mode, collectionId: presetCollectionId } = useLocalSearchParams<{ word?: string; wordId?: string; scanRequestId?: string; mode?: string; collectionId?: string }>();
  const picking = mode === 'pick';
  const [usingDefault, setUsingDefault] = useState(false);
  const queryClient = useQueryClient();
  // undefined = not chosen yet: then the preset collection (if any) is shown; null = the collection list.
  const [chosenCollection, setCollection] = useState<Collection | null | undefined>(undefined);
  const [parents, setParents] = useState<TopicDTO[]>([]);
  const [selected, setSelected] = useState<TopicDTO | null>(null);
  const breadcrumb = useRef<ScrollView>(null);
  const parent = parents.at(-1);
  const collections = useCollections({ type: 'USER' });
  const collection = chosenCollection !== undefined
    ? chosenCollection
    : collections.data?.find(item => String(item.id) === presetCollectionId) ?? null;
  const topics = useInfiniteCollectionTopics(collection?.id ?? '', { parentId: parent?.id, size: 30 });
  const items = topics.data?.pages.flatMap(page => page.data) ?? [];
  const selectedPath = collection && selected
    ? [collection.name, ...parents.map(topic => topic.name), ...(parent?.id === selected.id ? [] : [selected.name])].join(' / ')
    : null;
  const goUp = useCallback(() => {
    setSelected(null);
    if (parents.length)
      setParents(value => value.slice(0, -1));
    // Opened inside one collection: leaving its root goes back to it, not to the collection list.
    else if (collection && !presetCollectionId)
      setCollection(null);
    else
      router.back();
  }, [parents.length, collection, presetCollectionId, router]);
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
    if (picking) {
      rememberSaveDestination({
        collectionId: collection.id,
        collectionName: collection.name,
        topicId: selected.id,
        topicName: selected.name,
        activeTemplateId: selected.activeTemplateId ?? null,
      });
      router.back();
      return;
    }
    router.replace({
      pathname: '/collections/add-word',
      params: {
        topicId: String(selected.id),
        topicName: selected.name,
        collectionId: String(collection.id),
        collectionName: collection.name,
        ...(word ? { word } : {}),
        ...(wordId ? { wordId } : {}),
        ...(selected.activeTemplateId ? { activeTemplateId: String(selected.activeTemplateId) } : {}),
        ...(scanRequestId ? { scanRequestId } : {}),
      },
    });
  };
  /** No collection of their own yet: the default topic is created on the spot (BF-07 step 2). */
  const pickDefaultTopic = async () => {
    setUsingDefault(true);
    try {
      const target = await fetchDefaultTopic();
      rememberSaveDestination(target);
      // It may have just been created: the library must show it.
      void queryClient.invalidateQueries({ queryKey: ['collections'] });
      if (picking) {
        router.back();
        return;
      }
      router.replace({
        pathname: '/collections/add-word',
        params: {
          topicId: String(target.topicId),
          topicName: target.topicName,
          collectionId: String(target.collectionId),
          collectionName: target.collectionName,
          ...(word ? { word } : {}),
          ...(wordId ? { wordId } : {}),
          ...(target.activeTemplateId ? { activeTemplateId: String(target.activeTemplateId) } : {}),
          ...(scanRequestId ? { scanRequestId } : {}),
        },
      });
    }
    catch {
      setUsingDefault(false);
      showErrorMessage(translate('scan.save.default_error'));
    }
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
          <Text className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-300" tx={picking ? 'scan.save.pick_hint' : 'my_words.destination_hint'} />
        </View>
      </View>
      {!!word && (
        <View className="gap-1 border-b border-line px-4 py-3">
          <Text className="text-sm text-neutral-600 dark:text-neutral-300" tx="my_words.adding_word" />
          <Text numberOfLines={2} className="font-nunito text-xl font-extrabold text-mascot-navy dark:text-white">{word}</Text>
        </View>
      )}
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
              <Button tx="scan.save.use_default" loading={usingDefault} onPress={() => void pickDefaultTopic()} testID="save-use-default-topic" />
              <Button tx="scan.save.go_learn" variant="white" onPress={() => router.dismissTo('/learn')} />
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
                  {/* Create one here and come back to pick it, instead of leaving the save for the Learn tab. */}
                  <Button
                    tx={parent ? 'scan.save.create_subtopic' : 'scan.save.create_topic'}
                    variant="white"
                    testID="save-create-topic"
                    onPress={() => router.push({
                      pathname: '/collections/create-topic',
                      params: { collectionId: String(collection.id), collectionName: collection.name, parentId: parent ? String(parent.id) : '' },
                    })}
                  />
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
          <Button tx={picking ? 'scan.save.use_topic' : 'my_words.continue_to_form'} testID="save-destination-confirm" disabled={!selected} className="h-auto min-h-14 py-3" textClassName="shrink" onPress={confirm} />
        </View>
      )}
    </SafeAreaView>
  );
}
