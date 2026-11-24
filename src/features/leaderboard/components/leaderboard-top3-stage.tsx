import type { StagePinTone, StageSlot } from '../model';
import type { LeaderboardRow, LeaderboardWeek } from '../types';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { AvatarFrame } from '@/components/snapvocab';
import { Text, useColorMode } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { formatXp, stageSlotsOf, trendOf } from '../model';

type PinColors = { bg: string; tx: string };

type StagePalette = {
  gradient: readonly [string, string, string];
  locations: readonly [number, number, number];
  start: { x: number; y: number };
  end: { x: number; y: number };
  glowColor: string;
  glowOpacity: number;
  arcStroke: string;
  borderColor: string;
  wreathStem: string;
  wreathLeaf: string;
  name: string;
  nameElevated: string;
  nameMe: string;
  xp: string;
  xpElevated: string;
  ring: string;
  avBg: string;
  avTx: string;
  pins: Record<StagePinTone | 'me', PinColors>;
  trend: { up: string; down: string; flat: string };
};

/**
 * PROPOSED palette, not approved: the PO approved only the Direction B layout (2026-11-18).
 * - Light: V2 Fresh Meadow (`primary-50` wash + warm gold `#1` halo)
 * - Dark: V4 Soft Twilight Slate (`mascot-navy` family + luminous gold)
 */
const STAGE_PALETTE: Record<'light' | 'dark', StagePalette> = {
  light: {
    gradient: ['#FFFFFF', '#F4FDEC', '#E8F9DA'],
    locations: [0, 0.42, 1],
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
    glowColor: '#FFCC2E',
    glowOpacity: 0.22,
    arcStroke: 'rgba(60, 140, 0, 0.11)',
    borderColor: '#CCEBA9',
    wreathStem: 'rgba(196, 142, 12, 0.58)',
    wreathLeaf: 'rgba(212, 152, 12, 0.72)',
    name: '#1B2C1B',
    nameElevated: '#132114',
    nameMe: '#2A6400',
    xp: '#2D6A00',
    xpElevated: '#8A5B00',
    ring: '#EEFAE3',
    avBg: '#E0F3CE',
    avTx: '#3A6320',
    pins: {
      gold: { bg: '#F4BA20', tx: '#2A1B00' },
      silver: { bg: '#D9E2EC', tx: '#28364A' },
      bronze: { bg: '#E6C1A8', tx: '#522E17' },
      me: { bg: '#4CAD02', tx: '#FFFFFF' },
    },
    trend: { up: '#2F6E00', down: '#6D8266', flat: '#8AA082' },
  },
  dark: {
    gradient: ['#1D2945', '#26385E', '#203052'],
    locations: [0, 0.58, 1],
    start: { x: 0.15, y: 0 },
    end: { x: 0.85, y: 1 },
    glowColor: '#FFD666',
    glowOpacity: 0.18,
    arcStroke: 'rgba(255, 255, 255, 0.10)',
    borderColor: 'rgba(164, 192, 245, 0.20)',
    wreathStem: 'rgba(255, 222, 128, 0.64)',
    wreathLeaf: 'rgba(255, 226, 138, 0.78)',
    name: 'rgba(255, 255, 255, 0.94)',
    nameElevated: '#FFFFFF',
    nameMe: '#B5F57B',
    xp: '#FFE28C',
    xpElevated: '#FFEAAD',
    ring: '#233357',
    // Opaque: AvatarFrame paints its own blue under the initials, a translucent fill lets it through.
    avBg: '#33446A',
    avTx: '#EEF4FF',
    pins: {
      gold: { bg: '#F7C73E', tx: '#1E1500' },
      silver: { bg: '#E4ECF8', tx: '#1E2A44' },
      bronze: { bg: '#E7AE86', tx: '#2A160A' },
      me: { bg: '#86E63B', tx: '#122108' },
    },
    trend: { up: '#9DF25C', down: 'rgba(255, 255, 255, 0.58)', flat: 'rgba(255, 255, 255, 0.44)' },
  },
};

function StageBackdrop({ palette, idPrefix }: { palette: StagePalette; idPrefix: string }) {
  const gradId = `${idPrefix}-halo`;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 390 166" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <RadialGradient id={gradId} cx="50%" cy="34%" rx="46%" ry="60%">
            <Stop offset="0%" stopColor={palette.glowColor} stopOpacity={palette.glowOpacity} />
            <Stop offset="76%" stopColor={palette.glowColor} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="390" height="166" fill={`url(#${gradId})`} />
        <Circle cx="195" cy="60" r="76" stroke={palette.arcStroke} strokeWidth="1" fill="none" />
        <Circle cx="195" cy="60" r="118" stroke={palette.arcStroke} strokeWidth="1" strokeDasharray="3 5" fill="none" />
      </Svg>
    </View>
  );
}

