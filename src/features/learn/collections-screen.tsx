import type { Href } from 'expo-router';
import type { CollectionRef } from './types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, TextInput } from 'react-native';
import { FocusAwareStatusBar, SafeAreaView, View } from '@/components/ui';
import { SearchIcon } from '@/components/ui/icons';
import { useStudyLibrary } from '@/features/study/api';
import { translate } from '@/lib/i18n';
import { useCollections } from './api';
import {
  CollectionCard,
  CollectionEmptyState,
  CollectionErrorState,
  CollectionHeader,
  LibraryGroup,
  LibraryRow,
  SkeletonCollectionList,
} from './components';

/**
 * Two lists behind the Learn tab (learn_ui.md §8.2 D): `view=mine` is every collection in "Bộ từ của bạn"
 * (with search, the only place it exists), `view=explore` browses the system collections.
 */
export function CollectionsScreen() {
  const router = useRouter();
  const { view } = useLocalSearchParams<{ view?: 'mine' | 'explore' }>();
  const explore = view === 'explore';

  const openCollection = useCallback((collection: CollectionRef) => {
    router.push({
      pathname: '/(app)/collections/[id]',
      params: {
        id: String(collection.id),
        name: collection.name,
        translation: collection.translation,
        type: collection.type,
      },
    } as Href);
  }, [router]);

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <CollectionHeader
        title={translate(explore ? 'learn.library.explore_title' : 'learn.library.title')}
        subtitle={translate(explore ? 'learn.library.explore_subtitle' : 'learn.library.mine_subtitle')}
      />
      {explore ? <ExploreList onOpen={openCollection} /> : <MineList onOpen={openCollection} />}
    </SafeAreaView>
  );
}

function MineList({ onOpen }: { onOpen: (collection: CollectionRef) => void }) {
  const library = useStudyLibrary();
  const [query, setQuery] = useState('');
  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (library.data ?? []).filter(c =>
      !needle || c.name.toLowerCase().includes(needle) || c.translation?.toLowerCase().includes(needle));
  }, [library.data, query]);

  return (
    <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="pb-10" keyboardShouldPersistTaps="handled">
      <View className="mb-3 flex-row items-center rounded-2xl border border-neutral-200/80 bg-white px-3.5 py-2.5 dark:border-neutral-800 dark:bg-neutral-900">
        <SearchIcon width={18} height={18} color="#9CA3AF" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={translate('learn.library.search_placeholder')}
          placeholderTextColor="#9CA3AF"
          className="ml-2.5 flex-1 font-inter text-sm text-neutral-800 dark:text-white"
        />
      </View>
      {library.isLoading && <SkeletonCollectionList count={5} />}
      {library.isError && <CollectionErrorState isRetrying={library.isRefetching} onRetry={() => void library.refetch()} />}
      {library.data && rows.length === 0 && <CollectionEmptyState />}
      {rows.length > 0 && (
        <LibraryGroup>
          {rows.map(collection => (
            <LibraryRow key={collection.id} collection={collection} onPress={() => onOpen(collection)} />
          ))}
        </LibraryGroup>
      )}
    </ScrollView>
  );
}

function ExploreList({ onOpen }: { onOpen: (collection: CollectionRef) => void }) {
  const system = useCollections({ type: 'SYSTEM' });
  return (
    <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="gap-2.5 pb-10">
      {system.isLoading && <SkeletonCollectionList count={5} />}
      {system.isError && <CollectionErrorState isRetrying={system.isRefetching} onRetry={() => void system.refetch()} />}
      {system.data?.length === 0 && <CollectionEmptyState />}
      {system.data?.map(collection => (
        <CollectionCard
          key={collection.id}
          name={collection.name}
          translation={collection.translation}
          isSystemCollection
          onPress={() => onOpen(collection)}
        />
      ))}
    </ScrollView>
  );
}
