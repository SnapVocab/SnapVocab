import type { TopicSchemaDTO } from '@/features/template-builder/types';
import { translate } from '@/lib/i18n';

export function initializeFormData(
  schema?: TopicSchemaDTO,
  existingGroups?: Record<string, any>,
): Record<string, any> {
  if (!schema?.groups)
    return {};
  const initial: Record<string, any> = {};

  for (const group of schema.groups) {
    if (group.multiple) {
      const savedInstances = Array.isArray(existingGroups?.[group.name])
        ? existingGroups[group.name]
        : null;
      const instances = savedInstances ?? [];
      initial[group.name] = instances.map((savedInstance: Record<string, any>) => {
        const instance: Record<string, any> = {};
        for (const attr of group.attributes || []) {
          instance[attr.name] = savedInstance[attr.name]
            ?? (attr.dataType === 'BOOLEAN' ? false : '');
        }
        return instance;
      });
    }
    else {
      const singleValues: Record<string, any> = {};
      for (const attr of group.attributes || []) {
        singleValues[attr.name] = existingGroups?.[group.name]?.[attr.name]
          ?? (attr.dataType === 'BOOLEAN' ? false : '');
      }
      initial[group.name] = singleValues;
    }
  }

  return initial;
}

export function validateAddWordForm(
  schema: TopicSchemaDTO | undefined,
  formData: Record<string, any>,
): { hasError: boolean; validationErrors: Record<string, any> } {
  const validationErrors: Record<string, any> = {};
  let hasError = false;

  if (!schema?.groups)
    return { hasError: false, validationErrors };

  for (const group of schema.groups) {
    if (!group.multiple) {
      const groupVals = formData[group.name] || {};
      const groupErr: Record<string, string> = {};

      for (const attr of group.attributes || []) {
        if (attr.required) {
          const val = groupVals[attr.name];
          if (val === undefined || val === null || String(val).trim() === '') {
            groupErr[attr.name] = translate('learn.add_word.required_field', {
              field: attr.label,
            });
            hasError = true;
          }
        }
      }

      if (Object.keys(groupErr).length > 0) {
        validationErrors[group.name] = groupErr;
      }
    }
    else {
      const instances = Array.isArray(formData[group.name]) ? formData[group.name] : [];
      const groupErr: Record<number, Record<string, string>> = {};

      instances.forEach((inst: Record<string, any>, idx: number) => {
        if (!group.attributes.some((attr) => {
          const value = inst[attr.name];
          return value !== undefined && value !== null && String(value).trim() !== '';
        })) {
          return;
        }
        const itemErr: Record<string, string> = {};
        for (const attr of group.attributes || []) {
          if (attr.required) {
            const val = inst[attr.name];
            if (val === undefined || val === null || String(val).trim() === '') {
              itemErr[attr.name] = translate('learn.add_word.required_field', {
                field: attr.label,
              });
              hasError = true;
            }
          }
        }
        if (Object.keys(itemErr).length > 0) {
          groupErr[idx] = itemErr;
        }
      });

      if (Object.keys(groupErr).length > 0) {
        validationErrors[group.name] = groupErr;
      }
    }
  }

  return { hasError, validationErrors };
}

export function buildAddWordPayload(
  schema: TopicSchemaDTO | undefined,
  formData: Record<string, any>,
): Record<string, any> {
  const payload: Record<string, any> = {};
  if (!schema?.groups)
    return payload;

  for (const group of schema.groups) {
    const groupData = formData[group.name];
    if (!group.multiple) {
      if (groupData && typeof groupData === 'object') {
        const cleanedSingle: Record<string, any> = {};
        for (const { name: k } of group.attributes) {
          const v = groupData[k];
          if (v !== undefined && v !== null && String(v).trim() !== '') {
            cleanedSingle[k] = v;
          }
        }
        if (Object.keys(cleanedSingle).length > 0) {
          payload[group.name] = cleanedSingle;
        }
      }
    }
    else if (Array.isArray(groupData)) {
      const cleanedList: Record<string, any>[] = [];
      for (const item of groupData) {
        if (!group.attributes.some((attr) => {
          const value = item[attr.name];
          return value !== undefined && value !== null && String(value).trim() !== '';
        })) {
          continue;
        }
        const cleanedItem: Record<string, any> = {};
        for (const { name: k } of group.attributes) {
          const v = item[k];
          if (v !== undefined && v !== null && String(v).trim() !== '') {
            cleanedItem[k] = v;
          }
        }
        if (Object.keys(cleanedItem).length > 0) {
          cleanedList.push(cleanedItem);
        }
      }
      if (cleanedList.length > 0) {
        payload[group.name] = cleanedList;
      }
    }
  }

  return payload;
}
