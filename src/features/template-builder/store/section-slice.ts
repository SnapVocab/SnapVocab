import type { StateCreator } from 'zustand';
import type { SaveSectionParams, TemplateBuilderState } from '../store-types';
import type { BuilderSection, CardSide } from '../types';
import { translate } from '@/lib/i18n';
import { createEmptySection } from '../mappers';
import { removeSectionFromList, updateSectionInList } from '../store-helpers';

export type SectionSlice = {
  sectionSheetOpen: boolean;
  editingSection: BuilderSection | null;
  isCreatingSection: boolean;

  openAddSection: (side?: CardSide) => void;
  openEditSection: (sectionId: string) => void;
  closeSectionSheet: () => void;
  saveSectionSettings: (data: SaveSectionParams) => void;
  deleteSection: (sectionId: string) => void;
};

export const createSectionSlice: StateCreator<TemplateBuilderState, [], [], SectionSlice> = (
  set,
  get,
) => ({
  sectionSheetOpen: false,
  editingSection: null,
  isCreatingSection: false,

  openAddSection: (side?: CardSide) => {
    const targetSide = side ?? get().activeSide;
    const newSection = createEmptySection({
      name: translate(targetSide === 'FRONT' ? 'template_builder.default_new_front_section' : 'template_builder.default_new_back_section'),
      side: targetSide,
      columns: 1,
    });
    set({ editingSection: newSection, isCreatingSection: true, sectionSheetOpen: true });
  },

  openEditSection: (sectionId: string) => {
    const { frontSections, backSections } = get();
    const section = [...frontSections, ...backSections].find(s => s.id === sectionId);
    if (section) {
      set({ editingSection: { ...section }, isCreatingSection: false, sectionSheetOpen: true });
    }
  },

  closeSectionSheet: () => {
    set({ sectionSheetOpen: false, editingSection: null, isCreatingSection: false });
  },

  saveSectionSettings: ({ name, columns, repeatable }: SaveSectionParams) => {
    const { editingSection, isCreatingSection, activeSide, frontSections, backSections } = get();
    if (!editingSection)
      return;

    if (isCreatingSection) {
      const newSec: BuilderSection = {
        ...editingSection,
        name: name.trim() || translate('template_builder.section_settings.default_new_section'),
        columns,
        repeatable,
        fields: [],
      };
      const isFront = (editingSection.side ?? activeSide) === 'FRONT';
      set({
        frontSections: isFront ? [...frontSections, newSec] : frontSections,
        backSections: isFront ? backSections : [...backSections, newSec],
        isDirty: true,
        sectionSheetOpen: false,
        editingSection: null,
        isCreatingSection: false,
      });
    }
    else {
      const updater = (sec: BuilderSection) => ({
        ...sec,
        name: name.trim() || sec.name,
        columns,
        repeatable,
        fields: columns === 1 ? sec.fields.map(f => ({ ...f, column: 1 as const })) : sec.fields,
      });
      set({
        frontSections: updateSectionInList(frontSections, editingSection.id, updater),
        backSections: updateSectionInList(backSections, editingSection.id, updater),
        isDirty: true,
        sectionSheetOpen: false,
        editingSection: null,
      });
    }
  },

  deleteSection: (sectionId: string) => {
    const { frontSections, backSections } = get();
    set({
      frontSections: removeSectionFromList(frontSections, sectionId),
      backSections: removeSectionFromList(backSections, sectionId),
      isDirty: true,
      sectionSheetOpen: false,
      editingSection: null,
    });
  },
});
