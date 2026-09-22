import type { StateCreator } from 'zustand';
import type { AddFieldParams, TemplateBuilderState } from '../store-types';
import type { BuilderField, BuilderSection, SchemaAttributeDTO } from '../types';
import {
  createFieldFromAttribute,
  createFieldFromCustomInput,
  updateSectionInList,
} from '../store-helpers';

export type FieldSlice = {
  fieldSheetOpen: boolean;
  editingField: BuilderField | null;
  editingFieldSectionId: string | null;
  addFieldSheetOpen: boolean;
  addFieldTargetSectionId: string | null;

  openAddField: (sectionId: string) => void;
  closeAddFieldSheet: () => void;
  addFieldToSection: (params: AddFieldParams) => void;
  openEditField: (sectionId: string, fieldId: string) => void;
  closeFieldSheet: () => void;
  saveFieldSettings: (data: Partial<BuilderField>) => void;
  deleteField: (sectionId: string, fieldId: string) => void;
  reorderFields: (sectionId: string, fromIndex: number, toIndex: number) => void;
  moveFieldColumn: (sectionId: string, fieldId: string, targetColumn: 1 | 2) => void;
};

export const createFieldSlice: StateCreator<
  TemplateBuilderState,
  [],
  [],
  FieldSlice
> = (set, get) => ({
  fieldSheetOpen: false,
  editingField: null,
  editingFieldSectionId: null,
  addFieldSheetOpen: false,
  addFieldTargetSectionId: null,

  openAddField: (sectionId: string) => {
    set({ addFieldTargetSectionId: sectionId, addFieldSheetOpen: true });
  },

  closeAddFieldSheet: () => {
    set({ addFieldSheetOpen: false, addFieldTargetSectionId: null });
  },

  addFieldToSection: ({ sectionId, attribute, customField, column = 1 }: AddFieldParams) => {
    const { frontSections, backSections, schema, availableAttributes } = get();

    let newField: BuilderField;
    let newAttr: SchemaAttributeDTO | undefined;

    if (customField) {
      const allAttrIds = [
        ...availableAttributes.map(a => a.attributeId),
        ...frontSections.flatMap(s => s.fields).map(f => f.schemaAttributeId),
        ...backSections.flatMap(s => s.fields).map(f => f.schemaAttributeId),
      ];
      const existingNames = [
        ...availableAttributes.map(a => a.name.toLowerCase()),
        ...frontSections.flatMap(s => s.fields).map(f => f.attributeName.toLowerCase()),
        ...backSections.flatMap(s => s.fields).map(f => f.attributeName.toLowerCase()),
      ];
      const maxId = allAttrIds.length > 0 ? Math.max(...allAttrIds, 0) : 0;
      const nextAttrId = maxId + 1;
      const created = createFieldFromCustomInput({
        customInput: customField,
        attributeId: nextAttrId,
        column,
        existingNames,
      });
      newField = created.field;
      newAttr = created.attribute;
    }
    else if (attribute) {
      newField = createFieldFromAttribute(attribute, column);
    }
    else {
      return;
    }

    const updater = (sec: BuilderSection) => ({ ...sec, fields: [...sec.fields, newField] });

    let updatedGroups = schema?.groups ?? [];
    if (newAttr && schema) {
      const targetSec = [...frontSections, ...backSections].find(s => s.id === sectionId);
      const groupName = targetSec?.name ?? 'Thông tin chung';
      const existingGroupIndex = updatedGroups.findIndex(
        g => g.label === groupName || g.name === groupName,
      );

      if (existingGroupIndex >= 0) {
        updatedGroups = updatedGroups.map((g, idx) =>
          idx === existingGroupIndex
            ? { ...g, attributes: [...(g.attributes ?? []), newAttr!] }
            : g,
        );
      }
      else {
        updatedGroups = [
          ...updatedGroups,
          {
            groupId: -(Date.now() % 10000),
            name: groupName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            label: groupName,
            multiple: targetSec?.repeatable ?? false,
            position: updatedGroups.length,
            attributes: [newAttr],
          },
        ];
      }
    }

    set({
      frontSections: updateSectionInList(frontSections, sectionId, updater),
      backSections: updateSectionInList(backSections, sectionId, updater),
      schema: schema ? { ...schema, groups: updatedGroups } : undefined,
      availableAttributes: newAttr ? [...availableAttributes, newAttr] : availableAttributes,
      isDirty: true,
      addFieldSheetOpen: false,
      addFieldTargetSectionId: null,
    });
  },

  openEditField: (sectionId: string, fieldId: string) => {
    const { frontSections, backSections } = get();
    const section = [...frontSections, ...backSections].find(s => s.id === sectionId);
    const field = section?.fields.find(f => f.id === fieldId);
    if (field) {
      set({ editingField: { ...field }, editingFieldSectionId: sectionId, fieldSheetOpen: true });
    }
  },

  closeFieldSheet: () => {
    set({ fieldSheetOpen: false, editingField: null, editingFieldSectionId: null });
  },

  saveFieldSettings: (data: Partial<BuilderField>) => {
    const {
      editingField,
      editingFieldSectionId,
      frontSections,
      backSections,
      schema,
      availableAttributes,
    } = get();
    if (!editingField || !editingFieldSectionId)
      return;

    const updater = (sec: BuilderSection) => ({
      ...sec,
      fields: sec.fields.map(f => (f.id === editingField.id ? { ...f, ...data } : f)),
    });

    let updatedGroups = schema?.groups;
    const hasSchemaChanges =
      data.required !== undefined ||
      data.fieldLabel !== undefined ||
      data.dataType !== undefined;

    if (schema?.groups && hasSchemaChanges) {
      updatedGroups = schema.groups.map(g => ({
        ...g,
        attributes: (g.attributes ?? []).map(a =>
          a.attributeId === editingField.schemaAttributeId
            ? {
                ...a,
                ...(data.fieldLabel !== undefined ? { label: data.fieldLabel } : {}),
                ...(data.required !== undefined ? { required: data.required } : {}),
                ...(data.dataType !== undefined ? { dataType: data.dataType } : {}),
              }
            : a,
        ),
      }));
    }

    const updatedAvailableAttributes = availableAttributes.map(a =>
      a.attributeId === editingField.schemaAttributeId
        ? {
            ...a,
            ...(data.fieldLabel !== undefined ? { label: data.fieldLabel } : {}),
            ...(data.required !== undefined ? { required: data.required } : {}),
            ...(data.dataType !== undefined ? { dataType: data.dataType } : {}),
          }
        : a,
    );

    set({
      frontSections: updateSectionInList(frontSections, editingFieldSectionId, updater),
      backSections: updateSectionInList(backSections, editingFieldSectionId, updater),
      schema: schema ? { ...schema, groups: updatedGroups ?? schema.groups } : undefined,
      availableAttributes: updatedAvailableAttributes,
      isDirty: true,
      fieldSheetOpen: false,
      editingField: null,
      editingFieldSectionId: null,
    });
  },

  deleteField: (sectionId: string, fieldId: string) => {
    const { frontSections, backSections } = get();
    const updater = (sec: BuilderSection) => ({
      ...sec,
      fields: sec.fields.filter(f => f.id !== fieldId),
    });

    set({
      frontSections: updateSectionInList(frontSections, sectionId, updater),
      backSections: updateSectionInList(backSections, sectionId, updater),
      isDirty: true,
      fieldSheetOpen: false,
      editingField: null,
      editingFieldSectionId: null,
    });
  },

  reorderFields: (sectionId: string, fromIndex: number, toIndex: number) => {
    const { frontSections, backSections } = get();
    const updater = (sec: BuilderSection) => {
      const cloned = [...sec.fields];
      const [moved] = cloned.splice(fromIndex, 1);
      if (moved)
        cloned.splice(toIndex, 0, moved);
      return { ...sec, fields: cloned };
    };

    set({
      frontSections: updateSectionInList(frontSections, sectionId, updater),
      backSections: updateSectionInList(backSections, sectionId, updater),
      isDirty: true,
    });
  },

  moveFieldColumn: (sectionId: string, fieldId: string, targetColumn: 1 | 2) => {
    const { frontSections, backSections } = get();
    const updater = (sec: BuilderSection) => ({
      ...sec,
      fields: sec.fields.map(f => (f.id === fieldId ? { ...f, column: targetColumn } : f)),
    });

    set({
      frontSections: updateSectionInList(frontSections, sectionId, updater),
      backSections: updateSectionInList(backSections, sectionId, updater),
      isDirty: true,
    });
  },
});
