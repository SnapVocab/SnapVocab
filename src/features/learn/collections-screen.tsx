import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { Collection, CollectionRef } from './types';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Button, FocusAwareStatusBar, SafeAreaView, useSurface, View } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { setItem } from '@/lib/storage';
import { useCollections } from './api';
import {
  CollectionCard,
  CollectionEmptyState,
  CollectionErrorState,
  CollectionHeader,
  CollectionOptionsBottomSheet,
  CollectionSwitcher,
  SkeletonCollectionList,
} from './components';

export function CollectionsScreen() {
  const surface = useSurface();
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

  const handleCardPress = useCallback((collection: CollectionRef) => {
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
  }, [router]);

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: surface.headerBg }}>
      <FocusAwareStatusBar />

      {/* Header bar */}
      <CollectionHeader />

      <View className="flex-1 bg-background px-3 pt-4">
        {/* Switcher Tab: Mine / System */}
        <CollectionSwitcher viewType={viewType} onChange={setViewType} />

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pt-3 pb-8"
        >
          {/* Loading State */}
          {isLoading && !collections && <SkeletonCollectionList count={5} />}

          {/* Error State */}
          {isError && !collections && (
            <CollectionErrorState isRetrying={isRefetching} onRetry={() => refetch()} />
          )}

          {/* Empty State */}
          {!isLoading && !isError && collections && collections.length === 0 && (
            <CollectionEmptyState />
          )}

          {/* Data State */}
          {collections && collections.length > 0 && (
            <Animated.View key={viewType} entering={FadeIn.duration(200)} className="gap-2.5">
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

        <Button
          label={`${translate('learn.collections.create_new_collection')}`}
          onPress={handleCreatePress}
        />
      </View>

      {/* Collection Options Bottom Sheet */}
      <CollectionOptionsBottomSheet
        bottomSheetRef={bottomSheetRef}
        collection={selectedCollection}
        mode={sheetMode}
        onCreated={(newCol) => {
          refetch();
          handleCardPress(newCol);
        }}
        onSaveEdit={() => refetch()}
        onDelete={() => refetch()}
        onStudy={handleCardPress}
      />
    </SafeAreaView>
  );
}
