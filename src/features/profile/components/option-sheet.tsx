import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import type { ListRenderItemInfo } from 'react-native';
import type { TxKeyPath } from '@/lib/i18n';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useRef } from 'react';
import { useWindowDimensions } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Pressable, Text, useSurface, View } from '@/components/ui';
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

/** h-16 option height. */
const OPTION_HEIGHT = 64;
/** gap-2 between options. */
const OPTION_GAP = 8;
/** h-16 option + gap-2. */
const OPTION_PITCH = OPTION_HEIGHT + OPTION_GAP;

function OptionSeparator() {
  return <View className="h-2" />;
}

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
  const insets = useSafeAreaInsets();
  const surface = useSurface();
  const iconColor = useIconColors();
  const sheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (visible)
      sheetRef.current?.present();
    else
      sheetRef.current?.dismiss();
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.4}
        pressBehavior="close"
      />
    ),
    [],
  );

  // The reminder picker has 48 options; without a cap the sheet grows past the
  // screen and pushes its own title out of view.
  const listMaxHeight = Math.round(height * 0.45);
  // Bring the selected option (else the fallback) into view: 20:00 is the 41st of 48 reminder times.
  const selectedIndex = options.findIndex(o => o.value === selected);
  const anchorIndex = selectedIndex >= 0 ? selectedIndex : options.findIndex(o => o.value === fallbackScrollValue);
  const visibleCount = Math.max(1, Math.floor(listMaxHeight / OPTION_PITCH));
  const initialScrollIndex = anchorIndex > 0
    ? Math.max(0, Math.min(anchorIndex - Math.floor(visibleCount / 2), options.length - 1))
    : undefined;

  const getItemLayout = useCallback(
    (_: ArrayLike<Option<T>> | null | undefined, index: number) => ({
      length: OPTION_HEIGHT,
      offset: OPTION_PITCH * index,
      index,
    }),
    [],
  );

  const renderItem = useCallback(
    ({ item: option }: ListRenderItemInfo<Option<T>>) => {
      const isSelected = option.value === selected;
      return (
        <Pressable
          onPress={() => onSelect(option.value)}
          testID={`option-${option.value}`}
          className={`h-16 flex-row items-center rounded-2xl border-2 px-4 active:bg-pressed ${
            isSelected
              ? 'border-primary-400 bg-primary-50 dark:border-[#7FA35E] dark:bg-primary-500/15'
              : 'border-line bg-surface'
          }`}
        >
          {!!option.emoji && <Text className="mr-3 text-2xl">{option.emoji}</Text>}
          <Text
            className={`flex-1 text-base font-bold ${
              isSelected
                ? 'text-primary-700 dark:text-primary-300'
                : 'text-mascot-navy dark:text-white'
            }`}
          >
            {option.label}
          </Text>
          {isSelected && <CheckIcon color="#58CC02" width={20} height={20} />}
        </Pressable>
      );
    },
    [onSelect, selected],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      stackBehavior="replace"
      onDismiss={onClose}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: surface.border, width: 48, height: 6 }}
      backgroundStyle={{ backgroundColor: surface.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32 }}
    >
      <BottomSheetView style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: Math.max(40, 24 + insets.bottom) }}>
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

        <FlatList
          data={options}
          keyExtractor={item => String(item.value)}
          renderItem={renderItem}
          ItemSeparatorComponent={OptionSeparator}
          getItemLayout={getItemLayout}
          initialScrollIndex={initialScrollIndex}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          style={{ maxHeight: listMaxHeight }}
          className="mb-5"
          showsVerticalScrollIndicator
          bounces={false}
        />

        {clearTx && onClear && (
          <Button tx={clearTx} variant="outline" fullWidth onPress={onClear} className="mb-2" />
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
}
