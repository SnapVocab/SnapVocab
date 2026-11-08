import type { BadgeItem, BadgeSeries } from '../types';
import type { UnlockIntensity } from '../use-badge-session-store';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import * as React from 'react';
import { Modal, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Button, Text, useSurface } from '@/components/ui';
import { Snapy } from '@/components/ui/snapy';
import { translate } from '@/lib/i18n';
import { seriesTitle } from '../copy';
import { isSeriesFinal, milestonePosition, seriesOf } from '../model';
import { useReduceMotion } from '../use-reduce-motion';
import { BadgeImage } from './badge-image';
import { NewMedal } from './new-medal';
import { rewardText } from './reward-chips';

type Props = {
  items: BadgeItem[];
  seriesList: BadgeSeries[];
  intensity: UnlockIntensity;
  onClose: () => void;
  onViewCollection: () => void;
};

const MAX_MEDALS = 3;

/** Recognition moment (achievements_ui.md §7.1): normal, series-final, several at once, or reduced after Quiz Result. */
export function BadgeUnlockModal({ items, seriesList, intensity, onClose, onViewCollection }: Props) {
  const surface = useSurface();
  const reduce = useReduceMotion();
  const scale = useSharedValue(reduce ? 1 : 0.85);
  React.useEffect(() => {
    if (!reduce)
      scale.value = withSpring(1, { damping: 14, stiffness: 120 });
  }, [reduce, scale]);
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  React.useEffect(() => {
    // One tap of feedback per modal; unsupported devices just reject (achievements_ui.md §11, P2).
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, []);

  const first = items[0];
  if (!first)
    return null;
  const single = items.length === 1;
  const firstSeries = seriesOf(seriesList, first);
  const final = single && !!firstSeries && isSeriesFinal(first, firstSeries);
  const showSnapy = final && intensity === 'normal';
  // Series-final celebration plays once; reduced motion keeps the still Snapy (§10).
  const celebrate = showSnapy && !reduce;
  const { index, count } = milestonePosition(seriesList, first);
  // Everything this modal presents was paid in the same sync (PD-BDG-14).
  const paid = rewardText(items.reduce((sum, item) => ({
    coin: sum.coin + (item.reward?.coin ?? 0),
    xp: sum.xp + (item.reward?.xp ?? 0),
    item: sum.item ?? (item.reward?.item?.granted ? item.reward.item : null),
  }), { coin: 0, xp: 0, item: null as NonNullable<BadgeItem['reward']>['item'] }));
  const announce = single
    ? translate('badges.modal.a11y', { name: first.name, description: first.description })
    : translate('badges.modal.many_title', { count: items.length });

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View className="flex-1 items-center justify-center bg-black/60 p-5">
        <Animated.View
          accessibilityViewIsModal
          accessibilityLiveRegion="polite"
          accessibilityLabel={announce}
          style={[cardStyle, { backgroundColor: surface.surface, borderColor: surface.border }]}
          className="w-full max-w-[350px] items-center rounded-[32px] border-2 border-b-[6px] px-5 pt-5 pb-3"
        >
          {celebrate && (
            <View pointerEvents="none" className="absolute inset-x-0 -top-10 items-center">
              <LottieView testID="badge-confetti" autoPlay loop={false} style={{ width: 300, height: 300 }} source={require('@/assets/animations/confetti.json')} />
            </View>
          )}
          <View className="rounded-full border border-[#FFE7A3] bg-[#FFF6DB] px-3 py-1.5">
            <Text className="font-inter text-[14px] font-bold text-[#8A5A00] dark:text-[#8A5A00]">{translate(final ? 'badges.modal.pill_final' : 'badges.modal.pill')}</Text>
          </View>

          {single
            ? (
                <View className="mt-2 flex-row items-end">
                  <NewMedal isNew size={128}>
                    <BadgeImage item={first} size={128} />
                  </NewMedal>
                  {showSnapy && (
                    <Snapy
                      pose={celebrate ? 'jumping' : 'tu_hao'}
                      animation={celebrate ? 'celebrate' : 'none'}
                      className="-ml-3.5 h-[75px] w-[56px]"
                    />
                  )}
                </View>
              )
            : (
                <View className="mt-2 flex-row">
                  {items.slice(0, MAX_MEDALS).map(item => (
                    <NewMedal key={item.id} isNew size={80}>
                      <BadgeImage item={item} size={80} />
                    </NewMedal>
                  ))}
                </View>
              )}

          {single
            ? (
                <>
                  <Text className="mt-1 text-center font-nunito text-[22px]/7 font-extrabold" style={{ color: surface.text }}>{first.name}</Text>
                  <Text className="mt-1 text-center font-inter text-[15px] leading-[22px]" style={{ color: surface.textMuted }}>
                    {final && firstSeries ? translate('badges.modal.final_body', { series: seriesTitle(first.metric) }) : first.description}
                  </Text>
                  {!final && (
                    <Text className="mt-1 text-center font-inter text-[14px]" style={{ color: surface.textMuted }}>
                      {translate('badges.hero.position', { index, count, series: seriesTitle(first.metric) })}
                    </Text>
                  )}
                </>
              )
            : (
                <>
                  <Text className="mt-1 text-center font-nunito text-[22px]/7 font-extrabold" style={{ color: surface.text }}>
                    {translate('badges.modal.many_title', { count: items.length })}
                  </Text>
                  <View className="mt-2 w-full gap-1.5">
                    {items.slice(0, MAX_MEDALS).map(item => (
                      <View key={item.id} className="flex-row items-center justify-between gap-2">
                        <Text className="flex-1 font-nunito text-[15px] font-bold" style={{ color: surface.text }}>{item.name}</Text>
                        <Text className="font-inter text-[14px]" style={{ color: surface.textMuted }}>{seriesTitle(item.metric)}</Text>
                      </View>
                    ))}
                    {items.length > MAX_MEDALS && (
                      <Text className="font-inter text-[14px] font-semibold" style={{ color: surface.textMuted }}>
                        {translate('badges.modal.more', { count: items.length - MAX_MEDALS })}
                      </Text>
                    )}
                  </View>
                </>
              )}

          {paid && (
            <View className="mt-3 rounded-xl border border-reward-200 bg-reward-50 px-3 py-1.5 dark:border-reward-500/40 dark:bg-reward-500/15">
              <Text className="text-center font-nunito text-[14px] font-extrabold text-reward-700 dark:text-reward-300">{translate('badges.modal.reward', { rewards: paid })}</Text>
            </View>
          )}

          <View className="mt-4 w-full gap-1">
            <Button variant="primary" label={translate('badges.modal.view')} textClassName="font-nunito" onPress={onViewCollection} />
            <Button variant="ghost" label={translate('badges.modal.later')} textClassName="font-nunito" onPress={onClose} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
