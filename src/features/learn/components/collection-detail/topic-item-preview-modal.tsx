import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import type { TopicItemData } from '../../types';
import type { SchemaDTO, TemplateDTO, TopicSchemaDTO } from '@/features/template-builder/types';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, RotateCwIcon } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import { DynamicCardRenderer } from '@/features/card-renderer';
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
        <View className="flex-row items-center justify-between border-b border-neutral-200/80 px-5 pb-3 dark:border-neutral-800">
          <View>
            <Text
              tx="learn.collection_detail.preview_word_title"
              className="font-nunito text-lg font-black text-mascot-navy dark:text-white"
            />
            {totalCount > 0 ? (
              <Text className="font-inter text-xs font-semibold text-neutral-400 dark:text-neutral-500">
                {currentIndex + 1}
                {' '}
                /
                {' '}
                {totalCount}
                {' '}
                thẻ
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
              isInteractive
              minHeight={380}
            />
          ) : (
            <View className="items-center justify-center py-12">
              <Text className="font-inter text-sm text-neutral-400">
                Không tìm thấy dữ liệu thẻ
              </Text>
            </View>
          )}
        </BottomSheetScrollView>

        {/* Footer Navigation & Flip Controls */}
        <View
          style={{ paddingBottom: Math.max(insets.bottom + 12, 28) }}
          className="border-t border-neutral-200/80 bg-white px-4 pt-3.5 dark:border-neutral-800 dark:bg-neutral-900"
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
                    ? 'border-neutral-300 bg-white active:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800'
                    : 'border-neutral-200 bg-neutral-100 opacity-40 dark:border-neutral-800 dark:bg-neutral-900'
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
                    ? 'border-neutral-300 bg-white active:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800'
                    : 'border-neutral-200 bg-neutral-100 opacity-40 dark:border-neutral-800 dark:bg-neutral-900'
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
