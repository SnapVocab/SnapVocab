import type { BottomSheetBackdropProps, BottomSheetModal } from '@gorhom/bottom-sheet';
import type { Alignment, BuilderField, DataType, FontSize, SemanticRole } from '../types';
import { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBottomSheetModal } from '@/components/ui/app-bottom-sheet-modal';
import { Button } from '@/components/ui/button';
import { CloseIcon, TrashIcon } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { useSurface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { translate } from '@/lib/i18n/utils';
import {
  AlignmentSelector,
  ColorPicker,
  ColumnSelector,
  DataTypeSelector,
  FontSizeSelector,
  RoleSelector,
  ToggleSection,
} from './field-settings-selectors';

type FieldSettingsBottomSheetProps = {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  field: BuilderField | null;
  sectionColumns?: 1 | 2;
  onSave: (updated: Partial<BuilderField>) => void;
  onDelete: () => void;
};

export function FieldSettingsBottomSheet({
  bottomSheetRef,
  field,
  sectionColumns = 1,
  onSave,
  onDelete,
}: FieldSettingsBottomSheetProps) {
  const surface = useSurface();
  const insets = useSafeAreaInsets();
  const [label, setLabel] = React.useState('');
  const [dataType, setDataType] = React.useState<DataType>('TEXT');
  const [required, setRequired] = React.useState(false);
  const [role, setRole] = React.useState<SemanticRole | null>(null);
  const [hideIfEmpty, setHideIfEmpty] = React.useState(false);
  const [audioAction, setAudioAction] = React.useState(false);
  const [fontSize, setFontSize] = React.useState<FontSize>('M');
  const [alignment, setAlignment] = React.useState<Alignment>('LEFT');
  const [color, setColor] = React.useState('#111827');
  const [column, setColumn] = React.useState<1 | 2>(1);

  const snapPoints = React.useMemo(() => ['85%'], []);

  const prevFieldIdRef = React.useRef<string | null>(null);
  if (field && field.id !== prevFieldIdRef.current) {
    prevFieldIdRef.current = field.id;
    setLabel(field.fieldLabel);
    setDataType(field.dataType ?? 'TEXT');
    setRequired(field.required);
    setRole(field.semanticRole);
    setHideIfEmpty(field.hideIfEmpty);
    setAudioAction(field.audioAction);
    setFontSize(field.fontSize);
    setAlignment(field.alignment);
    setColor(field.color);
    setColumn(field.column);
  }

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

  const handleApply = () => {
    onSave({
      fieldLabel: label,
      dataType,
      required,
      semanticRole: role,
      hideIfEmpty,
      audioAction,
      fontSize,
      alignment,
      color,
      column,
    });
    bottomSheetRef.current?.dismiss();
  };

  const handleDelete = () => {
    onDelete();
    bottomSheetRef.current?.dismiss();
  };

  if (!field) {
    return null;
  }

  return (
    <AppBottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose
      enableContentPanningGesture={false}
      enableOverDrag={false}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 40 }}
      backgroundStyle={{ backgroundColor: surface.background }}
    >
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-line px-5 pb-3">
          <View>
            <Text
              tx="template_builder.field_settings.title"
              className="font-nunito text-lg font-black text-mascot-navy dark:text-white"
            />
            <Text className="font-inter text-xs text-neutral-400">{field.attributeName}</Text>
          </View>
          <TouchableOpacity
            onPress={() => bottomSheetRef.current?.dismiss()}
            className="size-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
          >
            <CloseIcon color="#6B7280" width={16} height={16} />
          </TouchableOpacity>
        </View>

        {/* Scrollable Form Content */}
        <BottomSheetScrollView
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 20 }}
          className="flex-1 pt-4"
        >
          {/* Display Label */}
          <View className="mb-4">
            <Text
              tx="template_builder.field_settings.display_name"
              className="mb-1.5 font-inter text-xs font-bold text-neutral-600 uppercase dark:text-neutral-300"
            />
            <Input
              value={label}
              onChangeText={setLabel}
              placeholder={translate('template_builder.field_settings.display_name_placeholder')}
            />
          </View>

          {/* Schema Data Type */}
          <DataTypeSelector dataType={dataType} onSelect={setDataType} />

          {/* Semantic Role */}
          <RoleSelector role={role} onSelect={setRole} />

          {/* Column selector for 2-column sections */}
          {sectionColumns === 2 && (
            <ColumnSelector column={column} onSelect={setColumn} />
          )}

          {/* Toggles (Required, HideIfEmpty, AudioAction) */}
          <ToggleSection
            required={required}
            onToggleRequired={setRequired}
            hideIfEmpty={hideIfEmpty}
            onToggleHideIfEmpty={setHideIfEmpty}
            audioAction={audioAction}
            onToggleAudioAction={setAudioAction}
          />

          {/* Font Size */}
          <FontSizeSelector fontSize={fontSize} onSelect={setFontSize} />

          {/* Text Alignment */}
          <AlignmentSelector alignment={alignment} onSelect={setAlignment} />

          {/* Text Color */}
          <ColorPicker color={color} onSelect={setColor} />
        </BottomSheetScrollView>

        {/* Frozen Action Row at Bottom */}
        <View
          style={{ paddingBottom: Math.max(insets.bottom + 12, 32) }}
          className="flex-row items-center gap-3 border-t border-line bg-surface px-5 pt-3.5"
        >
          <TouchableOpacity
            onPress={handleDelete}
            className="size-12 items-center justify-center rounded-2xl border border-red-200 bg-red-50 active:opacity-70 dark:border-red-900 dark:bg-red-950/30"
            activeOpacity={0.7}
          >
            <TrashIcon color="#DC2626" width={20} height={20} />
          </TouchableOpacity>

          <View className="flex-1">
            <Button
              label={translate('template_builder.field_settings.apply_changes')}
              onPress={handleApply}
            />
          </View>
        </View>
      </View>
    </AppBottomSheetModal>
  );
}
