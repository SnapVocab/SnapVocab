import type { DailyMission } from '../types';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { CheckIcon, ChevronRightIcon, ClockIcon } from '@/components/ui/icons';
import { useColorMode } from '@/components/ui/surface';
import { translate } from '@/lib/i18n';
import { categoryVisual, formatShortDuration } from '../model';

type VictoryLedgerProps = {
  missions: DailyMission[];
  minutesLeft: number;
  onContinueLearning: () => void;
};

export function VictoryLedger({ missions, minutesLeft, onContinueLearning }: VictoryLedgerProps) {
  const isDark = useColorMode() === 'dark';
  const sortedBySlot = React.useMemo(
    () => missions.slice().sort((a, b) => a.slot - b.slot),
    [missions],
  );

  return (
    <View testID="missions-victory-ledger" className="gap-3 px-3.5 pt-3.5 pb-10">
      <View className="flex-row items-center justify-between px-1">
        <Text
          tx="missions.victory_ledger_title"
          className="font-nunito text-[11.5px] font-black tracking-wider text-neutral-500 uppercase dark:text-neutral-300"
        />
        <Text
          tx="missions.victory_ledger_done"
          className="font-nunito text-[11.5px] font-black tracking-wider text-primary-800 uppercase dark:text-primary-300"
        />
      </View>

      <View className="overflow-hidden rounded-[18px] border-[1.5px] border-line bg-surface">
        {sortedBySlot.map((mission, idx) => {
          const visual = categoryVisual(mission.category);
          const isLast = idx === sortedBySlot.length - 1;
          return (
            <View
              key={mission.id}
              className={`flex-row items-center gap-2.5 px-3.5 py-2.5 ${isLast ? '' : 'border-b border-line'}`}
            >
              <View className="size-6 items-center justify-center rounded-full bg-primary-100 dark:bg-[#2F4424]">
                <CheckIcon width={13} height={13} color={isDark ? '#A0E063' : '#2F6E00'} />
              </View>
              <View className="flex-1">
                <Text numberOfLines={1} className="font-nunito text-[13.5px] font-extrabold text-mascot-navy dark:text-white">
                  {mission.name}
                </Text>
                <Text className="mt-0.5 font-inter text-[11px] text-neutral-400 dark:text-neutral-400">
                  {`${translate(visual.labelKey)} · ${mission.targetValue}/${mission.targetValue}`}
                </Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                {mission.reward.coin > 0 && (
                  <Text className="font-nunito text-[12px] font-extrabold text-[#8A6100] dark:text-warning-300">
                    {`+${mission.reward.coin} Coin`}
                  </Text>
                )}
                {mission.reward.coin > 0 && mission.reward.xp > 0 && (
                  <Text className="font-inter text-[11px] text-neutral-300 dark:text-neutral-600">·</Text>
                )}
                {mission.reward.xp > 0 && (
                  <Text className="font-nunito text-[12px] font-extrabold text-[#1D4ED8] dark:text-[#93C5FD]">
                    {`+${mission.reward.xp} XP`}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Grounded next-day countdown & optional non-pushy continuation */}
      <View className="gap-2.5 rounded-[18px] border-[1.5px] border-line bg-surface p-3.5">
        <View className="flex-row items-center gap-2.5">
          <View className="size-[34px] items-center justify-center rounded-[11px] bg-surface-raised">
            <ClockIcon width={17} height={17} color={isDark ? '#AEB4BE' : '#5E627E'} />
          </View>
          <View className="flex-1">
            <Text tx="missions.next_day_title" className="font-nunito text-[13.5px] font-black text-mascot-navy dark:text-white" />
            <Text className="mt-0.5 font-inter text-[12px] text-neutral-500 dark:text-neutral-300">
              {translate('missions.next_day_sub', { time: formatShortDuration(minutesLeft) })}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between border-t border-line pt-2.5">
          <Text tx="missions.next_day_prompt" className="font-inter text-[12px] text-neutral-500 dark:text-neutral-300" />
          <Pressable
            accessibilityRole="button"
            onPress={onContinueLearning}
            hitSlop={8}
            className="min-h-9 flex-row items-center gap-0.5 pl-2 active:opacity-60"
          >
            <Text tx="missions.next_day_cta" className="font-nunito text-[12.5px] font-black text-primary-800 dark:text-primary-300" />
            <ChevronRightIcon width={14} height={14} color={isDark ? '#A0E063' : '#2F6E00'} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
