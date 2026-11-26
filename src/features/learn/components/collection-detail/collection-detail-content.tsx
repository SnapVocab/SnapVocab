import type { Href } from 'expo-router';
import type { TopicDTO, TopicItemData } from '../../types';
import type { useCollectionDetail } from '../../use-collection-detail';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect, useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, RefreshControl, View } from 'react-native';
import { useCollectionStudyOverview } from '@/features/study/api';
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
    id,
    collectionTitle,
    currentParent,
    currentParentId,
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
  const overview = useCollectionStudyOverview(id);
  const refreshCounts = overview.refetch;
  useFocusEffect(React.useCallback(() => {
    void refreshCounts();
  }, [refreshCounts]));
  const currentCounts = isInsideTopic
    ? overview.data?.topics.find(count => count.topicId === currentParentId)
    : overview.data?.collection;
  const handleStudyCollection = React.useCallback(() => {
    if (currentParent) {
      handleStudyTopic(currentParent);
      return;
    }
    router.push({
      pathname: '/(app)/study/session',
      params: { collectionId: String(id), collectionName: collectionTitle },
    } as Href);
  }, [router, id, collectionTitle, currentParent, handleStudyTopic]);

  const handleStoryTopic = React.useCallback(() => {
    if (!currentParent)
      return;
    router.push({
      pathname: '/story/[id]',
      params: {
        id: 'new',
        source: 'TOPIC',
        topicId: String(currentParent.id),
        topicName: currentParent.name,
      },
    } as any);
  }, [router, currentParent]);

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
        onStoryTopic={handleStoryTopic}
        counts={currentCounts}
        topicCounts={overview.data?.topics}
        countsError={overview.isError}
        onRetryCounts={() => void refreshCounts()}
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
      handleStoryTopic,
      currentCounts,
      overview.data?.topics,
      overview.isError,
      refreshCounts,
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
              // System collections are read-only: no edit/delete to offer (the server refuses them).
              onLongPress={detail.isUserCollection ? () => detail.handleTopicItemOptionsPress(item) : undefined}
              onOptions={detail.isUserCollection ? () => detail.handleTopicItemOptionsPress(item) : undefined}
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
              counts={overview.data?.topics.find(count => count.topicId === item.id)}
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
