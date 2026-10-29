import type { XpEvent, XpSourceType } from '../types';
import * as React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import { BookIcon, BoxIcon, StarIcon, TrophyIcon, ZapIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';

export type RecentXpEventsListProps = {
  events: XpEvent[];
};

function getSourceInfo(sourceType: XpSourceType): {
  title: string;
  icon: (color: string) => React.ReactNode;
  bgColor: string;
  iconColor: string;
} {
  switch (sourceType) {
    case 'QUIZ':
      return {
        title: translate('progressUx.xpSourceQuiz'),
        icon: color => <TrophyIcon color={color} width={16} height={16} />,
        bgColor: 'bg-blue-50 dark:bg-blue-950/40',
        iconColor: '#3B82F6',
      };
    case 'FLASHCARD_REVIEW':
      return {
        title: translate('progressUx.xpSourceReview'),
        icon: color => <BookIcon color={color} width={16} height={16} />,
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
        iconColor: '#10B981',
      };
    case 'SAVE_WORD':
      return {
        title: translate('progressUx.xpSourceSaveWord'),
        icon: color => <BookIcon color={color} width={16} height={16} />,
        bgColor: 'bg-sky-50 dark:bg-sky-950/40',
        iconColor: '#0EA5E9',
      };
    case 'MISSION_REWARD':
      return {
        title: translate('progressUx.xpSourceMission'),
        icon: color => <StarIcon color={color} width={16} height={16} />,
        bgColor: 'bg-amber-50 dark:bg-amber-950/40',
        iconColor: '#F59E0B',
      };
    case 'DAILY_CHEST':
    case 'WEEKLY_CHEST':
      return {
        title: translate(sourceType === 'DAILY_CHEST' ? 'progressUx.xpSourceDailyChest' : 'progressUx.xpSourceWeeklyChest'),
        icon: color => <BoxIcon color={color} width={16} height={16} />,
        bgColor: 'bg-orange-50 dark:bg-orange-950/40',
        iconColor: '#F97316',
      };
    case 'ADMIN_ADJUSTMENT':
      return {
        title: translate('progressUx.xpSourceAdjustment'),
        icon: color => <ZapIcon color={color} width={16} height={16} />,
        bgColor: 'bg-neutral-100 dark:bg-neutral-800',
        iconColor: '#64748B',
      };
    default:
      // A source added on the backend before this client knows it.
      return {
        title: translate('progressUx.xpSourceGeneric'),
        icon: color => <ZapIcon color={color} width={16} height={16} />,
        bgColor: 'bg-primary-50 dark:bg-primary-500/15',
        iconColor: '#58CC02',
      };
  }
}

// Elapsed time, not calendar days: 25h ago can be two calendar days back, so never say "Hôm qua".
function formatRelativeTime(dateStr: string): string {
  const time = new Date(dateStr).getTime();
  if (Number.isNaN(time))
    return dateStr;
  const diffMs = Date.now() - time;
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1)
    return translate('progressUx.justNow');
  if (diffMinutes < 60)
    return translate('progressUx.minutesAgo', { count: diffMinutes });
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24)
    return translate('progressUx.hoursAgo', { count: diffHours });
  return translate('progressUx.daysAgo', { count: Math.floor(diffHours / 24) });
}

export function RecentXpEventsList({ events }: RecentXpEventsListProps) {
  if (!events || events.length === 0) {
    return (
      <View className="mb-4 rounded-3xl border border-line bg-surface p-5 shadow-sm">
        <Text className="font-nunito text-xs font-black tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
          {translate('progressUx.recentXpTitle')}
        </Text>
        <View className="mt-4 items-center justify-center py-6">
          <Text className="font-inter text-[13px] text-neutral-500">
            {translate('progressUx.recentXpEmpty')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="mb-4 rounded-3xl border border-line bg-surface p-5 shadow-sm">
      <Text className="font-nunito text-xs font-black tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
        {translate('progressUx.recentXpTitle')}
      </Text>

      <View className="mt-3 divide-y divide-line">
        {events.map((evt, idx) => {
          const info = getSourceInfo(evt.sourceType);

          return (
            <View key={`${evt.createdAt}-${idx}`} className="flex-row items-center justify-between py-3">
              <View className="mr-2 flex-1 flex-row items-center gap-3">
                <View className={`size-9 items-center justify-center rounded-xl ${info.bgColor}`}>
                  {info.icon(info.iconColor)}
                </View>

                <View className="flex-1">
                  <Text className="font-nunito text-sm font-bold text-neutral-800 dark:text-neutral-100">
                    {info.title}
                  </Text>
                  <Text className="font-inter text-[11px] text-neutral-500 dark:text-neutral-400">
                    {formatRelativeTime(evt.createdAt)}
                  </Text>
                </View>
              </View>

              <View className="shrink-0 rounded-full bg-info-50 px-2.5 py-1 dark:bg-info-700/30">
                <Text className="font-nunito text-xs font-black text-info-800 dark:text-info-400">
                  +
                  {evt.amount.toLocaleString()}
                  {' '}
                  XP
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
