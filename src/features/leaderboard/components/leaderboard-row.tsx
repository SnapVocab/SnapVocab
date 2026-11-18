import type { LeaderboardMe, LeaderboardRow, LeaderboardWeek } from '../types';
import * as React from 'react';
import { useWindowDimensions, View } from 'react-native';
import { AvatarFrame } from '@/components/snapvocab';
import { Text } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { formatXp, trendOf } from '../model';

/** Frame art is optional decoration: AvatarFrame drops a frame that fails to load, the row stays (§2.2). */
function RowAvatar({ row, name }: { row: LeaderboardRow; name: string }) {
  const [avatarFailed, setAvatarFailed] = React.useState(false);
  const avatarUri = avatarFailed ? null : row.avatarUrl;
  return (
    <AvatarFrame
      size={40}
      avatarUri={avatarUri}
      frameUrl={row.avatarFrameUrl}
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
  const podium = rank <= 3;
  return (
    <View className={`min-w-10 items-center rounded-md px-1 py-0.5 ${podium ? 'bg-reward-100 dark:bg-neutral-600' : ''}`}>
      <Text
        className={`font-nunito text-2xl font-black tabular-nums ${podium ? 'text-neutral-700 dark:text-reward-300' : 'text-neutral-500 dark:text-neutral-200'}`}
      >
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

/** "Thêm N XP để lên hạng R" with the bar toward that rank (`pct` from gapProgressOf). */
export function GapLine({ gap, pct }: { gap: string; pct?: number | null }) {
  return (
    <View className="gap-1">
      <Text className="font-inter text-xs font-bold text-primary-800 dark:text-primary-300">{gap}</Text>
      {pct != null && (
        <View className="h-1 w-full overflow-hidden rounded-full bg-primary-200 dark:bg-primary-500/25">
          <View className="h-full rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
        </View>
      )}
    </View>
  );
}

function RankingRow({ rank, score, rankChange, week, mine, gap, gapProgress, stacked, children }: {
  rank: number;
  score: number;
  rankChange: number | null;
  week: LeaderboardWeek;
  mine: boolean;
  gap?: string;
  gapProgress?: number | null;
  stacked: boolean;
  children: React.ReactNode;
}) {
  return (
    <View
      accessible
      className={`min-h-14 justify-center border-b border-line px-4 py-2.5 ${mine ? 'bg-primary-50 dark:bg-primary-500/15' : 'bg-surface'}`}
    >
      {mine && <View pointerEvents="none" className="absolute inset-y-0 left-0 w-[3px] bg-primary-500" />}
      <View className={stacked ? 'gap-1' : 'flex-row items-center gap-2'}>
        <View className={`min-w-0 flex-row items-center gap-2 ${stacked ? '' : 'flex-1'}`}>
          <RankBadge rank={rank} />
          {children}
        </View>
        <XpAndTrend score={score} rankChange={rankChange} week={week} stacked={stacked} />
      </View>
      {gap && (
        <View className="mt-1.5 pl-12">
          <GapLine gap={gap} pct={gapProgress} />
        </View>
      )}
    </View>
  );
}

/** One leaderboard line (design.md §10.4): rank, framed avatar, name, weekly XP over the trend. */
export function LeaderboardRowView({ row, week, gap, gapProgress }: {
  row: LeaderboardRow;
  week: LeaderboardWeek;
  gap?: string;
  gapProgress?: number | null;
}) {
  const stacked = useStackedLeaderboardRow();
  const name = row.displayName.trim() || translate('leaderboard.learner');
  return (
    <RankingRow
      rank={row.rank}
      score={row.score}
      rankChange={row.rankChange}
      week={week}
      mine={row.isMe}
      gap={gap}
      gapProgress={gapProgress}
      stacked={stacked}
    >
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <RowAvatar key={JSON.stringify([row.avatarUrl, row.avatarFrameUrl])} row={row} name={name} />
      </View>
      <View className="min-w-0 flex-1 flex-row items-center gap-1.5">
        <Text
          numberOfLines={stacked ? undefined : 1}
          className={`shrink font-inter text-[14.5px] text-mascot-navy dark:text-white ${row.isMe ? 'font-bold' : 'font-semibold'}`}
        >
          {name}
        </Text>
        {row.isMe && (
          <View className="shrink-0 rounded-full bg-primary-500 px-1.5 py-0.5">
            <Text allowFontScaling={false} className="font-inter text-[10px] font-extrabold text-on-brand">
              {translate('leaderboard.me')}
            </Text>
          </View>
        )}
      </View>
    </RankingRow>
  );
}

/** "You" from `me` when the caller is ranked but not among the loaded rows (`me` carries no name or avatar). */
export function MeRowView({ me, week, gap, gapProgress }: {
  me: LeaderboardMe;
  week: LeaderboardWeek;
  gap?: string;
  gapProgress?: number | null;
}) {
  const stacked = useStackedLeaderboardRow();
  if (me.rank === null)
    return null;
  return (
    <RankingRow
      rank={me.rank}
      score={me.score}
      rankChange={me.rankChange}
      week={week}
      mine
      gap={gap}
      gapProgress={gapProgress}
      stacked={stacked}
    >
      <Text className="min-w-0 flex-1 font-inter text-[15px] font-bold text-mascot-navy dark:text-white">{translate('leaderboard.me')}</Text>
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
