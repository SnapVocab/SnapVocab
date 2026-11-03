import type { TxKeyPath } from '@/lib/i18n';
import { useRef } from 'react';
import { Modal, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { Button, Text, View } from '@/components/ui';
import { CheckIcon, CloseIcon } from '@/components/ui/icons';
import { useIconColors } from '../use-icon-colors';

export type Option<T> = {
  value: T;
  label: string;
  /** Optional emoji shown before the label, e.g. a flag for a language. */
  emoji?: string;
};

type Props<T> = {
  visible: boolean;
  titleTx: TxKeyPath;
  /** Line under the title saying what the choice does. */
  descriptionTx?: TxKeyPath;
  options: Option<T>[];
  /** Option scrolled into view on open when nothing is selected, e.g. 20:00 for a reminder that is off. */
  fallbackScrollValue?: T;
  selected: T;
  onSelect: (value: T) => void;
  onClose: () => void;
  /** Extra action under the list, e.g. turning the reminder off. */
  clearTx?: TxKeyPath;
  onClear?: () => void;
};

/** h-16 option + gap-2. */
const OPTION_PITCH = 72;

/** Bottom sheet used by Settings for language, appearance and daily goal. */
export function OptionSheet<T extends string | number>({
  visible,
  titleTx,
  descriptionTx,
  options,
  fallbackScrollValue,
  selected,
  onSelect,
  onClose,
  clearTx,
  onClear,
}: Props<T>) {
  const { height } = useWindowDimensions();
  const iconColor = useIconColors();
  const listRef = useRef<ScrollView>(null);
  // The reminder picker has 48 options; without a cap the sheet grows past the
  // screen and pushes its own title out of view.
  const listMaxHeight = Math.round(height * 0.45);
  // Bring the selected option (else the fallback) into view: 20:00 is the 41st of 48 reminder times.
  const selectedIndex = options.findIndex(o => o.value === selected);
  const anchorIndex = selectedIndex >= 0 ? selectedIndex : options.findIndex(o => o.value === fallbackScrollValue);
  const scrollToAnchor = () => {
    if (anchorIndex > 0)
      listRef.current?.scrollTo({ y: Math.max(0, anchorIndex * OPTION_PITCH - listMaxHeight / 2 + OPTION_PITCH / 2), animated: false });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 justify-end bg-black/40">
        <Pressable
          onPress={e => e.stopPropagation()}
          className="rounded-t-[32px] bg-surface p-6 pb-10 shadow-xl"
        >
          <View className="mb-6 h-1.5 w-12 self-center rounded-full bg-edge" />

          <View className={`${descriptionTx ? 'mb-1' : 'mb-6'} flex-row items-center justify-between`}>
            <Text
              className="font-nunito text-xl font-extrabold text-mascot-navy dark:text-white"
              tx={titleTx}
            />
            <Pressable onPress={onClose} testID="option-sheet-close" className="-mr-2 p-2">
              <CloseIcon color={iconColor.muted} width={20} height={20} />
            </Pressable>
          </View>
          {!!descriptionTx && (
            <Text className="mb-5 font-inter text-sm text-neutral-500 dark:text-neutral-300" tx={descriptionTx} />
          )}

          <ScrollView
            ref={listRef}
            onContentSizeChange={scrollToAnchor}
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
                  className={`h-16 flex-row items-center rounded-2xl border-2 px-4 active:bg-pressed ${
                    option.value === selected
                      ? 'border-primary-400 bg-primary-50 dark:border-[#7FA35E] dark:bg-primary-500/15'
                      : 'border-line bg-surface'
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
        </Pressable>
      </Pressable>
    </Modal>
  );
}
