import type { TopicItemData } from '../../types';

export function extractTopicItemDisplay(item: TopicItemData) {
  // Extract groups from TopicItemData (either root properties or inside groups map)
  const itemAny = item as Record<string, any>;
  const groups = (item.groups || itemAny) as Record<string, any>;
  const mainGroup = (itemAny.main || groups.main || Object.values(groups).find(g => typeof g === 'object' && g !== null) || {}) as Record<string, any>;

  // 1. Primary Word / Term / Target Word
  const word
    = mainGroup.word
      || mainGroup.target_word
      || mainGroup.term
      || mainGroup.front
      || mainGroup.title
      || mainGroup.name
      || itemAny.word
      || '—';

  // 2. Phonetic / IPA
  const phonetic = mainGroup.phonetic || mainGroup.ipa || mainGroup.pronunciation || itemAny.phonetic || '';

  // 3. Part of Speech / Tag
  const partOfSpeech = mainGroup.partOfSpeech || mainGroup.pos || mainGroup.tag || mainGroup.type || itemAny.partOfSpeech || '';

  // 4. Translation / Definition
  const translation
    = mainGroup.translation
      || mainGroup.native_translation
      || mainGroup.definition
      || mainGroup.back
      || mainGroup.meaning
      || itemAny.translation
      || '';

  return {
    word: String(word),
    phonetic: phonetic ? String(phonetic) : undefined,
    partOfSpeech: partOfSpeech ? String(partOfSpeech) : undefined,
    translation: translation ? String(translation) : '',
  };
}
