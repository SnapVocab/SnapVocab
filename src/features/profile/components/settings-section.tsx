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
    <View className="mb-2">
      <Text
        className="mt-6 mb-3 ml-2 font-nunito text-[15px] font-extrabold tracking-widest text-mascot-navy uppercase dark:text-white"
        tx={tx}
      />
      <View className="overflow-hidden rounded-3xl border border-neutral-100 bg-white shadow-sm shadow-black/5 dark:border-neutral-800 dark:bg-neutral-900">
        {children}
      </View>
    </View>
  );
}
