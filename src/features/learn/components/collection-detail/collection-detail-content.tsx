import type { Href } from 'expo-router';
import type { TopicDTO, TopicItemData } from '../../types';
import type { useCollectionDetail } from '../../use-collection-detail';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, RefreshControl, View } from 'react-native';
import { useStudyLibrary } from '@/features/study/api';
import { CollectionErrorState } from '../collections';
import CollectionDetailListHeader from './collection-detail-list-header';
import CollectionWordsEmpty from './collection-words-empty';
import SkeletonTopicList from './skeleton-topic-list';
import TopicCard from './topic-card';
import TopicItemRow from './topic-item-row';
import TopicListEmpty from './topic-list-empty';

type Props = {
  detail: ReturnType<typeof useCollectionDetail>;
};

export function CollectionDetailContent({ detail }: Props) {
  const {
    isInsideTopic,
    topics,
    filteredTopics,
    filteredItems,
    totalTopicsCount,
    totalItemsCount,
    isTopicsLoading,
    isTopicsError,
    isTopicsRefetching,
    isItemsLoading,
    isItemsError,
    isItemsRefetching,
    isRefreshing,
    handleTopicPress,
    handleStudyTopic,
    handleEndReached,
    handleRefresh,
    refetchTopics,
    refetchItems,
    searchQuery,
    setSearchQuery,
    isFetchingNextTopics,
    isFetchingNextItems,
  } = detail;

  // Library row → here → one button for the whole collection (learn_ui.md §9.1, I7).
  const router = useRouter();
  const collectionDueCount = useStudyLibrary().data?.find(c => c.id === Number(detail.id))?.dueCount ?? 0;
  const handleStudyCollection = React.useCallback(() => {
    router.push({
      pathname: '/(app)/study/session',
      params: { collectionId: String(detail.id), collectionName: detail.collectionTitle },
    } as Href);
  }, [router, detail.id, detail.collectionTitle]);

  const ListHeader = React.useMemo(
    () => (
      <CollectionDetailListHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isInsideTopic={isInsideTopic}
        subtopics={topics}
        totalCount={isInsideTopic ? totalItemsCount : totalTopicsCount}
        onSelectTopic={handleTopicPress}
        onStudyTopic={handleStudyTopic}
        onStudyCollection={handleStudyCollection}
        collectionDueCount={collectionDueCount}
      />
    ),
    [
      searchQuery,
      setSearchQuery,
      isInsideTopic,
      topics,
      totalItemsCount,
      totalTopicsCount,
      handleTopicPress,
      handleStudyTopic,
      handleStudyCollection,
      collectionDueCount,
    ],
  );

  const ListEmpty = React.useMemo(() => {
    if (isInsideTopic) {
      if (isItemsLoading)
        return <SkeletonTopicList count={5} />;
      if (isItemsError) {
        return (
          <CollectionErrorState
            isRetrying={isItemsRefetching}
            onRetry={() => refetchItems()}
          />
        );
      }
      return <CollectionWordsEmpty />;
    }

    if (isTopicsLoading)
      return <SkeletonTopicList count={6} />;
    if (isTopicsError) {
      return (
        <CollectionErrorState
          isRetrying={isTopicsRefetching}
          onRetry={() => refetchTopics()}
        />
      );
    }
    return <TopicListEmpty />;
  }, [
    isInsideTopic,
    isItemsLoading,
    isItemsError,
    isItemsRefetching,
    refetchItems,
    isTopicsLoading,
    isTopicsError,
    isTopicsRefetching,
    refetchTopics,
  ]);

  const ListFooter = React.useMemo(() => {
    const isFetchingMore = isInsideTopic
      ? isFetchingNextItems
      : isFetchingNextTopics;
    if (isFetchingMore) {
      return (
        <View className="items-center justify-center py-4">
          <ActivityIndicator size="small" color="#0284C7" />
        </View>
      );
    }
    return <View className="h-8" />;
  }, [isInsideTopic, isFetchingNextItems, isFetchingNextTopics]);

  return (
    <View style={{ flex: 1 }} className="flex-1">
      {isInsideTopic ? (
        <FlashList<TopicItemData>
          data={isItemsLoading ? [] : filteredItems}
          keyExtractor={item => String(item.topicItemId)}
          renderItem={({ item, index }) => (
            <TopicItemRow
              item={item}
              onPress={() => detail.handlePreviewItem(item, index)}
            />
          )}
          ItemSeparatorComponent={() => <View className="h-2.5" />}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          ListFooterComponent={ListFooter}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={(
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 96,
          }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlashList<TopicDTO>
          data={isTopicsLoading ? [] : filteredTopics}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <TopicCard
              item={item}
              onPress={() => handleTopicPress(item)}
              onStudyPress={() => handleStudyTopic(item)}
            />
          )}
          ItemSeparatorComponent={() => <View className="h-2.5" />}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          ListFooterComponent={ListFooter}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={(
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 96,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

export default CollectionDetailContent;
