import type {
  BuilderField,
  BuilderSection,
  CardSide,
  TemplateDTO,
  TemplateElementDTO,
  TopicSchemaDTO,
} from '../types';
import {
  createDefaultFallbackSections,
  createEmptySection,
  findAttributeInSchema,
  generateClientId,
  isFrontElementFallback,
  resolveFontSizeKey,
} from './helpers';

export type ParseElementsOptions = {
  elements: TemplateElementDTO[];
  schema?: TopicSchemaDTO;
  side: CardSide;
  defaultSectionName: string;
};

/**
 * Backend -> Client Mapper
 * Converts backend flat TemplateElementDTO[] + TopicSchemaDTO into structured BuilderSections.
 */
export function templateDTOToBuilderSections(
  template: TemplateDTO | undefined,
  schema: TopicSchemaDTO | undefined,
): { frontSections: BuilderSection[]; backSections: BuilderSection[] } {
  if (!template || !template.elements || template.elements.length === 0) {
    return createDefaultFallbackSections(schema);
  }

  const sortedElements = [...template.elements].sort((a, b) => a.position - b.position);

  const frontElements = sortedElements.filter(
    el =>
      el.side === 'FRONT' || (el.side === undefined && isFrontElementFallback(el, sortedElements)),
  );
  const backElements = sortedElements.filter(
    el =>
      el.side === 'BACK' || (el.side === undefined && !isFrontElementFallback(el, sortedElements)),
  );

  const frontSections = parseElementsToSections({
    elements: frontElements,
    schema,
    side: 'FRONT',
    defaultSectionName: 'Thông tin chung',
  });

  const backSections = parseElementsToSections({
    elements: backElements,
    schema,
    side: 'BACK',
    defaultSectionName: 'Nghĩa & Ví dụ',
  });

  return {
    frontSections:
      frontSections.length > 0
        ? frontSections
        : [createEmptySection({ name: 'Thông tin chung', side: 'FRONT', columns: 2 })],
    backSections:
      backSections.length > 0
        ? backSections
        : [createEmptySection({ name: 'Nghĩa & Ví dụ', side: 'BACK', columns: 1 })],
  };
}

export function parseElementsToSections({
  elements,
  schema,
  side,
  defaultSectionName,
}: ParseElementsOptions): BuilderSection[] {
  if (elements.length === 0) {
    return [];
  }

  const sections: BuilderSection[] = [];
  let currentSection: BuilderSection | null = null;
  let currentColumn: 1 | 2 = 1;

  for (const el of elements) {
    if (el.type === 'SECTION_BREAK') {
      if (currentSection && currentSection.fields.length > 0) {
        sections.push(currentSection);
      }

      currentSection = {
        id: generateClientId('sec'),
        name: el.sectionLabel || '',
        side,
        columns: 1,
        repeatable: el.repeatable ?? false,
        fields: [],
      };
      currentColumn = 1;
      continue;
    }

    if (el.type === 'COLUMN_BREAK') {
      currentColumn = 2;
      if (currentSection) {
        currentSection.columns = 2;
      }
      continue;
    }

    if (el.type === 'FIELD' && el.field) {
      if (!currentSection) {
        currentSection = {
          id: generateClientId('sec'),
          name: defaultSectionName,
          side,
          columns: 1,
          repeatable: false,
          fields: [],
        };
      }

      const fieldDto = el.field;
      const { attribute, groupName, groupLabel, repeatable } = findAttributeInSchema(
        schema,
        fieldDto.schemaAttributeId,
      );

      if (repeatable && !currentSection.repeatable) {
        currentSection.repeatable = true;
      }

      if (groupName && !currentSection.groupName) {
        currentSection.groupName = groupName;
      }

      if (
        groupLabel
        && currentSection.fields.length === 0
        && currentSection.name === defaultSectionName
      ) {
        currentSection.name = groupLabel;
      }

      const builderField: BuilderField = {
        id: generateClientId('field'),
        schemaAttributeId: fieldDto.schemaAttributeId,
        attributeName: attribute?.name ?? 'custom_field',
        groupName,
        groupMultiple: repeatable,
        fieldLabel: fieldDto.fieldLabel || attribute?.label || 'Trường dữ liệu',
        semanticRole: fieldDto.semanticRole ?? null,
        required: attribute?.required ?? false,
        hideIfEmpty: fieldDto.hideIfEmpty ?? false,
        audioAction: fieldDto.audioAction ?? false,
        fontSize: resolveFontSizeKey(fieldDto.fontSize),
        alignment: fieldDto.alignment || 'LEFT',
        color: fieldDto.color || '#111827',
        dataType: attribute?.dataType ?? 'TEXT',
        column: currentColumn,
      };

      currentSection.fields.push(builderField);
    }
  }

  if (currentSection && (currentSection.fields.length > 0 || sections.length === 0)) {
    sections.push(currentSection);
  }

  return sections;
}
