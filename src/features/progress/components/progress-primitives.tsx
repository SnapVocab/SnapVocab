import { useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { Text } from '@/components/ui';

export type LearningActionProps = {
  secondary?: boolean;
  label?: string;
  route?: string;
  onPress?: () => void;
};

export function LearningAction({
  secondary = false,
  label,
  route = '/(app)/(tabs)/learn',
  onPress,
}: LearningActionProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    router.push(route as any);
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      className={`min-h-12 items-center justify-center rounded-2xl px-4 py-3 active:translate-y-0.5 ${
        secondary
          ? 'border-2 border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800'
          : 'border-b-4 border-primary-700 bg-primary-500'
      }`}
    >
      <Text
        className={`font-nunito text-base font-extrabold ${
          secondary
            ? 'text-neutral-700 dark:text-neutral-200'
            : 'text-primary-900 dark:text-primary-900'
        }`}
      >
        {label || t('progressUx.start')}
      </Text>
    </Pressable>
  );
}

/** A failed query is an error, never zeros or an empty/success state. */
export function SectionError({ onRetry, message }: { onRetry: () => void; message?: string }) {
  const { t } = useTranslation();
  return (
    <View
      accessibilityRole="alert"
      className="mb-3 gap-2 rounded-2xl border border-neutral-100 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <Text className="font-inter text-xs text-neutral-500">{message ?? t('progressUx.loadError')}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        className="self-start rounded-xl bg-neutral-100 px-3 py-1.5 dark:bg-neutral-800"
      >
        <Text className="font-nunito text-xs font-bold text-neutral-700 dark:text-neutral-200">
          {t('progressUx.retry')}
        </Text>
      </Pressable>
    </View>
  );
}

export function RatioBar({ progress, label }: { progress: number; label: string }) {
  const value = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      className="overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700"
    >
      <Svg width="100%" height={10} viewBox="0 0 100 10" preserveAspectRatio="none">
        <Rect width={value * 100} height={10} fill="#58CC02" />
      </Svg>
    </View>
  );
}

export type SegmentItem = {
  value: number;
  color: string;
  label: string;
};

export function MultiSegmentBar({
  segments,
  label,
}: {
  segments: SegmentItem[];
  label: string;
}) {
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);

  const calculatedSegments = React.useMemo(() => {
    if (total === 0) {
      return [];
    }
    let acc = 0;
    return segments
      .filter(seg => seg.value > 0)
      .map((seg) => {
        const segmentPercent = (seg.value / total) * 100;
        const x = acc;
        acc += segmentPercent;
        return {
          ...seg,
          x,
          width: segmentPercent,
        };
      });
  }, [segments, total]);

  if (total === 0) {
    return (
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={label}
        accessibilityValue={{ min: 0, max: 100, now: 0 }}
        className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700"
      />
    );
  }

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: 100 }}
      className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700"
    >
      <Svg width="100%" height={10} viewBox="0 0 100 10" preserveAspectRatio="none">
        {calculatedSegments.map(seg => (
          <Rect
            key={seg.label}
            x={seg.x}
            y={0}
            width={seg.width}
            height={10}
            fill={seg.color}
          />
        ))}
      </Svg>
    </View>
  );
}

export type StatValueProps = {
  value: string | number;
  label: string;
  dotColor?: string;
};

export function StatValue({ value, label, dotColor }: StatValueProps) {
  return (
    <View className="flex-1 gap-1">
      <Text className="font-nunito text-2xl font-extrabold text-neutral-900 dark:text-white">
        {value}
      </Text>
      <View className="flex-row items-center gap-1.5">
        {dotColor && (
          <View
            className="size-2 rounded-full"
            style={{ backgroundColor: dotColor }}
          />
        )}
        <Text className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
          {label}
        </Text>
      </View>
    </View>
  );
}
