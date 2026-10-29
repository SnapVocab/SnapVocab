import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { Collection } from './types';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Button, FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { setItem } from '@/lib/storage';
import { useCollections } from './api';
import {
  CollectionCard,
  CollectionEmptyState,
  CollectionErrorState,
  CollectionOptionsBottomSheet,
  CollectionSwitcher,
  SkeletonCollectionList,
} from './components';

export function LearnScreen() {
  const router = useRouter();
  const [viewType, setViewType] = useState<'USER' | 'SYSTEM'>('USER');
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [sheetMode, setSheetMode] = useState<'OPTIONS' | 'CREATE'>('OPTIONS');
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const {
    data: collections,
    isError,
    isLoading,
    isRefetching,
    refetch,
  } = useCollections({ type: viewType });

  const handleCardPress = useCallback(
    (collection: Collection) => {
      setItem('last_studied_collection_id', collection.id);
      router.push({
        pathname: '/(app)/collections/[id]',
        params: {
          id: String(collection.id),
          name: collection.name,
          translation: collection.translation,
          type: collection.type,
        },
      });
    },
    [router],
  );

  const handleOptionsPress = useCallback((collection: Collection) => {
    setSelectedCollection(collection);
    setSheetMode('OPTIONS');
    bottomSheetRef.current?.present();
  }, []);

  const handleCreatePress = useCallback(() => {
    setSelectedCollection(null);
    setSheetMode('CREATE');
    bottomSheetRef.current?.present();
  }, []);

  const handleCreated = useCallback(
    (newCollection: Collection) => {
      refetch();
      handleCardPress(newCollection);
    },
    [refetch, handleCardPress],
  );

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background">
      <FocusAwareStatusBar />

      {/* Screen Header */}
      <View className="border-b border-line bg-surface px-5 py-4">
        <Text className="font-nunito text-2xl font-black text-mascot-navy dark:text-white">
          {translate('learn.collections.title')}
        </Text>
        <Text className="mt-0.5 font-inter text-[13px] font-medium text-neutral-500 dark:text-neutral-400">
          {translate('learn.collections.subtitle')}
        </Text>
      </View>

      <View className="flex-1 px-4 pt-3">
        {/* Switcher Tab: Mine / System */}
        <View className="mb-3">
          <CollectionSwitcher viewType={viewType} onChange={setViewType} />
        </View>

        {/* Scrollable Collection Cards List */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pt-1 pb-24"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        >
          {/* Loading State */}
          {isLoading && !collections && <SkeletonCollectionList count={4} />}

          {/* Error State */}
          {isError && !collections && (
            <CollectionErrorState isRetrying={isRefetching} onRetry={() => refetch()} />
          )}

          {/* Empty State */}
          {!isLoading && !isError && collections && collections.length === 0 && (
            <CollectionEmptyState />
          )}

          {/* Data List State */}
          {collections && collections.length > 0 && (
            <Animated.View key={viewType} entering={FadeIn.duration(200)} className="gap-3">
              {collections.map(item => (
                <CollectionCard
                  key={item.id}
                  name={item.name}
                  translation={item.translation}
                  isSystemCollection={item.type === 'SYSTEM'}
                  onPress={() => handleCardPress(item)}
                  onOptionsPress={() => handleOptionsPress(item)}
                />
              ))}
            </Animated.View>
          )}
        </ScrollView>

        {/* Floating / Bottom Action Button */}
        {viewType === 'USER' && (
          <View className="absolute inset-x-4 bottom-4">
            <Button
              variant="primary"
              label={translate('learn.collections.create_new_collection')}
              onPress={handleCreatePress}
            />
          </View>
        )}
      </View>

      {/* Collection Options / Create Bottom Sheet */}
      <CollectionOptionsBottomSheet
        bottomSheetRef={bottomSheetRef}
        collection={selectedCollection}
        mode={sheetMode}
        onCreated={handleCreated}
        onSaveEdit={() => refetch()}
        onDelete={() => refetch()}
        onStudy={handleCardPress}
      />
    </SafeAreaView>
  );
}

export default LearnScreen;
