import type { InitBuilderParams, TemplateBuilderState } from './store-types';
import type { CardSide, TemplateElementDTO } from './types';
import { create } from 'zustand';
import {
  builderSectionsToTemplateElements,
  createDefaultFallbackSections,
  templateDTOToBuilderSections,
} from './mappers';
import { createFieldSlice } from './store/field-slice';
import { createSectionSlice } from './store/section-slice';

export * from './store-types';

export const useTemplateBuilderStore = create<TemplateBuilderState>((set, get, api) => ({
  topicId: undefined,
  topicName: '',
  templateId: undefined,
  templateName: 'Thẻ Tiêu Chuẩn',
  activeSide: 'FRONT',
  frontSections: [],
  backSections: [],
  schema: undefined,
  availableAttributes: [],
  isDirty: false,
  previewModalOpen: false,

  // Compose Section and Field slices
  ...createSectionSlice(set, get, api),
  ...createFieldSlice(set, get, api),

  setActiveSide: (side: CardSide) => set({ activeSide: side }),

  initBuilder: ({ topicId, topicName, template, schema }: InitBuilderParams) => {
    const { frontSections, backSections } = template
      ? templateDTOToBuilderSections(template, schema)
      : createDefaultFallbackSections(schema);

    const attributes = schema?.groups?.flatMap(g => g.attributes ?? []) ?? [];

    set({
      topicId,
      topicName: topicName ?? '',
      templateId: template?.id,
      templateName: template?.name ?? 'Thẻ Tiêu Chuẩn',
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

  getElementsPayload: (): TemplateElementDTO[] => {
    const { frontSections, backSections } = get();
    return builderSectionsToTemplateElements(frontSections, backSections);
  },

  reset: () => {
    set({
      topicId: undefined,
      topicName: '',
      templateId: undefined,
      templateName: 'Thẻ Tiêu Chuẩn',
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
