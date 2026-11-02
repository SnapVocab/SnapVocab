import type { ReactNode } from 'react';
import type { TxKeyPath } from '@/lib/i18n';
import { Pressable, Text, View } from '@/components/ui';
import { ChevronRightIcon } from '@/components/ui/icons';
import { Switch } from '@/components/ui/switch';
import { useIconColors } from '../use-icon-colors';

type Props = {
  icon: ReactNode;
  tx: TxKeyPath;
  /** Current value shown on the right, e.g. "Tiếng Việt" or "20 từ". */
  value?: string;
  /** Present for a toggle row; the row then has no chevron and no onPress. */
  toggle?: { value: boolean; onChange: (value: boolean) => void; disabled?: boolean };
  /** Second line under the label explaining the current state, e.g. why a reminder will not push. */
  hint?: string;
  onPress?: () => void;
  last?: boolean;
  testID?: string;
};

export function SettingsRow({ icon, tx, value, toggle, hint, onPress, last, testID }: Props) {
  const iconColor = useIconColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      testID={testID}
      className={`flex-row items-center p-4 ${last ? '' : 'border-b border-line'}`}
    >
      <View className="mr-3 w-8 items-center justify-center">{icon}</View>
      <View className="flex-1">
        <Text className="text-base font-bold text-mascot-navy dark:text-white" tx={tx} />
        {!!hint && <Text className="mt-0.5 font-inter text-sm text-neutral-500 dark:text-neutral-300">{hint}</Text>}
      </View>

      <View className="flex-row items-center gap-2">
        {value !== undefined && (
          <Text className="text-sm font-medium text-neutral-500 dark:text-neutral-300">{value}</Text>
        )}
        {toggle && (
          <Switch
            value={toggle.value}
            onValueChange={toggle.onChange}
            disabled={toggle.disabled}
          />
        )}
        {onPress && <ChevronRightIcon color={iconColor.muted} width={18} height={18} />}
      </View>
    </Pressable>
  );
}
