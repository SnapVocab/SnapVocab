import type { BadgeItem, BadgeSeries, BadgeVisualState } from '../types';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { AchievementArtifact, AchievementGlow } from '@/components/snapvocab';
import { Text } from '@/components/ui';
import { CheckIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';
import { amount, seriesTitle, slotLabel } from '../copy';
import { plankFill, shownProgress, visualState } from '../model';
import { useReduceMotion } from '../use-reduce-motion';

const SLOT_WIDTH = 104;
const PILL_SPACE = 16;

type Props = {
  series: BadgeSeries;
  /** Full list, for the "milestone i of n" screen-reader text. */
  seriesList: BadgeSeries[];
  /** `full` on the Achievements screen; `mini` (40px, thresholds only, not interactive) inside the detail sheet. */
  size?: 'full' | 'mini';
  focusedId?: number;
  /** Ids presented as new in this visit: "Mới" pill and a fading halo. */
  newIds?: number[];
  /** Offline: a reached-but-unrecorded badge says "Eligible" instead of "Recording". */
  stale?: boolean;
  onSelect?: (item: BadgeItem) => void;
};

/** A series shown as medals standing on one shelf; the gold inlay is the only progress mark (achievements_ui.md §4). */
export function AchievementShelf({ series, seriesList, size = 'full', focusedId, newIds = [], stale = false, onSelect }: Props) {
  const mini = size === 'mini';
  const n = series.items.length;
  const scroll = n > 3;
  const earned = series.items.filter(i => i.earned).length;
  const medal = mini ? 40 : 64;
  // Plaque bottom overlaps the shelf top by ~6px; mini medals have no plaque.
  const plankTop = mini ? 32 : PILL_SPACE + 57;

  const slots = series.items.map((item, index) => (
    <Slot
      key={item.id}
      item={item}
      state={visualState(series, index)}
      label={slotLabel(item, seriesList)}
      medal={medal}
      mini={mini}
      focused={item.id === focusedId}
      isNew={newIds.includes(item.id)}
      stale={stale}
      width={scroll ? SLOT_WIDTH : undefined}
      onPress={onSelect ? () => onSelect(item) : undefined}
    />
  ));
  const plank = <Plank top={plankTop} fill={plankFill(series)} half={n === 1} mini={mini} width={scroll ? n * SLOT_WIDTH - 8 : undefined} />;

  return (
    <View className={mini ? '' : 'mb-[30px]'} accessibilityElementsHidden={mini} importantForAccessibility={mini ? 'no-hide-descendants' : 'auto'}>
      {!mini && (
        <View className="mb-2.5 flex-row flex-wrap items-baseline justify-between gap-x-2">
          <Text accessibilityRole="header" className="font-nunito text-[16px] leading-[22px] font-extrabold text-mascot-navy dark:text-white">
            {seriesTitle(series.metric)}
          </Text>
          {earned === n
            ? (
                <View className="flex-row items-center gap-1">
                  <CheckIcon width={14} height={14} color="#8A5A00" />
                  <Text className="font-inter text-[14px] font-semibold text-[#8A5A00] dark:text-reward-300">{translate('badges.series_done')}</Text>
                </View>
              )
            : <Text className="font-inter text-[14px] font-semibold text-neutral-500 dark:text-neutral-300">{translate('badges.series_progress', { earned, total: n })}</Text>}
        </View>
      )}
      {scroll
        ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={SLOT_WIDTH} decelerationRate="fast">
              <View className="relative flex-row">
                {plank}
                {slots}
              </View>
            </ScrollView>
          )
        : (
            <View className={`relative flex-row ${n === 1 ? 'justify-center' : ''}`}>
              {plank}
              {slots}
            </View>
          )}
    </View>
  );
}

