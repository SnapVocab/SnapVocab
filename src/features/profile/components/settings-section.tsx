import type { ReactNode } from 'react';
import type { TxKeyPath } from '@/lib/i18n';
import { Text, View } from '@/components/ui';

type Props = {
  tx: TxKeyPath;
  children: ReactNode;
};

/** A titled card holding {@link SettingsRow}s, as on the Settings design. */
export function SettingsSection({ tx, children }: Props) {
  return (
    <View className="mb-5">
      <Text
        className="mb-2 ml-1 font-nunito text-xs font-extrabold tracking-wider text-neutral-400 uppercase"
        tx={tx}
      />
      <View className="overflow-hidden rounded-3xl border border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        {children}
      </View>
    </View>
  );
}
