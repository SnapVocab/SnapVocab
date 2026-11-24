import type { Href } from 'expo-router';
import type { WalletDelta } from './components/snapy-header';
import type { GrantedNotice, MissionSummary } from './model';
import type { DailyMission, MissionTriggerEvent } from './types';
import type { StudyToday } from '@/features/study/api';
import type { TxKeyPath } from '@/lib/i18n';
import { randomUUID } from 'expo-crypto';
import { useFocusEffect, useRouter } from 'expo-router';
import * as React from 'react';
import { AccessibilityInfo, AppState, RefreshControl, ScrollView, useWindowDimensions, View } from 'react-native';
import { Button, FocusAwareStatusBar, SafeAreaView, Text } from '@/components/ui';
import { AlertTriangleIcon } from '@/components/ui/icons';
import { useColorMode } from '@/components/ui/surface';
import { useStudyToday } from '@/features/study/api';
import { EXPLORE_HREF, todayState } from '@/features/study/today-state';
import { translate } from '@/lib/i18n';
import { missionErrorCode, useClaimMission, useDailyMissions } from './api';
import { MissionCard } from './components/mission-card';
import { SnapyHeader } from './components/snapy-header';
import { SnapyStage } from './components/snapy-stage';
import { VictoryLedger } from './components/victory-ledger';
import { buildStatusSegments, formatGrantedMessage, formatShortDuration, msUntilReset, orderMissions, summarizeMissions } from './model';

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

/**
 * Today's session only helps when it has cards. An empty library starts at the ready-made sets; once today is done,
 * any learning activity still keeps the streak, so that mission falls back to a quiz.
 */
export function studyHref(trigger: MissionTriggerEvent, href: Href, today: StudyToday | undefined): Href {
  if (!today || (trigger !== 'LEARNING_ACTIVITY_RECORDED' && trigger !== 'SRS_REVIEW_COMPLETED'))
    return href;
  const { kind } = todayState(today);
  if (kind === 'empty')
    return EXPLORE_HREF;
  if (kind === 'done')
    return trigger === 'LEARNING_ACTIVITY_RECORDED' ? '/study/quiz-setup' : '/learn';
  return href;
}

// Plain colors, not classes: Uniwind does not style the third-party SafeAreaView.
const TOP_SAFE_BG = {
  default: '#1E2A44',
  victory: '#142F29',
  expired: '#2C3445',
} as const;

function MissionStatusBanner({ ended, summary, minutesLeft, isDark }: { ended: boolean; summary: MissionSummary; minutesLeft: number; isDark: boolean }) {
  if (ended) {
    return (
      <View
        accessibilityRole="alert"
        className="flex-row items-center gap-2 rounded-xl border border-line bg-surface-raised px-3 py-2.5"
      >
        <AlertTriangleIcon width={15} height={15} color={isDark ? '#AEB4BE' : '#5E627E'} />
        <Text className="flex-1 font-inter text-[12px] font-semibold text-neutral-600 dark:text-neutral-300">
          {summary.expiredUnclaimed > 0
            ? translate('missions.ended_unclaimed', { count: summary.expiredUnclaimed })
            : translate('missions.ended')}
        </Text>
      </View>
    );
  }
  if (summary.readyCount <= 0)
    return null;

  return (
    <View
      className={`flex-row items-center gap-2 rounded-xl px-3 py-2 ${summary.urgent
        ? 'border-[1.5px] border-danger-300 bg-danger-50 dark:border-danger-800 dark:bg-[#361C1E]'
        : 'border border-[#FDE0B5] bg-[#FFF8EE] dark:border-[#6B4423] dark:bg-[#2E2318]'
      }`}
    >
      <AlertTriangleIcon
        width={15}
        height={15}
        color={summary.urgent ? (isDark ? '#FCA5A5' : '#991B1B') : (isDark ? '#FDBA74' : '#9A3412')}
      />
      <Text
        className={`flex-1 font-inter text-[11.5px] leading-[16px] ${summary.urgent
          ? 'font-bold text-danger-800 dark:text-danger-300'
          : 'font-semibold text-[#9A3412] dark:text-[#FDBA74]'
        }`}
      >
        {summary.urgent
          ? translate('missions.unclaimed_urgent', { time: formatShortDuration(minutesLeft) })
          : translate('missions.unclaimed_warning')}
      </Text>
    </View>
  );
}

