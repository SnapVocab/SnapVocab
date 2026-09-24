import type { HubState } from '../learning-state';
import * as React from 'react';
import { Text, View } from 'react-native';
import { XPOrb3D } from '@/components/ui/rewards';

export type LearningHeaderProps = {
  learned: number;
  target: number;
  xpReward: number;
  hubState: HubState;
};

export function LearningHeader({
  learned,
  target,
  xpReward,
  hubState,
}: LearningHeaderProps) {
  const progressPercent = Math.min(100, Math.round((learned / Math.max(1, target)) * 100));

  const getEncouragement = () => {
    switch (hubState) {
      case 'newUser':
        return 'Chụp lại thế giới quanh bạn để bắt đầu học từ đầu tiên!';
      case 'hasDue':
        return 'Củng cố phản xạ trước khi đường cong lãng quên tác động.';
      case 'inProgress':
        return 'Tiếp tục bài học dở để tiến gần hơn đến mục tiêu ngày.';
      case 'hasNewWords':
        return 'Khám phá và ghi nhớ những từ bạn vừa lưu gần đây.';
      case 'completed':
        return 'Xuất sắc! Bạn đã hoàn thành mục tiêu rèn luyện hôm nay.';
      default:
        return 'Củng cố phản xạ & chuyển từ vựng vào trí nhớ dài hạn.';
    }
  };

  return (
    <View className="px-5 py-3">
      {/* Header */}
      <View className="mb-2 pr-16">
        <Text className="font-nunito text-[24px] font-extrabold tracking-tight text-neutral-800 dark:text-white">
          Học tập
        </Text>
        <Text className="mt-0.5 font-inter text-[13px] leading-snug font-medium text-neutral-500 dark:text-neutral-400">
          {getEncouragement()}
        </Text>
      </View>

      {/* Daily goal progress bar */}
      {hubState !== 'newUser' && (
        <View className="mt-1">
          <View className="mb-1.5 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Text className="font-nunito text-[11px] font-extrabold tracking-wider text-neutral-400 uppercase">
                MỤC TIÊU HÔM NAY
              </Text>
              <View className="dark:bg-reward-950/40 flex-row items-center gap-1 rounded-md border border-reward-200 bg-reward-50 px-2 py-0.5 dark:border-reward-700/50">
                <XPOrb3D size={16} />
                <Text className="font-nunito text-[11px] font-extrabold text-reward-700 tabular-nums dark:text-reward-400">
                  +
                  {xpReward}
                  {' '}
                  XP
                </Text>
              </View>
            </View>
            <Text className="font-nunito text-[12px] font-bold text-neutral-600 tabular-nums dark:text-neutral-300">
              {learned}
              /
              {target}
              {' '}
              từ ·
              {progressPercent}
              %
            </Text>
          </View>
          <View className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <View
              className="h-full rounded-full bg-primary-500"
              style={{ width: `${progressPercent}%` }}
            />
          </View>
        </View>
      )}
    </View>
  );
}
