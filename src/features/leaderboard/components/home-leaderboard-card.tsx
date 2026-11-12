import { useRouter } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';
import { Button, Text } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { useLeaderboard } from '../api';
import { CachedError, EmptyBoard, LoadError, PersonalNote, updatedLabel } from '../leaderboard-screen';
import { shouldPinMe, visibleSnapshot } from '../model';
import { LeaderboardRowView, MeRowView, SkeletonRows } from './leaderboard-row';

/** Home snippet (§4): this week's top 3 plus "you" below a divider when outside them; no gap, no week switch. */
export function HomeLeaderboardCard() {
  const router = useRouter();
  const query = useLeaderboard('CURRENT', 3);
  const now = new Date();
  const data = visibleSnapshot(query, 'CURRENT', now);
  const goLearn = () => router.push('/learn');
  const updated = data && updatedLabel(data.asOf, now);

  return (
    <View className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
      <Text className="px-4 pt-4 pb-2 font-nunito text-lg font-black text-mascot-navy dark:text-white">
        {translate('leaderboard.home_title')}
      </Text>
      {!data
        ? (query.isError && !query.isFetching ? <LoadError onRetry={() => void query.refetch()} /> : <SkeletonRows count={3} />)
        : data.entries.length === 0
          ? (
              <>
                <EmptyBoard data={data} week="CURRENT" onLearn={goLearn} />
                <PersonalNote data={data} week="CURRENT" onLearn={goLearn} />
              </>
            )
          : (
              <>
                {data.entries.map((row, index) => <LeaderboardRowView key={`${index}:${row.rank}`} row={row} week="CURRENT" />)}
                {shouldPinMe(data) && (
                  <View className="border-t border-line">
                    <MeRowView me={data.me} week="CURRENT" />
                  </View>
                )}
                <PersonalNote data={data} week="CURRENT" onLearn={goLearn} />
              </>
            )}
      {data && query.isError && (
        <View className="px-4 pt-2">
          <CachedError onRetry={() => void query.refetch()} />
        </View>
      )}
      {updated && <Text className="px-4 pt-2 font-inter text-[13px] text-neutral-500 dark:text-neutral-300">{updated}</Text>}
      <View className="p-4">
        <Button tx="leaderboard.link" variant="outline" onPress={() => router.push('/leaderboard')} />
      </View>
    </View>
  );
}
