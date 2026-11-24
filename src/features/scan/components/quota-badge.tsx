import type { ScanQuota } from '../types';
import { useState } from 'react';
import { Modal, Pressable } from 'react-native';
import { Button, Text, View } from '@/components/ui';
import { SparklesIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';
import { formatLocalTime } from '../display';

type Props = {
  quota?: ScanQuota;
};

/** "3/20 scans" pill on the camera; tapping it explains the daily limit. */
export function QuotaBadge({ quota }: Props) {
  const [showInfo, setShowInfo] = useState(false);

  if (!quota)
    return <View className="h-10" />;

  const exhausted = quota.remaining <= 0;
  const values = {
    remaining: quota.remaining,
    limit: quota.limit,
    time: formatLocalTime(quota.resetAt),
  };

  return (
    <>
      <Pressable
        onPress={() => setShowInfo(true)}
        testID="scan-quota-badge"
        className="h-10 flex-row items-center gap-2 rounded-full border border-white/20 bg-black/50 px-4 active:bg-black/70"
      >
        <SparklesIcon color={exhausted ? '#F87171' : '#58CC02'} />
        <Text className={`font-nunito text-sm font-extrabold ${exhausted ? 'text-danger-400' : 'text-white'}`}>
          {translate('scan.quota.badge', values)}
        </Text>
      </Pressable>

      {showInfo && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setShowInfo(false)}>
          <Pressable
            onPress={() => setShowInfo(false)}
            className="flex-1 items-center justify-center bg-black/60 px-6"
          >
            <View className="w-full max-w-[320px] items-center rounded-[32px] border-b-[6px] border-neutral-200 bg-white p-6">
              <View className="mb-3 size-12 items-center justify-center rounded-2xl bg-primary-50">
                <SparklesIcon color="#58CC02" width={24} height={24} />
              </View>
              <Text className="mb-1 text-center font-nunito text-lg font-extrabold text-mascot-navy" tx="scan.quota.title" />
              <Text className="mb-4 text-center text-sm text-neutral-500">
                {translate('scan.quota.info', values)}
              </Text>
              <Button tx="scan.got_it" fullWidth onPress={() => setShowInfo(false)} />
            </View>
          </Pressable>
        </Modal>
      )}
    </>
  );
}
