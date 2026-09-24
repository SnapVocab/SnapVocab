import type { ReactNode } from 'react';
import type { TxKeyPath } from '@/lib/i18n';
import { Pressable, Switch } from 'react-native';
import { Text, View } from '@/components/ui';
import { ChevronRightIcon } from '@/components/ui/icons';

type Props = {
  icon: ReactNode;
  tx: TxKeyPath;
  /** Current value shown on the right, e.g. "Tiếng Việt" or "20 từ". */
  value?: string;
  /** Present for a toggle row; the row then has no chevron and no onPress. */
  toggle?: { value: boolean; onChange: (value: boolean) => void; disabled?: boolean };
  onPress?: () => void;
  last?: boolean;
  testID?: string;
};

export function SettingsRow({ icon, tx, value, toggle, onPress, last, testID }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      testID={testID}
      className={`flex-row items-center p-4 ${last ? '' : 'border-b border-neutral-50 dark:border-neutral-800'} ${onPress ? 'active:bg-neutral-50 dark:active:bg-neutral-800' : ''}`}
    >
      <View className="mr-3 w-8 items-center justify-center">{icon}</View>
      <Text className="flex-1 text-base font-bold text-mascot-navy dark:text-white" tx={tx} />

      <View className="flex-row items-center gap-2">
        {value !== undefined && <Text className="text-sm text-neutral-500">{value}</Text>}
        {toggle && (
          <Switch
            value={toggle.value}
            onValueChange={toggle.onChange}
            disabled={toggle.disabled}
            trackColor={{ false: '#E5E7EB', true: '#58CC02' }}
            thumbColor="#FFFFFF"
          />
        )}
        {onPress && <ChevronRightIcon color="#9CA3AF" width={18} height={18} />}
      </View>
    </Pressable>
  );
}
