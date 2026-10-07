import type {
  BuilderField,
  BuilderSection,
  CardSide,
  FontSize,
  SchemaAttributeDTO,
  SchemaAttributeGroupDTO,
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
  schema: any,
  attributeId: number,
): FindAttributeResult {
  if (!schema) {
    return {};
  }

  const groups = schema.groups || schema.attributeGroups;
  if (!groups || !Array.isArray(groups)) {
    return {};
  }

  for (const group of groups) {
    const attributes = group.attributes;
    if (attributes && Array.isArray(attributes)) {
      const attr = attributes.find(
        (a: any) => a.attributeId === attributeId || a.id === attributeId,
      );
      if (attr) {
        return {
          attribute: {
            ...attr,
            attributeId: attr.attributeId ?? attr.id,
          },
          groupName: group.name,
          groupLabel: group.label,
          repeatable: group.multiple ?? false,
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

function buildDefaultStaticSections(): {
  frontSections: BuilderSection[];
  backSections: BuilderSection[];
} {
  const defaultFront: BuilderSection = {
    id: generateClientId('sec_front'),
    name: 'Thông tin chung',
    side: 'FRONT',
    columns: 1,
    repeatable: false,
    fields: [
      {
        id: generateClientId('fld_word'),
        schemaAttributeId: 1,
        attributeName: 'word',
        fieldLabel: 'Từ vựng',
        semanticRole: 'TARGET_WORD',
        required: true,
        hideIfEmpty: false,
        audioAction: false,
        fontSize: 'XL',
        alignment: 'CENTER',
        color: '#0F172A',
        dataType: 'TEXT',
        column: 1,
      },
      {
        id: generateClientId('fld_phonetic'),
        schemaAttributeId: 2,
        attributeName: 'phonetic',
        fieldLabel: 'Phiên âm',
        semanticRole: null,
        required: false,
        hideIfEmpty: true,
        audioAction: true,
        fontSize: 'M',
        alignment: 'CENTER',
        color: '#0284C7',
        dataType: 'TEXT',
        column: 1,
      },
      {
        id: generateClientId('fld_pos'),
        schemaAttributeId: 3,
        attributeName: 'partOfSpeech',
        fieldLabel: 'Loại từ',
        semanticRole: null,
        required: false,
        hideIfEmpty: true,
        audioAction: false,
        fontSize: 'S',
        alignment: 'CENTER',
        color: '#15803D',
        dataType: 'TEXT',
        column: 1,
      },
    ],
  };

  const defaultBack: BuilderSection = {
    id: generateClientId('sec_back'),
    name: 'Nghĩa & Ví dụ',
    side: 'BACK',
    columns: 1,
    repeatable: true,
    fields: [
      {
        id: generateClientId('fld_translation'),
        schemaAttributeId: 4,
        attributeName: 'translation',
        fieldLabel: 'Bản dịch / Nghĩa',
        semanticRole: 'NATIVE_TRANSLATION',
        required: true,
        hideIfEmpty: false,
        audioAction: false,
        fontSize: 'L',
        alignment: 'LEFT',
        color: '#15803D',
        dataType: 'TEXT',
        column: 1,
      },
      {
        id: generateClientId('fld_definition'),
        schemaAttributeId: 5,
        attributeName: 'definition',
        fieldLabel: 'Định nghĩa',
        semanticRole: 'DEFINITION',
        required: false,
        hideIfEmpty: true,
        audioAction: false,
        fontSize: 'M',
        alignment: 'LEFT',
        color: '#334155',
        dataType: 'TEXT',
        column: 1,
      },
      {
        id: generateClientId('fld_example'),
        schemaAttributeId: 6,
        attributeName: 'example',
        fieldLabel: 'Ví dụ',
        semanticRole: 'EXAMPLE_SENTENCE',
        required: false,
        hideIfEmpty: true,
        audioAction: false,
        fontSize: 'M',
        alignment: 'LEFT',
        color: '#475569',
        dataType: 'TEXT',
        column: 1,
      },
    ],
  };

  return {
    frontSections: [defaultFront],
    backSections: [defaultBack],
  };
}

function classifySingleGroupAttribute(attr: SchemaAttributeDTO): {
  target: 'front' | 'back';
  field: BuilderField;
} {
  const name = (attr.name || '').toLowerCase();
  const label = attr.label || attr.name;

  if (
    name === 'word'
    || name === 'target_word'
    || name === 'term'
    || name === 'vocab'
  ) {
    return {
      target: 'front',
      field: {
        id: generateClientId('fld_front'),
        schemaAttributeId: attr.attributeId,
        attributeName: attr.name,
        fieldLabel: label,
        semanticRole: 'TARGET_WORD',
        required: attr.required,
        hideIfEmpty: false,
        audioAction: false,
        fontSize: 'XL',
        alignment: 'CENTER',
        color: '#0F172A',
        dataType: attr.dataType,
        column: 1,
      },
    };
  }

  if (
    name.includes('phonetic')
    || name.includes('ipa')
    || name.includes('pronun')
  ) {
    return {
      target: 'front',
      field: {
        id: generateClientId('fld_front'),
        schemaAttributeId: attr.attributeId,
        attributeName: attr.name,
        fieldLabel: label,
        semanticRole: null,
        required: attr.required,
        hideIfEmpty: true,
        audioAction: true,
        fontSize: 'M',
        alignment: 'CENTER',
        color: '#0284C7',
        dataType: attr.dataType,
        column: 1,
      },
    };
  }

  if (
    name.includes('pos')
    || name.includes('partofspeech')
    || name.includes('part_of_speech')
    || name.includes('tag')
  ) {
    return {
      target: 'front',
      field: {
        id: generateClientId('fld_front'),
        schemaAttributeId: attr.attributeId,
        attributeName: attr.name,
        fieldLabel: label,
        semanticRole: null,
        required: attr.required,
        hideIfEmpty: true,
        audioAction: false,
        fontSize: 'S',
        alignment: 'CENTER',
        color: '#15803D',
        dataType: attr.dataType,
        column: 1,
      },
    };
  }

  if (name === 'audio' || name === 'audiourl' || name === 'audio_url') {
    return {
      target: 'front',
      field: {
        id: generateClientId('fld_front'),
        schemaAttributeId: attr.attributeId,
        attributeName: attr.name,
        fieldLabel: label,
        semanticRole: 'AUDIO',
        required: attr.required,
        hideIfEmpty: true,
        audioAction: true,
        fontSize: 'M',
        alignment: 'CENTER',
        color: '#6B7280',
        dataType: 'AUDIO',
        column: 1,
      },
    };
  }

  if (
    name.includes('trans')
    || name.includes('meaning')
    || name.includes('dich')
    || name.includes('nghia')
  ) {
    return {
      target: 'back',
      field: {
        id: generateClientId('fld_back'),
        schemaAttributeId: attr.attributeId,
        attributeName: attr.name,
        fieldLabel: label,
        semanticRole: 'NATIVE_TRANSLATION',
        required: attr.required,
        hideIfEmpty: false,
        audioAction: false,
        fontSize: 'L',
        alignment: 'LEFT',
        color: '#15803D',
        dataType: attr.dataType,
        column: 1,
      },
    };
  }

  if (name.includes('def') || name.includes('explain')) {
    return {
      target: 'back',
      field: {
        id: generateClientId('fld_back'),
        schemaAttributeId: attr.attributeId,
        attributeName: attr.name,
        fieldLabel: label,
        semanticRole: 'DEFINITION',
        required: attr.required,
        hideIfEmpty: true,
        audioAction: false,
        fontSize: 'M',
        alignment: 'LEFT',
        color: '#334155',
        dataType: attr.dataType,
        column: 1,
      },
    };
  }

  if (name.includes('image') || name.includes('picture') || name.includes('photo')) {
    return {
      target: 'back',
      field: {
        id: generateClientId('fld_back'),
        schemaAttributeId: attr.attributeId,
        attributeName: attr.name,
        fieldLabel: label,
        semanticRole: 'IMAGE',
        required: attr.required,
        hideIfEmpty: true,
        audioAction: false,
        fontSize: 'M',
        alignment: 'CENTER',
        color: '#111827',
        dataType: 'IMAGE',
        column: 1,
      },
    };
  }

  return {
    target: 'back',
    field: {
      id: generateClientId('fld_back'),
      schemaAttributeId: attr.attributeId,
      attributeName: attr.name,
      fieldLabel: label,
      semanticRole: null,
      required: attr.required,
      hideIfEmpty: true,
      audioAction: false,
      fontSize: 'M',
      alignment: 'LEFT',
      color: '#475569',
      dataType: attr.dataType,
      column: 1,
    },
  };
}

function buildRepeatableGroupSection(group: SchemaAttributeGroupDTO): BuilderSection {
  const groupFields: BuilderField[] = (group.attributes || []).map((attr) => {
    const name = (attr.name || '').toLowerCase();
    const label = attr.label || attr.name;
    const isSentence = name.includes('sentence') || name.includes('example') || name.includes('cau');
    const isTranslation = name.includes('trans') || name.includes('dich') || name.includes('meaning');

    return {
      id: generateClientId('fld_group'),
      schemaAttributeId: attr.attributeId,
      attributeName: attr.name,
      fieldLabel: label,
      semanticRole: isSentence
        ? 'EXAMPLE_SENTENCE'
        : isTranslation
          ? 'NATIVE_TRANSLATION'
          : null,
      required: attr.required,
      hideIfEmpty: true,
      audioAction: false,
      fontSize: isSentence ? 'M' : 'S',
      alignment: 'LEFT',
      color: isSentence ? '#1E293B' : '#64748B',
      dataType: attr.dataType,
      column: 1,
    };
  });

  return {
    id: generateClientId('sec_group'),
    name: group.label || group.name || 'Ví dụ & Ngữ cảnh',
    side: 'BACK',
    columns: 1,
    repeatable: true,
    fields: groupFields,
  };
}

export function createDefaultFallbackSections(schema: TopicSchemaDTO | undefined): {
  frontSections: BuilderSection[];
  backSections: BuilderSection[];
} {
  if (!schema?.groups || schema.groups.length === 0) {
    return buildDefaultStaticSections();
  }

  const frontFields: BuilderField[] = [];
  const backMainFields: BuilderField[] = [];
  const backSections: BuilderSection[] = [];

  for (const group of schema.groups) {
    if (!group.multiple) {
      for (const attr of group.attributes || []) {
        const { target, field } = classifySingleGroupAttribute(attr);
        if (target === 'front') {
          frontFields.push(field);
        }
        else {
          backMainFields.push(field);
        }
      }
    }
    else {
      backSections.push(buildRepeatableGroupSection(group));
    }
  }

  const frontSection: BuilderSection = {
    id: generateClientId('sec_front'),
    name: 'Thông tin từ vựng',
    side: 'FRONT',
    columns: 1,
    repeatable: false,
    fields: frontFields.length > 0 ? frontFields : [
      {
        id: generateClientId('fld_word'),
        schemaAttributeId: 1,
        attributeName: 'word',
        fieldLabel: 'Từ vựng',
        semanticRole: 'TARGET_WORD',
        required: true,
        hideIfEmpty: false,
        audioAction: false,
        fontSize: 'XL',
        alignment: 'CENTER',
        color: '#0F172A',
        dataType: 'TEXT',
        column: 1,
      },
    ],
  };

  const backMainSection: BuilderSection = {
    id: generateClientId('sec_back_main'),
    name: 'Giải nghĩa',
    side: 'BACK',
    columns: 1,
    repeatable: false,
    fields: backMainFields,
  };

  const allBackSections = [
    ...(backMainFields.length > 0 ? [backMainSection] : []),
    ...backSections,
  ];

  return {
    frontSections: [frontSection],
    backSections: allBackSections.length > 0 ? allBackSections : [backMainSection],
  };
}
