import type { BuilderField, BuilderSection, CardSide, TemplateElementDTO } from '../types';
import { FONT_SIZE_MAP } from '../types';

export type CreateFieldElementParams = {
  position: number;
  side: CardSide;
  field: BuilderField;
};

export function createFieldElement({
  position,
  side,
  field,
}: CreateFieldElementParams): TemplateElementDTO {
  return {
    position,
    type: 'FIELD',
    side,
    field: {
      schemaAttributeId: field.schemaAttributeId,
      attributeName: field.attributeName,
      dataType: field.dataType,
      required: field.required,
      semanticRole: field.semanticRole,
      fieldLabel: field.fieldLabel,
      hideIfEmpty: field.hideIfEmpty,
      audioAction: field.audioAction,
      fontSize: FONT_SIZE_MAP[field.fontSize] ?? 16,
      alignment: field.alignment,
      color: field.color,
    },
  };
}

/**
 * Client -> Backend Mapper
 * Flattens Front & Back BuilderSections into continuous TemplateElementDTO[]
 */
export function builderSectionsToTemplateElements(
  frontSections: BuilderSection[],
  backSections: BuilderSection[],
): TemplateElementDTO[] {
  const elements: TemplateElementDTO[] = [];
  let currentPosition = 0;

  for (const section of frontSections) {
    elements.push({
      position: currentPosition++,
      type: 'SECTION_BREAK',
      side: 'FRONT',
      sectionLabel: section.name,
      repeatable: section.repeatable,
      field: null,
    });

    if (section.columns === 2) {
      const col1Fields = section.fields.filter(f => f.column === 1);
      for (const field of col1Fields) {
        elements.push(createFieldElement({ position: currentPosition++, side: 'FRONT', field }));
      }

      const col2Fields = section.fields.filter(f => f.column === 2);
      if (col2Fields.length > 0) {
        elements.push({
          position: currentPosition++,
          type: 'COLUMN_BREAK',
          side: 'FRONT',
          field: null,
        });

        for (const field of col2Fields) {
          elements.push(createFieldElement({ position: currentPosition++, side: 'FRONT', field }));
        }
      }
    }
    else {
      for (const field of section.fields) {
        elements.push(createFieldElement({ position: currentPosition++, side: 'FRONT', field }));
      }
    }
  }

  for (const section of backSections) {
    elements.push({
      position: currentPosition++,
      type: 'SECTION_BREAK',
      side: 'BACK',
      sectionLabel: section.name,
      repeatable: section.repeatable,
      field: null,
    });

    if (section.columns === 2) {
      const col1Fields = section.fields.filter(f => f.column === 1);
      for (const field of col1Fields) {
        elements.push(createFieldElement({ position: currentPosition++, side: 'BACK', field }));
      }

      const col2Fields = section.fields.filter(f => f.column === 2);
      if (col2Fields.length > 0) {
        elements.push({
          position: currentPosition++,
          type: 'COLUMN_BREAK',
          side: 'BACK',
          field: null,
        });

        for (const field of col2Fields) {
          elements.push(createFieldElement({ position: currentPosition++, side: 'BACK', field }));
        }
      }
    }
    else {
      for (const field of section.fields) {
        elements.push(createFieldElement({ position: currentPosition++, side: 'BACK', field }));
      }
    }
  }

  return elements;
}
