import type { TxKeyPath } from '@/lib/i18n';
import { Modal, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { Button, Text, View } from '@/components/ui';
import { CheckIcon, CloseIcon } from '@/components/ui/icons';

export type Option<T> = {
  value: T;
  label: string;
  /** Optional emoji shown before the label, e.g. a flag for a language. */
  emoji?: string;
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
      <Pressable onPress={onClose} className="flex-1 justify-end bg-black/40">
        <Pressable
          onPress={e => e.stopPropagation()}
          className="rounded-t-[32px] bg-white p-6 pb-10 shadow-xl dark:bg-neutral-900"
        >
          <View className="mb-6 h-1.5 w-12 self-center rounded-full bg-neutral-200 dark:bg-neutral-700" />

          <View className="mb-6 flex-row items-center justify-between">
            <Text
              className="font-nunito text-xl font-extrabold text-mascot-navy dark:text-white"
              tx={titleTx}
            />
            <Pressable onPress={onClose} testID="option-sheet-close" className="-mr-2 p-2">
              <CloseIcon color="#9CA3AF" width={20} height={20} />
            </Pressable>
          </View>

          <ScrollView
            style={{ maxHeight: listMaxHeight }}
            className="mb-5"
            showsVerticalScrollIndicator
            bounces={false}
          >
            <View className="gap-2">
              {options.map(option => (
                <Pressable
                  key={String(option.value)}
                  onPress={() => onSelect(option.value)}
                  testID={`option-${option.value}`}
                  className={`h-16 flex-row items-center rounded-2xl border-2 px-4 active:opacity-70 ${
                    option.value === selected
                      ? 'border-primary-400 bg-primary-50 dark:bg-primary-500/15'
                      : 'border-neutral-100 bg-white dark:border-neutral-700 dark:bg-neutral-900'
                  }`}
                >
                  {!!option.emoji && <Text className="mr-3 text-2xl">{option.emoji}</Text>}
                  <Text
                    className={`flex-1 text-base font-bold ${
                      option.value === selected
                        ? 'text-primary-700 dark:text-primary-300'
                        : 'text-mascot-navy dark:text-white'
                    }`}
                  >
                    {option.label}
                  </Text>
                  {option.value === selected && <CheckIcon color="#58CC02" width={20} height={20} />}
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
