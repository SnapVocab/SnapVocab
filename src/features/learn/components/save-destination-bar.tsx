import type { SaveDestination } from '../save-destination';
import { Pressable } from 'react-native';
import { Text, View } from '@/components/ui';
import { FolderIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';

type Props = {
  destination: SaveDestination | null;
  onChange: () => void;
  disabled?: boolean;
};

/** "Lưu vào <collection> › <topic> · Đổi" (BF-07 step 2/6): the learner always sees where a tap saves. */
export function SaveDestinationBar({ destination, onChange, disabled }: Props) {
  const path = destination
    ? [destination.collectionName, destination.topicName].filter(Boolean).join(' › ')
    : translate('scan.result.default_topic');
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-2.5">
      <FolderIcon width={18} height={18} color="#65A30D" />
      <View className="flex-1">
        <Text className="text-xs text-neutral-500 dark:text-neutral-400" tx="scan.result.save_to" />
        <Text numberOfLines={1} className="font-nunito text-sm font-black text-mascot-navy dark:text-white" testID="save-destination-path">
          {path}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={translate('scan.result.change_topic_a11y', { path })}
        onPress={onChange}
        disabled={disabled}
        hitSlop={8}
        testID="save-destination-change"
        className="min-h-11 justify-center rounded-xl px-3 active:bg-pressed"
      >
        <Text className="text-sm font-bold text-primary-700 dark:text-primary-200" tx="scan.result.change_topic" />
      </Pressable>
    </View>
  );
}
