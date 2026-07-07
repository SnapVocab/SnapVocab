import { View } from 'react-native';
import { Button, Text } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { ProgressBar } from './progress-bar';

type CurrentUnitCardProps = {
  unitName: string;
  currentLesson: number;
  lessonCount: number;
};

export function CurrentUnitCard({ unitName, currentLesson, lessonCount }: CurrentUnitCardProps) {
  return (
    <View
      className="gap-3 rounded-[28px] bg-[#29C45C] p-5 shadow-md shadow-gray-400"
      style={{ elevation: 5 }}
    >
      <Text className="text-xs font-black tracking-widest text-[#D0F2DB]">
        {translate('home.current_unit', { unitName })}
      </Text>
      <Text className="mt-1 text-2xl font-black text-white">
        {translate('home.lesson_progress', { currentLesson, lessonCount })}
      </Text>

      <ProgressBar
        currentValue={currentLesson}
        maxValue={lessonCount}
        barColor="#FFFFFF"
        trackColor="#23A74E"
      />

      <View className="mt-2 flex items-center justify-center rounded-3xl bg-white">
        <Button className="bg-white">
          <Text className="font-black tracking-wide text-[#29C45C]" tx="home.continue" />
        </Button>
      </View>
    </View>
  );
}
