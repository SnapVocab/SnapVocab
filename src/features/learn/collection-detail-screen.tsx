import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { TopicDTO } from './types';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { FocusAwareStatusBar, SafeAreaView, SpeedDialFAB, Text } from '@/components/ui';
import {
  BookIcon,
  ChevronRightIcon,
  CloseIcon,
  FolderIcon,
  SearchIcon,
} from '@/components/ui/icons';
import { translate } from '@/lib/i18n';
import { useCollection, useInfiniteCollectionTopics } from './api';
import {
  CollectionDetailHeader,
  CollectionErrorState,
  CollectionOptionsBottomSheet,
  SkeletonTopicList,
  TopicCard,
  TopicListEmpty,
} from './components';

type ParentBreadcrumb = {
  id: number;
  name: string;
  translation?: string;
};

export function CollectionDetailScreen() {
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

  const [parentStack, setParentStack] = useState<ParentBreadcrumb[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const currentParent = parentStack[parentStack.length - 1] ?? null;
  const currentParentId = currentParent ? currentParent.id : null;

  // Collection info query
  const { data: collectionData } = useCollection(id);

  // Infinite topics query with virtualization
  const {
    data: topicsResponse,
    isLoading,
    isError,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteCollectionTopics(id, {
    parentId: currentParentId,
    size: 20,
  });

  const topics: TopicDTO[] = useMemo(() => {
    return topicsResponse?.pages.flatMap(page => page.data) ?? [];
  }, [topicsResponse]);

  const totalElements = topicsResponse?.pages[0]?.meta.total ?? topics.length;

  // Filter topics by search query
  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) {
      return topics;
    }
    const q = searchQuery.toLowerCase().trim();
    return topics.filter(
      t =>
        t.name.toLowerCase().includes(q)
        || (t.translation && t.translation.toLowerCase().includes(q)),
    );
  }, [topics, searchQuery]);

  // Handle drill down into a folder topic
  const handleTopicPress = useCallback((topic: TopicDTO) => {
    if (topic.hasChildren) {
      setParentStack(prev => [
        ...prev,
        { id: topic.id, name: topic.name, translation: topic.translation },
      ]);
      setSearchQuery('');
    }
    else {
      // Navigate to topic flashcards / study session
    }
  }, []);

  // Handle navigating up one level or back
  const handleBack = useCallback(() => {
    if (parentStack.length > 0) {
      setParentStack(prev => prev.slice(0, -1));
      setSearchQuery('');
    }
    else {
      router.back();
    }
  }, [parentStack.length, router]);

  // Jump to specific breadcrumb
  const handleBreadcrumbPress = useCallback((index: number) => {
    if (index === -1) {
      setParentStack([]);
    }
    else {
      setParentStack(prev => prev.slice(0, index + 1));
    }
    setSearchQuery('');
  }, []);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleOpenOptions = () => {
    bottomSheetRef.current?.present();
  };

  const handleDeleteSuccess = () => {
    router.back();
  };

  const headerTitle
    = currentParent?.name
      || collectionData?.name
      || paramName
      || translate('learn.collection_detail.title');
  const headerSubtitle
    = currentParent?.translation || collectionData?.translation || paramTranslation;
  const isUserCollection = (collectionData?.type ?? paramType) === 'USER';

  const ListHeader = useMemo(() => {
    return (
      <View className="mb-3">
        {/* Search Box */}
        {(topics.length > 0 || searchQuery.length > 0) && (
          <View className="mb-3 flex-row items-center rounded-2xl border border-neutral-200/80 bg-white px-3.5 py-2.5 dark:border-neutral-800 dark:bg-neutral-900">
            <SearchIcon width={18} height={18} color="#9CA3AF" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={translate('learn.collection_detail.search_placeholder')}
              placeholderTextColor="#9CA3AF"
              className="ml-2.5 flex-1 font-inter text-sm text-neutral-800 dark:text-white"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <CloseIcon width={16} height={16} color="#9CA3AF" />
              </Pressable>
            )}
          </View>
        )}

        {/* Section Title & Count */}
        <View className="flex-row items-center justify-between">
          <Text className="font-nunito text-base font-black text-mascot-navy dark:text-white">
            {translate('learn.collection_detail.topics_list_title')}
            {' '}
            (
            {totalElements}
            )
          </Text>
        </View>
      </View>
    );
  }, [topics.length, searchQuery, totalElements]);

  const ListEmpty = useMemo(() => {
    if (isLoading) {
      return <SkeletonTopicList count={6} />;
    }
    if (isError) {
      return <CollectionErrorState isRetrying={isRefetching} onRetry={() => refetch()} />;
    }
    return <TopicListEmpty />;
  }, [isLoading, isError, isRefetching, refetch]);

  const ListFooter = useMemo(() => {
    if (isFetchingNextPage) {
      return (
        <View className="items-center justify-center py-4">
          <ActivityIndicator size="small" color="#0284C7" />
        </View>
      );
    }
    return <View className="h-8" />;
  }, [isFetchingNextPage]);

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background">
      <FocusAwareStatusBar />

      {/* Header */}
      <CollectionDetailHeader
        title={headerTitle}
        subtitle={headerSubtitle}
        showOptions={isUserCollection && parentStack.length === 0}
        onBackPress={handleBack}
        onOptionsPress={handleOpenOptions}
      />

      {/* Breadcrumb Bar (when drilled down) */}
      {parentStack.length > 0 && (
        <View className="flex-row items-center border-b border-neutral-100 bg-neutral-50/80 px-4 py-2.5 dark:border-neutral-800 dark:bg-neutral-900/50">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="flex-row items-center"
          >
            <Pressable onPress={() => handleBreadcrumbPress(-1)} hitSlop={6}>
              <Text className="font-nunito text-xs font-bold text-primary-600 dark:text-primary-400">
                {collectionData?.name
                  || paramName
                  || translate('learn.collection_detail.root_level')}
              </Text>
            </Pressable>

            {parentStack.map((crumb, idx) => {
              const isLast = idx === parentStack.length - 1;
              return (
                <View key={crumb.id} className="flex-row items-center">
                  <View className="mx-1.5">
                    <ChevronRightIcon width={12} height={12} color="#9CA3AF" />
                  </View>
                  <Pressable
                    onPress={() => !isLast && handleBreadcrumbPress(idx)}
                    disabled={isLast}
                    hitSlop={6}
                  >
                    <Text
                      className={`font-nunito text-xs ${
                        isLast
                          ? 'font-black text-mascot-navy dark:text-white'
                          : 'font-bold text-primary-600 dark:text-primary-400'
                      }`}
                    >
                      {crumb.name}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Virtualized Topic List with Infinite Scroll */}
      <View className="mb-4 flex-1">
        <FlashList<TopicDTO>
          data={isLoading ? [] : filteredTopics}
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
          refreshControl={
            <RefreshControl refreshing={isRefetching && !isFetchingNextPage} onRefresh={refetch} />
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 96 }}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Floating Speed Dial Button */}
      <SpeedDialFAB
        actions={[
          {
            id: 'add-word',
            label: translate('learn.topic.add_word'),
            icon: <BookIcon width={20} height={20} color="#FFFFFF" />,
            bgColorClass: 'bg-emerald-600 dark:bg-emerald-500',
            onPress: () => {
              // Action to add vocabulary into the current topic/collection
            },
          },
          {
            id: 'add-topic',
            label: currentParentId
              ? translate('learn.topic.add_subtopic')
              : translate('learn.topic.add_topic'),
            icon: <FolderIcon width={20} height={20} color="#FFFFFF" />,
            bgColorClass: 'bg-amber-500 dark:bg-amber-600',
            onPress: () => {
              router.push({
                pathname: '/(app)/collections/create-topic' as any,
                params: {
                  collectionId: String(id),
                  collectionName: collectionData?.name ?? paramName ?? '',
                  parentId: currentParentId !== null ? String(currentParentId) : '',
                },
              });
            },
          },
        ]}
      />

      {/* Options Bottom Sheet */}
      {collectionData && (
        <CollectionOptionsBottomSheet
          bottomSheetRef={bottomSheetRef}
          collection={collectionData}
          mode="OPTIONS"
          onDelete={handleDeleteSuccess}
        />
      )}

    </SafeAreaView>
  );
}

export default CollectionDetailScreen;
