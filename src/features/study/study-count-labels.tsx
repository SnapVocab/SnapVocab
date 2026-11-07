import { Text, View } from '@/components/ui';
import { translate } from '@/lib/i18n';

/** Two counts use the same capped daily plan as the study queue. Unknown is never presented as zero. */
export function StudyCountLabels({ counts, className = '' }: {
  counts?: { newCount: number; dueCount: number } | null;
  className?: string;
}) {
  return (
    <View className={`flex-row flex-wrap items-center gap-x-4 gap-y-1 ${className}`}>
      <Text className="font-nunito text-sm font-extrabold text-sky-700 dark:text-sky-300">
        {translate('study_limits.new_count', { count: counts?.newCount ?? '—' })}
      </Text>
      <Text className="font-nunito text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
        {translate('study_limits.review_count', { count: counts?.dueCount ?? '—' })}
      </Text>
    </View>
  );
}
