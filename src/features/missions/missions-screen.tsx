import type { Href } from 'expo-router';
import type { DailyMission, DailyMissions, MissionCategory, MissionTriggerEvent } from './types';
import type { TxKeyPath } from '@/lib/i18n';
import { randomUUID } from 'expo-crypto';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { AppState, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Button, FocusAwareStatusBar, SafeAreaView, ScreenHeader, Text } from '@/components/ui';
import { BookIcon, CameraIcon, CheckCircleIcon, ChevronRightIcon, FlameIcon, ShoppingBagIcon, SRSReviewIcon, TargetIcon } from '@/components/ui/icons';
import { RewardIcon } from '@/components/ui/rewards';
import { useColorMode } from '@/components/ui/surface';
import { translate } from '@/lib/i18n';
import { missionErrorCode, useClaimMission, useDailyMissions } from './api';

// Partial: a trigger added on the server after this build gets no CTA instead of crashing the screen.
export const actions: Partial<Record<MissionTriggerEvent, { href: Href; tx: TxKeyPath }>> = {
  // Add-word needs a topicId; the Learn tab's library → a collection → its add-word FAB supplies it.
  TOPIC_ITEM_CREATED: { href: '/learn', tx: 'missions.action.add_word' },
  QUIZ_COMPLETED: { href: '/study/quiz-setup', tx: 'missions.action.quiz' },
  // A card review is a learning activity (PD-DM-10): straight into today's session (learn_ui.md UI-LEARN-08).
  LEARNING_ACTIVITY_RECORDED: { href: '/study/session', tx: 'missions.action.study' },
  SHOP_ITEM_PURCHASED: { href: '/shop', tx: 'missions.action.shop' },
  BOOSTER_USED: { href: '/profile/inventory', tx: 'missions.action.booster' },
  SRS_REVIEW_COMPLETED: { href: '/study/session', tx: 'missions.action.srs_review' },
  SCAN_WORD_SAVED: { href: '/camera', tx: 'missions.action.scan' },
};

const missionCopy: Record<string, { name: TxKeyPath; description: TxKeyPath }> = {
  ADD_5_WORDS: { name: 'missions.catalog.add_5_words.name', description: 'missions.catalog.add_5_words.description' },
  QUIZ_SCORE_80: { name: 'missions.catalog.quiz_score_80.name', description: 'missions.catalog.quiz_score_80.description' },
  FINISH_2_SHORT_QUIZZES: { name: 'missions.catalog.finish_2_short_quizzes.name', description: 'missions.catalog.finish_2_short_quizzes.description' },
  PERFECT_MINI_QUIZ: { name: 'missions.catalog.perfect_mini_quiz.name', description: 'missions.catalog.perfect_mini_quiz.description' },
  KEEP_DAILY_STREAK: { name: 'missions.catalog.keep_daily_streak.name', description: 'missions.catalog.keep_daily_streak.description' },
  USE_XP_BOOSTER: { name: 'missions.catalog.use_xp_booster.name', description: 'missions.catalog.use_xp_booster.description' },
  BUY_SHOP_ITEM: { name: 'missions.catalog.buy_shop_item.name', description: 'missions.catalog.buy_shop_item.description' },
};

const categoryTiles: Partial<Record<MissionCategory, { Icon: typeof BookIcon; tile: string; color: string }>> = {
  SCAN: { Icon: CameraIcon, tile: 'bg-success-100 dark:bg-neutral-800', color: '#2F6E00' },
  VOCABULARY: { Icon: BookIcon, tile: 'bg-info-100 dark:bg-neutral-800', color: '#0B8FCE' },
  SRS: { Icon: SRSReviewIcon, tile: 'bg-info-100 dark:bg-neutral-800', color: '#0B8FCE' },
  QUIZ: { Icon: TargetIcon, tile: 'bg-purple-100 dark:bg-neutral-800', color: '#8253EC' },
  RETENTION: { Icon: FlameIcon, tile: 'bg-mascot-100 dark:bg-neutral-800', color: '#E57C00' },
  SHOP: { Icon: ShoppingBagIcon, tile: 'bg-reward-100 dark:bg-neutral-800', color: '#B37F00' },
};
const fallbackTile = { Icon: TargetIcon, tile: 'bg-neutral-50 dark:bg-neutral-800', color: '#565879' };

// Anchor the deadline to this response's server clock, never the device's calendar date.
function msUntilReset(data: DailyMissions, dataUpdatedAt: number) {
  return Date.parse(data.resetAt) - Date.parse(data.serverNow) - Math.max(0, Date.now() - (data.receivedAt ?? dataUpdatedAt));
}

