import type { GameVisualProps } from '../core/GameVisual';
import * as React from 'react';
import Svg, { Circle, Defs, G, LinearGradient, Path, Polygon, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { useColorMode } from '@/components/ui/surface';
import { GameVisual } from '../core/GameVisual';
import { resolveVisualSize } from '../core/SnapVocabVisualSize';

/** Shelf material (achievements_ui.md §3): struck gold, flat blank, next blank, blank waiting for sync. */
export type ArtifactState = 'earned' | 'locked' | 'next' | 'recording';

export type AchievementArtifactProps = {
  /** Backend `BadgeMetric`; selects the silhouette. Unknown metrics render the round fallback. */
  metric: string;
  /** Lucide icon name from the catalog; unknown keys render `award`. */
  iconKey?: string | null;
  /** Shown on the plaque from 56px up; hidden below, where the digits would be unreadable. */
  threshold?: number | null;
  state: ArtifactState;
  /** Navy focus ring, for the badge being viewed inside the mini shelf. */
  focused?: boolean;
} & GameVisualProps;

// Geometry lives in a 76 × 82 box (viewBox -6 -8 76 82): body centred on (32, 30), plaque at y 52–67.
function starPoints(count: number, outer: number, inner: number) {
  return Array.from({ length: count * 2 }, (_, i) => {
    const angle = (-90 + (i * 180) / count) * (Math.PI / 180);
    const r = i % 2 === 0 ? outer : inner;
    return `${(32 + r * Math.cos(angle)).toFixed(2)},${(30 + r * Math.sin(angle)).toFixed(2)}`;
  }).join(' ');
}
const SEAL = starPoints(8, 29, 25.5);
const HEX = starPoints(3, 28.5, 28.5);

type ShapeProps = { fill: string; stroke: string; strokeWidth: number; strokeDasharray?: string };
const SHAPES: Record<string, (p: ShapeProps) => React.ReactElement> = {
  LONGEST_STREAK_DAYS: p => <Circle cx={32} cy={30} r={27} {...p} />,
  QUIZ_COMPLETED: p => <Path d="M32 2.5 L56 10.5 V28 C56 43 45.5 53 32 58.5 C18.5 53 8 43 8 28 V10.5 Z" strokeLinejoin="round" {...p} />,
  PERFECT_QUIZ: p => <Polygon points={SEAL} strokeLinejoin="round" {...p} />,
  DISTINCT_WORDS_ADDED: p => <Polygon points={HEX} strokeLinejoin="round" {...p} />,
};
const roundShape = (p: ShapeProps) => <Circle cx={32} cy={30} r={27} {...p} />;

// Lucide paths (24 × 24), drawn at 0.8 scale on the medal face.
const EMBLEMS: Record<string, React.ReactElement> = {
  'flame': <Path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />,
  'clipboard-check': (
    <>
      <Rect x={8} y={2} width={8} height={4} rx={1} />
      <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <Path d="m9 14 2 2 4-4" />
    </>
  ),
  'target': (
    <>
      <Circle cx={12} cy={12} r={10} />
      <Circle cx={12} cy={12} r={6} />
      <Circle cx={12} cy={12} r={2} />
    </>
  ),
  'book-open': (
    <>
      <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </>
  ),
  'award': (
    <>
      <Circle cx={12} cy={8} r={6} />
      <Path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </>
  ),
};

// Contrast measured with WCAG: earned emblem 5.33:1, locked emblem 4.34:1 (dark 4.7:1), blank outline 3.37:1 (dark 3.22:1).
const BLANK = {
  light: { body: '#E8ECF2', edge: '#7C889C', face: '#F1F5F9', emblem: '#64748B', plate: '#FFFFFF', plateText: '#64748B' },
  dark: { body: '#24263D', edge: '#5A5F86', face: '#2A2C47', emblem: '#8A90AD', plate: '#171A2F', plateText: '#9497A8' },
};
const NEXT_EDGE = '#A87400';
const NEXT_TEXT = '#8A5A00';

/** A collectible medal: one silhouette per series, raised gold when earned, a flat blank otherwise. */
export function AchievementArtifact({
  metric,
  iconKey,
  threshold,
  state,
  focused = false,
  size = 'lg',
  style,
  testID,
  accessibilityLabel,
}: AchievementArtifactProps) {
  const px = resolveVisualSize(size);
  const mode = useColorMode();
  const gradientId = `bdg${React.useId().replace(/\W/g, '')}`;
  const earned = state === 'earned';
  const blank = BLANK[mode];
  const shape = SHAPES[metric] ?? roundShape;
  const emblem = EMBLEMS[iconKey ?? ''] ?? EMBLEMS.award;
  const pending = state === 'next' || state === 'recording';
  const showPlaque = px >= 56 && threshold !== null && threshold !== undefined;
  const plateWidth = 12 + 6.4 * String(threshold ?? '').length;

  return (
    <GameVisual
      size={px}
      style={[{ height: Math.round((px * 82) / 76) }, style]}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
    >
      <Svg
        width={px}
        height={Math.round((px * 82) / 76)}
        viewBox="-6 -8 76 82"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0.9" y2="1">
            <Stop offset="0" stopColor="#FFE48A" />
            <Stop offset="0.55" stopColor="#FFC42E" />
            <Stop offset="1" stopColor="#F0A800" />
          </LinearGradient>
        </Defs>
        {focused && <Circle cx={32} cy={30} r={35} fill="none" stroke={mode === 'dark' ? '#EEEFF3' : '#1E2A44'} strokeWidth={2.5} />}
        {earned && <G y={3.5}>{shape({ fill: '#C98A00', stroke: '#C98A00', strokeWidth: 1.5 })}</G>}
        {shape({
          fill: earned ? `url(#${gradientId})` : blank.body,
          stroke: earned ? '#E0A000' : state === 'recording' ? NEXT_EDGE : blank.edge,
          strokeWidth: 1.5,
          strokeDasharray: state === 'recording' ? '4 3' : undefined,
        })}
        {earned && <Circle cx={32} cy={30} r={20.5} fill="none" stroke="#FFE48A" strokeWidth={1} />}
        <Circle cx={32} cy={30} r={15} fill={earned ? '#FFF3C4' : blank.face} />
        <G
          x={22.4}
          y={20.4}
          scale={0.8}
          fill="none"
          stroke={earned ? '#8A5A00' : blank.emblem}
          strokeWidth={px < 48 ? 3.2 : 2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {emblem}
        </G>
        {showPlaque && (
          <>
            <Rect
              x={32 - plateWidth / 2}
              y={52}
              width={plateWidth}
              height={15}
              rx={7.5}
              fill={earned ? '#1E2A44' : blank.plate}
              stroke={earned ? '#1E2A44' : pending ? NEXT_EDGE : blank.edge}
              strokeWidth={pending ? 2 : 1.5}
            />
            <SvgText
              x={32}
              y={63}
              textAnchor="middle"
              fontFamily="Nunito"
              fontWeight="800"
              fontSize={10.5}
              fill={earned ? '#FFFFFF' : pending ? NEXT_TEXT : blank.plateText}
            >
              {String(threshold)}
            </SvgText>
          </>
        )}
      </Svg>
    </GameVisual>
  );
}

/** Soft gold halo (`elev-reward`) placed behind a newly earned medal; callers animate its opacity. */
export function AchievementGlow({ size }: { size: number }) {
  const id = `glw${React.useId().replace(/\W/g, '')}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFD15C" stopOpacity={0.8} />
          <Stop offset="1" stopColor="#FFD15C" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={50} cy={50} r={50} fill={`url(#${id})`} />
    </Svg>
  );
}
