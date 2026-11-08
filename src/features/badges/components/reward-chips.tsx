import type { BadgeReward, BadgeRewardItem } from '../types';
import type { TxKeyPath } from '@/lib/i18n';
import * as React from 'react';
import { View } from 'react-native';
import { Coin3D, XPOrb3D } from '@/components/snapvocab';
import { Text } from '@/components/ui';
import { translate } from '@/lib/i18n';

const FRAME_LABEL: Record<string, TxKeyPath> = {
  AVATAR_FRAME: 'badges.reward.frame_avatar',
  CARD_FRAME: 'badges.reward.frame_card',
};

export function frameLabel(item: BadgeRewardItem): string {
  return translate(FRAME_LABEL[item.type] ?? 'badges.reward.frame_other');
}

/** "+20 Coin · +50 XP · Khung Lửa"; null when the badge pays nothing (PD-BDG-14). */
export function rewardText(reward: BadgeReward | null | undefined): string | null {
  if (!reward)
    return null;
  const parts = [
    reward.coin > 0 && translate('badges.reward.coin', { count: reward.coin }),
    reward.xp > 0 && translate('badges.reward.xp', { count: reward.xp }),
    reward.item?.name,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
}

const SIZES = {
  sm: { chip: 'rounded-md px-1.5 py-0.5', text: 'text-[10px] font-bold', icon: 'xs' as const, gap: 'gap-1.5' },
  md: { chip: 'rounded-xl px-2.5 py-1', text: 'text-[13px] font-extrabold', icon: 'xs' as const, gap: 'gap-2' },
};

/** The prototype's reward chips (Coin, XP, frame). Renders nothing without a reward. */
export function RewardChips({ reward, size = 'sm' }: { reward: BadgeReward | null | undefined; size?: keyof typeof SIZES }) {
  const s = SIZES[size];
  if (!rewardText(reward) || !reward)
    return null;
  return (
    <View accessible accessibilityLabel={translate('badges.reward.a11y', { rewards: rewardText(reward) })} className={`flex-row flex-wrap items-center justify-center ${s.gap}`}>
      {reward.coin > 0 && (
        <View className={`flex-row items-center border border-reward-200 bg-reward-50 dark:border-reward-500/40 dark:bg-reward-500/15 ${s.chip}`}>
          <Coin3D size={s.icon} style={{ marginRight: 2 }} />
          <Text className={`font-nunito text-reward-700 dark:text-reward-300 ${s.text}`}>{`+${reward.coin}`}</Text>
        </View>
      )}
      {reward.xp > 0 && (
        <View className={`flex-row items-center border border-info-200 bg-info-50 dark:border-info-500/40 dark:bg-info-500/15 ${s.chip}`}>
          <XPOrb3D size={s.icon} style={{ marginRight: 2 }} />
          <Text className={`font-nunito text-info-700 dark:text-info-300 ${s.text}`}>{`+${reward.xp}`}</Text>
        </View>
      )}
      {reward.item && (
        <View className={`border border-purple-200 bg-purple-50 dark:border-purple-500/40 dark:bg-purple-500/15 ${s.chip}`}>
          <Text className={`font-nunito text-purple-700 dark:text-purple-300 ${s.text}`}>{frameLabel(reward.item)}</Text>
        </View>
      )}
    </View>
  );
}