function Plank({ top, fill, half, mini, width }: { top: number; fill: number; half: boolean; mini: boolean; width?: number }) {
  const reduce = useReduceMotion();
  const progress = useSharedValue(reduce ? fill : 0);
  React.useEffect(() => {
    progress.value = reduce ? fill : withTiming(fill, { duration: 480 });
  }, [fill, reduce, progress]);
  const inlay = useAnimatedStyle(() => ({ width: `${Math.max(0, Math.min(1, progress.value)) * 100}%` }));
  return (
    <View
      pointerEvents="none"
      className={`absolute rounded-full border-b-[3px] border-[#CDD5E0] bg-[#E3E8EF] dark:border-[#1A1C30] dark:bg-[#23263F] ${mini ? 'h-[10px]' : 'h-[13px] border-b-4'}`}
      style={{ top, left: half ? '25%' : 4, right: half ? '25%' : width ? undefined : 4, width }}
    >
      <View className="absolute inset-x-1.5 top-[3px] h-[5px]">
        <Animated.View className="h-full rounded-full border-[1.5px] border-[#A87400] bg-reward-500" style={inlay} />
      </View>
    </View>
  );
}

type SlotProps = {
  item: BadgeItem;
  state: BadgeVisualState;
  label: string;
  medal: number;
  mini: boolean;
  focused: boolean;
  isNew: boolean;
  stale: boolean;
  width?: number;
  onPress?: () => void;
};

function Slot({ item, state, label, medal, mini, focused, isNew, stale, width, onPress }: SlotProps) {
  const sub = state === 'earned'
    ? `✓ ${amount(item.threshold, item.metric)}`
    : state === 'recording'
      ? translate(stale ? 'badges.eligible' : 'badges.recording')
      : state === 'next'
        ? `${shownProgress(item)}/${amount(item.threshold, item.metric)}`
        : amount(item.threshold, item.metric);
  const subTone = state === 'next' ? 'font-bold text-[#8A5A00] dark:text-[#FFDA6B]' : 'text-neutral-500 dark:text-neutral-300';

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={label}
      className="items-center px-0.5 active:scale-[0.96] active:opacity-90"
      style={width ? { width } : { flex: 1, maxWidth: '50%' }}
    >
      {!mini && (isNew
        ? (
            <View className="z-10 h-4 flex-row items-center rounded-full border-[1.5px] border-[#E5A500] bg-[#FFF1C2] px-[7px]">
              <Text className="font-nunito text-[11.5px] font-extrabold text-[#8A5A00]">{translate('badges.new_pill')}</Text>
            </View>
          )
        : <View className="h-4" />)}
      <NewMedal isNew={isNew} size={medal}>
        <AchievementArtifact metric={item.metric} iconKey={item.iconKey} threshold={mini ? null : item.threshold} state={state} size={medal} focused={focused} />
      </NewMedal>
      {mini
        ? <Text className={`mt-2 font-inter text-[14px] ${focused ? 'font-extrabold text-mascot-navy dark:text-white' : 'font-semibold text-neutral-500 dark:text-neutral-300'}`}>{item.threshold}</Text>
        : (
            <View className="mt-4 items-center gap-0.5">
              <Text className={`text-center font-nunito text-[14px] leading-[18px] font-bold ${item.earned ? 'text-mascot-navy dark:text-white' : 'text-[#3F4A5E] dark:text-neutral-200'}`}>{item.name}</Text>
              <Text className={`text-center font-inter text-[14px] leading-[18px] font-semibold ${subTone}`}>{sub}</Text>
            </View>
          )}
    </Pressable>
  );
}

/** Recognition motion for a newly presented medal: spring 0.85 → 1 and a 2s halo (reduced: static halo, 600ms). */
export function NewMedal({ isNew, size, children }: { isNew: boolean; size: number; children: React.ReactNode }) {
  const reduce = useReduceMotion();
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);
  React.useEffect(() => {
    if (!isNew)
      return;
    glow.value = 1;
    if (reduce) {
      glow.value = withTiming(0, { duration: 600 });
      return;
    }
    scale.value = 0.85;
    scale.value = withSpring(1, { damping: 12, stiffness: 140 });
    glow.value = withTiming(0, { duration: 2000 });
  }, [isNew, reduce, scale, glow]);
  const medalStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  const halo = Math.round(size * 1.5);
  return (
    <View className="items-center justify-center">
      {isNew && (
        <Animated.View pointerEvents="none" className="absolute" style={[{ width: halo, height: halo }, glowStyle]}>
          <AchievementGlow size={halo} />
        </Animated.View>
      )}
      <Animated.View style={medalStyle}>{children}</Animated.View>
    </View>
  );
}
