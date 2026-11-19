import type { CategoryVisual, GrantedNotice } from '../model';
import type { DailyMission } from '../types';
import type { TxKeyPath } from '@/lib/i18n';
import * as React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { MissionIcon3D } from '@/components/snapvocab';
import { Text } from '@/components/ui';
import { CheckIcon, ChevronRightIcon } from '@/components/ui/icons';
import { RewardIcon } from '@/components/ui/rewards';
import { useColorMode } from '@/components/ui/surface';
import { translate } from '@/lib/i18n';
import { categoryVisual, formatGrantedMessage } from '../model';

type MissionCardProps = {
  mission: DailyMission;
  ended: boolean;
  compact?: boolean;
  actionTx?: TxKeyPath;
  onAction?: () => void;
  onClaim: () => void;
  claiming: boolean;
  claimDisabled: boolean;
  claimErrorTx?: TxKeyPath;
  justClaimed?: GrantedNotice;
};

type ClaimableProps = {
  mission: DailyMission;
  visual: CategoryVisual;
  compact: boolean;
  onClaim: () => void;
  claiming: boolean;
  claimDisabled: boolean;
  claimErrorTx?: TxKeyPath;
};

function ClaimableMissionCard({
  mission,
  visual,
  compact,
  onClaim,
  claiming,
  claimDisabled,
  claimErrorTx,
}: ClaimableProps) {
  return (
    <View
      testID={`mission-card-${mission.id}`}
      className="gap-2 rounded-[17px] border-2 border-b-4 border-primary-500 border-b-primary-700 bg-primary-50 px-3.5 py-3 dark:border-[#7FA35E] dark:border-b-[#557044] dark:bg-[#25331E]"
    >
      <View className="flex-row items-center gap-3">
        <MissionIcon3D type={visual.icon3d} size={compact ? 40 : 44} />
        <View className="flex-1">
          <Text className="font-nunito text-[14.5px] leading-[18px] font-black text-mascot-navy dark:text-white">
            {mission.name}
          </Text>
          <Text className="mt-0.5 font-inter text-[12px] leading-[16px] text-neutral-500 dark:text-neutral-300">
            {mission.description}
          </Text>
          <View className="mt-1.5 flex-row flex-wrap items-center gap-x-2.5 gap-y-1">
            {mission.reward.coin > 0 && (
              <View className="flex-row items-center gap-1">
                <RewardIcon type="coin" size={15} />
                <Text className={`font-nunito font-extrabold text-mascot-navy dark:text-white ${compact ? 'text-[11.5px]' : 'text-[12.5px]'}`}>
                  {`+${mission.reward.coin} Coin`}
                </Text>
              </View>
            )}
            {mission.reward.xp > 0 && (
              <View className="flex-row items-center gap-1">
                <RewardIcon type="xp" size={15} />
                <Text className={`font-nunito font-extrabold text-mascot-navy dark:text-white ${compact ? 'text-[11.5px]' : 'text-[12.5px]'}`}>
                  {`+${mission.reward.xp} XP`}
                </Text>
              </View>
            )}
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${translate('missions.claim_a11y')} — ${mission.name}`}
          accessibilityState={{ busy: claiming, disabled: claimDisabled }}
          disabled={claimDisabled}
          onPress={onClaim}
          className={`min-h-[42px] items-center justify-center rounded-[13px] border-b-4 border-b-brand-edge bg-brand active:translate-y-[2px] active:border-b-2 ${
            compact ? 'min-w-[68px] px-3' : 'min-w-[82px] px-4'
          }`}
        >
          {claiming
            ? <ActivityIndicator size="small" color="#15240A" />
            : (
                <Text
                  tx="missions.claim"
                  className={`font-nunito font-black tracking-wider text-[#15240A] uppercase dark:text-[#15240A] ${compact ? 'text-[12px]' : 'text-[13px]'}`}
                />
              )}
        </Pressable>
      </View>

      {mission.reward.itemCode && (
        <Text className="font-inter text-[12px] text-neutral-600 dark:text-neutral-300">
          {translate('missions.item', { item: mission.reward.itemName ?? mission.reward.itemCode })}
        </Text>
      )}

      {claimErrorTx && (
        <Text
          accessibilityRole="alert"
          tx={claimErrorTx}
          className="text-center font-inter text-[12px] font-semibold text-danger-600 dark:text-danger-300"
        />
      )}
    </View>
  );
}

type InProgressProps = {
  mission: DailyMission;
  visual: CategoryVisual;
  ended: boolean;
  isDark: boolean;
  actionTx?: TxKeyPath;
  onAction?: () => void;
};