function LaurelWreath({ size, palette }: { size: number; palette: StagePalette }) {
  const width = Math.round(size * 1.32);
  const height = Math.round(width * (92 / 108));
  return (
    <View pointerEvents="none" style={styles.wreathContainer}>
      <Svg width={width} height={height} viewBox="0 0 108 92" fill="none">
        <Path d="M27 79C14 67 11 47 17 28C20 18 25 11 31 6" stroke={palette.wreathStem} strokeWidth="1.2" strokeLinecap="round" />
        <Ellipse cx="15" cy="54" rx="4.2" ry="1.9" transform="rotate(-38 15 54)" fill={palette.wreathLeaf} />
        <Ellipse cx="13.5" cy="41" rx="4.2" ry="1.9" transform="rotate(-18 13.5 41)" fill={palette.wreathLeaf} />
        <Ellipse cx="16.5" cy="28" rx="4" ry="1.8" transform="rotate(6 16.5 28)" fill={palette.wreathLeaf} />
        <Ellipse cx="23" cy="17" rx="3.8" ry="1.7" transform="rotate(28 23 17)" fill={palette.wreathLeaf} />
        <Ellipse cx="20" cy="66" rx="4" ry="1.8" transform="rotate(-55 20 66)" fill={palette.wreathLeaf} />

        <Path d="M81 79C94 67 97 47 91 28C88 18 83 11 77 6" stroke={palette.wreathStem} strokeWidth="1.2" strokeLinecap="round" />
        <Ellipse cx="93" cy="54" rx="4.2" ry="1.9" transform="rotate(38 93 54)" fill={palette.wreathLeaf} />
        <Ellipse cx="94.5" cy="41" rx="4.2" ry="1.9" transform="rotate(18 94.5 41)" fill={palette.wreathLeaf} />
        <Ellipse cx="91.5" cy="28" rx="4" ry="1.8" transform="rotate(-6 91.5 28)" fill={palette.wreathLeaf} />
        <Ellipse cx="85" cy="17" rx="3.8" ry="1.7" transform="rotate(-28 85 17)" fill={palette.wreathLeaf} />
        <Ellipse cx="88" cy="66" rx="4" ry="1.8" transform="rotate(55 88 66)" fill={palette.wreathLeaf} />
      </Svg>
    </View>
  );
}

function StageAvatar({ row, name, size, palette }: {
  row: LeaderboardRow;
  name: string;
  size: number;
  palette: StagePalette;
}) {
  const [avatarFailed, setAvatarFailed] = React.useState(false);
  const avatarUri = avatarFailed ? null : row.avatarUrl;
  return (
    <AvatarFrame
      size={size}
      avatarUri={avatarUri}
      frameUrl={row.avatarFrameUrl}
      onAvatarError={() => setAvatarFailed(true)}
    >
      {!avatarUri && (
        <View style={[styles.fallbackCircle, { backgroundColor: palette.avBg }]}>
          <Text
            allowFontScaling={false}
            style={{ color: palette.avTx, fontSize: Math.max(13, Math.round(size * 0.24)) }}
            className="font-nunito font-black"
          >
            {Array.from(name)[0]?.toLocaleUpperCase()}
          </Text>
        </View>
      )}
    </AvatarFrame>
  );
}