export function MissionsScreen() {
  const query = useDailyMissions();
  const { data, dataUpdatedAt, refetch } = query;
  const claim = useClaimMission();
  const today = useStudyToday().data;
  const router = useRouter();
  const isDark = useColorMode() === 'dark';
  const { width } = useWindowDimensions();
  const compact = width < 360;

  const keys = React.useRef(new Map<number, string>());
  const inFlight = React.useRef(false);
  const firstFocus = React.useRef(true);
  const deltaTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const deltaSeq = React.useRef(0);
  const [, tick] = React.useReducer((n: number) => n + 1, 0);

  // Freeze visual card order per session/date so claiming a reward never jumps cards mid-tap.
  const [orderState, setOrderState] = React.useState<{ date: string; ids: number[] } | null>(null);
  const [justClaimedMap, setJustClaimedMap] = React.useState<Record<number, GrantedNotice>>({});
  const [walletDelta, setWalletDelta] = React.useState<WalletDelta | null>(null);
  const [claimingId, setClaimingId] = React.useState<number | null>(null);

  const recomputeOrder = React.useCallback((nextData: typeof data) => {
    if (!nextData)
      return;
    setOrderState({ date: nextData.missionDate, ids: orderMissions(nextData.missions).map(m => m.id) });
    setJustClaimedMap({});
  }, []);

  React.useEffect(() => {
    if (!data)
      return;
    setOrderState((prev) => {
      if (prev && prev.date === data.missionDate) {
        const known = new Set(prev.ids);
        const missing = orderMissions(data.missions.filter(m => !known.has(m.id))).map(m => m.id);
        return missing.length > 0 ? { date: prev.date, ids: [...prev.ids, ...missing] } : prev;
      }
      return { date: data.missionDate, ids: orderMissions(data.missions).map(m => m.id) };
    });
  }, [data]);

  React.useEffect(() => () => {
    if (deltaTimer.current)
      clearTimeout(deltaTimer.current);
  }, []);

  useFocusEffect(React.useCallback(() => {
    if (firstFocus.current) {
      firstFocus.current = false;
      return;
    }
    void refetch().then((res) => {
      if (res?.data)
        recomputeOrder(res.data);
    });
  }, [recomputeOrder, refetch]));

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        tick();
        void refetch();
      }
    });
    return () => subscription.remove();
  }, [refetch]);

  React.useEffect(() => {
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (!data)
      return;
    const timer = setTimeout(() => {
      tick();
      void refetch();
    }, Math.max(1000, msUntilReset(data, dataUpdatedAt)));
    return () => clearTimeout(timer);
  }, [data, dataUpdatedAt, refetch]);

  const handleRefresh = React.useCallback(() => {
    void refetch().then((res) => {
      if (res?.data)
        recomputeOrder(res.data);
    });
  }, [recomputeOrder, refetch]);

  async function receive(mission: DailyMission) {
    if (inFlight.current)
      return;
    inFlight.current = true;
    setClaimingId(mission.id);
    const key = keys.current.get(mission.id) ?? randomUUID();
    keys.current.set(mission.id, key);
    try {
      const result = await claim.mutateAsync({ missionId: mission.id, idempotencyKey: key });
      keys.current.delete(mission.id);
      const reward = result?.rewardGranted;
      if (reward) {
        const notice: GrantedNotice = {
          missionId: mission.id,
          coin: reward.coin + reward.fallbackCoin,
          xp: reward.xp,
          item: reward.itemQuantity > 0 ? reward.itemName ?? reward.itemCode : null,
          fallback: reward.fallbackCoin > 0,
        };
        setJustClaimedMap(prev => ({ ...prev, [mission.id]: notice }));
        AccessibilityInfo.announceForAccessibility?.(formatGrantedMessage(notice));
        if (!result.replayed && (notice.coin > 0 || notice.xp > 0)) {
          deltaSeq.current += 1;
          setWalletDelta({ coin: notice.coin, xp: notice.xp, seq: deltaSeq.current });
          if (deltaTimer.current)
            clearTimeout(deltaTimer.current);
          deltaTimer.current = setTimeout(() => setWalletDelta(null), 1600);
        }
      }
    }
    catch {
      // Keep the original key when the response is lost, so the next tap safely retries.
    }
    finally {
      inFlight.current = false;
      setClaimingId(null);
    }
  }

  const rawMissions = data?.missions ?? [];
  const missions = React.useMemo(() => {
    if (!rawMissions.length)
      return [];
    if (!orderState || orderState.date !== data?.missionDate)
      return orderMissions(rawMissions);
    const byId = new Map(rawMissions.map(m => [m.id, m]));
    const ordered = orderState.ids.map(id => byId.get(id)).filter((m): m is DailyMission => Boolean(m));
    const seen = new Set(ordered.map(m => m.id));
    for (const m of orderMissions(rawMissions)) {
      if (!seen.has(m.id))
        ordered.push(m);
    }
    return ordered;
  }, [data?.missionDate, orderState, rawMissions]);

  const msLeft = data ? msUntilReset(data, dataUpdatedAt) : 0;
  const minutesLeft = Math.max(0, Math.ceil(msLeft / 60_000));
  const ended = !!data && msLeft <= 0;
  const summary = React.useMemo(() => summarizeMissions(rawMissions, ended, minutesLeft), [ended, minutesLeft, rawMissions]);
  const segments = React.useMemo(() => buildStatusSegments(rawMissions, ended), [ended, rawMissions]);
  const tone: 'default' | 'victory' | 'expired' = summary.allClaimed ? 'victory' : ended ? 'expired' : 'default';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TOP_SAFE_BG[tone] }} edges={['top']}>
      <FocusAwareStatusBar style="light" />
      <SnapyHeader tone={tone} onBack={() => router.back()} delta={walletDelta} compact={compact} />

      <ScrollView
        style={{ flex: 1 }}
        className="bg-background dark:bg-neutral-950"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={handleRefresh} />}
      >
        <View className="w-full max-w-[560px] self-center">
          {data && missions.length > 0 && (
            <SnapyStage summary={summary} segments={segments} minutesLeft={minutesLeft} ended={ended} compact={compact} />
          )}

          {query.isPending && (
            <View className="gap-3 px-4 pt-4">
              <View className="h-36 rounded-3xl bg-neutral-200 dark:bg-neutral-800" />
              {Array.from({ length: 5 }, (_, i) => <View key={i} className="h-28 rounded-2xl bg-neutral-200 dark:bg-neutral-800" />)}
            </View>
          )}

          {query.isError && (
            <View className="mx-3.5 mt-3 gap-2.5 rounded-2xl border border-line bg-surface p-4">
              <Text tx={query.data ? 'missions.cached_error' : 'missions.load_error'} className="font-inter text-[13px] text-neutral-600 dark:text-neutral-300" />
              <Button tx="missions.retry" onPress={handleRefresh} />
            </View>
          )}

          {data && missions.length === 0 && (
            <View className="mx-3.5 mt-4 items-center rounded-2xl border border-line bg-surface p-6">
              <Text className="mb-1 text-center font-nunito text-base font-extrabold text-mascot-navy dark:text-white">
                {translate('missions.empty_title')}
              </Text>
              <Text className="text-center font-inter text-sm text-neutral-500 dark:text-neutral-300">
                {translate('missions.empty_body')}
              </Text>
            </View>
          )}

          {data && missions.length > 0 && summary.allClaimed && (
            <VictoryLedger missions={rawMissions} minutesLeft={minutesLeft} onContinueLearning={() => router.push('/learn')} />
          )}

          {data && missions.length > 0 && !summary.allClaimed && (
            <View className="gap-2.5 px-3.5 pt-3">
              <MissionStatusBanner ended={ended} summary={summary} minutesLeft={minutesLeft} isDark={isDark} />
              {missions.map((mission) => {
                const action = actions[mission.triggerEvent];
                const hasClaimError = claim.isError && claim.variables?.missionId === mission.id;
                const claimErrorTx: TxKeyPath | undefined = hasClaimError
                  ? missionErrorCode(claim.error) === 'MISSION_EXPIRED' ? 'missions.expired_error' : 'missions.claim_error'
                  : undefined;

                return (
                  <MissionCard
                    key={mission.id}
                    mission={mission}
                    ended={ended}
                    compact={compact}
                    actionTx={action?.tx}
                    onAction={action ? () => router.push(studyHref(mission.triggerEvent, action.href, today)) : undefined}
                    onClaim={() => void receive(mission)}
                    claiming={claimingId === mission.id}
                    claimDisabled={claimingId !== null}
                    claimErrorTx={claimErrorTx}
                    justClaimed={justClaimedMap[mission.id]}
                  />
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
