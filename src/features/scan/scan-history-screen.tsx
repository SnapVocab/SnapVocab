import type { ScanHistoryItem } from './api';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { Button, FocusAwareStatusBar, Mascot, Pressable, SafeAreaView, ScreenHeader, Text, View } from '@/components/ui';
import { CameraIcon, ChevronRightIcon } from '@/components/ui/icons';
import { useColorMode } from '@/components/ui/surface';
import { getLanguage, translate } from '@/lib/i18n';
import { useScanHistory } from './api';
import { scanFailureMessageKey } from './scan-errors';

const screenStyle = { flex: 1 };

function when(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime()))
    return '';
  return new Intl.DateTimeFormat(getLanguage(), { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date);
}

/**
 * "Lịch sử scan": a scan the learner stopped waiting for still finishes and is charged, so this is where they get
 * its words back (UX audit #6). A row opens the usual result screen, which polls until the scan is done.
 */
export function ScanHistoryScreen() {
  const router = useRouter();
  const history = useScanHistory();
  const items = history.data?.pages.flatMap(page => page.data) ?? [];

  return (
    <SafeAreaView style={screenStyle} className="flex-1 bg-background" edges={['top', 'bottom']}>
      <FocusAwareStatusBar />
      <ScreenHeader title={translate('scan.history.title')} onBack={() => router.back()} />
      <FlatList
        data={items}
        keyExtractor={item => item.requestId}
        contentContainerClassName="grow gap-2.5 p-4"
        refreshControl={<RefreshControl refreshing={history.isRefetching && !history.isFetchingNextPage} onRefresh={() => void history.refetch()} />}
        onEndReached={() => {
          if (history.hasNextPage && !history.isFetchingNextPage)
            void history.fetchNextPage();
        }}
        ListEmptyComponent={history.isPending
          ? <ActivityIndicator className="mt-12" />
          : history.isError
            ? (
                <View className="gap-3 py-10">
                  <Text className="text-center text-base" tx="scan.history.load_error" />
                  <Button tx="scan.history.retry" variant="white" onPress={() => void history.refetch()} />
                </View>
              )
            : (
                <View className="flex-1 items-center justify-center gap-3 py-10">
                  <Mascot pose="read" className="size-28" />
                  <Text className="text-center font-nunito text-lg font-extrabold text-mascot-navy dark:text-white" tx="scan.history.empty_title" />
                  <Text className="text-center text-sm text-neutral-600 dark:text-neutral-300" tx="scan.history.empty_body" />
                  <Button tx="scan.history.scan_now" onPress={() => router.dismissTo('/camera')} />
                </View>
              )}
        ListFooterComponent={history.isFetchingNextPage ? <ActivityIndicator className="py-4" /> : null}
        renderItem={({ item }) => (
          <HistoryRow item={item} onPress={() => router.push({ pathname: '/scan-result', params: { requestId: item.requestId } })} />
        )}
      />
    </SafeAreaView>
  );
}

function HistoryRow({ item, onPress }: { item: ScanHistoryItem; onPress: () => void }) {
  const dark = useColorMode() === 'dark';
  const done = item.status === 'DONE';
  const failed = item.status === 'FAILED';
  const summary = failed
    ? translate(scanFailureMessageKey(item.errorCode ?? 'UNKNOWN'))
    : !done
        ? translate('scan.history.in_progress')
        : item.words.length > 0
          ? item.words.join(', ')
          : translate('scan.history.no_words');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${when(item.createdAt)}. ${summary}`}
      onPress={onPress}
      testID={`scan-history-${item.requestId}`}
      className="flex-row items-center gap-3 rounded-2xl border-2 border-b-4 border-line border-b-edge bg-surface p-3 active:bg-pressed"
    >
      <View className="size-16 items-center justify-center overflow-hidden rounded-xl bg-surface-raised">
        {item.imageUrl
          ? <Image source={{ uri: item.imageUrl }} style={{ width: 64, height: 64 }} contentFit="cover" accessible={false} />
          : <CameraIcon color={dark ? '#AEB4BE' : '#73758F'} />}
      </View>
      <View className="flex-1">
        <Text className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{when(item.createdAt)}</Text>
        <Text numberOfLines={2} className={`mt-0.5 font-nunito text-base font-extrabold ${failed ? 'text-danger-600 dark:text-danger-400' : 'text-mascot-navy dark:text-white'}`}>
          {summary}
        </Text>
        {done && (item.detectionCount ?? 0) > 0 && (
          <Text className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            {translate('scan.result.found', { count: item.detectionCount ?? 0 })}
          </Text>
        )}
      </View>
      <ChevronRightIcon width={16} height={16} color="#94A3B8" />
    </Pressable>
  );
}

export default ScanHistoryScreen;