function InProgressMissionCard({ mission, visual, ended, isDark, actionTx, onAction }: InProgressProps) {
  const target = Math.max(1, mission.targetValue);
  const progress = Math.min(target, Math.max(0, mission.currentProgress));
  const ratio = Math.min(1, progress / target);
  const isOneLeft = target > 1 && progress === target - 1;

  return (
    <View
      testID={`mission-card-${mission.id}`}
      className="gap-2.5 rounded-[17px] border-[1.5px] border-b-[2.5px] border-line border-b-edge bg-surface px-3.5 py-3"
    >
      <View className="flex-row items-center gap-3">
        <MissionIcon3D type={visual.icon3d} size={40} />
        <View className="flex-1">
          <Text className="font-nunito text-[14.5px] leading-[18px] font-black text-mascot-navy dark:text-white">
            {mission.name}
          </Text>
          <Text className="mt-0.5 font-inter text-[12px] leading-[16px] text-neutral-500 dark:text-neutral-300">
            {mission.description}
          </Text>
          {mission.triggerEvent === 'TOPIC_ITEM_CREATED' && (
            <Text tx="missions.add_word_hint" className="mt-1 font-inter text-[11px] leading-[15px] text-neutral-400 dark:text-neutral-400" />
          )}
        </View>
      </View>

      {target > 1 && target <= 5 && (
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={mission.name}
          accessibilityValue={{ min: 0, max: target, now: progress }}
          className="flex-row items-center gap-2"
        >
          <View className="flex-1 flex-row gap-1">
            {Array.from({ length: target }, (_, index) => {
              const filled = index < progress;
              const nextUp = isOneLeft && index === progress;
              return (
                <View
                  key={index}
                  style={filled ? { backgroundColor: visual.accent } : undefined}
                  className={`h-[7px] flex-1 rounded-full ${
                    filled
                      ? ''
                      : nextUp
                        ? 'border-[1.5px] border-dashed border-warning-500 bg-warning-500/15'
                        : 'bg-[#E8EBF3] dark:bg-[#323742]'
                  }`}
                />
              );
            })}
          </View>
          <View className="flex-row items-center gap-1">
            {isOneLeft && (
              <Text tx="missions.almost_one" className="font-nunito text-[11px] font-black text-warning-700 dark:text-warning-300" />
            )}
            <Text className="font-nunito text-[12px] font-black text-mascot-navy dark:text-neutral-200">
              {`${progress}/${target}`}
            </Text>
          </View>
        </View>
      )}

      {target > 5 && (
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={mission.name}
          accessibilityValue={{ min: 0, max: target, now: progress }}
          className="flex-row items-center gap-2"
        >
          <View className="h-[7px] flex-1 overflow-hidden rounded-full bg-[#E8EBF3] dark:bg-[#323742]">
            <View style={{ width: `${ratio * 100}%`, backgroundColor: visual.accent }} className="h-full rounded-full" />
          </View>
          <Text className="font-nunito text-[12px] font-black text-mascot-navy dark:text-neutral-200">
            {`${progress}/${target}`}
          </Text>
        </View>
      )}

      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-row items-center gap-2.5">
          {mission.reward.coin > 0 && (
            <View className="flex-row items-center gap-1">
              <RewardIcon type="coin" size={15} />
              <Text className="font-nunito text-[12.5px] font-extrabold text-mascot-navy dark:text-white">
                {mission.reward.coin}
              </Text>
            </View>
          )}
          {mission.reward.xp > 0 && (
            <View className="flex-row items-center gap-1">
              <RewardIcon type="xp" size={15} />
              <Text className="font-nunito text-[12.5px] font-extrabold text-mascot-navy dark:text-white">
                {`${mission.reward.xp} XP`}
              </Text>
            </View>
          )}
        </View>

        {!ended && actionTx && onAction
          ? (
              <Pressable
                accessibilityRole="button"
                onPress={onAction}
                hitSlop={8}
                className="min-h-10 flex-row items-center gap-0.5 pl-2 active:opacity-60"
              >
                <Text tx={actionTx} className="font-nunito text-[13px] font-black text-primary-800 dark:text-primary-300" />
                <ChevronRightIcon width={14} height={14} color={isDark ? '#A0E063' : '#2F6E00'} />
              </Pressable>
            )
          : ended
            ? (
                <View className="rounded-full bg-neutral-100 px-2.5 py-0.5 dark:bg-neutral-800">
                  <Text tx="missions.closed" className="font-nunito text-[11px] font-extrabold text-neutral-500 dark:text-neutral-300" />
                </View>
              )
            : null}
      </View>

      {mission.reward.itemCode && (
        <Text className="font-inter text-[12px] text-neutral-500 dark:text-neutral-300">
          {translate('missions.item', { item: mission.reward.itemName ?? mission.reward.itemCode })}
        </Text>
      )}
    </View>
  );
}

