import { Text, View } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { formatNumber } from '../utils';

type LevelCardProps = {
  level: number;
  currentXP: number;
  maxXP: number;
  barHeight?: number;
  barColor?: string;
  trackColor?: string;
};

export function LevelCard({
  level,
  currentXP,
  maxXP,
  barHeight = 12,
  barColor,
  trackColor,
}: LevelCardProps) {
  const progress = Math.min(currentXP / maxXP, 1);
  const barRadius = barHeight / 2;

  return (
    <View
      className="mx-5 rounded-3xl bg-[#0EA5E9] p-4 shadow-sm dark:bg-neutral-800"
    >
      <View>
        <View className="my-2 self-start rounded-full bg-[#42c5f5] p-2">
          <Text className="text-[11px] font-bold text-white">
            {translate('home.level', { level })}
          </Text>
        </View>
        <View className="mb-2 flex-row justify-between">
          <Text className="text-[36px] font-bold text-white">
            {formatNumber(currentXP)}
            {' '}
            XP
          </Text>
          <Text className="text-[14px] font-bold text-white">
            {translate('home.xp_to_level', { remaining: maxXP - currentXP, nextLevel: level + 1 })}
          </Text>
        </View>

      </View>
      {/* Progress bar track */}
      <View
        style={{
          height: barHeight,
          borderRadius: barRadius,
          backgroundColor: trackColor,
        }}
        className="w-full overflow-hidden bg-neutral-200 dark:bg-neutral-700"
      >
        {/* Progress bar fill */}
        <View
          style={{
            width: `${progress * 100}%`,
            height: barHeight,
            borderRadius: barRadius,
            backgroundColor: barColor,
          }}
          className="bg-primary-500"
        />
      </View>
    </View>
  );
}
