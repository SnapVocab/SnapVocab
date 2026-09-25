import type { TxKeyPath } from '@/lib/i18n';
import { Modal, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { Button, Text, View } from '@/components/ui';
import { CheckCircleIcon } from '@/components/ui/icons';

export type Option<T> = {
  value: T;
  label: string;
};

type Props<T> = {
  visible: boolean;
  titleTx: TxKeyPath;
  options: Option<T>[];
  selected: T;
  onSelect: (value: T) => void;
  onClose: () => void;
  /** Extra action under the list, e.g. turning the reminder off. */
  clearTx?: TxKeyPath;
  onClear?: () => void;
};

/** Bottom sheet used by Settings for language, appearance and daily goal. */
export function OptionSheet<T extends string | number>({
  visible,
  titleTx,
  options,
  selected,
  onSelect,
  onClose,
  clearTx,
  onClear,
}: Props<T>) {
  const { height } = useWindowDimensions();
  // The reminder picker has 48 options; without a cap the sheet grows past the
  // screen and pushes its own title out of view.
  const listMaxHeight = Math.round(height * 0.45);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 justify-end bg-black/50">
        <Pressable
          onPress={e => e.stopPropagation()}
          className="rounded-t-[36px] border-t-2 border-neutral-100 bg-white p-6 pb-10 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <Text
            className="mb-4 font-nunito text-xl font-extrabold text-mascot-navy dark:text-white"
            tx={titleTx}
          />

          <ScrollView
            style={{ maxHeight: listMaxHeight }}
            className="mb-5"
            showsVerticalScrollIndicator
            bounces={false}
          >
            <View className="gap-2.5">
              {options.map(option => (
                <Pressable
                  key={String(option.value)}
                  onPress={() => onSelect(option.value)}
                  testID={`option-${option.value}`}
                  className={`flex-row items-center justify-between rounded-2xl border-2 p-4 ${
                    option.value === selected
                      ? 'border-b-4 border-primary-500 bg-primary-50/70 dark:bg-primary-500/15'
                      : 'border-b-[3px] border-neutral-200 bg-white active:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900'
                  }`}
                >
                  <Text
                    className={`text-[15px] font-extrabold ${
                      option.value === selected
                        ? 'text-primary-700 dark:text-primary-300'
                        : 'text-mascot-navy dark:text-white'
                    }`}
                  >
                    {option.label}
                  </Text>
                  {option.value === selected && <CheckCircleIcon color="#58CC02" />}
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {clearTx && onClear && (
            <Button tx={clearTx} variant="outline" fullWidth onPress={onClear} className="mb-2" />
          )}
          <Button tx="settings.done" variant="ghost" fullWidth onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
