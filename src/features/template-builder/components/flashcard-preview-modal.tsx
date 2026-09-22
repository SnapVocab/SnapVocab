import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import type { BuilderField, BuilderSection } from '../types';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { CloseIcon, RotateCwIcon, VolumeIcon } from '@/components/ui/icons';
import { Text } from '@/components/ui/text';
import { translate } from '@/lib/i18n/utils';
import { FONT_SIZE_MAP } from '../types';

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
  const snapPoints = React.useMemo(() => ['85%'], []);

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
  const activeSections = isFront ? frontSections : backSections;

  const handleFlip = () => {
    setCurrentSide(prev => (prev === 'FRONT' ? 'BACK' : 'FRONT'));
  };

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose
      enableContentPanningGesture={false}
      enableOverDrag={false}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 40 }}
    >
      <View className="flex-1 bg-slate-100 dark:bg-neutral-900">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-neutral-200 px-5 pb-3 dark:border-neutral-800">
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
            className="size-8 items-center justify-center rounded-full bg-white shadow-sm dark:bg-neutral-800"
          >
            <CloseIcon color="#6B7280" width={16} height={16} />
          </TouchableOpacity>
        </View>

        {/* Card Canvas */}
        <BottomSheetScrollView
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 20 }}
          className="flex-1 pt-4"
        >
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={handleFlip}
            className="min-h-[380px] rounded-3xl border-2 border-neutral-200 bg-white p-6 shadow-md dark:border-neutral-700 dark:bg-neutral-800"
          >
            {/* Card Top Label */}
            <View className="mb-4 flex-row items-center justify-between border-b border-neutral-100 pb-2 dark:border-neutral-700">
              <View className="rounded-full bg-emerald-100 px-2.5 py-0.5 dark:bg-emerald-950/60">
                <Text
                  tx={isFront ? 'template_builder.front_side' : 'template_builder.back_side'}
                  className="font-inter text-[10px] font-bold text-emerald-700 dark:text-emerald-300"
                />
              </View>
              <Text
                tx="template_builder.preview_modal.tap_to_flip"
                className="font-inter text-[10px] text-neutral-400"
              />
            </View>

            {/* Sections Container */}
            <View className="gap-5">
              {activeSections.map(section => (
                <View
                  key={section.id}
                  className="rounded-2xl bg-neutral-50 p-3.5 dark:bg-neutral-900/50"
                >
                  {section.name ? (
                    <Text className="mb-2 font-inter text-[11px] font-bold tracking-wider text-neutral-400 uppercase">
                      {section.name}
                    </Text>
                  ) : null}

                  {section.columns === 2 ? (
                    <View className="flex-row gap-3">
                      <View className="flex-1 gap-2">
                        {section.fields
                          .filter(f => f.column === 1)
                          .map(f => (
                            <PreviewField key={f.id} field={f} />
                          ))}
                      </View>
                      <View className="flex-1 gap-2">
                        {section.fields
                          .filter(f => f.column === 2)
                          .map(f => (
                            <PreviewField key={f.id} field={f} />
                          ))}
                      </View>
                    </View>
                  ) : (
                    <View className="gap-2">
                      {section.fields.map(f => (
                        <PreviewField key={f.id} field={f} />
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </TouchableOpacity>
        </BottomSheetScrollView>

        {/* Frozen Flip Button at Bottom */}
        <View
          style={{ paddingBottom: Math.max(insets.bottom + 12, 32) }}
          className="border-t border-neutral-200 bg-slate-100 px-5 pt-3.5 dark:border-neutral-800 dark:bg-neutral-900"
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
    </BottomSheetModal>
  );
}

function PreviewField({ field }: { field: BuilderField }) {
  const getSampleText = (f: BuilderField) => {
    if (f.samplePlaceholder) {
      return f.samplePlaceholder;
    }
    switch (f.semanticRole) {
      case 'TARGET_WORD':
        return 'Serendipity';
      case 'AUDIO':
        return '/ˌser.ənˈdɪp.ə.ti/';
      case 'DEFINITION':
        return 'Sự tình cờ may mắn tìm thấy điều gì đó thú vị hay có giá trị.';
      case 'NATIVE_TRANSLATION':
        return 'Sự may mắn bất ngờ';
      case 'EXAMPLE_SENTENCE':
        return 'Finding this cozy coffee shop was pure serendipity.';
      default:
        return f.fieldLabel;
    }
  };

  const textAlign =
    field.alignment === 'CENTER' ? 'center' : field.alignment === 'RIGHT' ? 'right' : 'left';
  const fontSize = FONT_SIZE_MAP[field.fontSize] ?? 16;

  return (
    <View className="flex-row items-center justify-between py-1">
      <View className="flex-1">
        <Text
          style={{
            fontSize,
            color: field.color,
            textAlign,
            fontWeight: field.fontSize === 'XL' ? '700' : '500',
          }}
        >
          {getSampleText(field)}
        </Text>
      </View>

      {field.audioAction && (
        <View className="ml-2 rounded-full bg-blue-50 p-1.5 dark:bg-blue-950/50">
          <VolumeIcon color="#0284C7" width={14} height={14} />
        </View>
      )}
    </View>
  );
}
