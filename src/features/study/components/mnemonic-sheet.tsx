import type { BottomSheetBackdropProps, BottomSheetModal } from '@gorhom/bottom-sheet';
import type { Mnemonic } from '../mnemonic-api';
import { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, showErrorMessage, Text } from '@/components/ui';
import { AppBottomSheetModal } from '@/components/ui/app-bottom-sheet-modal';
import { CloseIcon, SparklesIcon } from '@/components/ui/icons';
import { useSurface } from '@/components/ui/surface';
import { translate } from '@/lib/i18n';
import { mnemonicErrorKey, useDeleteMnemonic, useGenerateMnemonic } from '../mnemonic-api';
import { MnemonicText } from './mnemonic-text';

/** The card the sheet works on; the parent owns `mnemonic` and updates it through `onChanged`. */
export type MnemonicTarget = {
  topicItemId: number;
  word?: string | null;
  forgetCount: number;
  mnemonic: Mnemonic | null;
};

type Props = {
  ref: React.Ref<BottomSheetModal | null>;
  target: MnemonicTarget | null;
  onChanged: (topicItemId: number, mnemonic: Mnemonic | null) => void;
  /** The close button: the parent dismisses the sheet. */
  onRequestClose: () => void;
  /** The sheet is gone (closed or swiped away). */
  onDismissed: () => void;
};

/** "Mẹo nhớ AI": create, read, regenerate or remove the learner's mnemonic for one leech word. */
export function MnemonicSheet({ ref, target, onChanged, onRequestClose, onDismissed }: Props) {
  const insets = useSafeAreaInsets();
  const surface = useSurface();
  const generate = useGenerateMnemonic();
  const remove = useDeleteMnemonic();
  const { reset } = generate;

  // A different card starts clean: no previous error or "remaining" line.
  React.useEffect(() => {
    reset();
  }, [target?.topicItemId, reset]);

  const renderBackdrop = React.useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    [],
  );

  const create = () => {
    if (!target)
      return;
    generate.mutate(target.topicItemId, {
      onSuccess: result => onChanged(target.topicItemId, result.mnemonic),
    });
  };

  const discard = () => {
    if (!target)
      return;
    remove.mutate(target.topicItemId, {
      onSuccess: () => onChanged(target.topicItemId, null),
      onError: () => showErrorMessage(translate('mnemonic.delete_error')),
    });
  };

  const mnemonic = target?.mnemonic ?? null;
  const busy = generate.isPending || remove.isPending;

  return (
    <AppBottomSheetModal
      ref={ref}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      onDismiss={onDismissed}
      handleIndicatorStyle={{ backgroundColor: surface.border, width: 36, height: 4 }}
      backgroundStyle={{ backgroundColor: surface.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
    >
      <BottomSheetView
        style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: Math.max(insets.bottom, 16) + 12 }}
        testID="mnemonic-sheet"
      >
        <View className="mb-3 flex-row items-center gap-3">
          <View className="size-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/20">
            <SparklesIcon width={20} height={20} color="#D97706" />
          </View>
          <View className="flex-1">
            <Text className="font-nunito text-lg font-black text-mascot-navy dark:text-white">
              {translate('mnemonic.title')}
            </Text>
            {target?.word
              ? <Text className="font-inter text-sm font-semibold text-neutral-500 dark:text-neutral-400">{target.word}</Text>
              : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={translate('mnemonic.close')}
            onPress={onRequestClose}
            hitSlop={8}
            className="size-9 items-center justify-center rounded-full bg-muted active:bg-pressed"
          >
            <CloseIcon width={16} height={16} color={surface.textMuted} />
          </Pressable>
        </View>

        {generate.isPending
          ? (
              <View className="items-center gap-3 py-8" accessibilityLiveRegion="polite">
                <ActivityIndicator color="#D97706" />
                <Text className="font-inter text-sm text-neutral-500 dark:text-neutral-400">
                  {translate('mnemonic.generating')}
                </Text>
              </View>
            )
          : mnemonic
            ? (
                <View className="gap-3">
                  <View className="gap-2 rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
                    <Text className="self-start rounded-full bg-amber-200/70 px-2.5 py-0.5 font-inter text-[11px] font-bold text-amber-900 dark:bg-amber-500/25 dark:text-amber-100">
                      {translate(`mnemonic.type_${mnemonic.type}`)}
                    </Text>
                    <MnemonicText mnemonic={mnemonic} className="font-inter text-base/6 text-neutral-800 dark:text-neutral-100" />
                  </View>
                  <View className="flex-row gap-2">
                    <Button label={translate('mnemonic.regenerate')} variant="secondary" onPress={create} disabled={busy} className="flex-1" fullWidth={false} testID="mnemonic-regenerate" />
                    <Button label={translate('mnemonic.delete')} variant="ghost" fullWidth={false} onPress={discard} loading={remove.isPending} disabled={busy} testID="mnemonic-delete" />
                  </View>
                </View>
              )
            : (
                <View className="gap-4">
                  <Text className="font-inter text-sm/5 text-neutral-600 dark:text-neutral-300">
                    {translate('mnemonic.create_hint', { count: target?.forgetCount ?? 0 })}
                  </Text>
                  <Button label={translate('mnemonic.create')} variant="reward" onPress={create} disabled={busy || !target} testID="mnemonic-create" />
                </View>
              )}

        {generate.isError && (
          <Text accessibilityRole="alert" className="mt-3 font-inter text-sm text-danger-600 dark:text-danger-400">
            {translate(mnemonicErrorKey(generate.error))}
          </Text>
        )}
        {generate.data && !generate.isPending && (
          <Text className="mt-3 text-center font-inter text-xs text-neutral-400">
            {translate('mnemonic.remaining', { count: generate.data.remainingToday })}
          </Text>
        )}
      </BottomSheetView>
    </AppBottomSheetModal>
  );
}
