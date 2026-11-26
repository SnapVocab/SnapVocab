import type { BottomSheetBackdropProps, BottomSheetModal } from '@gorhom/bottom-sheet';
import type { BuilderSection } from '../types';
import { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBottomSheetModal } from '@/components/ui/app-bottom-sheet-modal';
import { Button } from '@/components/ui/button';
import { CloseIcon, RotateCwIcon } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import { DynamicCardRenderer } from '@/features/card-renderer';
import { translate } from '@/lib/i18n/utils';

type FlashcardPreviewModalProps = {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  frontSections: BuilderSection[];
  backSections: BuilderSection[];
};

export function FlashcardPreviewModal({
  bottomSheetRef,
  frontSections,
  backSections,
}: FlashcardPreviewModalProps) {
  const insets = useSafeAreaInsets();
  const [currentSide, setCurrentSide] = React.useState<'FRONT' | 'BACK'>('FRONT');
  const snapPoints = React.useMemo(() => ['88%'], []);

  const renderBackdrop = React.useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  const isFront = currentSide === 'FRONT';

  const handleFlip = () => {
    setCurrentSide(prev => (prev === 'FRONT' ? 'BACK' : 'FRONT'));
  };

  return (
    <AppBottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose
      enableContentPanningGesture={false}
      enableOverDrag={false}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: '#CBD5E1', width: 40 }}
      backgroundStyle={{
        backgroundColor: '#F8FAFC',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
      }}
    >
      <View className="flex-1 bg-slate-50 dark:bg-neutral-950">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-line px-5 pb-3">
          <View>
            <Text
              tx="template_builder.preview_modal.title"
              className="font-nunito text-lg font-black text-mascot-navy dark:text-white"
            />
            <Text
              tx={
                isFront
                  ? 'template_builder.preview_modal.front_subtitle'
                  : 'template_builder.preview_modal.back_subtitle'
              }
              className="font-inter text-xs text-neutral-500 dark:text-neutral-400"
            />
          </View>
          <TouchableOpacity
            onPress={() => bottomSheetRef.current?.dismiss()}
            activeOpacity={0.7}
            hitSlop={8}
            className="size-8 items-center justify-center rounded-full bg-white shadow-xs dark:bg-neutral-800"
          >
            <CloseIcon color="#64748B" width={16} height={16} />
          </TouchableOpacity>
        </View>

        {/* Dynamic Card Canvas */}
        <BottomSheetScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 24,
            flexGrow: 1,
            justifyContent: 'center',
          }}
        >
          <DynamicCardRenderer
            frontSections={frontSections}
            backSections={backSections}
            side={currentSide}
            onFlip={setCurrentSide}
            isInteractive={false}
            minHeight={380}
          />
        </BottomSheetScrollView>

        {/* Frozen Flip Button at Bottom */}
        <View
          style={{ paddingBottom: Math.max(insets.bottom + 12, 28) }}
          className="border-t border-line bg-surface px-5 pt-3.5"
        >
          <Button
            label={
              isFront
                ? translate('template_builder.preview_modal.flip_to_back')
                : translate('template_builder.preview_modal.flip_to_front')
            }
            icon={<RotateCwIcon color="#FFFFFF" width={18} height={18} />}
            onPress={handleFlip}
          />
        </View>
      </View>
    </AppBottomSheetModal>
  );
}

export default FlashcardPreviewModal;
