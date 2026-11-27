export type WordSuggestionResponse = {
  id: string | number;
  word: string;
};

/** One row of "Từ của tôi" (GET /api/words/my): absent fields on an older backend mean "unknown". */
export type MyWordResponse = WordSuggestionResponse & {
  /** First Vietnamese translation, else definition. */
  meaning?: string | null;
  /** The learner's own topics already holding this word. */
  topics?: { topicId: number; topicName: string; collectionId: number; collectionName: string }[];
};

export type WordSuggestionParams = {
  q: string;
  page?: number;
  size?: number;
};

export type PronunciationLookup = {
  ipa?: string;
  region?: string;
};

export type Meaning = {
  definition?: string;
  definitionLang?: string;
  example?: string;
  pos?: string;
  subPos?: string;
  links?: string[];
};

export type TranslationLookup = {
  langCode?: string;
  translation: string;
};

export type RelationLookup = {
  relatedWord: string;
  relationType: string;
};

export type LookupResultDTO = {
  wordId: number;
  inMyVocabulary: boolean;
  exists: boolean;
  word: string;
  langCode: string;
  langName: string;
  pronunciations?: PronunciationLookup[];
  meanings?: Meaning[];
  translations?: TranslationLookup[];
  relations?: RelationLookup[];
  createdAt?: string;
};
