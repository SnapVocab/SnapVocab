import type { LeaderboardMe, LeaderboardRow, LeaderboardWeek } from '../types';
import * as React from 'react';
import { useWindowDimensions, View } from 'react-native';
import { AvatarFrame } from '@/components/snapvocab';
import { Text } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { formatXp, trendOf } from '../model';

/** Frame art is optional decoration: a frame that fails to load is dropped, the row stays (§2.2). */
function RowAvatar({ row, name }: { row: LeaderboardRow; name: string }) {
  const [avatarFailed, setAvatarFailed] = React.useState(false);
  const [frameFailed, setFrameFailed] = React.useState(false);
  const avatarUri = avatarFailed ? null : row.avatarUrl;
  return (
    <AvatarFrame
      size={40}
      avatarUri={avatarUri}
      frameUrl={frameFailed ? null : row.avatarFrameUrl}
      onFrameError={() => setFrameFailed(true)}
      onAvatarError={() => setAvatarFailed(true)}
    >
      {!avatarUri && (
        <View className="size-full items-center justify-center bg-neutral-50 dark:bg-neutral-800">
          <Text allowFontScaling={false} className="font-nunito text-xs font-black text-neutral-600 dark:text-neutral-200">
            {Array.from(name)[0]?.toLocaleUpperCase()}
          </Text>
        </View>
      )}
    </AvatarFrame>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const pill = rank === 1
    ? 'border border-amber-300/80 bg-amber-100 dark:border-amber-400/40 dark:bg-amber-400/20'
    : rank === 2
      ? 'border border-slate-300/80 bg-slate-100 dark:border-slate-400/35 dark:bg-slate-400/20'
      : rank === 3
        ? 'border border-orange-300/80 bg-orange-100 dark:border-orange-400/35 dark:bg-orange-400/20'
        : '';
  const tone = rank === 1
    ? 'text-xl font-black text-amber-800 dark:text-amber-200'
    : rank === 2
      ? 'text-xl font-black text-slate-700 dark:text-slate-200'
      : rank === 3
        ? 'text-xl font-black text-orange-800 dark:text-orange-200'
        : `${rank >= 100 ? 'text-sm' : 'text-base'} font-extrabold text-neutral-500 dark:text-neutral-300`;
  return (
    <View className={`h-9 w-11 shrink-0 items-center justify-center rounded-xl px-1 ${pill}`}>
      <Text className={`font-nunito tabular-nums ${tone}`}>
        {rank}
      </Text>
    </View>
  );
}

const TREND_TONE = {
  up: 'text-primary-800 dark:text-primary-300',
  down: 'text-neutral-500 dark:text-neutral-300',
  flat: 'text-neutral-500 dark:text-neutral-300',
} as const;

function TrendMark({ rankChange }: { rankChange: number | null }) {
  const trend = trendOf(rankChange);
  return (
    <Text
      accessibilityLabel={translate(trend.a11yKey, { count: trend.amount ?? 0 })}
      className={`font-inter text-xs font-bold tabular-nums ${TREND_TONE[trend.tone]}`}
    >
      {trend.amount === null ? trend.symbol : `${trend.symbol} ${trend.amount}`}
    </Text>
  );
}

function XpAndTrend({ score, rankChange, week, stacked }: { score: number; rankChange: number | null; week: LeaderboardWeek; stacked: boolean }) {
  return (
    <View className={stacked ? 'items-start pl-12' : 'items-end'}>
      <Text className="font-nunito text-base font-black text-neutral-700 tabular-nums dark:text-reward-300">
        {translate('leaderboard.xp', { xp: formatXp(score) })}
      </Text>
      {week === 'CURRENT' && <TrendMark rankChange={rankChange} />}
    </View>
  );
}

export function useStackedLeaderboardRow() {
  const { fontScale, width } = useWindowDimensions();
  return fontScale > 1.2 || width < 340;
}

function RankingRow({ rank, name, score, rankChange, week, mine, gap, last, stacked, children }: {
  rank: number;
  name: string;
  score: number;
  rankChange: number | null;
  week: LeaderboardWeek;
  mine: boolean;
  gap?: string;
  last?: boolean;
  stacked: boolean;
  children: React.ReactNode;
}) {
  const trend = week === 'CURRENT' ? trendOf(rankChange) : null;
  const a11yParts = [
    `#${rank}`,
    name,
    mine && name !== translate('leaderboard.me') ? translate('leaderboard.me') : null,
    translate('leaderboard.xp', { xp: formatXp(score) }),
    trend ? translate(trend.a11yKey, { count: trend.amount ?? 0 }) : null,
    gap ?? null,
  ].filter(Boolean);

  return (
    <View
      accessible
      accessibilityLabel={a11yParts.join(', ')}
      className={`min-h-16 justify-center px-4 py-3 ${last ? '' : 'border-b border-line'} ${mine ? 'bg-primary-50 dark:bg-primary-500/15' : 'bg-surface'}`}
    >
      {mine && <View pointerEvents="none" className="absolute inset-y-0 left-0 w-[3px] bg-primary-500" />}
      <View className={stacked ? 'gap-1' : 'flex-row items-center gap-2.5'}>
        <View className={`min-w-0 flex-row items-center gap-2.5 ${stacked ? '' : 'flex-1'}`}>
          <RankBadge rank={rank} />
          {children}
        </View>
        <XpAndTrend score={score} rankChange={rankChange} week={week} stacked={stacked} />
      </View>
      {gap && (
        <Text className="mt-1 pl-[54px] font-inter text-[13px] font-semibold text-primary-800 dark:text-primary-300">
          {gap}
        </Text>
      )}
    </View>
  );
}

/** One leaderboard line (design.md §10.4): rank, framed avatar, name, weekly XP over the trend. */
export function LeaderboardRowView({ row, week, gap }: { row: LeaderboardRow; week: LeaderboardWeek; gap?: string }) {
  const stacked = useStackedLeaderboardRow();
  const name = row.displayName.trim() || translate('leaderboard.learner');
  return (
    <RankingRow rank={row.rank} name={name} score={row.score} rankChange={row.rankChange} week={week} mine={row.isMe} gap={gap} stacked={stacked}>
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <RowAvatar key={JSON.stringify([row.avatarUrl, row.avatarFrameUrl])} row={row} name={name} />
      </View>
      <View className="min-w-0 flex-1">
        <Text numberOfLines={stacked ? undefined : 1} className="font-inter text-[15px] font-semibold text-mascot-navy dark:text-white">
          {name}
        </Text>
        {row.isMe && (
          <Text className="font-inter text-xs font-bold text-primary-800 dark:text-primary-300">{translate('leaderboard.me')}</Text>
        )}
      </View>
    </RankingRow>
  );
}

/** "You" from `me` when the caller is ranked but not among the loaded rows (`me` carries no name or avatar). */
export function MeRowView({ me, week, gap, last }: { me: LeaderboardMe; week: LeaderboardWeek; gap?: string; last?: boolean }) {
  const stacked = useStackedLeaderboardRow();
  if (me.rank === null)
    return null;
  const meLabel = translate('leaderboard.me');
  return (
    <RankingRow rank={me.rank} name={meLabel} score={me.score} rankChange={me.rankChange} week={week} mine gap={gap} last={last} stacked={stacked}>
      <Text className="min-w-0 flex-1 font-inter text-[15px] font-bold text-mascot-navy dark:text-white">{meLabel}</Text>
    </RankingRow>
  );
}

export function SkeletonRows({ count }: { count: number }) {
  return (
    <View accessibilityLabel={translate('leaderboard.loading')}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} className="min-h-16 flex-row items-center gap-3 border-b border-line px-4 py-3">
          <View className="size-8 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
          <View className="size-10 rounded-full bg-neutral-100 dark:bg-neutral-800" />
          <View className="h-4 flex-1 rounded-sm bg-neutral-100 dark:bg-neutral-800" />
        </View>
      ))}
    </View>
  );
}
