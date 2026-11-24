import type { MissionSummary, SegmentKind, StatusSegment } from '../model';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { Snapy } from '@/components/Snapy';
import { Text } from '@/components/ui';
import { CheckIcon, ClockIcon } from '@/components/ui/icons';
import { RewardIcon } from '@/components/ui/rewards';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { translate } from '@/lib/i18n';
import { formatResetCountdown } from '../model';

type SnapyStageProps = {
  summary: MissionSummary;
  segments: StatusSegment[];
  minutesLeft: number;
  ended: boolean;
  compact?: boolean;
};

const SEGMENT_COLOR: Record<SegmentKind, string> = {
  claimed: '#7DD634',
  ready: '#FFC42E',
  progress: '#38BDF8',
  empty: 'transparent',
  expired: '#64748B',
};

function VictoryHaloRing() {
  const r = 49;
  const c = 2 * Math.PI * r;
  const seg = c / 5;
  const gap = 8;
  const arc = seg - gap;

  return (
    <Svg width={112} height={112} viewBox="0 0 112 112" style={StyleSheet.absoluteFill}>
      {[0, 1, 2, 3, 4].map(i => (
        <Circle
          key={i}
          cx={56}
          cy={56}
          r={r}
          fill="none"
          stroke={i % 2 === 0 ? '#7DD634' : '#FFC42E'}
          strokeWidth={4.5}
          strokeLinecap="round"
          strokeDasharray={`${arc} ${c - arc}`}
          transform={`rotate(${-90 + i * 72 + 4} 56 56)`}
          opacity={0.92}
        />
      ))}
    </Svg>
  );
}

