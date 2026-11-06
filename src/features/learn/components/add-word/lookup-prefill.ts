import type { LookupResultDTO } from '@/features/lookup/types';
import type { SchemaAttributeDTO, TemplateDTO, TopicSchemaDTO } from '@/features/template-builder/types';

/** Roles belong to the selected template, not to an attribute's display name. */
export function withTemplateRoles(schema: TopicSchemaDTO, template?: TemplateDTO): TopicSchemaDTO {
  const roles = new Map(template?.elements.flatMap(element => element.field?.semanticRole
    ? [[element.field.schemaAttributeId, element.field.semanticRole] as const] : []) ?? []);
  return {
    ...schema,
    groups: schema.groups.map(group => ({
      ...group,
      attributes: group.attributes.map(attribute => ({ ...attribute, semanticRole: roles.get(attribute.attributeId) ?? null })),
    })),
  };
}

function valueFor(attribute: SchemaAttributeDTO, data: LookupResultDTO, index = 0): string {
  if (attribute.dataType !== 'TEXT')
    return '';
  switch (attribute.semanticRole) {
    case 'TARGET_WORD': return data.word ?? '';
    case 'NATIVE_TRANSLATION': return data.translations?.find(item => item.translation?.trim())?.translation?.trim() ?? '';
    case 'DEFINITION': return data.meanings?.[index]?.definition ?? '';
    case 'EXAMPLE_SENTENCE': return data.meanings?.[index]?.example ?? '';
    default: return '';
  }
}

/** Fill only empty fields. Preserve custom groups and every value already entered. */
export function prefillLookup(schema: TopicSchemaDTO, previous: Record<string, any>, data: LookupResultDTO): Record<string, any> {
  const next = { ...previous };
  for (const group of schema.groups) {
    if (!group.multiple) {
      const row = { ...previous[group.name] };
      for (const attribute of group.attributes) {
        if (row[attribute.name] === undefined || row[attribute.name] === null || row[attribute.name] === '') {
          const value = valueFor(attribute, data);
          if (value)
            row[attribute.name] = value;
        }
      }
      next[group.name] = row;
      continue;
    }
    const rows: Record<string, any>[] = Array.isArray(previous[group.name]) ? previous[group.name] : [];
    const hasMeaningRoles = group.attributes.some(attr => attr.semanticRole === 'DEFINITION' || attr.semanticRole === 'EXAMPLE_SENTENCE');
    const count = Math.max(rows.length, hasMeaningRoles ? data.meanings?.length ?? 1 : 1);
    next[group.name] = Array.from({ length: count }, (_, index) => {
      const row = { ...rows[index] };
      for (const attribute of group.attributes) {
        if (row[attribute.name] === undefined || row[attribute.name] === null || row[attribute.name] === '') {
          const value = valueFor(attribute, data, index);
          row[attribute.name] = value || (attribute.dataType === 'BOOLEAN' ? false : '');
        }
      }
      return row;
    });
  }
  return next;
}
