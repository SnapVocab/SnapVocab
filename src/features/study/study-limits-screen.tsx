import type { LibraryStudySettings } from './api';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { Button, FocusAwareStatusBar, Mascot, Pressable, SafeAreaView, ScreenHeader, Text, View } from '@/components/ui';
import { ChevronRightIcon, FolderIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';
import { useLibraryStudySettings } from './api';

const screenStyle = { flex: 1 };

/**
 * Settings → "Giới hạn học theo bộ": every collection being studied with its daily limits, one tap from editing
 * them. It used to open the plain collection list, where the limits hid behind each card's ⋮ (UX audit #12).
 */
export function StudyLimitsScreen() {
  const router = useRouter();
  const settings = useLibraryStudySettings();

  const edit = (row: LibraryStudySettings) => router.push({
    pathname: '/collections/study-settings',
    params: { collectionId: String(row.collectionId), name: row.name },
  });

  return (
    <SafeAreaView style={screenStyle} className="flex-1 bg-background" edges={['top', 'bottom']}>
      <FocusAwareStatusBar />
      <ScreenHeader title={translate('study_limits.collection_limits')} onBack={() => router.back()} />
      <FlatList
        data={settings.data ?? []}
        keyExtractor={row => String(row.collectionId)}
        contentContainerClassName="grow gap-2.5 p-4"
        refreshControl={<RefreshControl refreshing={settings.isRefetching} onRefresh={() => void settings.refetch()} />}
        ListHeaderComponent={<Text className="mb-1 text-sm/5 text-neutral-600 dark:text-neutral-300" tx="study_limits.list_hint" />}
        ListEmptyComponent={settings.isPending
          ? <ActivityIndicator className="mt-12" />
          : settings.isError
            ? (
                <View className="gap-3 py-10">
                  <Text className="text-center text-base" tx="study_limits.load_error" />
                  <Button tx="study_limits.retry" variant="white" onPress={() => void settings.refetch()} />
                </View>
              )
            : (
                <View className="flex-1 items-center justify-center gap-3 py-10">
                  <Mascot pose="read" className="size-28" />
                  <Text className="text-center text-base text-neutral-600 dark:text-neutral-300" tx="study_limits.list_empty" />
                  <Button tx="study_limits.open_library" onPress={() => router.push('/collections')} />
                </View>
              )}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${item.name}. ${translate('study_limits.row_limits', { newCount: item.newCardsPerDay, reviewCount: item.reviewCardsPerDay })}`}
            onPress={() => edit(item)}
            testID={`study-limits-${item.collectionId}`}
            className="flex-row items-center gap-3 rounded-2xl border-2 border-b-4 border-line border-b-edge bg-surface p-3.5 active:bg-pressed"
          >
            <View className="size-10 items-center justify-center rounded-xl bg-surface-raised">
              <FolderIcon width={20} height={20} color={item.type === 'SYSTEM' ? '#0284C7' : '#65A30D'} />
            </View>
            <View className="flex-1">
              <Text numberOfLines={1} className="font-nunito text-base font-black text-mascot-navy dark:text-white">{item.name}</Text>
              <Text className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-300">
                {translate('study_limits.row_limits', { newCount: item.newCardsPerDay, reviewCount: item.reviewCardsPerDay })}
              </Text>
              <Text className="mt-0.5 text-xs font-semibold text-neutral-400" tx={item.customized ? 'study_limits.row_custom' : 'study_limits.row_default'} />
            </View>
            <ChevronRightIcon width={16} height={16} color="#94A3B8" />
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

export default StudyLimitsScreen;
