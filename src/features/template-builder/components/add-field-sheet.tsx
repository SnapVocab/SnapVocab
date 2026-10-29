import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import type { AddFieldParams } from '../store-types';
import type { CustomFieldInput, DataType, SchemaAttributeDTO, SemanticRole, TopicSchemaDTO } from '../types';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { CloseIcon, PlusIcon } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { translate } from '@/lib/i18n/utils';
import { DataTypeSelector, RoleSelector } from './field-settings-selectors';

type AddFieldSheetProps = {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  schema?: TopicSchemaDTO;
  sectionId: string | null;
  targetColumn?: 1 | 2;
  usedAttributeIds: number[];
  onAddField: (params: AddFieldParams) => void;
};

export function AddFieldSheet({
  bottomSheetRef,
  schema,
  sectionId,
  targetColumn = 1,
  usedAttributeIds,
  onAddField,
}: AddFieldSheetProps) {
  const [activeTab, setActiveTab] = React.useState<'PRESETS' | 'CUSTOM'>('PRESETS');

  // Custom Field Form State
  const [customLabel, setCustomLabel] = React.useState('');
  const [customDataType, setCustomDataType] = React.useState<DataType>('TEXT');
  const [customRole, setCustomRole] = React.useState<SemanticRole>('DEFINITION');
  const [customRequired, setCustomRequired] = React.useState(false);

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

  const handleSelectAttribute = (attribute: SchemaAttributeDTO) => {
    if (!sectionId)
      return;
    onAddField({
      sectionId,
      attribute,
      column: targetColumn,
    });
    bottomSheetRef.current?.dismiss();
  };

  const handleCreateCustomField = () => {
    if (!sectionId || !customLabel.trim())
      return;
    const customField: CustomFieldInput = {
      label: customLabel.trim(),
      dataType: customDataType,
      required: customRequired,
      semanticRole: customRole,
    };

    onAddField({
      sectionId,
      customField,
      column: targetColumn,
    });

    setCustomLabel('');
    setCustomDataType('TEXT');
    setCustomRole('DEFINITION');
    setCustomRequired(false);
    bottomSheetRef.current?.dismiss();
  };

  const groups = schema?.groups ?? [];
  const snapPoints = React.useMemo(() => ['85%'], []);

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
      <View className="flex-1 bg-background px-5 pb-6">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-line pb-3">
          <View>
            <Text
              tx="template_builder.add_field_sheet.title"
              className="font-nunito text-lg font-black text-mascot-navy dark:text-white"
            />
            <Text
              tx="template_builder.add_field_sheet.subtitle"
              className="font-inter text-xs text-neutral-400"
            />
          </View>
          <TouchableOpacity
            onPress={() => bottomSheetRef.current?.dismiss()}
            className="size-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
          >
            <CloseIcon color="#6B7280" width={16} height={16} />
          </TouchableOpacity>
        </View>

        {/* Tab Switcher (Presets vs Custom Field) */}
        <View className="my-3 flex-row rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
          <TouchableOpacity
            onPress={() => setActiveTab('PRESETS')}
            className={`flex-1 items-center rounded-lg py-2 ${
              activeTab === 'PRESETS' ? 'bg-white shadow-sm dark:bg-neutral-700' : ''
            }`}
          >
            <Text
              tx="template_builder.add_field_sheet.tab_presets"
              className={`font-inter text-xs font-bold ${
                activeTab === 'PRESETS'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-neutral-500 dark:text-neutral-400'
              }`}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('CUSTOM')}
            className={`flex-1 items-center rounded-lg py-2 ${
              activeTab === 'CUSTOM' ? 'bg-white shadow-sm dark:bg-neutral-700' : ''
            }`}
          >
            <Text
              tx="template_builder.add_field_sheet.tab_custom"
              className={`font-inter text-xs font-bold ${
                activeTab === 'CUSTOM'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-neutral-500 dark:text-neutral-400'
              }`}
            />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <BottomSheetScrollView
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
          className="flex-1"
        >
          {activeTab === 'PRESETS' ? (
            groups.length === 0 ? (
              <View className="items-center justify-center py-8">
                <Text
                  tx="template_builder.add_field_sheet.no_available_fields"
                  className="font-inter text-xs text-neutral-400"
                />
              </View>
            ) : (
              groups.map(group => (
                <View key={group.groupId} className="mb-4">
                  <Text className="mb-2 font-inter text-xs font-bold tracking-wider text-neutral-400 uppercase">
                    {group.label}
                  </Text>

                  <View className="gap-2">
                    {group.attributes?.map((attr) => {
                      const isUsed = usedAttributeIds.includes(attr.attributeId);
                      return (
                        <TouchableOpacity
                          key={attr.attributeId}
                          onPress={() => handleSelectAttribute(attr)}
                          className="flex-row items-center justify-between rounded-xl border border-line bg-white p-3 shadow-sm active:opacity-70 dark:bg-neutral-800"
                          activeOpacity={0.7}
                        >
                          <View className="flex-1">
                            <View className="flex-row items-center">
                              <Text className="font-inter text-sm font-bold text-mascot-navy dark:text-white">
                                {attr.label}
                              </Text>
                              {attr.required && (
                                <Text className="ml-1 text-xs font-bold text-red-500">*</Text>
                              )}
                              {isUsed && (
                                <View className="ml-2 rounded-md bg-neutral-100 px-1.5 py-0.5 dark:bg-neutral-700">
                                  <Text
                                    tx="template_builder.add_field_sheet.already_added"
                                    className="font-inter text-[10px] text-neutral-500 dark:text-neutral-400"
                                  />
                                </View>
                              )}
                            </View>
                            <Text className="font-inter text-[11px] text-neutral-400">
                              {`${attr.name} • ${attr.dataType}`}
                            </Text>
                          </View>

                          <View className="size-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40">
                            <PlusIcon color="#16A34A" width={16} height={16} />
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))
            )
          ) : (
            <View className="pb-4">
              {/* Display Label */}
              <View className="mb-4">
                <Text
                  tx="template_builder.add_field_sheet.custom_display_label"
                  className="mb-1.5 font-inter text-xs font-bold text-neutral-600 uppercase dark:text-neutral-300"
                />
                <Input
                  value={customLabel}
                  onChangeText={setCustomLabel}
                  placeholder={translate('template_builder.add_field_sheet.custom_display_placeholder')}
                />
              </View>

              {/* Data Type */}
              <DataTypeSelector dataType={customDataType} onSelect={setCustomDataType} />

              {/* Semantic Role */}
              <RoleSelector role={customRole} onSelect={setCustomRole} />

              {/* Required Toggle */}
              <View className="mb-4 rounded-2xl border border-line bg-neutral-50 p-3 dark:bg-neutral-800/50">
                <View className="flex-row items-center justify-between py-1.5">
                  <View className="flex-1 pr-3">
                    <Text
                      tx="template_builder.add_field_sheet.required_label"
                      className="font-inter text-xs font-bold text-mascot-navy dark:text-white"
                    />
                    <Text
                      tx="template_builder.add_field_sheet.required_desc"
                      className="font-inter text-[11px] text-neutral-400"
                    />
                  </View>
                  <Switch
                    value={customRequired}
                    onValueChange={setCustomRequired}
                  />
                </View>
              </View>

              <Button
                label={translate('template_builder.add_field_sheet.btn_create_field')}
                disabled={!customLabel.trim()}
                onPress={handleCreateCustomField}
              />
            </View>
          )}
        </BottomSheetScrollView>
      </View>
    </BottomSheetModal>
  );
}
