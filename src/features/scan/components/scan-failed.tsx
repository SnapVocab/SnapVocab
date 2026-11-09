import type { ScanFailure } from '../scan-errors';
import { ScrollView } from 'react-native';
import { Button, Mascot, Text, View } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { isRetryable, scanFailureMessageKey } from '../scan-errors';

type Props = {
  failure: ScanFailure;
  retrying?: boolean;
  /** Re-submits the same photo; omitted when retrying cannot help (bad image, no quota). */
  onRetry?: () => void;
  onBackToCamera: () => void;
};

export function ScanFailed({ failure, retrying, onRetry, onBackToCamera }: Props) {
  const canRetry = onRetry && isRetryable(failure);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="grow items-center justify-center px-6 py-8">
      <View className="w-full max-w-md items-center">
        <Mascot pose="sad" className="mb-4 size-32" />
        <Text accessibilityRole="header" className="mb-2 text-center font-nunito text-[22px] font-extrabold text-mascot-navy dark:text-white" tx="scan.result.error_title" />
        <Text accessibilityLiveRegion="polite" className="mb-8 text-center text-sm/6 text-neutral-600 dark:text-neutral-300">
          {translate(scanFailureMessageKey(failure))}
        </Text>
        <View className="w-full gap-3">
          {canRetry && (
            <Button tx="scan.result.retry" fullWidth loading={retrying} onPress={onRetry} testID="scan-retry-button" />
          )}
          <Button
            tx="scan.result.back_camera"
            variant={canRetry ? 'outline' : 'default'}
            fullWidth
            onPress={onBackToCamera}
          />
        </View>
      </View>
    </ScrollView>
  );
}
