import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import type { BuilderSection, ColumnLayout } from '../types';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { Switch, TouchableOpacity, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { CloseIcon, TrashIcon } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { translate } from '@/lib/i18n/utils';

type SectionSettingsBottomSheetProps = {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  section: BuilderSection | null;
  onSave: (updated: Partial<BuilderSection>) => void;
  onDelete: () => void;
};

export function SectionSettingsBottomSheet({
  bottomSheetRef,
  section,
  onSave,
  onDelete,
}: SectionSettingsBottomSheetProps) {
  const [name, setName] = React.useState('');
  const [columns, setColumns] = React.useState<ColumnLayout>(1);
  const [repeatable, setRepeatable] = React.useState(false);

  const prevSectionIdRef = React.useRef<string | null>(null);
  if (section && section.id !== prevSectionIdRef.current) {
    prevSectionIdRef.current = section.id;
    setName(section.name);
    setColumns(section.columns);
    setRepeatable(section.repeatable);
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
      name,
      columns,
      repeatable,
    });
    bottomSheetRef.current?.dismiss();
  };

  const handleDelete = () => {
    onDelete();
    bottomSheetRef.current?.dismiss();
  };

  if (!section) {
    return null;
  }

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      enableDynamicSizing
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 40 }}
    >
      <BottomSheetView className="rounded-t-3xl bg-white px-5 pt-1 pb-8 dark:bg-neutral-900">
        <View className="flex-row items-center justify-between border-b border-neutral-100 pb-3 dark:border-neutral-800">
          <View>
            <Text
              tx="template_builder.section_settings.title"
              className="font-nunito text-lg font-black text-mascot-navy dark:text-white"
            />
            <Text className="font-inter text-xs text-neutral-400">{section.name}</Text>
          </View>
          <TouchableOpacity
            onPress={() => bottomSheetRef.current?.dismiss()}
            className="size-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
          >
            <CloseIcon color="#6B7280" width={16} height={16} />
          </TouchableOpacity>
        </View>

        <View className="pt-4">
          {/* Section Name */}
          <View className="mb-4">
            <Text
              tx="template_builder.section_settings.section_name"
              className="mb-1.5 font-inter text-xs font-bold text-neutral-600 uppercase dark:text-neutral-300"
            />
            <Input
              value={name}
              onChangeText={setName}
              placeholder={translate('template_builder.section_settings.section_name_placeholder')}
            />
          </View>

          {/* Column Layout Selector */}
          <ColumnLayoutSelector columns={columns} onSelect={setColumns} />

          {/* Repeatable 1-n Option */}
          <RepeatableOption
            repeatable={repeatable}
            onToggleRepeatable={setRepeatable}
          />
        </View>

        {/* Action Row: Delete Icon Button + Apply Button on Same Line */}
        <View className="flex-row items-center gap-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
          <TouchableOpacity
            onPress={handleDelete}
            className="size-12 items-center justify-center rounded-2xl border border-red-200 bg-red-50 active:opacity-70 dark:border-red-900 dark:bg-red-950/30"
            activeOpacity={0.7}
          >
            <TrashIcon color="#DC2626" width={20} height={20} />
          </TouchableOpacity>

          <View className="flex-1">
            <Button
              label={translate('template_builder.section_settings.apply_changes')}
              onPress={handleApply}
            />
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

function ColumnLayoutSelector({
  columns,
  onSelect,
}: {
  columns: ColumnLayout;
  onSelect: (c: ColumnLayout) => void;
}) {
  return (
    <View className="mb-4">
      <Text
        tx="template_builder.section_settings.column_layout"
        className="mb-1.5 font-inter text-xs font-bold text-neutral-600 uppercase dark:text-neutral-300"
      />
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={() => onSelect(1)}
          className={`flex-1 items-center rounded-xl border py-3 ${
            columns === 1
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
              : 'border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800'
          }`}
        >
          <Text
            className={`font-inter text-xs font-bold ${
              columns === 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-700 dark:text-neutral-300'
            }`}
          >
            {`1 ${translate('template_builder.one_column_badge')} (100%)`}
          </Text>
          <Text
            tx="template_builder.section_settings.one_col_desc"
            className="mt-0.5 font-inter text-[10px] text-neutral-400"
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onSelect(2)}
          className={`flex-1 items-center rounded-xl border py-3 ${
            columns === 2
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
              : 'border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800'
          }`}
        >
          <Text
            className={`font-inter text-xs font-bold ${
              columns === 2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-700 dark:text-neutral-300'
            }`}
          >
            {`2 ${translate('template_builder.two_column_badge')} (50% - 50%)`}
          </Text>
          <Text
            tx="template_builder.section_settings.two_col_desc"
            className="mt-0.5 font-inter text-[10px] text-neutral-400"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function RepeatableOption({
  repeatable,
  onToggleRepeatable,
}: {
  repeatable: boolean;
  onToggleRepeatable: (v: boolean) => void;
}) {
  return (
    <View className="mb-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800/50">
      <View className="flex-row items-center justify-between py-1.5">
        <View className="flex-1 pr-3">
          <Text
            tx="template_builder.section_settings.repeatable"
            className="font-inter text-xs font-bold text-mascot-navy dark:text-white"
          />
          <Text
            tx="template_builder.section_settings.repeatable_desc"
            className="font-inter text-[11px] text-neutral-400"
          />
        </View>
        <Switch
          value={repeatable}
          onValueChange={onToggleRepeatable}
          trackColor={{ false: '#E5E7EB', true: '#16A34A' }}
        />
      </View>
    </View>
  );
}
