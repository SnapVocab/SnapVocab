import { useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { BackButton, SafeAreaView, Text } from '@/components/ui';
import {
  ChevronRightIcon,
  FlameIcon,
  FolderIcon,
} from '@/components/ui/icons';
import { useCollections } from '@/features/learn/api';
import { translate } from '@/lib/i18n';

export function StudySelectScreen() {
  const router = useRouter();
  const { data: collections, isLoading, isError, refetch } = useCollections();
  const openCollection = React.useCallback(
    (collectionId: number, name: string) =>
      router.push({
        pathname: '/(app)/study/session',
        params: { collectionId: String(collectionId), collectionName: name },
      } as any),
    [router],
  );
  return (
    <SafeAreaView
      className="flex-1 bg-[#F7F8F2] dark:bg-[#181A1F]"
      edges={['top', 'bottom']}
    >
      <View className="flex-row items-center bg-white px-4 py-3 dark:bg-[#22252B]">
        <BackButton onPress={() => router.back()} hitSlop={10} />
        <Text className="ml-3 flex-1 font-nunito text-xl font-black text-mascot-navy dark:text-white">
          {translate('learn.hub.study_choose_collection')}
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={{ padding: 18, gap: 12, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-2 overflow-hidden rounded-[28px] border-2 border-b-[5px] border-emerald-200 border-b-emerald-400 bg-emerald-100 p-5 dark:border-emerald-900 dark:border-b-emerald-950 dark:bg-emerald-950/60">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="font-nunito text-lg/6 font-black text-mascot-navy dark:text-white">
                {translate('learn.hub.study_choose_collection_desc')}
              </Text>
            </View>
            <View className="size-14 items-center justify-center rounded-2xl border-2 border-b-4 border-amber-200 border-b-amber-400 bg-amber-50 dark:bg-amber-950/50">
              <FlameIcon width={28} height={28} color="#F97316" />
            </View>
          </View>
        </View>
        {isLoading && (
          <View className="items-center py-10">
            <ActivityIndicator size="large" color="#16A34A" />
            <Text className="mt-3 font-inter text-sm text-neutral-500 dark:text-neutral-400">
              {translate('learn.hub.study_loading_queue')}
            </Text>
          </View>
        )}
        {isError && (
          <Pressable
            onPress={() => refetch()}
            accessibilityRole="button"
            accessibilityLabel={translate('learn.hub.study_collections_error')}
            className="rounded-2xl border-2 border-rose-100 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/40"
          >
            <Text className="text-center font-nunito font-bold text-rose-700 dark:text-rose-300">
              {translate('learn.hub.study_collections_error')}
            </Text>
          </Pressable>
        )}
        {collections?.map(collection => (
          <Pressable
            key={collection.id}
            onPress={() => openCollection(collection.id, collection.name)}
            android_ripple={{ color: 'transparent' }}
            className="flex-row items-center rounded-2xl border-2 border-b-4 border-neutral-200 border-b-neutral-300 bg-white p-4 active:translate-y-px active:border-b-2 dark:border-[#46505C] dark:border-b-[#667382] dark:bg-[#22252B]"
          >
            <View className="mr-3 size-12 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/50">
              <FolderIcon width={22} height={22} color="#16A34A" />
            </View>
            <View className="flex-1">
              <Text
                className="font-nunito text-base font-black text-mascot-navy dark:text-white"
                numberOfLines={1}
              >
                {collection.name}
              </Text>
              {collection.translation ? (
                <Text
                  className="mt-0.5 font-inter text-xs text-neutral-500 dark:text-neutral-400"
                  numberOfLines={1}
                >
                  {collection.translation}
                </Text>
              ) : null}
            </View>
            <ChevronRightIcon width={18} height={18} color="#9CA3AF" />
          </Pressable>
        ))}
        {!isLoading && !isError && collections?.length === 0 && (
          <View className="items-center py-10">
            <FolderIcon width={28} height={28} color="#9CA3AF" />
            <Text className="mt-3 text-center font-inter text-neutral-500 dark:text-neutral-400">
              {translate('learn.hub.study_no_collections')}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
