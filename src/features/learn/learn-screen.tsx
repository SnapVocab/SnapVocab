import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { Href } from 'expo-router';
import type { CollectionRef } from './types';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView } from 'react-native';
import { FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { PlusIcon } from '@/components/ui/icons';
import { invalidateStudy, useStudyLibrary } from '@/features/study/api';
import { TodayBlock } from '@/features/study/today-block';
import { translate } from '@/lib/i18n';
import { CollectionOptionsBottomSheet, LibraryGroup, LibraryLinkRow, LibraryRow } from './components';

/** Rows shown before "Xem tất cả" (learn_ui.md §8.2 D). */
const LIBRARY_PREVIEW = 6;

/**
 * Tab "Học" (learn_ui.md IA B): today's session on top, the learner's library below. No streak, XP or
 * progress here: rewards belong to the end of a session (§7.2).
 */
export function LearnScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const library = useStudyLibrary();
  const [selected, setSelected] = useState<CollectionRef | null>(null);
  const [sheetMode, setSheetMode] = useState<'OPTIONS' | 'CREATE'>('OPTIONS');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const sheetRef = useRef<BottomSheetModal>(null);

  const refresh = useCallback(() => invalidateStudy(queryClient), [queryClient]);
  const onPullRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  }, [refresh]);

  const openCollection = useCallback((collection: CollectionRef) => {
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

  const studyCollection = useCallback((collection: CollectionRef) => {
    router.push({
      pathname: '/(app)/study/session',
      params: { collectionId: String(collection.id), collectionName: collection.name },
    } as Href);
  }, [router]);

  const openSheet = useCallback((mode: 'OPTIONS' | 'CREATE', collection: CollectionRef | null) => {
    setSelected(collection);
    setSheetMode(mode);
    sheetRef.current?.present();
  }, []);

  const rows = library.data ?? [];

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-10"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onPullRefresh} tintColor="#58CC02" />}
      >
        <Text className="px-5 pt-4 pb-3 font-nunito text-3xl font-black text-mascot-navy dark:text-white">
          {translate('learn.tab_label')}
        </Text>

        <TodayBlock />

        <View className="px-4">
          <View className="mb-2 ml-1 flex-row items-center justify-between">
            <Text className="font-nunito text-[15px] font-extrabold tracking-widest text-mascot-navy uppercase dark:text-white">
              {translate('learn.library.title')}
            </Text>
            <Pressable
              onPress={() => openSheet('CREATE', null)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={translate('learn.library.create')}
              className="size-10 items-center justify-center"
              testID="library-create"
            >
              <PlusIcon width={20} height={20} color="#58CC02" />
            </Pressable>
          </View>

          <LibraryGroup>
            {library.isLoading && [0, 1, 2].map(i => (
              <View key={i} className="h-16 border-b border-neutral-50 dark:border-neutral-800" />
            ))}
            {library.isError && (
              <LibraryLinkRow label={translate('learn.library.error')} onPress={() => void library.refetch()} />
            )}
            {rows.slice(0, LIBRARY_PREVIEW).map(collection => (
              <LibraryRow
                key={collection.id}
                collection={collection}
                onPress={() => openCollection(collection)}
                onOptionsPress={collection.type === 'USER' ? () => openSheet('OPTIONS', collection) : undefined}
              />
            ))}
            {rows.length > LIBRARY_PREVIEW && (
              <LibraryLinkRow
                label={translate('learn.library.see_all', { count: rows.length })}
                onPress={() => router.push({ pathname: '/(app)/collections', params: { view: 'mine' } } as Href)}
              />
            )}
            <LibraryLinkRow
              label={translate('learn.library.explore')}
              onPress={() => router.push({ pathname: '/(app)/collections', params: { view: 'explore' } } as Href)}
              last
            />
          </LibraryGroup>

          <View className="mt-6">
            <LibraryGroup>
              <LibraryLinkRow
                label={translate('learn.library.practice_quiz')}
                onPress={() => router.push('/(app)/study/quiz-setup' as Href)}
                last
              />
            </LibraryGroup>
          </View>
        </View>
      </ScrollView>

      <CollectionOptionsBottomSheet
        bottomSheetRef={sheetRef}
        collection={selected}
        mode={sheetMode}
        onCreated={(created) => {
          void refresh();
          openCollection(created);
        }}
        onSaveEdit={() => void refresh()}
        onDelete={() => void refresh()}
        onStudy={studyCollection}
      />
    </SafeAreaView>
  );
}

export default LearnScreen;
