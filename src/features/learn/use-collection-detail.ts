import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { Collection, TopicDTO, TopicItemData } from './types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { useCollection, useInfiniteCollectionTopics, useInfiniteTopicItems } from './api';
import { extractTopicItemDisplay } from './components/collection-detail/topic-item-utils';

export type ParentBreadcrumb = {
  id: number;
  name: string;
  translation?: string;
};

export function useCollectionDetail() {
  const router = useRouter();
  const {
    id,
    name: paramName,
    translation: paramTranslation,
    type: paramType,
  } = useLocalSearchParams<{
    id: string;
    name?: string;
    translation?: string;
    type?: string;
  }>();

  const [parentStack, setParentStack] = React.useState<ParentBreadcrumb[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const bottomSheetRef = React.useRef<BottomSheetModal>(null);

  const currentParent = parentStack[parentStack.length - 1] ?? null;
  const currentParentId = currentParent ? currentParent.id : null;
  const isInsideTopic = currentParentId !== null;

  // 1. Query Collection Info
  const { data: collectionData } = useCollection(id);

  // 2. Query Topics (Root topics or Subtopics)
  const {
    data: topicsResponse,
    isLoading: isTopicsLoading,
    isError: isTopicsError,
    isRefetching: isTopicsRefetching,
    isFetchingNextPage: isFetchingNextTopics,
    hasNextPage: hasNextTopics,
    fetchNextPage: fetchNextTopics,
    refetch: refetchTopics,
  } = useInfiniteCollectionTopics(id, {
    parentId: currentParentId,
    size: isInsideTopic ? 50 : 20,
  });

  const topics: TopicDTO[] = React.useMemo(() => {
    return topicsResponse?.pages.flatMap((page: { data: TopicDTO[] }) => page.data) ?? [];
  }, [topicsResponse]);

  // 3. Query Topic Items (when inside a topic)
  const {
    data: itemsResponse,
    isLoading: isItemsLoading,
    isError: isItemsError,
    isRefetching: isItemsRefetching,
    isFetchingNextPage: isFetchingNextItems,
    hasNextPage: hasNextItems,
    fetchNextPage: fetchNextItems,
    refetch: refetchItems,
  } = useInfiniteTopicItems(isInsideTopic ? currentParentId : undefined, 20);

  const items: TopicItemData[] = React.useMemo(() => {
    return itemsResponse?.pages.flatMap((page: { data: TopicItemData[] }) => page.data) ?? [];
  }, [itemsResponse]);

  const totalItemsCount = itemsResponse?.pages[0]?.meta.total ?? items.length;
  const totalTopicsCount = topicsResponse?.pages[0]?.meta.total ?? topics.length;

  // Search filtered topics
  const filteredTopics = React.useMemo(() => {
    if (!searchQuery.trim())
      return topics;
    const q = searchQuery.toLowerCase().trim();
    return topics.filter(
      t =>
        t.name.toLowerCase().includes(q)
        || (t.translation && t.translation.toLowerCase().includes(q)),
    );
  }, [topics, searchQuery]);

  // Search filtered items
  const filteredItems = React.useMemo(() => {
    if (!searchQuery.trim())
      return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter((item) => {
      const { word, translation, phonetic } = extractTopicItemDisplay(item);
      return (
        word.toLowerCase().includes(q)
        || translation.toLowerCase().includes(q)
        || (phonetic && phonetic.toLowerCase().includes(q))
      );
    });
  }, [items, searchQuery]);

  // Navigation handlers
  const handleTopicPress = React.useCallback((topic: TopicDTO) => {
    setParentStack(prev => [
      ...prev,
      { id: topic.id, name: topic.name, translation: topic.translation },
    ]);
    setSearchQuery('');
  }, []);

  const handleBack = React.useCallback(() => {
    if (parentStack.length > 0) {
      setParentStack(prev => prev.slice(0, -1));
      setSearchQuery('');
    }
    else {
      router.back();
    }
  }, [parentStack.length, router]);

  const handleBreadcrumbPress = React.useCallback((index: number) => {
    if (index === -1) {
      setParentStack([]);
    }
    else {
      setParentStack(prev => prev.slice(0, index + 1));
    }
    setSearchQuery('');
  }, []);

  const handleEndReached = React.useCallback(() => {
    if (isInsideTopic) {
      if (hasNextItems && !isFetchingNextItems) {
        fetchNextItems();
      }
    }
    else {
      if (hasNextTopics && !isFetchingNextTopics) {
        fetchNextTopics();
      }
    }
  }, [
    isInsideTopic,
    hasNextItems,
    isFetchingNextItems,
    fetchNextItems,
    hasNextTopics,
    isFetchingNextTopics,
    fetchNextTopics,
  ]);

  const handleRefresh = React.useCallback(() => {
    if (isInsideTopic) {
      refetchTopics();
      refetchItems();
    }
    else {
      refetchTopics();
    }
  }, [isInsideTopic, refetchTopics, refetchItems]);

  const handleOptionsPress = React.useCallback(() => {
    bottomSheetRef.current?.present();
  }, []);

  const handleDeleteSuccess = React.useCallback(() => {
    router.back();
  }, [router]);

  const isRefreshing = isInsideTopic
    ? (isItemsRefetching || isTopicsRefetching) && !isFetchingNextItems
    : isTopicsRefetching && !isFetchingNextTopics;

  const headerTitle
    = currentParent?.name
      || collectionData?.name
      || paramName
      || '';
  const headerSubtitle
    = currentParent?.translation || collectionData?.translation || paramTranslation;
  const collectionTitle = collectionData?.name || paramName || '';
  const isUserCollection = (collectionData?.type ?? paramType) === 'USER';

  const isInitialLoading = isInsideTopic
    ? isItemsLoading && items.length === 0
    : isTopicsLoading && topics.length === 0;

  const isError = isInsideTopic ? isItemsError : isTopicsError;

  const firstTopic = topics[0];

  return {
    id,
    paramName,
    paramTranslation,
    paramType,
    collectionData: (collectionData ?? null) as Collection | null,
    parentStack,
    currentParent,
    currentParentId,
    isInsideTopic,
    topics,
    filteredTopics,
    items,
    filteredItems,
    totalTopicsCount,
    totalItemsCount,
    isTopicsLoading,
    isTopicsError,
    isTopicsRefetching,
    isItemsLoading,
    isItemsError,
    isItemsRefetching,
    isInitialLoading,
    isError,
    isRefreshing,
    isFetchingNextTopics,
    isFetchingNextItems,
    searchQuery,
    setSearchQuery,
    bottomSheetRef,
    headerTitle,
    headerSubtitle,
    collectionTitle,
    isUserCollection,
    firstTopicId: firstTopic?.id ?? null,
    firstTopicName: firstTopic?.name ?? '',
    handleDeleteSuccess,
    handleTopicPress,
    handleBack,
    handleBreadcrumbPress,
    handleEndReached,
    handleRefresh,
    handleOptionsPress,
    refetchTopics,
    refetchItems,
  };
}
