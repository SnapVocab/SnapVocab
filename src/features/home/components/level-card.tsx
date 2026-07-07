import { Text, View } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { formatNumber } from '../utils';
import { ProgressBar } from './progress-bar';

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
  return (
    <View
      className="mx-5 rounded-3xl bg-[#0284C7] p-4 shadow-md shadow-gray-400 dark:bg-neutral-800"
      style={{ elevation: 5 }}
    >
      <View>
        <View className="my-2 self-start rounded-full bg-[#0EA5E9] p-2">
          <Text className="text-[11px] font-bold text-white">
            {translate('home.level', { level })}
          </Text>
        </View>
        <View className="mb-2 flex-row justify-between">
          <Text className="text-[36px] font-bold text-white">
            {formatNumber(currentXP)}
            {' / '}
            {formatNumber(maxXP)}
            {' '}
            XP
          </Text>
        </View>
      </View>
      <ProgressBar
        currentValue={currentXP}
        maxValue={maxXP}
        barColor={barColor}
        trackColor={trackColor}
        height={barHeight}
      />
    </View>
  );
}
