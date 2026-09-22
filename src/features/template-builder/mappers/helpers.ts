import type {
  BuilderSection,
  CardSide,
  FontSize,
  SchemaAttributeDTO,
  TemplateElementDTO,
  TopicSchemaDTO,
} from '../types';
import { REVERSE_FONT_SIZE_MAP } from '../types';

export function generateClientId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export type FindAttributeResult = {
  attribute?: SchemaAttributeDTO;
  groupName?: string;
  groupLabel?: string;
  repeatable?: boolean;
};

export function findAttributeInSchema(
  schema: TopicSchemaDTO | undefined,
  attributeId: number,
): FindAttributeResult {
  if (!schema || !schema.groups) {
    return {};
  }

  for (const group of schema.groups) {
    if (group.attributes) {
      const attr = group.attributes.find(a => a.attributeId === attributeId);
      if (attr) {
        return {
          attribute: attr,
          groupName: group.name,
          groupLabel: group.label,
          repeatable: group.multiple,
        };
      }
    }
  }

  return {};
}

export function resolveFontSizeKey(size?: number | null): FontSize {
  if (!size) {
    return 'M';
  }
  return (
    REVERSE_FONT_SIZE_MAP[size] ?? (size >= 24 ? 'XL' : size >= 20 ? 'L' : size <= 14 ? 'S' : 'M')
  );
}

export function isFrontElementFallback(
  element: TemplateElementDTO,
  allSorted: TemplateElementDTO[],
): boolean {
  const firstSectionBreakIndex = allSorted.findIndex(el => el.type === 'SECTION_BREAK');
  if (firstSectionBreakIndex === -1) {
    return true;
  }
  return element.position < allSorted[firstSectionBreakIndex].position;
}

export type CreateEmptySectionParams = {
  name: string;
  side: CardSide;
  columns?: 1 | 2;
};

export function createEmptySection({
  name,
  side,
  columns = 1,
}: CreateEmptySectionParams): BuilderSection {
  return {
    id: generateClientId('sec'),
    name,
    side,
    columns,
    repeatable: false,
    fields: [],
  };
}

export function createDefaultFallbackSections(schema: TopicSchemaDTO | undefined): {
  frontSections: BuilderSection[];
  backSections: BuilderSection[];
} {
  const findAttr = (name: string) => {
    if (!schema?.groups) {
      return undefined;
    }
    for (const g of schema.groups) {
      const a = g.attributes?.find(attr => attr.name === name);
      if (a) {
        return a;
      }
    }
    return undefined;
  };

  const wordAttr = findAttr('word');
  const phoneticAttr = findAttr('phonetic');
  const audioAttr = findAttr('audio');
  const meaningAttr = findAttr('meaning');
  const exampleAttr = findAttr('example');

  const frontSection: BuilderSection = {
    id: generateClientId('sec_front'),
    name: 'Thông tin chung',
    side: 'FRONT',
    columns: 2,
    repeatable: false,
    fields: [
      {
        id: generateClientId('fld_word'),
        schemaAttributeId: wordAttr?.attributeId ?? 1,
        attributeName: 'word',
        fieldLabel: 'Từ vựng',
        semanticRole: 'TARGET_WORD',
        required: true,
        hideIfEmpty: false,
        audioAction: false,
        fontSize: 'XL',
        alignment: 'CENTER',
        color: '#111827',
        dataType: wordAttr?.dataType ?? 'TEXT',
        column: 1,
      },
      {
        id: generateClientId('fld_phonetic'),
        schemaAttributeId: phoneticAttr?.attributeId ?? 2,
        attributeName: 'phonetic',
        fieldLabel: 'Phiên âm',
        semanticRole: 'AUDIO',
        required: false,
        hideIfEmpty: true,
        audioAction: true,
        fontSize: 'M',
        alignment: 'CENTER',
        color: '#0284C7',
        dataType: phoneticAttr?.dataType ?? 'TEXT',
        column: 2,
      },
      {
        id: generateClientId('fld_audio'),
        schemaAttributeId: audioAttr?.attributeId ?? 3,
        attributeName: 'audio',
        fieldLabel: 'Phát âm',
        semanticRole: 'AUDIO',
        required: false,
        hideIfEmpty: true,
        audioAction: true,
        fontSize: 'M',
        alignment: 'CENTER',
        color: '#6B7280',
        dataType: audioAttr?.dataType ?? 'AUDIO',
        column: 2,
      },
    ],
  };

  const backSection: BuilderSection = {
    id: generateClientId('sec_back'),
    name: 'Nghĩa & Ví dụ',
    side: 'BACK',
    columns: 1,
    repeatable: true,
    fields: [
      {
        id: generateClientId('fld_meaning'),
        schemaAttributeId: meaningAttr?.attributeId ?? 4,
        attributeName: 'meaning',
        fieldLabel: 'Bản dịch / Nghĩa',
        semanticRole: 'DEFINITION',
        required: true,
        hideIfEmpty: false,
        audioAction: false,
        fontSize: 'L',
        alignment: 'LEFT',
        color: '#111827',
        dataType: meaningAttr?.dataType ?? 'TEXT',
        column: 1,
      },
      {
        id: generateClientId('fld_example'),
        schemaAttributeId: exampleAttr?.attributeId ?? 5,
        attributeName: 'example',
        fieldLabel: 'Câu ví dụ (Sentence)',
        semanticRole: 'EXAMPLE_SENTENCE',
        required: false,
        hideIfEmpty: true,
        audioAction: false,
        fontSize: 'M',
        alignment: 'LEFT',
        color: '#6B7280',
        dataType: exampleAttr?.dataType ?? 'TEXT',
        column: 1,
      },
    ],
  };

  return {
    frontSections: [frontSection],
    backSections: [backSection],
  };
}
