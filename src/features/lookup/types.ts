export type WordSuggestionResponse = {
  id: string | number;
  word: string;
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
