import { LinearGradient } from 'expo-linear-gradient';
import { Pressable } from 'react-native';

import { Text, View } from '@/components/ui';

type ScanResultsActionsProps = {
  canContinue: boolean;
  onRetake: () => void;
};

export function ScanResultsActions({ canContinue, onRetake }: ScanResultsActionsProps) {
  return (
    <View className="flex-row gap-3 bg-white p-5 dark:bg-neutral-900">
      <Pressable
        onPress={onRetake}
        testID="scan-retake-button"
        style={{ flex: 1 }}
        className="h-14 flex-1 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800"
      >
        <Text className="text-base font-bold" tx="scan.retake" />
      </Pressable>

      {/* "Find meanings" is intentionally inert for now — the meaning-selection
          flow is a separate feature that has not been built yet. */}
      <Pressable
        disabled={!canContinue}
        testID="scan-find-meanings-button"
        style={{ flex: 1 }}
        className={`h-14 flex-1 overflow-hidden rounded-full ${canContinue ? '' : 'opacity-50'}`}
      >
        <LinearGradient
          colors={['#6366f1', '#8b5cf6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 9999 }}
        >
          <Text className="text-base font-bold text-white" tx="scan.find_meanings" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}
