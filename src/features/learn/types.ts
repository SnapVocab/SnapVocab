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

/** What the options sheet needs; Learn's library rows carry only this much. */
export type CollectionRef = Pick<Collection, 'id' | 'name' | 'translation' | 'type'>;

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

export type CollectionTopicParams = {
  parentId?: number | null;
  page?: number;
  size?: number;
};

export type TopicDTO = {
  id: number;
  name: string;
  translation: string;
  description?: string;
  parentId: number | null;
  descriptionTranslation?: string;
  activeTemplateId?: number | null;
  activeTemplateName?: string | null;
  activeTemplateCode?: string | null;
  hasChildren: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateTopicDTO = {
  name: string;
  translation?: string;
  description?: string;
  parentId?: number | null;
  descriptionTranslation?: string;
  schemaId?: number | null;
  activeTemplateId?: number | null;
};

export type TopicItemData = {
  topicItemId: number;
  createdAt: string;
  groups: Record<string, any>;
};

export type CreateTopicItemDTO = Record<string, any>;

export type AddTopicItemParams = {
  topicId: number | string;
  data: CreateTopicItemDTO;
  /** The scan the word was saved from: feeds the Scan daily mission (daily_mission.md §6.1). */
  scanRequestId?: string;
};

export type UpdateTopicItemParams = AddTopicItemParams & {
  itemId: number | string;
};

export type DeleteTopicItemParams = {
  topicId: number | string;
  itemId: number | string;
};
