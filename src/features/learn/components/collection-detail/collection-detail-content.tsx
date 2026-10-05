import type { TopicDTO, TopicItemData } from '../../types';
import type { useCollectionDetail } from '../../use-collection-detail';
import { FlashList } from '@shopify/flash-list';
import * as React from 'react';
import { ActivityIndicator, RefreshControl, View } from 'react-native';
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
    handleEndReached,
    handleRefresh,
    refetchTopics,
    refetchItems,
    searchQuery,
    setSearchQuery,
    isFetchingNextTopics,
    isFetchingNextItems,
  } = detail;

  const ListHeader = React.useMemo(
    () => (
      <CollectionDetailListHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isInsideTopic={isInsideTopic}
        subtopics={topics}
        totalCount={isInsideTopic ? totalItemsCount : totalTopicsCount}
        onSelectTopic={handleTopicPress}
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
            <TopicCard item={item} onPress={() => handleTopicPress(item)} />
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
