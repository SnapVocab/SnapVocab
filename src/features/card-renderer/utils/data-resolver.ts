import type { BuilderField, BuilderSection, TopicItemData } from '../types';
import { getMockFieldValue } from './mock-data-generator';

export type ResolvedFieldValue = {
  text: string;
  isEmpty: boolean;
  isAudio: boolean;
  isImage: boolean;
};

/**
 * Extracts a map of group data from TopicItemData
 */
export function extractGroups(
  data: TopicItemData | Record<string, any> | null | undefined,
): Record<string, any> {
  if (!data)
    return {};
  const record = data as Record<string, any>;
  if (record.groups && typeof record.groups === 'object') {
    return record.groups;
  }
  return record;
}

/**
 * Resolves a field's value from data
 */
export function resolveFieldValue(
  field: BuilderField,
  data?: TopicItemData | Record<string, any> | null,
  instanceIndex = 0,
): ResolvedFieldValue {
  if (!data) {
    const mockVal = getMockFieldValue(field);
    return {
      text: mockVal,
      isEmpty: !mockVal,
      isAudio: field.dataType === 'AUDIO' || field.semanticRole === 'AUDIO',
      isImage: field.dataType === 'IMAGE' || field.semanticRole === 'IMAGE',
    };
  }

  const groups = extractGroups(data);
  const attrName = field.attributeName || '';
  const semanticRole = field.semanticRole;

  let value: any;

  // 1. Check in all groups
  for (const groupKey of Object.keys(groups)) {
    const groupVal = groups[groupKey];
    if (Array.isArray(groupVal)) {
      // Multiple instances (like examples)
      const targetInstance = groupVal[instanceIndex] || groupVal[0];
      if (targetInstance && typeof targetInstance === 'object') {
        if (targetInstance[attrName] !== undefined) {
          value = targetInstance[attrName];
          break;
        }
      }
    }
    else if (groupVal && typeof groupVal === 'object') {
      if (groupVal[attrName] !== undefined) {
        value = groupVal[attrName];
        break;
      }
    }
  }

  // 2. Direct root access fallback
  if (value === undefined && (data as any)[attrName] !== undefined) {
    value = (data as any)[attrName];
  }

  // 3. Fallback matching via SemanticRole if attribute name didn't match
  if (value === undefined && semanticRole) {
    const mainGroup
      = groups.main
        || Object.values(groups).find(g => typeof g === 'object' && !Array.isArray(g))
        || groups;
    if (mainGroup && typeof mainGroup === 'object') {
      if (semanticRole === 'TARGET_WORD') {
        value = mainGroup.word || mainGroup.target_word || mainGroup.term || mainGroup.front;
      }
      else if (semanticRole === 'NATIVE_TRANSLATION') {
        value
          = mainGroup.translation
            || mainGroup.native_translation
            || mainGroup.meaning
            || mainGroup.back;
      }
      else if (semanticRole === 'DEFINITION') {
        value = mainGroup.definition || mainGroup.meaning;
      }
      else if (semanticRole === 'EXAMPLE_SENTENCE') {
        const examples = groups.examples || groups.example;
        if (Array.isArray(examples) && examples[instanceIndex]) {
          value
            = examples[instanceIndex].sentence
              || examples[instanceIndex].example
              || examples[instanceIndex].text;
        }
        else {
          value = mainGroup.example || mainGroup.sentence;
        }
      }
    }
  }

  const strValue = value !== undefined && value !== null ? String(value).trim() : '';
  const isEmpty = !strValue;

  return {
    text: strValue,
    isEmpty,
    isAudio: field.dataType === 'AUDIO' || field.semanticRole === 'AUDIO' || field.audioAction,
    isImage: field.dataType === 'IMAGE' || field.semanticRole === 'IMAGE',
  };
}

/**
 * Calculates how many instances exist for a repeatable section (e.g. list of examples)
 */
export function getSectionInstanceCount(
  section: BuilderSection,
  data: TopicItemData | Record<string, any> | null | undefined,
): number {
  if (!section.repeatable || !data) {
    return 1;
  }

  const groups = extractGroups(data);

  // Look for any array in groups that might correspond to this section
  for (const groupKey of Object.keys(groups)) {
    const groupVal = groups[groupKey];
    if (Array.isArray(groupVal) && groupVal.length > 0) {
      // Check if any field in section matches attributes inside this array
      const hasMatchingField = section.fields.some(f =>
        groupVal.some(item => item && item[f.attributeName] !== undefined),
      );
      if (hasMatchingField) {
        return groupVal.length;
      }
    }
  }

  return 1;
}
