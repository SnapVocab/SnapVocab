import type { ScanQuota } from '../types';
import { Button, Mascot, Text, View } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { formatLocalTime } from '../display';

type Props = {
  quota: ScanQuota;
  onReview: () => void;
  onClose: () => void;
};

/** Shown over the camera when the daily quota is used up (AF-06.7). */
export function QuotaExhaustedCard({ quota, onReview, onClose }: Props) {
  return (
    <View className="w-full max-w-[340px] items-center rounded-[32px] border-b-[6px] border-neutral-200 bg-white p-6">
      <Mascot pose="sad" className="mb-3 size-24" />
      <Text className="mb-1 text-center font-nunito text-[22px] font-extrabold text-mascot-navy" tx="scan.quota.exhausted_title" />
      <Text className="mb-6 text-center text-sm text-neutral-500">
        {translate('scan.quota.exhausted_subtitle', { limit: quota.limit, time: formatLocalTime(quota.resetAt) })}
      </Text>
      <Button tx="scan.quota.review_saved" fullWidth onPress={onReview} className="mb-2" />
      <Button tx="scan.close" variant="ghost" fullWidth onPress={onClose} />
    </View>
  );
}
