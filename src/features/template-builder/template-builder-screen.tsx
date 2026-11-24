import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { BuilderField, BuilderSection } from './types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { Button, FocusAwareStatusBar, SafeAreaView, showErrorMessage, showSuccessMessage, Text } from '@/components/ui';
import { PlusIcon } from '@/components/ui/icons';
import { translate } from '@/lib/i18n/utils';
import { useCreateTemplate, useForkTopicSchema, useSchema, useSchemas, useSetActiveTemplate, useTopicSchema } from './api';
import {
  AddFieldSheet,
  BuilderHeader,
  FieldSettingsBottomSheet,
  FlashcardPreviewModal,
  SectionCard,
  SectionSettingsBottomSheet,
  TabSegmentedBar,
  TemplateBuilderSkeleton,
} from './components';
import { builderSectionsToTemplateElements } from './mappers';
import { useTemplateBuilderStore } from './use-template-builder-store';

function summarizeSections(sections: BuilderSection[], fallback: string) {
  return (
    sections
      .flatMap(s => s.fields)
      .map(f => f.fieldLabel)
      .filter(Boolean)
      .slice(0, 3)
      .join(', ') || fallback
  );
}

export function TemplateBuilderScreen() {
  const params = useLocalSearchParams<{ topicId?: string; schemaId?: string }>();
  const router = useRouter();

  const topicId = params.topicId ? Number(params.topicId) : undefined;
  const schemaId = params.schemaId ? Number(params.schemaId) : undefined;

  const { data: topicSchema, isLoading: isTopicSchemaLoading } = useTopicSchema(topicId);
  const targetSchemaId = topicSchema?.schemaId ?? (!topicId ? schemaId : undefined);
  const { data: fullSchema, isLoading: isFullSchemaLoading } = useSchema(targetSchemaId);
  const { data: allSchemas, isLoading: isAllSchemasLoading } = useSchemas();

  const isLoading =
    isTopicSchemaLoading ||
    isFullSchemaLoading ||
    (!topicId && !schemaId && isAllSchemasLoading);

  // Determine active schema and default template
  const { schema, defaultTemplate } = React.useMemo(() => {
    if (fullSchema) {
      const defTpl = fullSchema.templates?.find(t => t.isDefault) ?? fullSchema.templates?.[0];
      return {
        schema: {
          topicId: topicId ?? 0,
          schemaId: fullSchema.id,
          name: fullSchema.name,
          shared: topicSchema?.shared,
          usageCount: topicSchema?.usageCount,
          groups: fullSchema.groups ?? [],
        },
        defaultTemplate: defTpl,
      };
    }
    if (topicSchema) {
      return { schema: topicSchema, defaultTemplate: undefined };
    }
    if (allSchemas && allSchemas.length > 0) {
      const systemSchema =
        allSchemas.find(s => s.code === 'DEFAULT_ENGLISH' || s.isSystem) ?? allSchemas[0];
      const defTpl =
        systemSchema.templates?.find(t => t.isDefault) ?? systemSchema.templates?.[0];
      return {
        schema: {
          topicId: 0,
          schemaId: systemSchema.id,
          name: systemSchema.name,
          groups: systemSchema.groups ?? [],
        },
        defaultTemplate: defTpl,
      };
    }
    return { schema: undefined, defaultTemplate: undefined };
  }, [fullSchema, topicSchema, topicId, allSchemas]);

  // Store state and actions
  const activeSide = useTemplateBuilderStore(s => s.activeSide);
  const frontSections = useTemplateBuilderStore(s => s.frontSections);
  const backSections = useTemplateBuilderStore(s => s.backSections);
  const editingField = useTemplateBuilderStore(s => s.editingField);
  const editingSection = useTemplateBuilderStore(s => s.editingSection);
  const isDirty = useTemplateBuilderStore(s => s.isDirty);

  const setActiveSide = useTemplateBuilderStore(s => s.setActiveSide);
  const initBuilder = useTemplateBuilderStore(s => s.initBuilder);
  const openAddSection = useTemplateBuilderStore(s => s.openAddSection);
  const openEditSection = useTemplateBuilderStore(s => s.openEditSection);
  const saveSectionSettings = useTemplateBuilderStore(s => s.saveSectionSettings);
  const deleteSection = useTemplateBuilderStore(s => s.deleteSection);
  const openAddField = useTemplateBuilderStore(s => s.openAddField);
  const addFieldToSection = useTemplateBuilderStore(s => s.addFieldToSection);
  const openEditField = useTemplateBuilderStore(s => s.openEditField);
  const saveFieldSettings = useTemplateBuilderStore(s => s.saveFieldSettings);
  const deleteField = useTemplateBuilderStore(s => s.deleteField);
  const setSavedCustomTemplate = useTemplateBuilderStore(s => s.setSavedCustomTemplate);
  const markSaved = useTemplateBuilderStore(s => s.markSaved);

  const forkMutation = useForkTopicSchema();
  const createTemplateMutation = useCreateTemplate();
  const setActiveTemplateMutation = useSetActiveTemplate();
  const isSaving = forkMutation.isPending || createTemplateMutation.isPending || setActiveTemplateMutation.isPending;

  // BottomSheet Refs
  const fieldSettingsRef = React.useRef<BottomSheetModal>(null);
  const sectionSettingsRef = React.useRef<BottomSheetModal>(null);
  const addFieldRef = React.useRef<BottomSheetModal>(null);
  const previewRef = React.useRef<BottomSheetModal>(null);

  // Target context for adding field
  const [targetSectionIdForAdd, setTargetSectionIdForAdd] = React.useState<string | null>(null);
  const [targetColumnForAdd, setTargetColumnForAdd] = React.useState<1 | 2>(1);

  // Initialize store when schema & template load
  React.useEffect(() => {
    if (schema) {
      initBuilder({ topicId, schema, template: defaultTemplate });
    }
  }, [schema, topicId, defaultTemplate, initBuilder]);

  // Active section list based on tab
  const currentSections = activeSide === 'FRONT' ? frontSections : backSections;
  const frontFieldCount = frontSections.reduce((acc, s) => acc + s.fields.length, 0);
  const backFieldCount = backSections.reduce((acc, s) => acc + s.fields.length, 0);

  // All sections for lookup
  const allSections = [...frontSections, ...backSections];
  const usedAttributeIds = allSections.flatMap(s => s.fields).map(f => f.schemaAttributeId);
  const editingFieldSection = allSections.find(s => s.fields.some(f => f.id === editingField?.id));

  const handleOpenFieldSettings = (field: BuilderField, sectionId: string) => {
    openEditField(sectionId, field.id);
    fieldSettingsRef.current?.present();
  };

  const handleOpenSectionSettings = (section: BuilderSection) => {
    openEditSection(section.id);
    sectionSettingsRef.current?.present();
  };

  const handleOpenAddField = (sectionId: string, column: 1 | 2 = 1) => {
    setTargetSectionIdForAdd(sectionId);
    setTargetColumnForAdd(column);
    openAddField(sectionId);
    addFieldRef.current?.present();
  };

  const handleSave = async () => {
    if (!isDirty) {
      router.back();
      return;
    }

    const elements = builderSectionsToTemplateElements(frontSections, backSections);
    if (elements.length === 0) {
      router.back();
      return;
    }

    try {
      let targetSaveSchemaId = schema?.schemaId;
      if (topicId && topicSchema?.shared) {
        const forked = await forkMutation.mutateAsync({ topicId });
        targetSaveSchemaId = forked.schemaId;
      }
      if (!targetSaveSchemaId) {
        showErrorMessage(translate('learn.create_topic.create_error'));
        return;
      }

      const baseName = defaultTemplate?.name || schema?.name || translate('template_builder.default_template_name');
      const customName = baseName.includes('(Custom)') ? baseName : `${baseName} (Custom)`;
      const created = await createTemplateMutation.mutateAsync({
        schemaId: targetSaveSchemaId,
        name: customName,
        isDefault: !topicId,
        elements,
      });

      if (topicId) {
        await setActiveTemplateMutation.mutateAsync({ topicId, templateId: created.id });
      }
      else {
        setSavedCustomTemplate({
          schemaId: created.schemaId,
          templateId: created.id,
          name: created.name,
          frontSummary: summarizeSections(frontSections, translate('learn.create_topic.layout_front_value')),
          backSummary: summarizeSections(backSections, translate('learn.create_topic.layout_back_value')),
        });
      }
      markSaved();
      showSuccessMessage(translate('template_builder.save_config'));
      router.back();
    }
    catch (error: any) {
      const message = error?.response?.data?.error || error?.response?.data?.message || translate('learn.create_topic.create_error');
      showErrorMessage(message);
    }
  };

  if (isLoading) {
    return <TemplateBuilderSkeleton />;
  }

  const sideLabel =
    activeSide === 'FRONT'
      ? translate('template_builder.front_side_label')
      : translate('template_builder.back_side_label');

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-background">
      <FocusAwareStatusBar />

      {/* Header */}
      <BuilderHeader
        templateName={schema?.name ?? translate('template_builder.default_template_name')}
        onPreviewPress={() => previewRef.current?.present()}
      />

      {/* Tab Segmented Bar */}
      <TabSegmentedBar
        activeTab={activeSide}
        onTabChange={setActiveSide}
        frontFieldCount={frontFieldCount}
        backFieldCount={backFieldCount}
      />

      {/* Canvas Scroll Area */}
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {currentSections.map(section => (
          <SectionCard
            key={section.id}
            section={section}
            side={activeSide}
            onSectionSettingsPress={handleOpenSectionSettings}
            onFieldPress={handleOpenFieldSettings}
            onAddFieldPress={handleOpenAddField}
          />
        ))}

        {/* Add New Section Button */}
        <TouchableOpacity
          onPress={() => {
            openAddSection(activeSide);
            sectionSettingsRef.current?.present();
          }}
          className="mb-8 flex-row items-center justify-center rounded-2xl border-2 border-dashed border-emerald-500/40 bg-emerald-50/50 py-3.5 active:opacity-70 dark:border-emerald-700/50 dark:bg-emerald-950/20"
          activeOpacity={0.7}
        >
          <PlusIcon color="#16A34A" width={18} height={18} />
          <Text className="ml-2 font-inter text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {translate('template_builder.add_section', { side: sideLabel })}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Sticky Bottom Save CTA */}
      <View className="border-t border-line bg-surface p-4 shadow-lg">
        <Button
          label={
            isDirty
              ? translate('template_builder.save_config')
              : translate('template_builder.done')
          }
          loading={isSaving}
          onPress={() => void handleSave()}
        />
      </View>

      {/* 4 Bottom Sheets */}
      <FieldSettingsBottomSheet
        bottomSheetRef={fieldSettingsRef}
        field={editingField}
        sectionColumns={editingFieldSection?.columns}
        onSave={(updated) => {
          saveFieldSettings(updated);
        }}
        onDelete={() => {
          if (editingField && editingFieldSection) {
            deleteField(editingFieldSection.id, editingField.id);
          }
        }}
      />

      <SectionSettingsBottomSheet
        bottomSheetRef={sectionSettingsRef}
        section={editingSection}
        onSave={(updated) => {
          saveSectionSettings({
            name: updated.name ?? translate('template_builder.section_settings.default_new_section'),
            columns: updated.columns ?? 1,
            repeatable: updated.repeatable ?? false,
          });
        }}
        onDelete={() => {
          if (editingSection) {
            deleteSection(editingSection.id);
          }
        }}
      />

      <AddFieldSheet
        bottomSheetRef={addFieldRef}
        schema={schema}
        sectionId={targetSectionIdForAdd}
        targetColumn={targetColumnForAdd}
        usedAttributeIds={usedAttributeIds}
        onAddField={addFieldToSection}
      />

      <FlashcardPreviewModal
        bottomSheetRef={previewRef}
        frontSections={frontSections}
        backSections={backSections}
      />
    </SafeAreaView>
  );
}
