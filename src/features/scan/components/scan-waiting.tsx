import type { ScanStatus } from '../types';
import { useEffect, useState } from 'react';
import { BouncingDots, Button, Mascot, Text, View } from '@/components/ui';

/** The UI promises about 90s (BF-06); past that, say the server is busy rather than look stuck. */
const SLOW_AFTER_MS = 90_000;

type Props = {
  status?: ScanStatus;
  /** When the scan was accepted, to time the "still working" hint across re-renders. */
  startedAt: number;
  onCancel: () => void;
};

export function ScanWaiting({ status, startedAt, onCancel }: Props) {
  const [slow, setSlow] = useState(() => Date.now() - startedAt > SLOW_AFTER_MS);

  useEffect(() => {
    const remaining = SLOW_AFTER_MS - (Date.now() - startedAt);
    if (remaining <= 0)
      return;
    const timer = setTimeout(() => setSlow(true), remaining);
    return () => clearTimeout(timer);
  }, [startedAt]);

  const pending = status === 'PENDING';

  return (
    <View style={{ flex: 1 }} className="flex-1 items-center justify-center px-6">
      <Mascot pose="read" float className="mb-4 size-36" />
      <Text
        className="mb-2 text-center font-nunito text-[22px] font-extrabold text-mascot-navy dark:text-white"
        tx={pending ? 'scan.status.pending_title' : 'scan.status.processing_title'}
      />
      <Text
        className="mb-4 text-center text-sm text-neutral-500"
        tx={pending ? 'scan.status.pending_subtitle' : 'scan.status.processing_subtitle'}
      />
      <BouncingDots color="#58CC02" />
      {slow && (
        <Text className="mt-4 text-center text-sm font-semibold text-reward-700" tx="scan.status.slow_hint" />
      )}

      <Button
        tx="scan.status.cancel"
        variant="outline"
        onPress={onCancel}
        testID="scan-cancel-button"
        className="mt-8 px-6"
      />
      <Text className="mt-2 text-center text-xs text-neutral-400" tx="scan.status.cancel_hint" />
    </View>
  );
}
