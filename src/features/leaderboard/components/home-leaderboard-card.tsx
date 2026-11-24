import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Button, Text } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { useLeaderboard } from '../api';
import { CachedError, EmptyBoard, LoadError, PersonalNote } from '../leaderboard-screen';
import { shouldPinMe, visibleSnapshot } from '../model';
import { LeaderboardRowView, MeRowView, SkeletonRows } from './leaderboard-row';

/** Home snippet (§4): this week's top 3 plus "you" below a divider when outside them; no gap, no week switch. */
export function HomeLeaderboardCard() {
  const router = useRouter();
  const query = useLeaderboard('CURRENT', 3);
  const now = new Date();
  const data = visibleSnapshot(query, 'CURRENT', now);
  const goLearn = () => router.push('/learn');

  return (
    <View className="mt-4 overflow-hidden rounded-3xl border border-line bg-surface">
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/leaderboard')}
        className="flex-row items-center justify-between gap-2 px-4 pt-4 pb-3 active:opacity-80"
      >
        <Text className="flex-1 font-nunito text-lg font-black text-mascot-navy dark:text-white">
          {translate('leaderboard.home_title')}
        </Text>
        {data?.me.rank != null && (
          <View className="rounded-full bg-primary-100 px-2.5 py-1 dark:bg-primary-500/20">
            <Text className="font-nunito text-xs font-extrabold text-primary-800 tabular-nums dark:text-primary-300">
              {`#${data.me.rank}`}
            </Text>
          </View>
        )}
      </Pressable>
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
                {data.entries.map((row, index) => (
                  <LeaderboardRowView
                    key={`${index}:${row.rank}`}
                    row={row}
                    week="CURRENT"
                    last={index === data.entries.length - 1 && !shouldPinMe(data)}
                  />
                ))}
                {shouldPinMe(data) && (
                  <View className="border-t border-line">
                    <MeRowView me={data.me} week="CURRENT" last />
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
      <View className="px-4 pt-3 pb-4">
        <Button tx="leaderboard.link" variant="outline" onPress={() => router.push('/leaderboard')} />
      </View>
    </View>
  );
}
