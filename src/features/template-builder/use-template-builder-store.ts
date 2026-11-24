import type { InitBuilderParams, TemplateBuilderState } from './store-types';
import type { CardSide, TemplateElementDTO } from './types';
import { create } from 'zustand';
import { translate } from '@/lib/i18n';
import {
  builderSectionsToTemplateElements,
  createDefaultFallbackSections,
  templateDTOToBuilderSections,
} from './mappers';
import { createFieldSlice } from './store/field-slice';
import { createSectionSlice } from './store/section-slice';

export * from './store-types';

export const useTemplateBuilderStore = create<TemplateBuilderState>((set, get, api) => ({
  isInitialized: false,
  topicId: undefined,
  topicName: '',
  templateId: undefined,
  templateName: translate('template_builder.default_template_name'),
  activeSide: 'FRONT',
  frontSections: [],
  backSections: [],
  schema: undefined,
  availableAttributes: [],
  isDirty: false,
  previewModalOpen: false,
  savedCustomTemplate: null,

  // Compose Section and Field slices
  ...createSectionSlice(set, get, api),
  ...createFieldSlice(set, get, api),

  setActiveSide: (side: CardSide) => set({ activeSide: side }),

  initBuilder: ({ topicId, topicName, template, schema, force = false }: InitBuilderParams) => {
    const current = get();

    // If already initialized for the same topic context and not forced, preserve modified state!
    if (!force && current.isInitialized && current.topicId === topicId) {
      if (current.availableAttributes.length === 0 && schema?.groups) {
        const attributes = schema.groups.flatMap(g => g.attributes ?? []);
        set({ availableAttributes: attributes });
      }
      return;
    }

    const { frontSections, backSections } = template
      ? templateDTOToBuilderSections(template, schema)
      : createDefaultFallbackSections(schema);

    const attributes = schema?.groups?.flatMap(g => g.attributes ?? []) ?? [];

    set({
      isInitialized: true,
      topicId,
      topicName: topicName ?? '',
      templateId: template?.id,
      templateName: template?.name ?? translate('template_builder.default_template_name'),
      activeSide: 'FRONT',
      frontSections,
      backSections,
      schema,
      availableAttributes: attributes,
      isDirty: false,
      fieldSheetOpen: false,
      editingField: null,
      editingFieldSectionId: null,
      sectionSheetOpen: false,
      editingSection: null,
      isCreatingSection: false,
      addFieldSheetOpen: false,
      addFieldTargetSectionId: null,
      previewModalOpen: false,
    });
  },

  setPreviewModalOpen: (open: boolean) => set({ previewModalOpen: open }),

  setSavedCustomTemplate: savedCustomTemplate => set({ savedCustomTemplate }),

  markSaved: () => set({ isDirty: false }),

  getElementsPayload: (): TemplateElementDTO[] => {
    const { frontSections, backSections } = get();
    return builderSectionsToTemplateElements(frontSections, backSections);
  },

  reset: () => {
    set({
      isInitialized: false,
      topicId: undefined,
      topicName: '',
      templateId: undefined,
      templateName: translate('template_builder.default_template_name'),
      activeSide: 'FRONT',
      frontSections: [],
      backSections: [],
      schema: undefined,
      availableAttributes: [],
      isDirty: false,
      fieldSheetOpen: false,
      editingField: null,
      editingFieldSectionId: null,
      sectionSheetOpen: false,
      editingSection: null,
      isCreatingSection: false,
      addFieldSheetOpen: false,
      addFieldTargetSectionId: null,
      previewModalOpen: false,
    });
  },
}));
