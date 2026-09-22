import type {
  BuilderField,
  BuilderSection,
  CustomFieldInput,
  SchemaAttributeDTO,
  SemanticRole,
} from './types';

export function generateClientId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function inferSemanticRole(name: string, dataType: string): SemanticRole {
  const lower = name.toLowerCase();
  if (lower === 'word' || lower.includes('target') || lower.includes('title'))
    return 'TARGET_WORD';
  if (lower === 'meaning' || lower.includes('def') || lower.includes('definition'))
    return 'DEFINITION';
  if (lower === 'translation' || lower.includes('trans'))
    return 'NATIVE_TRANSLATION';
  if (lower === 'example' || lower.includes('sentence') || lower.includes('content'))
    return 'EXAMPLE_SENTENCE';
  if (dataType === 'AUDIO' || lower === 'audio' || lower === 'sound' || lower === 'phonetic')
    return 'AUDIO';
  if (dataType === 'IMAGE' || lower === 'image' || lower === 'photo' || lower === 'picture')
    return 'IMAGE';
  return 'DEFINITION';
}

export function createFieldFromAttribute(
  attribute: SchemaAttributeDTO,
  column: 1 | 2 = 1,
): BuilderField {
  const role = inferSemanticRole(attribute.name, attribute.dataType);
  return {
    id: generateClientId('field'),
    schemaAttributeId: attribute.attributeId,
    attributeName: attribute.name,
    fieldLabel: attribute.label,
    semanticRole: role,
    required: attribute.required,
    hideIfEmpty: !attribute.required,
    audioAction: attribute.dataType === 'AUDIO' || attribute.name === 'phonetic',
    fontSize: role === 'TARGET_WORD' ? 'XL' : role === 'DEFINITION' ? 'L' : 'M',
    alignment: role === 'TARGET_WORD' || role === 'AUDIO' || role === 'IMAGE' ? 'CENTER' : 'LEFT',
    color: role === 'AUDIO' ? '#0284C7' : '#111827',
    dataType: attribute.dataType,
    column,
  };
}

export type CreateFieldFromCustomInputParams = {
  customInput: CustomFieldInput;
  attributeId: number;
  column?: 1 | 2;
  existingNames?: string[];
};

export function createFieldFromCustomInput({
  customInput,
  attributeId,
  column = 1,
  existingNames = [],
}: CreateFieldFromCustomInputParams): { field: BuilderField; attribute: SchemaAttributeDTO } {
  let baseSlug = customInput.label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!baseSlug) {
    baseSlug = 'field';
  }

  let attrName = baseSlug;
  if (existingNames.includes(attrName.toLowerCase())) {
    const hash = Math.random().toString(36).substring(2, 6);
    attrName = `${baseSlug}_${hash}`;
  }

  const attribute: SchemaAttributeDTO = {
    attributeId,
    name: attrName,
    label: customInput.label,
    dataType: customInput.dataType,
    required: customInput.required,
    position: 0,
  };

  const role = customInput.semanticRole || inferSemanticRole(attrName, customInput.dataType);

  const field: BuilderField = {
    id: generateClientId('field'),
    schemaAttributeId: attributeId,
    attributeName: attrName,
    fieldLabel: customInput.label,
    semanticRole: role,
    required: customInput.required,
    hideIfEmpty: !customInput.required,
    audioAction: customInput.dataType === 'AUDIO' || attrName === 'phonetic',
    fontSize: role === 'TARGET_WORD' ? 'XL' : role === 'DEFINITION' ? 'L' : 'M',
    alignment: role === 'TARGET_WORD' || role === 'AUDIO' || role === 'IMAGE' ? 'CENTER' : 'LEFT',
    color: role === 'AUDIO' ? '#0284C7' : '#111827',
    dataType: customInput.dataType,
    column,
  };

  return { field, attribute };
}

export function updateSectionInList(
  list: BuilderSection[],
  sectionId: string,
  updater: (sec: BuilderSection) => BuilderSection,
): BuilderSection[] {
  return list.map(sec => (sec.id === sectionId ? updater(sec) : sec));
}

export function removeSectionFromList(list: BuilderSection[], sectionId: string): BuilderSection[] {
  return list.filter(s => s.id !== sectionId);
}