function StageSlotView({ slot, week, narrow, width, palette }: {
  slot: StageSlot;
  week: LeaderboardWeek;
  narrow: boolean;
  width: number;
  palette: StagePalette;
}) {
  const { row, elevated, laurel, pinTone } = slot;
  const name = row.displayName.trim() || translate('leaderboard.learner');
  const avatarSize = elevated ? (narrow ? 70 : 82) : (narrow ? 58 : 66);
  const pin = row.isMe ? palette.pins.me : palette.pins[pinTone];
  const trend = week === 'CURRENT' ? trendOf(row.rankChange) : null;
  const nameColor = row.isMe ? palette.nameMe : elevated ? palette.nameElevated : palette.name;
  const xpColor = elevated ? palette.xpElevated : palette.xp;

  return (
    <View
      accessible
      testID={`leaderboard-top3-slot-${row.rank}`}
      style={[styles.slot, { width }, elevated ? undefined : styles.slotSide]}
    >
      <View
        style={[
          styles.portraitBox,
          { width: avatarSize + 20, height: avatarSize + 10 },
          elevated ? styles.portraitElevated : undefined,
        ]}
      >
        {laurel && <LaurelWreath size={avatarSize} palette={palette} />}
        <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <StageAvatar
            key={JSON.stringify([row.avatarUrl, row.avatarFrameUrl])}
            row={row}
            name={name}
            size={avatarSize}
            palette={palette}
          />
        </View>
        <View
          style={[
            styles.rankPin,
            { backgroundColor: pin.bg, borderColor: palette.ring },
          ]}
        >
          <Text
            allowFontScaling={false}
            style={{ color: pin.tx }}
            className="font-nunito text-[11px] font-black tabular-nums"
          >
            {row.rank}
          </Text>
        </View>
      </View>

      <View style={styles.nameRow}>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{ color: nameColor }}
          className={`shrink text-center font-nunito ${elevated ? 'text-[13px] font-black' : 'text-xs font-extrabold'}`}
        >
          {name}
        </Text>
        {row.isMe && (
          <View style={[styles.meTag, { backgroundColor: palette.pins.me.bg }]}>
            <Text
              allowFontScaling={false}
              style={{ color: palette.pins.me.tx }}
              className="font-inter text-[10px] font-extrabold"
            >
              {translate('leaderboard.me')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.xpRow}>
        <Text
          numberOfLines={1}
          style={{ color: xpColor }}
          className={`font-nunito tabular-nums ${elevated ? 'text-xs font-black' : 'text-[11px] font-extrabold'}`}
        >
          {translate('leaderboard.xp', { xp: formatXp(row.score) })}
        </Text>
        {trend && (
          <Text
            accessibilityLabel={translate(trend.a11yKey, { count: trend.amount ?? 0 })}
            style={{ color: palette.trend[trend.tone] }}
            className="font-inter text-[10px] font-extrabold tabular-nums"
          >
            {trend.amount === null ? trend.symbol : `${trend.symbol} ${trend.amount}`}
          </Text>
        )}
      </View>
    </View>
  );
}

/**
 * Direction B Top 3 Recognition Stage (`V2 Light × V4 Dark`):
 * Floating elevated `2 — 1 — 3` portraits with delicate gold laurel wreath, zero podium blocks,
 * and fair equal-height dual laurels for `#1–#1` ties.
 */
export function LeaderboardTop3Stage({ entries, week }: {
  entries: LeaderboardRow[];
  week: LeaderboardWeek;
}) {
  const mode = useColorMode();
  const { width } = useWindowDimensions();
  const idPrefix = React.useId().replace(/[^\w-]/g, '');
  const slots = stageSlotsOf(entries);

  if (slots.length === 0)
    return null;

  const palette = STAGE_PALETTE[mode];
  const narrow = width < 345;
  // Fixed widths, not flex + maxWidth: on Android, Yoga collapsed two max-clamped slots to 0 width (2 participants).
  const gap = narrow ? 2 : 6;
  const sideWidth = Math.min(118, Math.floor((width - 52 - 2 * gap) / 3.12));
  const elevatedWidth = Math.round(sideWidth * 1.12);

  return (
    <LinearGradient
      testID="leaderboard-top3-stage"
      colors={[...palette.gradient]}
      locations={[...palette.locations]}
      start={palette.start}
      end={palette.end}
      style={[styles.stage, { borderColor: palette.borderColor }]}
    >
      <StageBackdrop palette={palette} idPrefix={idPrefix} />
      <View style={[styles.row, { gap }]}>
        {slots.map(slot => (
          <StageSlotView
            key={slot.key}
            slot={slot}
            week={week}
            narrow={narrow}
            width={slot.elevated ? elevatedWidth : sideWidth}
            palette={palette}
          />
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  stage: {
    position: 'relative',
    overflow: 'hidden',
    marginHorizontal: 16,
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 24,
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 10,
    minHeight: 164,
    justifyContent: 'flex-end',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  slot: {
    alignItems: 'center',
  },
  slotSide: {
    paddingTop: 14,
  },
  portraitBox: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  portraitElevated: {
    marginBottom: 10,
  },
  wreathContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackCircle: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankPin: {
    position: 'absolute',
    bottom: -2,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    maxWidth: '100%',
    paddingHorizontal: 2,
  },
  meTag: {
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 1,
    flexShrink: 0,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 2,
    flexWrap: 'nowrap',
  },
});
