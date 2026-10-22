import type { ScreenState } from '../model';
import type { BadgeItem, BadgeSeries } from '../types';
import * as React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { AchievementArtifact } from '@/components/snapvocab';
import { Text } from '@/components/ui';
import { Snapy } from '@/components/ui/snapy';
import { translate } from '@/lib/i18n';
import { ctaOf, seriesTitle, unitOf } from '../copy';
import { highestProgressRatio, metricRoute, milestonePosition } from '../model';
import { NewMedal } from './achievement-shelf';

type Props = {
  state: ScreenState;
  seriesList: BadgeSeries[];
  /** NEW: badges presented in this visit, in shelf order. */
  newItems: BadgeItem[];
  onOpen: (item: BadgeItem) => void;
  onNavigate: (route: '/study/quiz-setup' | '/collections') => void;
};

const CARD = 'mb-[26px] rounded-3xl border-[1.5px] border-b-4 border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900';

/** Top of the screen: one meaning per state, and nothing at all in NORMAL (achievements_ui.md §5). */
export function AchievementHero({ state, seriesList, newItems, onOpen, onNavigate }: Props) {
  if (state === 'RECORDING')
    return <StatusBanner tone="recording" />;
  if (state === 'NEW' && newItems.length > 0)
    return <NewHero items={newItems} seriesList={seriesList} onOpen={onOpen} />;
  if (state === 'COMPLETE') {
    const finals = seriesList.map(s => s.items[s.items.length - 1]).filter(Boolean);
    return (
      <View className={`${CARD} flex-row items-center gap-3`}>
        <Snapy pose="tu_hao" animation="none" className="h-[72px] w-[54px]" />
        <View className="flex-1 gap-1.5">
          <Text className="font-nunito text-[18px]/6 font-extrabold text-mascot-navy dark:text-white">{translate('badges.hero.complete')}</Text>
          <View className="flex-row flex-wrap">
            {finals.map(item => <AchievementArtifact key={item.id} metric={item.metric} iconKey={item.iconKey} state="earned" size={40} />)}
          </View>
        </View>
      </View>
    );
  }
  if (state === 'EMPTY') {
    const target = highestProgressRatio(seriesList);
    const route = target ? metricRoute(target.metric) : null;
    const cta = target ? ctaOf(target.metric) : null;
    return (
      <View className={`${CARD} flex-row items-center gap-3`}>
        <Snapy pose="to_mo" animation="none" className="h-[72px] w-[56px]" />
        <View className="flex-1">
          <Text className="font-nunito text-[18px]/6 font-extrabold text-mascot-navy dark:text-white">{translate('badges.hero.empty_title')}</Text>
          {target && (
            <Text className="mt-0.5 font-inter text-[14px]/5 text-neutral-500 dark:text-neutral-300">
              {translate('badges.hero.target', { name: target.name, remaining: target.threshold - target.currentValue, unit: unitOf(target.metric) })}
            </Text>
          )}
          {route && cta && (
            <Pressable accessibilityRole="link" onPress={() => onNavigate(route)} hitSlop={8} className="min-h-12 justify-center self-start active:opacity-60">
              <Text className="font-nunito text-[15px] font-extrabold text-primary-800 dark:text-primary-300">{cta}</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }
  return null;
}

function NewHero({ items, seriesList, onOpen }: { items: BadgeItem[]; seriesList: BadgeSeries[]; onOpen: (item: BadgeItem) => void }) {
  const first = items[0];
  if (items.length === 1) {
    const { index, count } = milestonePosition(seriesList, first);
    return (
      <Pressable accessibilityRole="button" onPress={() => onOpen(first)} className={`${CARD} flex-row items-center gap-3 active:opacity-90`}>
        <NewMedal isNew size={88}>
          <AchievementArtifact metric={first.metric} iconKey={first.iconKey} threshold={first.threshold} state="earned" size={88} />
        </NewMedal>
        <View className="flex-1">
          <Text className="font-inter text-[14px] font-semibold text-neutral-500 dark:text-neutral-300">{translate('badges.hero.new_label')}</Text>
          <Text className="font-nunito text-[18px]/6 font-extrabold text-mascot-navy dark:text-white">{first.name}</Text>
          <Text className="font-inter text-[14px]/5 text-neutral-500 dark:text-neutral-300">
            {translate('badges.hero.position', { index, count, series: seriesTitle(first.metric) })}
          </Text>
        </View>
      </Pressable>
    );
  }
  return (
    <View className={`${CARD} flex-row items-center gap-3`}>
      <View className="flex-row">
        {items.slice(0, 3).map((item, i) => (
          <View key={item.id} style={{ marginLeft: i === 0 ? 0 : -18 }}>
            <NewMedal isNew size={58}>
              <AchievementArtifact metric={item.metric} iconKey={item.iconKey} threshold={item.threshold} state="earned" size={58} />
            </NewMedal>
          </View>
        ))}
      </View>
      <View className="flex-1">
        <Text className="font-inter text-[14px] font-semibold text-neutral-500 dark:text-neutral-300">{translate('badges.hero.new_label')}</Text>
        <Text className="font-nunito text-[18px]/6 font-extrabold text-mascot-navy dark:text-white">{translate('badges.hero.new_many', { count: items.length })}</Text>
        <Text className="font-inter text-[14px]/5 text-neutral-500 dark:text-neutral-300">{translate('badges.hero.new_hint')}</Text>
      </View>
    </View>
  );
}

/** Thin status line used for stale data and for badges waiting to be recorded. */
export function StatusBanner({ tone }: { tone: 'stale' | 'recording' }) {
  const recording = tone === 'recording';
  return (
    <View
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
      className={`mb-3.5 min-h-10 flex-row items-center gap-2 rounded-xl px-3 py-2 ${recording ? 'bg-[#FFF6DB] dark:bg-[#3A2E0A]' : 'bg-neutral-100 dark:bg-neutral-800'}`}
    >
      {recording && <ActivityIndicator size="small" color="#A87400" />}
      <Text className={`flex-1 font-inter text-[14px]/5 ${recording ? 'text-[#7A5200] dark:text-reward-300' : 'text-neutral-600 dark:text-neutral-300'}`}>
        {translate(recording ? 'badges.recording_banner' : 'badges.stale_banner')}
      </Text>
    </View>
  );
}
