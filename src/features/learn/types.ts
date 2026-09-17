export type Collection = {
  id: number;
  name: string;
  translation: string;
  type: 'SYSTEM' | 'USER';
  ownerId: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CollectionDTO = Collection;

export type UpdateCollectionDTO = {
  name: string;
  translation?: string;
};

export type CollectionWord = {
  id: number;
  word: string;
  phonetic?: string;
  partOfSpeech?: string;
  translation: string;
  definition?: string;
  example?: string;
  exampleTranslation?: string;
  imageUrl?: string;
  isMastered?: boolean;
};

export type CollectionDetail = Collection & {
  words?: CollectionWord[];
  wordsCount?: number;
  masteredCount?: number;
};