export function MissionCard({
  mission,
  ended,
  compact = false,
  actionTx,
  onAction,
  onClaim,
  claiming,
  claimDisabled,
  claimErrorTx,
  justClaimed,
}: MissionCardProps) {
  const isDark = useColorMode() === 'dark';
  const reducedMotion = useReducedMotion();
  const visual = categoryVisual(mission.category);

  const rewardSummaryParts = [
    mission.reward.coin > 0 && `+${mission.reward.coin} Coin`,
    mission.reward.xp > 0 && `+${mission.reward.xp} XP`,
  ].filter(Boolean).join(' · ');

  if (justClaimed) {
    return (
      <Animated.View
        testID={`mission-card-${mission.id}`}
        entering={reducedMotion ? undefined : FadeIn.duration(220)}
        className="gap-2 rounded-[17px] border-[1.5px] border-[#A7E66B] bg-primary-50 px-3.5 py-2.5 dark:border-[#557044] dark:bg-[#25331E]"
      >
        <View className="flex-row items-center gap-2.5">
          <View className="size-6 items-center justify-center rounded-full bg-primary-100 dark:bg-[#2F4424]">
            <CheckIcon width={13} height={13} color={isDark ? '#A0E063' : '#2F6E00'} />
          </View>
          <Text numberOfLines={1} className="flex-1 font-nunito text-[13.5px] font-black text-mascot-navy dark:text-white">
            {mission.name}
          </Text>
        </View>
        <View
          accessibilityRole="alert"
          className="flex-row items-center gap-2 rounded-[10px] bg-primary-100 px-2.5 py-2 dark:bg-[#2F4424]"
        >
          <CheckIcon width={13} height={13} color={isDark ? '#A0E063' : '#2F6E00'} />
          <Text className="flex-1 font-nunito text-[12px] font-black text-primary-800 dark:text-primary-300">
            {formatGrantedMessage(justClaimed)}
          </Text>
        </View>
      </Animated.View>
    );
  }

  if (mission.status === 'CLAIMED') {
    return (
      <View
        testID={`mission-card-${mission.id}`}
        className="rounded-[17px] border border-line bg-surface-raised px-3.5 py-2.5"
      >
        <View className="flex-row items-center gap-2.5">
          <View className="size-6 items-center justify-center rounded-full bg-primary-100 dark:bg-[#2F4424]">
            <CheckIcon width={13} height={13} color={isDark ? '#A0E063' : '#2F6E00'} />
          </View>
          <Text numberOfLines={1} className="flex-1 font-nunito text-[13px] font-extrabold text-neutral-500 dark:text-neutral-300">
            {mission.name}
          </Text>
          {rewardSummaryParts.length > 0 && (
            <Text className="font-nunito text-[11.5px] font-extrabold text-neutral-400 dark:text-neutral-400">
              {rewardSummaryParts}
            </Text>
          )}
        </View>
        {mission.reward.itemCode && (
          <Text className="mt-1 pl-8 font-inter text-[11.5px] text-neutral-400 dark:text-neutral-400">
            {translate('missions.item', { item: mission.reward.itemName ?? mission.reward.itemCode })}
          </Text>
        )}
      </View>
    );
  }

  if (mission.status === 'COMPLETED' && ended) {
    return (
      <View
        testID={`mission-card-${mission.id}`}
        className="rounded-[17px] border border-line bg-surface-raised px-3.5 py-3"
      >
        <View className="flex-row items-center gap-3">
          <View className="opacity-45">
            <MissionIcon3D type={visual.icon3d} size={38} />
          </View>
          <View className="flex-1">
            <Text className="font-nunito text-[14px] font-extrabold text-neutral-500 dark:text-neutral-300">
              {mission.name}
            </Text>
            <Text className="mt-0.5 font-inter text-[12px] text-neutral-400 dark:text-neutral-400">
              {mission.description}
            </Text>
          </View>
          <View className="rounded-full bg-neutral-100 px-2.5 py-1 dark:bg-neutral-800">
            <Text tx="missions.expired_badge" className="font-nunito text-[11px] font-extrabold text-neutral-500 dark:text-neutral-300" />
          </View>
        </View>
      </View>
    );
  }

  if (mission.status === 'COMPLETED') {
    return (
      <ClaimableMissionCard
        mission={mission}
        visual={visual}
        compact={compact}
        onClaim={onClaim}
        claiming={claiming}
        claimDisabled={claimDisabled}
        claimErrorTx={claimErrorTx}
      />
    );
  }

  return (
    <InProgressMissionCard
      mission={mission}
      visual={visual}
      ended={ended}
      isDark={isDark}
      actionTx={actionTx}
      onAction={onAction}
    />
  );
}
