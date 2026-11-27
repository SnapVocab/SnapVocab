import { useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, View } from 'react-native';
import { FocusAwareStatusBar, SafeAreaView, ScreenHeader, Text } from '@/components/ui';
import { LEECH_ALL_LIMIT, useLeeches } from '@/features/study/mnemonic-api';
import { translate } from '@/lib/i18n';
import { LeechWordsCard } from './components/leech-words-card';
import { SectionError } from './components/progress-primitives';

/** "Xem tất cả" from the stats card: every word the learner keeps forgetting, most forgotten first. */
export function LeechWordsScreen() {
  const router = useRouter();
  const leeches = useLeeches(LEECH_ALL_LIMIT);
  const data = leeches.data;
  const shown = data?.items.length ?? 0;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }} className="flex-1 bg-background dark:bg-neutral-950">
      <FocusAwareStatusBar />
      <ScreenHeader title={translate('mnemonic.leeches_title')} onBack={() => router.back()} />
      <ScrollView
        contentContainerClassName="gap-3 px-4 pt-2 pb-10"
        refreshControl={<RefreshControl refreshing={leeches.isRefetching} onRefresh={() => void leeches.refetch()} />}
      >
        {leeches.isLoading
          ? <View className="items-center py-10"><ActivityIndicator /></View>
          : leeches.isError || !data
            ? <SectionError onRetry={() => void leeches.refetch()} />
            : (
                <>
                  <Text className="px-1 font-inter text-[13px] text-neutral-600 dark:text-neutral-300">
                    {translate('mnemonic.leeches_count', { count: data.total ?? shown })}
                    {' · '}
                    {translate('mnemonic.remaining', { count: data.remainingToday })}
                  </Text>
                  <LeechWordsCard items={data.items} total={data.total} showAll />
                  {(data.total ?? 0) > shown && (
                    <Text className="px-1 text-center font-inter text-xs text-neutral-400">
                      {translate('mnemonic.leeches_truncated', { count: shown })}
                    </Text>
                  )}
                </>
              )}
      </ScrollView>
    </SafeAreaView>
  );
}
