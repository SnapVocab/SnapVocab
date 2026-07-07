import { View } from 'react-native';

type ProgressBarProps = {
  currentValue: number;
  maxValue: number;
  barColor?: string;
  trackColor?: string;
  height?: number;
  width?: string;
};

export function ProgressBar({
  currentValue,
  maxValue,
  barColor,
  trackColor,
  height = 12,
  width,
}: ProgressBarProps) {
  const progress = Math.min(currentValue / maxValue, 1);
  const radius = height / 2;

  const trackClass = width ?? 'w-full';

  return (
    <View
      style={{
        height,
        borderRadius: radius,
        ...(trackColor != null ? { backgroundColor: trackColor } : {}),
      }}
      className={`overflow-hidden bg-neutral-200 ${trackClass} dark:bg-neutral-700`}
    >
      <View
        style={{
          width: `${progress * 100}%`,
          height,
          borderRadius: radius,
          ...(barColor != null ? { backgroundColor: barColor } : {}),
        }}
        className="bg-primary-500"
      />
    </View>
  );
}
