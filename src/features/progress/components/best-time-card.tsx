import type { BestTimeDTO } from '../types';
import * as React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import { useColorMode } from '@/components/ui/surface';
import { translate } from '@/lib/i18n';
import { RatioBar } from './progress-primitives';

const SLOT_HOURS = 4;
const percent = (value: number | null) => Math.round((value ?? 0) * 100);

/**
 * "Khung giờ học nhớ lâu nhất": each 4-hour slot scored by how often its cards were still remembered at their next
 * review 12+ hours later. Until there are enough such reviews it says how many more are needed.
 */
export function BestTimeCard({ bestTime }: { bestTime: BestTimeDTO }) {
  const isDark = useColorMode() === 'dark';
  const best = bestTime.slots.find(slot => slot.startHour === bestTime.bestStartHour);

  return (
    <View className="gap-2.5 rounded-2xl border border-line bg-surface p-3.5" testID="best-time-card">
      {bestTime.enoughData && best
        ? (
            <>
              <Text className="font-nunito text-sm font-black text-neutral-900 dark:text-white">
                {translate('forecast.best_result', {
                  from: best.startHour,
                  to: best.startHour + SLOT_HOURS,
                  percent: percent(best.recallRate),
                })}
              </Text>
              <View className="gap-1.5">
                {bestTime.slots.map((slot) => {
                  const isBest = slot.startHour === bestTime.bestStartHour;
                  const label = translate('forecast.slot', { from: slot.startHour, to: slot.startHour + SLOT_HOURS });
                  return (
                    <View
                      key={slot.startHour}
                      className="flex-row items-center gap-2"
                      accessible
                      accessibilityLabel={translate('forecast.slot_a11y', {
                        from: slot.startHour,
                        to: slot.startHour + SLOT_HOURS,
                        count: slot.reviews,
                        percent: percent(slot.recallRate),
                      })}
                    >
                      <Text className={`w-14 font-inter text-[11px] ${isBest ? 'font-black text-emerald-700 dark:text-emerald-300' : 'text-neutral-500 dark:text-neutral-400'}`}>
                        {label}
                      </Text>
                      <View className="flex-1">
                        {slot.recallRate === null
                          ? <View className="h-2.5 rounded-full bg-line dark:bg-edge" />
                          : <RatioBar progress={slot.recallRate} label={label} color={isBest ? '#58CC02' : isDark ? '#4B6B3A' : '#B8E39A'} />}
                      </View>
                      <Text className="w-10 text-right font-inter text-[11px] font-bold text-neutral-700 dark:text-neutral-200">
                        {slot.recallRate === null ? '–' : `${percent(slot.recallRate)}%`}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </>
          )
        : (
            <>
              <Text className="font-inter text-[13px]/5 text-neutral-600 dark:text-neutral-300">
                {translate('forecast.best_not_enough', { pairs: Math.min(bestTime.pairs, bestTime.minPairs), min: bestTime.minPairs })}
              </Text>
              <RatioBar
                progress={bestTime.minPairs ? bestTime.pairs / bestTime.minPairs : 0}
                label={translate('forecast.best_title')}
                color="#58CC02"
              />
            </>
          )}
      <Text className="font-inter text-[11px]/4 text-neutral-500 dark:text-neutral-400">{translate('forecast.best_hint')}</Text>
    </View>
  );
}