export function SnapyStage({ summary, segments, minutesLeft, ended, compact = false }: SnapyStageProps) {
  const coinBalance = useAuthStore(s => s.user?.coin);
  const xpBalance = useAuthStore(s => s.user?.exp);

  if (summary.allClaimed) {
    return (
      <View
        testID="missions-victory-stage"
        className="relative overflow-hidden rounded-b-[28px] bg-[#142F29] px-4 pt-4 pb-5"
      >
        {/* Native gradient: a percentage-sized Svg stops short of the stage on Android. */}
        <LinearGradient
          colors={['#142F29', '#1B4236', '#20523E']}
          locations={[0, 0.56, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.4, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View pointerEvents="none" className="absolute inset-x-0 -top-20 items-center">
          <Svg width={374} height={288}>
            <Defs>
              <RadialGradient id="victoryGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#FFD666" stopOpacity="0.22" />
                <Stop offset="45%" stopColor="#7DD634" stopOpacity="0.11" />
                <Stop offset="100%" stopColor="#142F29" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Ellipse cx={187} cy={144} rx={187} ry={144} fill="url(#victoryGlow)" />
          </Svg>
        </View>

        <View className="items-center">
          <View className="relative mb-2.5 size-28 items-center justify-center">
            <VictoryHaloRing />
            <Snapy pose="celebrating" animation="none" className="size-20" />
          </View>

          <View className="mb-1.5 flex-row items-center gap-1.5 rounded-full border border-[#BEF264]/45 bg-[#A3E635]/20 px-2.5 py-1">
            <CheckIcon width={11} height={11} color="#D9F99D" />
            <Text className="font-nunito text-[11px] font-black tracking-wider text-[#D9F99D] uppercase">
              {translate('missions.victory_badge')}
            </Text>
          </View>

          <Text className="text-center font-nunito text-[21px] font-black text-white">
            {translate('missions.victory_title')}
          </Text>
          <Text className="mt-1 max-w-[320px] text-center font-inter text-[12.5px] leading-[18px] text-slate-300">
            {translate('missions.victory_subtitle')}
          </Text>
        </View>

        <View className="mt-4 flex-row gap-2.5">
          <View className="flex-1 flex-row items-center gap-2.5 rounded-2xl border border-[#FFD666]/35 bg-reward-500/15 px-3 py-2.5">
            <RewardIcon type="coin" size={26} />
            <View className="flex-1">
              <Text className="font-nunito text-[17px] font-black text-[#FFE596]">
                {`+${summary.totalCoin} Coin`}
              </Text>
              {typeof coinBalance === 'number' && (
                <Text numberOfLines={1} className="mt-0.5 font-inter text-[11px] text-slate-300">
                  {translate('missions.victory_coin_wallet', { coin: coinBalance })}
                </Text>
              )}
            </View>
          </View>

          <View className="flex-1 flex-row items-center gap-2.5 rounded-2xl border border-[#93C5FD]/35 bg-[#60A5FA]/15 px-3 py-2.5">
            <RewardIcon type="xp" size={26} />
            <View className="flex-1">
              <Text className="font-nunito text-[17px] font-black text-[#BFDBFE]">
                {`+${summary.totalXp} XP`}
              </Text>
              {typeof xpBalance === 'number' && (
                <Text numberOfLines={1} className="mt-0.5 font-inter text-[11px] text-slate-300">
                  {translate('missions.victory_xp_total', { xp: xpBalance })}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  }

  const snapyPose = ended
    ? 'thinking'
    : summary.readyCount > 0
      ? 'jumping'
      : summary.completedCount === 0
        ? 'exploring'
        : 'reading';

  const headline = ended
    ? translate('missions.ended_headline')
    : summary.readyCount > 0
      ? translate('missions.headline_ready', { count: summary.readyCount })
      : summary.completedCount === 0
        ? translate('missions.headline_fresh')
        : translate('missions.headline_remaining', { count: Math.max(0, summary.totalCount - summary.completedCount) });

  const legendItems = [
    summary.claimedCount > 0 && { key: 'claimed', color: '#7DD634', label: translate('missions.legend_claimed', { count: summary.claimedCount }) },
    summary.readyCount > 0 && { key: 'ready', color: '#FFC42E', label: translate('missions.legend_ready', { count: summary.readyCount }) },
    summary.inProgressStarted > 0 && { key: 'progress', color: '#38BDF8', label: translate('missions.legend_in_progress', { count: summary.inProgressStarted }) },
    summary.notStarted > 0 && { key: 'empty', color: 'rgba(255,255,255,0.34)', label: translate('missions.legend_not_started', { count: summary.notStarted }) },
    summary.expiredUnclaimed > 0 && { key: 'expired', color: '#94A3B8', label: translate('missions.legend_expired', { count: summary.expiredUnclaimed }) },
  ].filter((item): item is { key: string; color: string; label: string } => Boolean(item));

  return (
    <View
      testID="missions-snapy-stage"
      className={`relative overflow-hidden rounded-b-[24px] px-4 pt-2.5 pb-4 ${ended ? 'bg-[#2C3445]' : 'bg-[#1E2A44]'}`}
    >
      <LinearGradient
        colors={ended ? ['#2C3445', '#374155'] : ['#1E2A44', '#263659']}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" className="absolute -top-6 -right-20">
        <Svg width={280} height={126}>
          <Defs>
            <RadialGradient id="stageGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFC42E" stopOpacity={ended ? '0.06' : '0.22'} />
              <Stop offset="60%" stopColor="#FF8A00" stopOpacity="0.04" />
              <Stop offset="100%" stopColor="#1E2A44" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse cx={140} cy={63} rx={140} ry={63} fill="url(#stageGlow)" />
        </Svg>
      </View>

      <View className="flex-row items-center gap-3">
        <View className="flex-1">
          <View
            className={`mb-1.5 flex-row items-center gap-1.5 self-start rounded-full px-2 py-0.5 ${
              summary.urgent
                ? 'border border-[#FCA5A5]/50 bg-[#EF4444]/25'
                : 'bg-white/10'
            }`}
          >
            <ClockIcon width={12} height={12} color={summary.urgent ? '#FECACA' : '#E2E8F0'} />
            <Text className={`font-inter text-[11px] font-bold ${summary.urgent ? 'text-[#FECACA]' : 'text-slate-200'}`}>
              {ended ? translate('missions.ended_pull_hint') : formatResetCountdown(minutesLeft)}
            </Text>
          </View>

          <Text className={`font-nunito font-black text-white ${compact ? 'text-[15.5px] leading-[20px]' : 'text-[17.5px] leading-[22px]'}`}>
            {headline}
          </Text>

          <View className="mt-1 flex-row flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <Text className="font-inter text-[12px] text-slate-300">
              {translate(ended ? 'missions.earned_yesterday' : 'missions.earned_today')}
            </Text>
            {/* Coin · XP wrap as one unit, so the dot never dangles at a line end. */}
            <View className="flex-row items-center gap-x-1.5">
              <Text className="font-nunito text-[12px] font-extrabold text-[#FFE596]">
                {`${summary.earnedCoin}/${summary.totalCoin} Coin`}
              </Text>
              <Text className="font-inter text-[12px] text-slate-400">·</Text>
              <Text className="font-nunito text-[12px] font-extrabold text-[#93C5FD]">
                {`${summary.earnedXp}/${summary.totalXp} XP`}
              </Text>
            </View>
          </View>
        </View>

        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Snapy pose={snapyPose} animation="none" className={compact ? 'size-14' : 'size-[72px]'} />
        </View>
      </View>

      {/* Strict 1-to-1 Status-Semantic 5-Segment Progress Bar */}
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={translate('missions.completed_count')}
        accessibilityValue={{ min: 0, max: summary.totalCount, now: summary.completedCount }}
        className="mt-3 flex-row gap-1.5"
      >
        {segments.map(seg => (
          <View key={seg.id} className="h-[7px] flex-1 overflow-hidden rounded-full bg-white/20">
            {seg.fillPercent > 0 && (
              <View
                style={{ width: `${seg.fillPercent}%`, backgroundColor: SEGMENT_COLOR[seg.kind] }}
                className="h-full rounded-full"
              />
            )}
          </View>
        ))}
      </View>

      {legendItems.length > 0 && (
        <View className="mt-2 flex-row flex-wrap items-center gap-x-2.5 gap-y-1">
          {legendItems.map(item => (
            <View key={item.key} className="flex-row items-center gap-1.5">
              <View style={{ backgroundColor: item.color }} className="size-[7px] rounded-full" />
              <Text className="font-inter text-[11px] font-semibold text-slate-200">{item.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