export function MissionsScreen() {
  const query = useDailyMissions();
  const { data, dataUpdatedAt, refetch } = query;
  const claim = useClaimMission();
  const router = useRouter();
  const isDark = useColorMode() === 'dark';
  const keys = React.useRef(new Map<number, string>());
  const inFlight = React.useRef(false);
  const [, tick] = React.useReducer((n: number) => n + 1, 0);
  const [granted, setGranted] = React.useState<{ missionId: number; coin: number; xp: number; item: string | null; fallback: boolean }>();

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active')
        void refetch();
    });
    return () => subscription.remove();
  }, [refetch]);

  // Re-render once a minute so the reset countdown stays current.
  React.useEffect(() => {
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (!data)
      return;
    const timer = setTimeout(() => void refetch(), Math.max(1000, msUntilReset(data, dataUpdatedAt)));
    return () => clearTimeout(timer);
  }, [data, dataUpdatedAt, refetch]);

  async function receive(mission: DailyMission) {
    if (inFlight.current)
      return;
    inFlight.current = true;
    const key = keys.current.get(mission.id) ?? randomUUID();
    keys.current.set(mission.id, key);
    try {
      const result = await claim.mutateAsync({ missionId: mission.id, idempotencyKey: key });
      keys.current.delete(mission.id);
      const reward = result?.rewardGranted;
      if (reward) {
        setGranted({
          missionId: mission.id,
          coin: reward.coin + reward.fallbackCoin,
          xp: reward.xp,
          item: reward.itemQuantity > 0 ? reward.itemName ?? reward.itemCode : null,
          fallback: reward.fallbackCoin > 0,
        });
      }
    }
    catch {
      // Keep the original key when the response is lost, so the next tap safely retries.
    }
    finally {
      inFlight.current = false;
    }
  }

  const missions = data?.missions.slice().sort((a, b) => a.slot - b.slot) ?? [];
  const done = missions.filter(m => m.status !== 'IN_PROGRESS').length;
  const msLeft = data ? msUntilReset(data, dataUpdatedAt) : 0;
  const minutesLeft = Math.max(0, Math.ceil(msLeft / 60_000));
  // Past reset with no fresh set (refetch pending or failed): the cached day can no longer be acted on.
  const ended = !!data && msLeft <= 0;

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background dark:bg-neutral-950" edges={['top']}>
      <FocusAwareStatusBar />
      <ScreenHeader title={translate('missions.title')} onBack={() => router.back()} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 64,
          rowGap: 12,
        }}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}
      >
        <View className="gap-1">
          <Text tx="missions.subtitle" className="font-inter text-[13px] font-medium text-neutral-500 dark:text-neutral-300" />
          {data && (
            <Text className="text-sm font-semibold text-mascot-600">
              {ended ? translate('missions.ended') : translate('missions.resets_in', { hours: Math.floor(minutesLeft / 60), minutes: minutesLeft % 60 })}
            </Text>
          )}
        </View>

        {data && (
          <View className="mt-2 flex-row items-center justify-between">
            <Text tx="missions.completed_count" className="text-xs font-bold tracking-widest text-neutral-500 uppercase dark:text-neutral-300" />
            <Text className="font-nunito text-sm font-extrabold text-neutral-700 dark:text-neutral-200">{`${done}/${missions.length}`}</Text>
          </View>
        )}

        {query.isPending && Array.from({ length: 5 }, (_, i) => <View key={i} className="h-36 rounded-2xl bg-neutral-200 dark:bg-neutral-800" />)}
        {query.isError && (
          <View className="gap-2 rounded-2xl bg-surface p-4">
            <Text tx={query.data ? 'missions.cached_error' : 'missions.load_error'} />
            <Button tx="missions.retry" onPress={() => void query.refetch()} />
          </View>
        )}

        {data && missions.length === 0 && (
          <View className="items-center rounded-2xl border border-line bg-surface p-6">
            <Text className="mb-1 text-center font-nunito text-base font-extrabold text-mascot-navy dark:text-white">
              {translate('missions.empty_title')}
            </Text>
            <Text className="text-center font-inter text-sm text-neutral-500 dark:text-neutral-300">
              {translate('missions.empty_body')}
            </Text>
          </View>
        )}

        {missions.map((mission) => {
          const { Icon, tile, color } = categoryTiles[mission.category] ?? fallbackTile;
          const copy = missionCopy[mission.code];
          const action = actions[mission.triggerEvent];
          const ratio = Math.min(1, mission.currentProgress / Math.max(1, mission.targetValue));
          const claimable = mission.status === 'COMPLETED' && !ended;
          const claimed = mission.status === 'CLAIMED';
          return (
            <View
              key={mission.id}
              // Info: light border. Ready: lifted like Quiz's selected card. Claimed: muted surface only.
              className={`gap-3 rounded-2xl border-2 p-4 ${claimable
                ? 'border-b-2 border-primary-500 bg-primary-50 dark:border-[#7FA35E] dark:bg-[#2A3324]'
                : claimed
                  ? 'border-b-2 border-line border-b-edge bg-surface-raised'
                  : 'border-b-2 border-line border-b-edge bg-surface'}`}
            >
              <View className="flex-row items-start gap-3">
                <View className={`size-11 items-center justify-center rounded-xl ${tile}`}>
                  <Icon width={22} height={22} color={color} />
                </View>
                <View className="flex-1">
                  <Text className="font-nunito text-[15px] font-extrabold text-mascot-navy dark:text-white">{copy ? translate(copy.name) : mission.name}</Text>
                  <Text className="font-inter text-[13px] text-neutral-500 dark:text-neutral-300">{copy ? translate(copy.description) : mission.description}</Text>
                  {mission.triggerEvent === 'TOPIC_ITEM_CREATED' && mission.status === 'IN_PROGRESS' && (
                    <Text tx="missions.add_word_hint" className="mt-1 font-inter text-xs text-neutral-500 dark:text-neutral-300" />
                  )}
                </View>
                {mission.status === 'COMPLETED' && (
                  <View className="rounded-full bg-primary-100 px-2.5 py-1 dark:bg-primary-900">
                    <Text tx="missions.ready" className="font-nunito text-[11px] font-extrabold text-primary-800 dark:text-primary-100" />
                  </View>
                )}
              </View>

              <View className="flex-row items-center gap-3">
                <View className="h-2.5 flex-1 overflow-hidden rounded-full bg-line dark:bg-edge">
                  <View className="h-full rounded-full bg-brand" style={{ width: `${ratio * 100}%` }} />
                </View>
                {mission.status !== 'IN_PROGRESS'
                  ? <CheckCircleIcon width={18} height={18} color="#58CC02" />
                  : <Text className="font-nunito text-sm font-extrabold text-neutral-600 dark:text-neutral-300">{`${mission.currentProgress}/${mission.targetValue}`}</Text>}
              </View>

              <View className="flex-row items-center gap-3">
                {/* An item-only reward pays no Coin (expansion_plan.md §7): never show a "0". */}
                {mission.reward.coin > 0 && (
                  <View className="flex-row items-center gap-1">
                    <RewardIcon type="coin" size={18} />
                    <Text className="font-nunito text-sm font-extrabold">{mission.reward.coin}</Text>
                  </View>
                )}
                {mission.reward.xp > 0 && (
                  <View className="flex-row items-center gap-1">
                    <RewardIcon type="xp" size={18} />
                    <Text className="font-nunito text-sm font-extrabold">{`${mission.reward.xp} XP`}</Text>
                  </View>
                )}
                <View className="flex-1" />
                {claimed && <Text tx="missions.claimed" className="font-nunito text-sm font-extrabold text-primary-800 dark:text-primary-300" />}
                {mission.status === 'IN_PROGRESS' && !ended && action && (
                  <Pressable accessibilityRole="button" onPress={() => router.push(action.href)} hitSlop={8} className="min-h-11 flex-row items-center gap-0.5 active:opacity-60">
                    <Text tx={action.tx} className="font-nunito text-sm font-extrabold text-primary-800 dark:text-primary-300" />
                    <ChevronRightIcon width={16} height={16} color={isDark ? '#A0E063' : '#2F6E00'} />
                  </Pressable>
                )}
              </View>
              {/* Own row: item names may be long and must not push the CTA off the card. */}
              {mission.reward.itemCode && <Text className="text-sm text-neutral-500 dark:text-neutral-300">{translate('missions.item', { item: mission.reward.itemName ?? mission.reward.itemCode })}</Text>}

              {claimable && (
                <>
                  <Button tx="missions.claim" accessibilityLabel={`${translate('missions.claim')} — ${mission.name}`} textClassName="font-nunito" disabled={claim.isPending} loading={claim.isPending && claim.variables?.missionId === mission.id} onPress={() => void receive(mission)} />
                  <Text tx="missions.unclaimed_warning" className="text-center text-xs text-orange-700 dark:text-orange-300" />
                </>
              )}
              {claim.isError && claim.variables?.missionId === mission.id && (
                <Text accessibilityRole="alert" tx={missionErrorCode(claim.error) === 'MISSION_EXPIRED' ? 'missions.expired_error' : 'missions.claim_error'} className="text-center text-sm" />
              )}
              {granted?.missionId === mission.id && (
                <View accessibilityRole="alert" className="flex-row flex-wrap items-center justify-center gap-2 rounded-xl bg-primary-50 p-3 dark:bg-primary-500/15">
                  <CheckCircleIcon width={18} height={18} color="#58CC02" />
                  <Text className="font-nunito text-sm font-extrabold text-primary-800 dark:text-primary-300">
                    {[
                      translate('missions.granted', {
                        rewards: [
                          granted.coin > 0 && translate('missions.granted_coin', { coin: granted.coin }),
                          granted.xp > 0 && translate('missions.granted_xp', { xp: granted.xp }),
                          granted.item,
                        ].filter(Boolean).join(', '),
                      }),
                      granted.fallback && translate('missions.fallback_coin'),
                    ].filter(Boolean).join(' · ')}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
