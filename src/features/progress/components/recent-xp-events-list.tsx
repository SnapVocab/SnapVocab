import type { XpEvent, XpSourceType } from '../types';
import * as React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import { BookIcon, BoxIcon, StarIcon, TrophyIcon, ZapIcon } from '@/components/ui/icons';

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
        title: 'Hoàn thành bài Quiz',
        icon: color => <TrophyIcon color={color} width={16} height={16} />,
        bgColor: 'bg-blue-50 dark:bg-blue-950/40',
        iconColor: '#3B82F6',
      };
    case 'FLASHCARD_REVIEW':
      return {
        title: 'Ôn tập thẻ từ vựng (SRS)',
        icon: color => <BookIcon color={color} width={16} height={16} />,
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
        iconColor: '#10B981',
      };
    case 'SAVE_WORD':
      return {
        title: 'Lưu từ vựng mới',
        icon: color => <BookIcon color={color} width={16} height={16} />,
        bgColor: 'bg-sky-50 dark:bg-sky-950/40',
        iconColor: '#0EA5E9',
      };
    case 'MISSION_REWARD':
      return {
        title: 'Thưởng nhiệm vụ',
        icon: color => <StarIcon color={color} width={16} height={16} />,
        bgColor: 'bg-amber-50 dark:bg-amber-950/40',
        iconColor: '#F59E0B',
      };
    case 'DAILY_CHEST':
    case 'WEEKLY_CHEST':
      return {
        title: sourceType === 'DAILY_CHEST' ? 'Rương thưởng ngày' : 'Rương thưởng tuần',
        icon: color => <BoxIcon color={color} width={16} height={16} />,
        bgColor: 'bg-orange-50 dark:bg-orange-950/40',
        iconColor: '#F97316',
      };
    case 'ADMIN_ADJUSTMENT':
      return {
        title: 'Điều chỉnh XP',
        icon: color => <ZapIcon color={color} width={16} height={16} />,
        bgColor: 'bg-neutral-100 dark:bg-neutral-800',
        iconColor: '#64748B',
      };
    default:
      // A source added on the backend before this client knows it.
      return {
        title: 'Nhận XP',
        icon: color => <ZapIcon color={color} width={16} height={16} />,
        bgColor: 'bg-primary-50 dark:bg-primary-950/40',
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
    return 'Vừa xong';
  if (diffMinutes < 60)
    return `${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24)
    return `${diffHours} giờ trước`;
  return `${Math.floor(diffHours / 24)} ngày trước`;
}

export function RecentXpEventsList({ events }: RecentXpEventsListProps) {
  if (!events || events.length === 0) {
    return (
      <View className="mb-4 rounded-3xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <Text className="font-nunito text-xs font-black tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
          Lịch sử nhận kinh nghiệm gần đây
        </Text>
        <View className="mt-4 items-center justify-center py-6">
          <Text className="font-inter text-[13px] text-neutral-500">
            Chưa có sự kiện nhận XP nào gần đây
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="mb-4 rounded-3xl border border-neutral-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <Text className="font-nunito text-xs font-black tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
        Lịch sử nhận kinh nghiệm gần đây
      </Text>

      <View className="mt-3 divide-y divide-neutral-100 dark:divide-neutral-800">
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
                  {evt.amount.toLocaleString('vi-VN')}
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
