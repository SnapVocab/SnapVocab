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
  translation: ['translation', 'native_translation', 'nativeTranslation', 'meaning', 'back', 'vietnamese', 'dich', 'nghia'],
  meaning: ['meaning', 'definition', 'translation', 'native_translation', 'nativeTranslation', 'back', 'nghia'],
  definition: ['definition', 'meaning', 'dinh_nghia', 'dinhNghia', 'explain', 'explanation'],
  definition_translation: ['definition_translation', 'definitionTranslation', 'dich_dinh_nghia', 'dichDinhNghia', 'translation'],
  content: ['content', 'sentence', 'example', 'example_sentence', 'exampleSentence', 'text', 'cau_vi_du', 'cauViDu'],
  example: ['content', 'sentence', 'example', 'example_sentence', 'exampleSentence', 'text', 'cau_vi_du', 'cauViDu'],
  sentence: ['content', 'sentence', 'example', 'example_sentence', 'exampleSentence', 'text', 'cau_vi_du', 'cauViDu'],
  exampletranslation: ['translation', 'exampleTranslation', 'example_translation', 'sentenceTranslation', 'sentence_translation', 'meaning', 'dich_vi_du'],
  audio: ['audio', 'audioUrl', 'audio_url', 'sound', 'voice'],
  image: ['image', 'imageUrl', 'image_url', 'picture', 'photo', 'illustration'],
  level: ['level', 'cefr', 'cap_do', 'capDo'],
  synonyms: ['synonyms', 'synonym', 'dong_nghia', 'dongNghia'],
  antonyms: ['antonyms', 'antonym', 'trai_nghia', 'traiNghia'],
};

function getValueFromObject(obj: Record<string, any>, key: string): any {
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
 * Extracts a map of group data from TopicItemData
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

  // 1. If repeatable array exists (e.g. examples), try the current instance first
  for (const groupKey of Object.keys(groups)) {
    const groupVal = groups[groupKey];
    if (Array.isArray(groupVal)) {
      const targetInstance = groupVal[instanceIndex];
      if (targetInstance && typeof targetInstance === 'object') {
        const found = getValueFromObject(targetInstance, attrName);
        if (found !== undefined) {
          value = found;
          break;
        }
      }
    }
  }

  // 2. Check in single groups
  if (value === undefined) {
    for (const groupKey of Object.keys(groups)) {
      const groupVal = groups[groupKey];
      if (groupVal && typeof groupVal === 'object' && !Array.isArray(groupVal)) {
        const found = getValueFromObject(groupVal, attrName);
        if (found !== undefined) {
          value = found;
          break;
        }
      }
    }
  }

  // 3. Direct root access
  if (value === undefined) {
    value = getValueFromObject(data as Record<string, any>, attrName);
  }

  // 4. Fallback matching via SemanticRole if attribute name didn't match directly
  if (value === undefined && semanticRole) {
    const mainGroup
      = groups.main
        || groups.vocabulary
        || Object.values(groups).find(g => typeof g === 'object' && !Array.isArray(g))
        || groups;

    const examplesGroup = groups.examples || groups.example;
    const currentInstance = Array.isArray(examplesGroup) ? examplesGroup[instanceIndex] : null;

    if (semanticRole === 'TARGET_WORD' && mainGroup) {
      value = getValueFromObject(mainGroup, 'word');
    }
    else if (semanticRole === 'NATIVE_TRANSLATION') {
      if (currentInstance && (field.attributeName?.includes('example') || field.fieldLabel?.includes('ví dụ'))) {
        value = getValueFromObject(currentInstance, 'translation');
      }
      else if (mainGroup) {
        value = getValueFromObject(mainGroup, 'translation') || getValueFromObject(mainGroup, 'definition_translation');
      }
    }
    else if (semanticRole === 'DEFINITION' && mainGroup) {
      value = getValueFromObject(mainGroup, 'definition') || getValueFromObject(mainGroup, 'meaning');
    }
    else if (semanticRole === 'EXAMPLE_SENTENCE') {
      if (currentInstance) {
        value = getValueFromObject(currentInstance, 'content') || getValueFromObject(currentInstance, 'sentence');
      }
      else if (mainGroup) {
        value = getValueFromObject(mainGroup, 'sentence') || getValueFromObject(mainGroup, 'example');
      }
    }
    else if ((semanticRole as any) === 'PRONUNCIATION' || attrName.includes('phonetic') || attrName.includes('ipa')) {
      if (mainGroup) {
        value = getValueFromObject(mainGroup, 'phonetic') || getValueFromObject(mainGroup, 'ipa');
      }
    }
    else if (semanticRole === 'AUDIO' && mainGroup) {
      value = getValueFromObject(mainGroup, 'audio') || '';
    }
    else if (semanticRole === 'IMAGE' && mainGroup) {
      value = getValueFromObject(mainGroup, 'image');
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

  // Look for any array in groups (like examples)
  for (const groupKey of Object.keys(groups)) {
    const groupVal = groups[groupKey];
    if (Array.isArray(groupVal) && groupVal.length > 0) {
      // Check if any field matches or section is an example/repeatable group
      const hasMatchingField = section.fields.some(f =>
        groupVal.some(item => item && getValueFromObject(item, f.attributeName) !== undefined),
      );
      if (
        hasMatchingField
        || groupKey.toLowerCase().includes('example')
        || section.name.toLowerCase().includes('ví dụ')
        || section.name.toLowerCase().includes('example')
      ) {
        return groupVal.length;
      }
    }
  }

  return 1;
}
