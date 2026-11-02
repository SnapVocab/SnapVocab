import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import type { TopicItemData } from '../../types';
import type { SchemaDTO, TemplateDTO, TopicSchemaDTO } from '@/features/template-builder/types';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import * as React from 'react';
import { TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, RotateCwIcon } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import { DynamicCardRenderer } from '@/features/card-renderer';
import { useEquippedCardFrame } from '@/features/card-renderer/card-frame';
import { translate } from '@/lib/i18n/utils';

type Props = {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  item: TopicItemData | null;
  items?: TopicItemData[];
  currentIndex?: number;
  template?: TemplateDTO | null;
  schema?: TopicSchemaDTO | SchemaDTO | null;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
};

export function TopicItemPreviewModal({
  bottomSheetRef,
  item,
  items,
  currentIndex = 0,
  template,
  schema,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const [currentSide, setCurrentSide] = React.useState<'FRONT' | 'BACK'>('FRONT');
  const snapPoints = React.useMemo(() => ['88%'], []);
  // The learner's own card, so it wears the equipped card frame like in study (card_frame_plan.md PD-CF-01).
  const { frameUrl, onFrameError } = useEquippedCardFrame();
  // A framed card is 3:4: cap its height so the header and the flip/next controls stay on screen.
  const framedMaxHeight = Math.round(useWindowDimensions().height * 0.55);

  const handlePrev = () => {
    setCurrentSide('FRONT');
    onPrev?.();
  };

  const handleNext = () => {
    setCurrentSide('FRONT');
    onNext?.();
  };

  const handleDismiss = () => {
    setCurrentSide('FRONT');
  };

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

  const handleFlip = () => {
    setCurrentSide(prev => (prev === 'FRONT' ? 'BACK' : 'FRONT'));
  };

  const handleClose = () => {
    bottomSheetRef.current?.dismiss();
  };

  const totalCount = items ? items.length : 0;
  const isFront = currentSide === 'FRONT';

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose
      enableContentPanningGesture={false}
      enableOverDrag={false}
      backdropComponent={renderBackdrop}
      onDismiss={handleDismiss}
      handleIndicatorStyle={{ backgroundColor: '#CBD5E1', width: 40 }}
      backgroundStyle={{
        backgroundColor: '#F8FAFC',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
      }}
    >
      <View className="flex-1 bg-slate-50 dark:bg-neutral-950">
        {/* Modal Top Header */}
        <View className="flex-row items-center justify-between border-b border-line px-5 pb-3">
          <View>
            <Text
              tx="learn.collection_detail.preview_word_title"
              className="font-nunito text-lg font-black text-mascot-navy dark:text-white"
            />
            {totalCount > 0 ? (
              <Text className="font-inter text-xs font-semibold text-neutral-400 dark:text-neutral-400">
                {translate('learn.collection_detail.card_counter', {
                  current: currentIndex + 1,
                  total: totalCount,
                })}
              </Text>
            ) : null}
          </View>

          {/* Close Button */}
          <TouchableOpacity
            onPress={handleClose}
            activeOpacity={0.7}
            hitSlop={8}
            className="size-8 items-center justify-center rounded-full bg-white shadow-xs dark:bg-neutral-800"
          >
            <CloseIcon color="#64748B" width={16} height={16} />
          </TouchableOpacity>
        </View>

        {/* Scrollable Center Canvas */}
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
          {item ? (
            <DynamicCardRenderer
              key={`preview-card-${item.topicItemId}`}
              data={item}
              template={template ?? undefined}
              schema={schema ?? undefined}
              side={currentSide}
              onFlip={setCurrentSide}
              isInteractive={false}
              minHeight={380}
              frameUrl={frameUrl}
              maxHeight={framedMaxHeight}
              onFrameError={onFrameError}
            />
          ) : (
            <View className="items-center justify-center py-12">
              <Text className="font-inter text-sm text-neutral-400">
                {translate('learn.collection_detail.card_not_found')}
              </Text>
            </View>
          )}
        </BottomSheetScrollView>

        {/* Footer Navigation & Flip Controls */}
        <View
          style={{ paddingBottom: Math.max(insets.bottom + 12, 28) }}
          className="border-t border-line bg-surface px-4 pt-3.5"
        >
          <View className="flex-row items-center gap-2">
            {/* Prev Word Button */}
            {items && totalCount > 1 ? (
              <TouchableOpacity
                onPress={handlePrev}
                disabled={!hasPrev}
                activeOpacity={0.7}
                className={`size-11 items-center justify-center rounded-2xl border ${
                  hasPrev
                    ? 'border-edge bg-white active:bg-pressed dark:bg-neutral-800'
                    : 'border-line bg-muted opacity-40'
                }`}
              >
                <ChevronLeftIcon color={hasPrev ? '#0F172A' : '#94A3B8'} width={20} height={20} />
              </TouchableOpacity>
            ) : null}

            {/* Flip Action Button */}
            <View className="flex-1">
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

            {/* Next Word Button */}
            {items && totalCount > 1 ? (
              <TouchableOpacity
                onPress={handleNext}
                disabled={!hasNext}
                activeOpacity={0.7}
                className={`size-11 items-center justify-center rounded-2xl border ${
                  hasNext
                    ? 'border-edge bg-white active:bg-pressed dark:bg-neutral-800'
                    : 'border-line bg-muted opacity-40'
                }`}
              >
                <ChevronRightIcon color={hasNext ? '#0F172A' : '#94A3B8'} width={20} height={20} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </BottomSheetModal>
  );
}

export default TopicItemPreviewModal;
