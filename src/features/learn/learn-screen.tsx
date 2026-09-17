import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { Collection } from './types';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { getItem, setItem } from '@/lib/storage';
import { useCollections } from './api';
import {
  CollectionCard,
  CollectionOptionsBottomSheet,
  SkeletonCollectionCard,
} from './components';

const LAST_STUDIED_COLLECTION_KEY = 'last_studied_collection_id';

export function LearnScreen() {
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

  const { data: collections, isLoading } = useCollections();

  const activeCollection = useMemo(() => {
    if (!collections || collections.length === 0) {
      return null;
    }

    const lastStudiedId = getItem<number>(LAST_STUDIED_COLLECTION_KEY);
    if (lastStudiedId) {
      const found = collections.find(c => c.id === lastStudiedId);
      if (found) {
        return found;
      }
    }

    // Otherwise, pick the most recently updated user collection
    const userCollections = collections.filter(c => c.type === 'USER');
    if (userCollections.length > 0) {
      return [...userCollections].sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
      })[0];
    }

    // Fallback to default system collection
    const systemCollections = collections.filter(c => c.type === 'SYSTEM');
    return systemCollections[0] ?? null;
  }, [collections]);

  const handleCardPress = useCallback((collection: Collection) => {
    setItem(LAST_STUDIED_COLLECTION_KEY, collection.id);
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
    bottomSheetRef.current?.present();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="p-4 pb-8"
      >
        {/* Section Header: Collections */}
        <View className="flex-row items-center justify-between">
          <Text className="font-nunito text-xs font-extrabold tracking-wider text-neutral-400 uppercase">
            {translate('learn.collections.title')}
          </Text>
          <Pressable onPress={() => router.push('/collections')} hitSlop={8}>
            <Text className="font-inter text-xs font-bold text-neutral-500">
              {`${translate('learn.view_all')} →`}
            </Text>
          </Pressable>
        </View>

        {/* Active Collection Card (1 item) */}
        <View className="mt-3">
          {isLoading && <SkeletonCollectionCard />}

          {!isLoading && activeCollection && (
            <Animated.View entering={FadeIn.duration(200)}>
              <CollectionCard
                name={activeCollection.name}
                translation={activeCollection.translation}
                isSystemCollection={activeCollection.type === 'SYSTEM'}
                onPress={() => handleCardPress(activeCollection)}
                onOptionsPress={() => handleOptionsPress(activeCollection)}
              />
            </Animated.View>
          )}

          {!isLoading && !activeCollection && (
            <Pressable
              onPress={() => router.push('/collections')}
              className="items-center justify-center rounded-2xl border border-dashed border-neutral-300 p-6 dark:border-neutral-700"
            >
              <Text className="font-nunito text-sm font-bold text-neutral-400">
                {translate('learn.collections.empty_title')}
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Collection Options Bottom Sheet */}
      <CollectionOptionsBottomSheet
        bottomSheetRef={bottomSheetRef}
        collection={selectedCollection}
        mode="OPTIONS"
        onStudy={handleCardPress}
      />
    </SafeAreaView>
  );
}

export default LearnScreen;
