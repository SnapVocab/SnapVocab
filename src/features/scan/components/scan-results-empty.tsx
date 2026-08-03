import { Pressable } from 'react-native';

import { FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { BackButton } from '@/components/ui/back-button';
import { Mascot } from '@/components/ui/mascot';

type ScanResultsEmptyProps = {
  onBack: () => void;
  onRetake: () => void;
};

export function ScanResultsEmpty({ onBack, onRetake }: ScanResultsEmptyProps) {
  return (
    <View style={{ flex: 1 }} className="flex-1 bg-white dark:bg-neutral-900">
      <SafeAreaView style={{ flex: 1 }} className="flex-1">
        <FocusAwareStatusBar />

        <View className="flex-row items-center gap-3 px-5 py-3">
          <BackButton onPress={onBack} />
          <Text style={{ flex: 1 }} className="flex-1 text-[20px] font-bold" tx="scan.results_title" />
        </View>

        <View style={{ flex: 1 }} className="flex-1 items-center justify-center gap-4 px-8">
          <Mascot pose="sad" className="size-32" />
          <Text
            className="text-center text-base text-neutral-500 dark:text-neutral-400"
            tx="scan.results_empty"
          />
        </View>

        <View className="p-5">
          <Pressable
            onPress={onRetake}
            testID="scan-retake-button"
            className="h-14 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800"
          >
            <Text className="text-base font-bold" tx="scan.retake" />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
