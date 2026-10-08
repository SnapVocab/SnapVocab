import type { BuilderField, BuilderSection, TopicItemData } from '../types';
import { getMockFieldValue } from './mock-data-generator';

export type ResolvedFieldValue = {
  text: string;
  isEmpty: boolean;
  isAudio: boolean;
  isImage: boolean;
};

const ATTRIBUTE_ALIASES: Record<string, string[]> = {
  word: ['word', 'target_word', 'targetWord', 'term', 'front', 'vocab', 'title', 'name', 'text'],
  target_word: ['word', 'target_word', 'targetWord', 'term', 'front', 'vocab'],
  phonetic: ['phonetic', 'ipa', 'pronunciation', 'phien_am', 'phienAm'],
  ipa: ['phonetic', 'ipa', 'pronunciation', 'phien_am', 'phienAm'],
  partofspeech: ['partOfSpeech', 'part_of_speech', 'pos', 'tag', 'type', 'word_class', 'wordClass', 'loai_tu', 'loaiTu'],
  pos: ['partOfSpeech', 'part_of_speech', 'pos', 'tag', 'type', 'loai_tu', 'loaiTu'],
  translation: ['translation', 'native_translation', 'nativeTranslation', 'vietnamese', 'dich', 'nghia'],
  meaning: ['meaning', 'definition', 'explain', 'explanation', 'giai_nghia', 'giaiNghia'],
  definition: ['definition', 'dinh_nghia', 'dinhNghia', 'explain', 'explanation', 'meaning'],
  definition_translation: ['definition_translation', 'definitionTranslation', 'dich_dinh_nghia', 'dichDinhNghia', 'definition_trans'],
  content: ['content', 'sentence', 'example', 'example_sentence', 'exampleSentence', 'text', 'cau_vi_du', 'cauViDu'],
  example: ['content', 'sentence', 'example', 'example_sentence', 'exampleSentence', 'text', 'cau_vi_du', 'cauViDu'],
  sentence: ['content', 'sentence', 'example', 'example_sentence', 'exampleSentence', 'text', 'cau_vi_du', 'cauViDu'],
  example_translation: ['example_translation', 'exampleTranslation', 'sentenceTranslation', 'sentence_translation', 'dich_vi_du', 'dichViDu', 'translation'],
  audio: ['audio', 'audioUrl', 'audio_url', 'sound', 'voice'],
  image: ['image', 'imageUrl', 'image_url', 'picture', 'photo', 'illustration'],
  level: ['level', 'cefr', 'cap_do', 'capDo'],
  synonyms: ['synonyms', 'synonym', 'dong_nghia', 'dongNghia'],
  antonyms: ['antonyms', 'antonym', 'trai_nghia', 'traiNghia'],
};

export function getValueFromObject(obj: Record<string, any>, key: string): any {
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }
  if (obj[key] !== undefined && obj[key] !== null) {
    return obj[key];
  }

  // Case-insensitive lookup
  const lowerKey = key.toLowerCase();
  for (const [k, v] of Object.entries(obj)) {
    if (k.toLowerCase() === lowerKey && v !== undefined && v !== null) {
      return v;
    }
  }

  // Check aliases
  const aliases = ATTRIBUTE_ALIASES[lowerKey];
  if (aliases) {
    for (const alias of aliases) {
      if (obj[alias] !== undefined && obj[alias] !== null) {
        return obj[alias];
      }
      for (const [k, v] of Object.entries(obj)) {
        if (k.toLowerCase() === alias.toLowerCase() && v !== undefined && v !== null) {
          return v;
        }
      }
    }
  }

  return undefined;
}

/**
 * Extracts a map of group data from TopicItemData dynamically
 */
export function extractGroups(
  data: TopicItemData | Record<string, any> | null | undefined,
): Record<string, any> {
  if (!data) {
    return {};
  }
  const record = data as Record<string, any>;
  if (record.groups && typeof record.groups === 'object') {
    return { ...record, ...record.groups };
  }
  return record;
}

/**
 * Resolves the primary target word from data dynamically without hardcoding group names
 */
export function resolveTargetWord(
  data: TopicItemData | Record<string, any> | null | undefined,
): string {
  if (!data) {
    return '';
  }
  const groups = extractGroups(data);

  // 1. Look in single object groups for 'word' or 'target_word'
  for (const groupVal of Object.values(groups)) {
    if (groupVal && typeof groupVal === 'object' && !Array.isArray(groupVal)) {
      const found = getValueFromObject(groupVal, 'word') || getValueFromObject(groupVal, 'target_word');
      if (found) {
        return String(found).trim();
      }
    }
  }

  // 2. Direct root access
  const direct = getValueFromObject(data as Record<string, any>, 'word') || (data as any)?.target_word;
  if (direct) {
    return String(direct).trim();
  }

  return '';
}

export type ResolveFieldOptions = {
  instanceIndex?: number;
  isRepeatableSection?: boolean;
};

/**
 * Resolves a field's value from data dynamically based on Schema & Template metadata (Frappe-style)
 */
export function resolveFieldValue(
  field: BuilderField,
  data?: TopicItemData | Record<string, any> | null,
  options: ResolveFieldOptions | number = 0,
): ResolvedFieldValue {
  const instanceIndex = typeof options === 'number' ? options : (options.instanceIndex ?? 0);
  const isRepeatableSection = typeof options === 'number' ? false : (options.isRepeatableSection ?? false);

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
  const groupName = field.groupName;

  let value: any;

  // 1. Direct metadata lookup using field's parent Schema Group
  if (groupName && groups[groupName] !== undefined) {
    const targetGroup = groups[groupName];
    if (Array.isArray(targetGroup)) {
      const row = targetGroup[instanceIndex];
      if (row && typeof row === 'object') {
        value = getValueFromObject(row, attrName);
      }
    }
    else if (targetGroup && typeof targetGroup === 'object') {
      value = getValueFromObject(targetGroup, attrName);
    }
  }

  // 2. Dynamic group scan if not resolved by direct groupName
  if (value === undefined) {
    if (isRepeatableSection || field.groupMultiple) {
      // Search inside array groups at instanceIndex
      for (const groupVal of Object.values(groups)) {
        if (Array.isArray(groupVal)) {
          const row = groupVal[instanceIndex];
          if (row && typeof row === 'object') {
            const found = getValueFromObject(row, attrName);
            if (found !== undefined) {
              value = found;
              break;
            }
          }
        }
      }
    }
    else {
      // Search inside single object groups ONLY
      for (const groupVal of Object.values(groups)) {
        if (groupVal && typeof groupVal === 'object' && !Array.isArray(groupVal)) {
          const found = getValueFromObject(groupVal, attrName);
          if (found !== undefined) {
            value = found;
            break;
          }
        }
      }
    }
  }

  // 3. Root object direct property fallback
  if (value === undefined) {
    const directVal = (data as Record<string, any>)[attrName];
    if (directVal !== undefined && (isRepeatableSection || !Array.isArray(directVal))) {
      value = directVal;
    }
  }

  // 4. Semantic Role Fallback (Dynamic matching across single / array groups)
  if (value === undefined && semanticRole) {
    if (isRepeatableSection || field.groupMultiple) {
      for (const groupVal of Object.values(groups)) {
        if (Array.isArray(groupVal)) {
          const row = groupVal[instanceIndex];
          if (row && typeof row === 'object') {
            if (semanticRole === 'EXAMPLE_SENTENCE') {
              value = getValueFromObject(row, 'content') || getValueFromObject(row, 'sentence') || getValueFromObject(row, 'example');
            }
            else if (semanticRole === 'NATIVE_TRANSLATION') {
              value = getValueFromObject(row, 'translation') || getValueFromObject(row, 'meaning');
            }
            if (value !== undefined) {
              break;
            }
          }
        }
      }
    }
    else {
      for (const groupVal of Object.values(groups)) {
        if (groupVal && typeof groupVal === 'object' && !Array.isArray(groupVal)) {
          if (semanticRole === 'TARGET_WORD') {
            value = getValueFromObject(groupVal, 'word') || getValueFromObject(groupVal, 'target_word');
          }
          else if (semanticRole === 'NATIVE_TRANSLATION') {
            value = getValueFromObject(groupVal, 'translation');
          }
          else if (semanticRole === 'DEFINITION') {
            value = getValueFromObject(groupVal, 'definition') || getValueFromObject(groupVal, 'meaning');
          }
          else if (semanticRole === 'AUDIO') {
            value = getValueFromObject(groupVal, 'audio') || '';
          }
          else if (semanticRole === 'IMAGE') {
            value = getValueFromObject(groupVal, 'image');
          }
          if (value !== undefined) {
            break;
          }
        }
      }
    }
  }

  const strValue = value !== undefined && value !== null ? String(value).trim() : '';
  const isEmpty = !strValue;

  return {
    text: strValue,
    isEmpty,
    isAudio: field.dataType === 'AUDIO' || field.semanticRole === 'AUDIO',
    isImage: field.dataType === 'IMAGE' || field.semanticRole === 'IMAGE',
  };
}

/**
 * Calculates how many instances exist for a repeatable section dynamically (Frappe-style)
 */
export function getSectionInstanceCount(
  section: BuilderSection,
  data: TopicItemData | Record<string, any> | null | undefined,
): number {
  if (!section.repeatable || !data) {
    return 1;
  }

  const groups = extractGroups(data);

  // 1. If section maps to a specific schema group that is an array
  if (section.groupName && Array.isArray(groups[section.groupName])) {
    return groups[section.groupName].length;
  }

  // 2. If any field in the section belongs to a schema group that is an array
  for (const field of section.fields) {
    if (field.groupName && Array.isArray(groups[field.groupName])) {
      return groups[field.groupName].length;
    }
  }

  // 3. Dynamic scan: find any array group in data that has matching attribute values
  for (const groupVal of Object.values(groups)) {
    if (Array.isArray(groupVal) && groupVal.length > 0) {
      const hasMatchingField = section.fields.some(f =>
        groupVal.some(item => item && typeof item === 'object' && getValueFromObject(item, f.attributeName) !== undefined),
      );
      if (hasMatchingField) {
        return groupVal.length;
      }
    }
  }

  return 1;
}
